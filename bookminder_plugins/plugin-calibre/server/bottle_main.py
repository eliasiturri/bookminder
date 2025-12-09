from bottle import route, run, request, response, hook
import os, sys, uuid, hashlib, base64, uuid, time, threading, logging
import subprocess
from json import dumps

import requests
from requests.auth import HTTPBasicAuth

from xml.etree import ElementTree as ET

# Logging
logger = logging.getLogger('gutenberg')
logger.setLevel(logging.DEBUG)

stdout_handler = logging.StreamHandler(sys.stdout)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

stdout_handler.setFormatter(formatter)
logger.addHandler(stdout_handler)

# Add request logging hook
@hook('before_request')
def log_request():
    logger.info(f"Incoming request: {request.method} {request.path} (fullpath: {request.fullpath})")
    logger.info(f"Headers: {dict(request.headers)}")

# Environment variables
ALLOWED_ORIGINS_ENV = os.environ.get('ALLOWED_ORIGINS','')
ALLOWED_ORIGINS = ALLOWED_ORIGINS_ENV.split(',')
DEBUG_ENV = int(os.environ.get('DEBUG', 0))
DEBUG = DEBUG_ENV == 1
BOOKMINDER_CONTAINER_NAME = os.environ.get('BOOKMINDER_CONTAINER_NAME', 'bookminder')
BOOKMINDER_CONTAINER_PORT = os.environ.get('BOOKMINDER_CONTAINER_PORT', '3000')

PLUGIN_CONTAINER_NAME = os.environ.get('PLUGIN_CONTAINER_NAME', 'calibre')
PLUGIN_CONTAINER_PORT = os.environ.get('PLUGIN_CONTAINER_PORT', '5000')
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
    "name": "Calibre",
    "description": "A plugin providing metadata extraction and format conversion for ebooks",
    "public_uuid": PUBLIC_UUID,
    "private_uuid": PRIVATE_UUID,
    "container_port": PLUGIN_CONTAINER_PORT,
    "container_name": PLUGIN_CONTAINER_NAME,
    "entrypoints": [
        {
            "type": "file-metadata",
            "description": "Extract metadata from an ebook file",
            "entrypoint": None,
            "url": "/get-file-metadata",
            "method": "POST"
        },
        {
            "type": "format-conversion",
            "description": "Convert an ebook file to a different format",
            "entrypoint": "/components/FormatConversionComponent.vue",
            "url": "/convert",
            "method": "POST",
			"position": "book-details"
        }        
    ],
    "last_modified_ts": LAST_MODIFIED_TS
}

class MetadataParser():
    def __init__(self, metadata_str):
        self.dc_namespace = "http://purl.org/dc/elements/1.1/"
        self.opf_namespace = "http://www.idpf.org/2007/opf"
        self.metadata_str = metadata_str
        self.parse_metadata()

    def get_text(self, el, force_list=False):
        if el is None:
            return None

        if type(el) == list:
            l = [e.text for e in el]
            if len(l) > 1 or force_list:
                return l
            elif len(l) == 1:
                return l[0]
            else:
                return None

        return el.text

    def get_identifiers(self, el):
        if el is None:
            return None

        identifiers = {}
        for e in el:
            print(e.attrib)
            # get the  opf:scheme attribute as key
            scheme = e.attrib.get(f'{{{self.opf_namespace}}}scheme', None)
            print(scheme)
            if scheme is not None:
                identifiers[scheme] = e.text
        if len(identifiers) == 0:
            return None
        return identifiers

    def parse_metadata(self):
        self.metadata = {}
        tree = ET.ElementTree(ET.fromstring(self.metadata_str))
        root = tree.getroot()
        

        print(str(root))

        title_el = tree.find(f'.//{{{self.dc_namespace}}}title')
        self.metadata['title'] = self.get_text(title_el)

        authors_el = tree.findall(f'.//{{{self.dc_namespace}}}creator')
        self.metadata['authors'] = self.get_text(authors_el, force_list=True)
        
        subjects_el = tree.findall(f'.//{{{self.dc_namespace}}}subject')
        self.metadata['subjects'] = self.get_text(subjects_el)
        
        description_el = tree.find(f'.//{{{self.dc_namespace}}}description')
        self.metadata['description'] = self.get_text(description_el)

        publisher_el = tree.find(f'.//{{{self.dc_namespace}}}publisher')
        self.metadata['publisher'] = self.get_text(publisher_el)

        language_el = tree.find(f'.//{{{self.dc_namespace}}}language')
        self.metadata['language'] = self.get_text(language_el)

        date_el = tree.find(f'.//{{{self.dc_namespace}}}date')
        self.metadata['published'] = self.get_text(date_el)

        identifiers_el = tree.findall(f'.//{{{self.dc_namespace}}}identifier')
        print(identifiers_el)
        self.metadata['identifiers'] = self.get_identifiers(identifiers_el)

def encode_img(fn):
    with open(fn, 'rb') as binary_file:
        binary_file_data = binary_file.read()
        base64_encoded_data = base64.b64encode(binary_file_data)
        base64_output = base64_encoded_data.decode('utf-8')

        return base64_output

@route('/get-file-metadata', method='POST')
def get_file_metadata():


    file = request.files.get('file', None)
    print("file: ", type(file))
    filename = request.forms.get('filename')
    print("file: ", type(file))

    uuid_str = str(uuid.uuid4())

    # create directory ./data/{uuid}
    current_directory = os.getcwd()
    os.mkdir(os.path.join(current_directory, "data", uuid_str))

    filename = os.path.join(current_directory, "data", uuid_str, f'{uuid_str}_{filename}')
    output_opf = os.path.join(current_directory, "data", uuid_str, f'{uuid_str}.opf')
    output_cover = os.path.join(current_directory, "data", uuid_str, f'{uuid_str}.png')

    with open(filename, 'wb') as f:
        Data = file.file.read()
        if type(Data) == bytes: f.write(Data)
        elif type(Data) == str: f.write(Data.encode("utf-8"))

    # calculate the saved file sha256
    sha256 = hashlib.sha256()
    with open(filename, 'rb') as f:
        while True:
            data = f.read(65536)
            if not data:
                break
            sha256.update(data)
    sha256 = sha256.hexdigest()
    print(f"sha256: {sha256}")

    res = subprocess.run(f'ebook-meta --to-opf="{output_opf}" --get-cover="{output_cover}" "{filename}"', shell=True, capture_output=True)
    print(res)

    metadata = None
    cover = None
    if os.path.exists(output_opf):
        with open(output_opf, 'r') as f:
            metadata_str = f.read()
            metadata = MetadataParser(metadata_str).metadata
    if os.path.exists(output_cover):
        cover = encode_img(output_cover)

    
    response.content_type = 'application/json'
    return dumps({"metadata": metadata, "cover": cover})

@route('/health', method='GET')
def health_check():
    response.content_type = 'application/json'
    return dumps({"status": "ok", "version": "2024-12-03-updated", "routes": ["GET /health", "POST /get-file-metadata", "POST /convert"]})

@route('/test-post', method='POST')
def test_post():
    logger.info("=== TEST POST CALLED ===")
    response.content_type = 'application/json'
    return dumps({"success": True, "message": "Test POST works"})

@route('/convert', method='POST')
def convert_format():
    logger.info("=== CONVERT FUNCTION CALLED ===")
    try:
        payload = request.json
        logger.info(f"Payload: {payload}")
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        response.status = 400
        response.content_type = 'application/json'
        return dumps({"error": f"JSON parse error: {str(e)}"})
    
    input_file = payload.get('input_file', None)
    output_file = payload.get('output_file', None)

    if not input_file or not output_file:
        response.status = 400
        response.content_type = 'application/json'
        return dumps({"error": "Missing input_file or output_file"})

    # Check if input file exists
    if not os.path.exists(input_file):
        response.status = 404
        response.content_type = 'application/json'
        return dumps({"error": f"Input file not found: {input_file}"})

    try:
        # Run the conversion with proper shell escaping
        res = subprocess.run(
            ['ebook-convert', input_file, output_file],
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        print(f"Conversion command: ebook-convert {input_file} {output_file}")
        print(f"Return code: {res.returncode}")
        print(f"STDOUT: {res.stdout}")
        print(f"STDERR: {res.stderr}")

        if res.returncode == 0:
            # Check if output file was created
            if os.path.exists(output_file):
                response.content_type = 'application/json'
                return dumps({
                    "success": True,
                    "message": f"Successfully converted to {output_file}",
                    "output_file": output_file
                })
            else:
                response.status = 500
                response.content_type = 'application/json'
                return dumps({
                    "error": "Conversion completed but output file not found",
                    "stderr": res.stderr
                })
        else:
            response.status = 500
            response.content_type = 'application/json'
            return dumps({
                "error": "Conversion failed",
                "returncode": res.returncode,
                "stderr": res.stderr,
                "stdout": res.stdout
            })
    except subprocess.TimeoutExpired:
        response.status = 408
        response.content_type = 'application/json'
        return dumps({"error": "Conversion timed out after 5 minutes"})
    except Exception as e:
        response.status = 500
        response.content_type = 'application/json'
        return dumps({"error": f"Conversion error: {str(e)}"})

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


if __name__ == '__main__':
    # Log all registered routes for debugging
    from bottle import default_app
    app = default_app()
    logger.info("=" * 50)
    logger.info("Registered routes:")
    for route in app.routes:
        logger.info(f"  {route.method} {route.rule}")
    logger.info("=" * 50)
    
    # We start the registration loop in a separate thread
    regitration_thread = threading.Thread(target=regitration_loop)
    regitration_thread.start()

    # Run the plugin server
    run(host=PLUGIN_CONTAINER_HOST, port=PLUGIN_CONTAINER_PORT, debug=DEBUG)

