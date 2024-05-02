# Data Processing

This directory contains scripts to process the (GloRiC)[https://www.hydrosheds.org/products/gloric] dataset into MBTiles files. Assume the raw dataset is in `raw` directory and be sure to check all the configs in the configs cell of each script file. The default setting is to use the Canada shapefile format.  
Each script requires some software packages to be installed. For Python packages, a `requirement.txt` is provided for convenience. For other software packages, please check the detail sections.

## Vector Tiles

The `vector.py` file contains script for generating vector tiles from the raw dataset. Before running the script, please make sure the Python packages are installed. Also, `tippecanoe` should be installed and available as command `tippecanoe` in the shell.

## Raster Tiles

The `raster.py` file contains script for generation raster tiles from the raw dataset. Before running the script, please make sure the Python packages are installed. Also, `gdal` should be installed and `gdal_translate` and `gdaladdo` commands are available in the shell.
