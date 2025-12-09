import sys, os, logging, json, gzip, uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime
import time

import threading

import csv 
from collections import Counter
from io import BytesIO
from pathlib import Path

from utils.authguard import auth_guard

# Logging
logger = logging.getLogger('gutenberg')
logger.setLevel(logging.DEBUG)

stdout_handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

stdout_handler.setFormatter(formatter)
logger.addHandler(stdout_handler)

# Environment variables
ALLOWED_ORIGINS_ENV = os.environ.get('ALLOWED_ORIGINS','')
ALLOWED_ORIGINS = ALLOWED_ORIGINS_ENV.split(',')
DEBUG_ENV = int(os.environ.get('DEBUG', 0))
DEBUG = DEBUG_ENV == 1
BOOKMINDER_CONTAINER_NAME = os.environ.get('BOOKMINDER_CONTAINER_NAME', 'bookminder')
BOOKMINDER_CONTAINER_PORT = os.environ.get('BOOKMINDER_CONTAINER_PORT', '3000')

PLUGIN_CONTAINER_NAME = os.environ.get('PLUGIN_CONTAINER_NAME', 'gutenberg')
PLUGIN_CONTAINER_PORT = os.environ.get('PLUGIN_CONTAINER_PORT', '5019')
PLUGIN_CONTAINER_HOST = os.environ.get('PLUGIN_CONTAINER_HOST', '0.0.0.0')

REGISTRATION_URL = f"http://{BOOKMINDER_CONTAINER_NAME}:{BOOKMINDER_CONTAINER_PORT}/plugins/register"

PRIVATE_UUID = str(uuid.uuid4())
PUBLIC_UUID = os.environ.get('PUBLIC_UUID', None)
PLUGIN_AUTH_TOKEN = os.environ.get('PLUGIN_AUTH_TOKEN', None)

REGISTRATION_INTERVAL = os.environ.get('REGISTRATION_INTERVAL', 30)
REGISTRATION_INTERVAL = int(REGISTRATION_INTERVAL)
REGISTRATION_RETRY_INTERVAL = os.environ.get('REGISTRATION_RETRY_INTERVAL', 100)
REGISTRATION_RETRY_INTERVAL = int(REGISTRATION_RETRY_INTERVAL)

LAST_MODIFIED_TS = time.time()



if PUBLIC_UUID is None:
    os._exit(1)

PLUGIN_DATA = {
    "name": "Gutenberg",
    "description": "A plugin to search for books in the Gutenberg catalog",
    "public_uuid": PUBLIC_UUID,
    "private_uuid": PRIVATE_UUID,
    "container_port": PLUGIN_CONTAINER_PORT,
    "container_name": PLUGIN_CONTAINER_NAME,
    "entrypoints": [
        {
            "type": "search",
            "description": "Search for books in the Gutenberg catalog",
            "entrypoint": "components/SearchComponent.vue",
            "url": "/search",
            "method": "POST"
        }
    ],
    "last_modified_ts": LAST_MODIFIED_TS
}


logger.debug(f'ALLOWED_ORIGINS: {ALLOWED_ORIGINS}')

# Flask app
app = Flask(__name__)

# CORS allowed origins
CORS(app, origins=ALLOWED_ORIGINS, automatic_options=True)

# Sets up data directory
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
DATA_FOLDER = os.path.join(CURRENT_DIR, "data")

# URL for the Gutenberg catalog
# This is the only way that is allowed to access the Gutenberg catalog
URL = "https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz"

# Setting an initial last modified date for the meta file
INIT_META_FILE = {
    "last_modified": "Sun, 13 Oct 1900 21:00:24 GMT"
}

class ProjectGutenberg:

    def __init__(self, url=URL):
        self.catalog_url = url
        self.meta_file = os.path.join(DATA_FOLDER, "latest_file_meta.txt")
        self.file_path_gz = os.path.join(DATA_FOLDER, "pg_catalog.csv.gz")
        # It turns out that after downloading the file, it will be uncompressed, so this path is not really used
        self.file_path = os.path.join(DATA_FOLDER, "pg_catalog.csv")
        self.books = None

    def get_latest(self):
        self.load_meta_json()
        # Getting the HEAD request to check the last modified date
        head = requests.head(self.catalog_url)
        last_modified = head.headers.get("last-modified", None)
        if last_modified is not None:
            last_modified_date = datetime.strptime(last_modified, "%a, %d %b %Y %H:%M:%S %Z")
            last_modified_meta_date = datetime.strptime(self.meta.get("last-modified", "Sun, 13 Oct 1900 21:00:24 GMT"), "%a, %d %b %Y %H:%M:%S %Z")

            # If our version is older, we download the new version
            if last_modified_date > last_modified_meta_date:
                response = requests.get(URL)
                if response.status_code == 200:
                    # We save the file
                    with open(self.file_path_gz, "wb") as f:
                        f.write(response.content)
                        # We save the last modified date
                        with open(self.meta_file, "w") as metaf:
                            metaf.write(json.dumps({
                                "last_modified": last_modified
                            }))

    # Not used
    def uncompress_file_dump(self):
        with gzip.open(self.file_path_gz, "rb") as f:
            contents = f.read()
            with open(self.file_path, "wb") as g:
                g.write(contents)
            if os.path.isfile(self.file_path_gz):
                os.remove(self.file_path_gz)
            

    def load_meta_json(self):
        self.meta = None

        # We create the meta file if it does not exist
        if not os.path.isfile(self.meta_file):

            # create the directory if it does not exist with os.makedirs
            if not os.path.exists(DATA_FOLDER):
                os.makedirs(DATA_FOLDER)

            with open(self.meta_file, "w") as f:
                f.write(json.dumps(INIT_META_FILE))

        # We load the meta file
        with open(self.meta_file, "r") as f:
            self.meta = json.loads(f.read())
            
    # We load/parse the file dump
    def parse_file_dump(self):
        books = None
        with gzip.open(self.file_path_gz, "rt", encoding="utf-8") as f:
            reader = csv.reader(f)
            self.books = [book for book in csv.DictReader(f)]
        
        # Since the file is small, we keep its data in memory
        #return books

    # Search function
    def search(self, title, author, language, subject, n_results, page):

        # We get/load/parse the file dump if it's not already loaded
        if self.books is None:
            self.get_latest()
            self.parse_file_dump()

        # We create an array with the search conditions (parameters the user is filtering by)
        search_conditions = []
        if len(title) > 0:
            search_conditions.append(("Title", title))
        if len(author) > 0:
            search_conditions.append(("Authors", author))
        if len(language) > 0:
            search_conditions.append(("Language", language))
        if len(subject) > 0:
            search_conditions.append(("Subjects", subject))

        # We filter the books by the search conditions
        filtered_books = [book for book in self.books if all([cond[1].lower() in book.get(cond[0], '').lower() for cond in search_conditions])]

        total_results = len(filtered_books)

        # We reparse the filtered books to get the requested results
        results = []
        for i in range((page-1)*n_results, min(page*n_results, len(filtered_books))):
            book = filtered_books[i]
            book_id = book.get("Text#")
            results.append({
                "id": book_id,
                "title": book.get("Title"),
                "author": book.get("Authors"),
                "language": book.get("Language"),
                "subject": book.get("Subjects"),
                "type": book.get("Type"),
                "cover": "https://www.gutenberg.org/cache/epub/" + book_id + "/pg" + book_id + ".cover.medium.jpg"
            })

        return results, total_results

@auth_guard
@app.route('/search', methods=['POST'])
async def search():
    data = request.json
    params = data.get('params', {})

    title = params.get('title', '')
    author = params.get('author', '')
    language = params.get('language', '')
    subject = params.get('subject', '')
    n_results = params.get('n_results', 10)
    page = params.get('page', 1)
    page = int(page)

    results, total = lib.search(title, author, language, subject, n_results, page)

    response = {
        "total": total,
        'results': results
    }

    return response

# We define the listening port. Since it's dockerized, we don't need to look for a free one

def regitration_loop():
    while True:
        try:
            basic = HTTPBasicAuth(str(PUBLIC_UUID), str(PLUGIN_AUTH_TOKEN))
            result = requests.post(REGISTRATION_URL, auth=basic, json=PLUGIN_DATA)
            logger.debug(result)
            if result.status_code == 200:
                logger.info("Registered with the server. Our private UUID is {}".format(PRIVATE_UUID))        
            time.sleep(REGISTRATION_INTERVAL)
        except Exception as e:
            logger.error("Could not register with the server. Is Bookminder offline? " + str(e))
            time.sleep(REGISTRATION_RETRY_INTERVAL)

# Run the Flask app
if __name__ == '__main__':

    lib = ProjectGutenberg()

    # We start the registration loop in a separate thread
    regitration_thread = threading.Thread(target=regitration_loop)
    regitration_thread.start()

    logger.debug("Guttenberg plugin listenting on port {}".format(PLUGIN_CONTAINER_PORT))
    app.run(port=PLUGIN_CONTAINER_PORT, host=PLUGIN_CONTAINER_HOST, debug=DEBUG)
