# %% imports
import os
import shapefile
import subprocess
from tqdm import tqdm
import json

# %% configs
# TODO modify the configs if needed
input_shape_file_path = "./raw/GloRiC_Canada_v10_shapefile/GloRiC_Canada_v10.shp"
intermediate_ld_geojson_path = "./temp/gloric_ca.geojson.ld"
output_mbtiles_path = "./out/gloric_ca.mbtiles"

maximum_zoom = None
extend_zooms_if_still_dropping = True
maximum_tile_bytes = 5_000_000
maximum_tile_features = 500_000


# %% helpers
def create_container_directory_if_not_existing(file_path):
    directory = os.path.dirname(file_path)
    os.makedirs(directory, exist_ok=True)


def remove_file_if_exsiting(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)


# %% read the shape file
reader = shapefile.Reader(input_shape_file_path)


def generate_geojson_features():
    fields = reader.fields
    for shape_record in reader.iterShapeRecords():
        id = int(shape_record.record["Reach_ID"])
        geometry = shape_record.shape.__geo_interface__
        field_names = [field[0] for field in fields]
        metadata = dict(zip(field_names, shape_record.record))
        feature = {
            "id": id,
            "type": "Feature",
            "geometry": geometry,
            "properties": metadata,
        }
        yield feature


features = generate_geojson_features()

# %% generate the line-delimited GeoJSON file
create_container_directory_if_not_existing(intermediate_ld_geojson_path)
remove_file_if_exsiting(intermediate_ld_geojson_path)
with open(intermediate_ld_geojson_path, "a") as file:
    for feature in tqdm(features, total=len(reader)):
        file.write(json.dumps(feature) + "\n")

# %% generate mbtiles file
options = [
    "--drop-densest-as-needed",
    "-P",
    "-l",
    "gloric",
]
options.append("-zg" if maximum_zoom is None else f"-z{maximum_zoom}")
if extend_zooms_if_still_dropping is not None:
    options.append("--extend-zooms-if-still-dropping")
options.append(
    "--no-tile-size-limit"
    if maximum_tile_bytes is None
    else f"--maximum-tile-bytes={maximum_tile_bytes}"
)
options.append(
    "--no-feature-limit"
    if maximum_tile_features is None
    else f"--maximum-tile-features={maximum_tile_bytes}"
)

create_container_directory_if_not_existing(output_mbtiles_path)
remove_file_if_exsiting(output_mbtiles_path)
subprocess.run(
    ["tippecanoe", "-o", output_mbtiles_path, *options, intermediate_ld_geojson_path]
)

# %%
