# %% imports
import os
import subprocess
import numpy as np
import geopandas as gpd
import rasterio
from rasterio.transform import from_bounds
from rasterio.plot import show
from rasterio.features import rasterize
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import helpers

# %% configs
# TODO modify the configs if needed
input_shape_file_path = "./raw/GloRiC_Canada_v10_shapefile/GloRiC_Canada_v10.shp"
intermediate_geotiff_path = "./temp/gloric_ca.tif"
output_mbtiles_path = "./out/gloric_ca_raster.mbtiles"
output_tiles_dir_path = "../app/tilesets/gloric_ca_raster"

variable = "Temp_av"
resolution = 0.005
tile_size = 256
color_map = plt.cm.ScalarMappable(cmap="hot", norm=mcolors.Normalize(vmin=0, vmax=1))
maximum_zoom = 8


# %% reads the shape file
print("This would take a while, be patient...")
gdf = gpd.read_file(input_shape_file_path)

# %% generate raster
bounds = gdf.total_bounds
width = int((bounds[2] - bounds[0]) / 360 * tile_size * 2 ** (maximum_zoom + 1))
height = int((bounds[3] - bounds[1]) / 360 * tile_size * 2 ** (maximum_zoom + 1))
transform = from_bounds(*bounds, width, height)

min_val = gdf[variable].min()
max_val = gdf[variable].max()
temp_av_normalized = (gdf[variable] - min_val) / (max_val - min_val)

geom = [(geometry, value) for geometry, value in zip(gdf.geometry, temp_av_normalized)]
rst = rasterize(
    shapes=geom,
    out_shape=(height, width),
    dtype=rasterio.float32,
    transform=transform,
    fill=-1,
    all_touched=True,
)
show(rst, cmap="hot")

# %% apply color map to the raster
rst = np.ma.masked_where(rst == -1, rst)
rgb_image = color_map.to_rgba(rst, bytes=True)
plt.imshow(rgb_image)

# %% write the GeoTiff file
helpers.create_container_directory_if_not_existing(intermediate_geotiff_path)
with rasterio.open(
    intermediate_geotiff_path,
    "w",
    driver="GTiff",
    height=rgb_image.shape[0],
    width=rgb_image.shape[1],
    tile_size=tile_size,
    count=4,
    dtype=rgb_image.dtype,
    crs=gdf.crs,
    transform=transform,
) as dst:
    for i in range(4):
        dst.write(rgb_image[:, :, i], i + 1)

# %% generate mbtiles file
helpers.create_container_directory_if_not_existing(output_mbtiles_path)
helpers.remove_file_if_exsiting(output_mbtiles_path)
subprocess.run(
    [
        "gdal_translate",
        intermediate_geotiff_path,
        output_mbtiles_path,
        "-of",
        "MBTILES",
        "-co",
        "TILE_FORMAT=PNG",
    ]
)
subprocess.run(
    [
        "gdaladdo",
        "-r",
        "average",
        output_mbtiles_path,
        *[str(2**x) for x in range(1, maximum_zoom)],
    ]
)

# %% extract mbtiles into a directory
helpers.create_container_directory_if_not_existing(output_tiles_dir_path)
helpers.remove_dir_if_exsiting(output_tiles_dir_path)
subprocess.run(
    [
        "mb-util",
        "--scheme=xyz",
        "--image_format=png",
        output_mbtiles_path,
        output_tiles_dir_path,
    ]
)
# %%
