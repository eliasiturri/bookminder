#!/bin/bash
cd /server
# create a virtual environment in venv if it does not exist
if [ ! -d "venv" ]; then
    whoami
    echo "venv is not a directory"
    python3 -m venv venv
    # activate the virtual environment
    source venv/bin/activate
    # install the required packages
    pip install -r requirements.txt
    pwd
    #ls -la /config/.cache/pip
    python3 -u bottle_main.py
    #sleep 100
else
    # activate the virtual environment
    source venv/bin/activate
    # install the required packages
    pwd
    python3 -u bottle_main.py
fi