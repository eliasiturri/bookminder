#!/bin/sh
cd /server
# create a virtual environment in venv if it does not exist
if [ ! -d "venv" ]; then
    whoami
    echo "venv is not a directory"
    python3 -m venv venv
    # activate the virtual environment
    . venv/bin/activate
    # install the required packages
    ./venv/bin/pip install -r requirements.txt
    pwd
    ls -la /config/.cache/pip
    ./venv/bin/python3 -u bottle_main.py
else
    # activate the virtual environment
    . venv/bin/activate
    # install the required packages
    pwd
    ./venv/bin/python3 -u bottle_main.py
fi