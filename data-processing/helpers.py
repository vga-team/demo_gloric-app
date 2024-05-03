import os
import shutil


def create_container_directory_if_not_existing(file_path):
    directory = os.path.dirname(file_path)
    os.makedirs(directory, exist_ok=True)


def remove_dir_if_exsiting(dir_path):
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        shutil.rmtree(dir_path, ignore_errors=True)


def remove_file_if_exsiting(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
