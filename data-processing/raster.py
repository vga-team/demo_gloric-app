# %% imports
import os
import shapefile
import subprocess
from tqdm import tqdm
import numpy as np
import geopandas as gpd
import rasterio
from rasterio.transform import from_bounds
from rasterio.plot import show
from rasterio.features import rasterize, geometry_mask
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

# %% configs
# TODO modify the configs if needed
input_shape_file_path = "./raw/GloRiC_Canada_v10_shapefile/GloRiC_Canada_v10.shp"
intermediate_geotiff_path = "./temp/gloric_ca.tif"
output_mbtiles_path = "./out/gloric_ca_raster.mbtiles"

variable = "Temp_av"
resolution = 0.005
color_map = plt.cm.ScalarMappable(cmap="hot", norm=mcolors.Normalize(vmin=0, vmax=1))
maximum_zoom = 5


# %% helpers
def create_container_directory_if_not_existing(file_path):
    directory = os.path.dirname(file_path)
    os.makedirs(directory, exist_ok=True)


def remove_file_if_exsiting(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)


# %% reads the shape file
print("This would take a while, be patient...")
gdf = gpd.read_file(input_shape_file_path)

# %% generate raster
bounds = gdf.total_bounds
width = int((bounds[2] - bounds[0]) / resolution)
height = int((bounds[3] - bounds[1]) / resolution)
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
create_container_directory_if_not_existing(intermediate_geotiff_path)
with rasterio.open(
    intermediate_geotiff_path,
    "w",
    driver="GTiff",
    height=rgb_image.shape[0],
    width=rgb_image.shape[1],
    count=4,
    dtype=rgb_image.dtype,
    crs=gdf.crs,
    transform=transform,
) as dst:
    for i in range(4):
        dst.write(rgb_image[:, :, i], i + 1)

# %% generate mbtiles file
create_container_directory_if_not_existing(output_mbtiles_path)
remove_file_if_exsiting(output_mbtiles_path)
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

# %%
