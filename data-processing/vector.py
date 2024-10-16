# %% imports
import os
import shapefile
import subprocess
from tqdm import tqdm
import json
import numpy as np
from random import random
import helpers

# %% configs
# TODO modify the configs if needed
input_shape_file_path = "./raw/GloRiC_Canada_v10_shapefile/GloRiC_Canada_v10.shp"
intermediate_ld_geojson_path = "./temp/gloric_ca.geojson.ld"
output_mbtiles_path = "./out/gloric_ca_vector.mbtiles"
output_tiles_dir_path = "../app/tilesets/gloric_ca_vector"

maximum_zoom = None
extend_zooms_if_still_dropping = True
maximum_tile_bytes = 5_000_000
maximum_tile_features = 500_000

# %% read the shape file
reader = shapefile.Reader(input_shape_file_path)


def generate_mock_time_series(base: float, count: int):
    variance = min(1 - base, base - 0)
    angles = np.linspace(0, 2 * np.pi, count)
    items = base + variance * np.sin(angles)
    return items.tolist()


def generate_geojson_features():
    fields = reader.fields
    for shape_record in reader.iterShapeRecords():
        id = int(shape_record.record["Reach_ID"])
        geometry = shape_record.shape.__geo_interface__
        field_names = [field[0] for field in fields]
        metadata = dict(zip(field_names, shape_record.record))
        mockTimeSeries = generate_mock_time_series(random(), 10)
        for i in range(len(mockTimeSeries)):
            metadata[f"mockTimeSeries{i}"] = mockTimeSeries[i]
        feature = {
            "id": id,
            "type": "Feature",
            "geometry": geometry,
            "properties": metadata,
        }
        yield feature


features = generate_geojson_features()

# %% generate the line-delimited GeoJSON file
helpers.create_container_directory_if_not_existing(intermediate_ld_geojson_path)
helpers.remove_file_if_exsiting(intermediate_ld_geojson_path)
with open(intermediate_ld_geojson_path, "a") as file:
    for feature in tqdm(features, total=len(reader)):
        file.write(json.dumps(feature) + "\n")

# %% generate mbtiles file
options = [
    "--drop-densest-as-needed",
    "-P",
    "-l",
    "gloric",
    "--no-tile-compression",
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

helpers.create_container_directory_if_not_existing(output_mbtiles_path)
helpers.remove_file_if_exsiting(output_mbtiles_path)
subprocess.run(
    ["tippecanoe", "-o", output_mbtiles_path, *options, intermediate_ld_geojson_path]
)

# %% extract mbtiles into a directory
helpers.create_container_directory_if_not_existing(output_tiles_dir_path)
helpers.remove_dir_if_exsiting(output_tiles_dir_path)
subprocess.run(
    [
        "mb-util",
        "--scheme=xyz",
        "--image_format=pbf",
        output_mbtiles_path,
        output_tiles_dir_path,
    ]
)

# %%
