from flask import Flask, request

import sys, os, logging, threading, time, uuid, json, base64
import requests
from requests.auth import HTTPBasicAuth

from flask_cors import CORS

import email, smtplib, ssl

from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Logging
logger = logging.getLogger('sendtokindle')
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
BOOKMINDER_CONTAINER_NAME = os.environ.get('BOOKMINDER_CONTAINER_NAME', 'sendtokindle')
BOOKMINDER_CONTAINER_PORT = os.environ.get('BOOKMINDER_CONTAINER_PORT', '3000')

PLUGIN_CONTAINER_NAME = os.environ.get('PLUGIN_CONTAINER_NAME', 'sendtokindle')
PLUGIN_CONTAINER_PORT = os.environ.get('PLUGIN_CONTAINER_PORT', '5000')
PLUGIN_CONTAINER_HOST = os.environ.get('PLUGIN_CONTAINER_HOST', '0.0.0.0')

REGISTRATION_URL = f"http://{BOOKMINDER_CONTAINER_NAME}:{BOOKMINDER_CONTAINER_PORT}/plugins/register"
GET_SETTINGS_URL = f"http://{BOOKMINDER_CONTAINER_NAME}:{BOOKMINDER_CONTAINER_PORT}/plugins/get-settings-plugin"

PRIVATE_UUID = str(uuid.uuid4())
PUBLIC_UUID = os.environ.get('PUBLIC_UUID', None)
PLUGIN_AUTH_TOKEN = os.environ.get('PLUGIN_AUTH_TOKEN', None)

REGISTRATION_INTERVAL = os.environ.get('REGISTRATION_INTERVAL', 30)
REGISTRATION_INTERVAL = int(REGISTRATION_INTERVAL)
REGISTRATION_RETRY_INTERVAL = os.environ.get('REGISTRATION_RETRY_INTERVAL', 100)
REGISTRATION_RETRY_INTERVAL = int(REGISTRATION_RETRY_INTERVAL)

LAST_MODIFIED_TS = time.time()

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

DOCKER_DATA_PATH = '/opt/data/'

VALID_USERNAME = PLUGIN_CONTAINER_NAME
VALID_PASSWORD = PLUGIN_AUTH_TOKEN

logger.debug("DATA PATH: " + DATA_PATH)

if PUBLIC_UUID is None:
    os._exit(1)

PLUGIN_DATA = {
    "name": "Send to kindle",
    "description": "A plugin to send ebooks to your Kindle",
    "public_uuid": PUBLIC_UUID,
    "private_uuid": PRIVATE_UUID,
    "container_port": PLUGIN_CONTAINER_PORT,
    "container_name": PLUGIN_CONTAINER_NAME,
    "entrypoints": [
        {
            "type": "component",
            "position": "book-details",
            "description": "Send ebook to kindle",
            "entrypoint": "components/SendToKindleComponent.vue",
            "url": "/send",
            "method": "POST"
        },
        {
            "type": "settings",
            "description": "Component Settings",
            "entrypoint": "components/Settings.vue",
        }
    ],
    "last_modified_ts": LAST_MODIFIED_TS
}

DEFAULT_CONFIG = {
    "server": {
        "mail_host": "",
        "mail_port": 0,
        "mail_username": "",
        "mail_password": ""
    },
    "email_list": []
}

# Local config file (not committed) - contains sensitive credentials
LOCAL_CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'local_config.json')
LOCAL_CONFIG = {}
if os.path.exists(LOCAL_CONFIG_FILE):
    try:
        with open(LOCAL_CONFIG_FILE, 'r') as _f:
            LOCAL_CONFIG = json.load(_f)
            logger.debug(f"Loaded local config from {LOCAL_CONFIG_FILE}")
    except Exception as _e:
        logger.debug(f"Failed to load local config: {_e}")

def get_active_default_config():
    """Return the default config merged with local_config (local overrides defaults)."""
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))
    # Merge server settings
    local_server = LOCAL_CONFIG.get('server', {}) if isinstance(LOCAL_CONFIG, dict) else {}
    for k, v in local_server.items():
        cfg['server'][k] = v
    # Merge email_list
    if isinstance(LOCAL_CONFIG.get('email_list', None), list):
        cfg['email_list'] = LOCAL_CONFIG.get('email_list')
    return cfg

# Flask app
app = Flask(__name__)

# CORS allowed origins
CORS(app, origins=ALLOWED_ORIGINS, automatic_options=True)

"""
# AES-256 requires data to be supplied in 16-byte blocks
# We need to pad our data with spaces to meet this requirement
def pad(s):
    block_size = 16
    remainder = len(s) % block_size
    padding_needed = block_size - remainder
    return s + padding_needed * chr(padding_needed)

# Remove the padding from the plaintext after decryption
def unpad(s):
    return s.rstrip()

def encrypt(plain_text, password):
    # Generate a random salt
    salt = os.urandom(AES.block_size)

    # Generate a random initialization vector
    iv = Random.new().read(AES.block_size)

    # Used the Scrypt Key Derivation Function to get a private key from the password
    private_key = hashlib.scrypt(
        password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32
    )

    # Create the cipher config
    cipher = AES.new(private_key, AES.MODE_CBC, iv)

    # Pad the plain text
    padded_text = pad(plain_text)

    # Encrypt the padded text
    encrypted_text = cipher.encrypt(padded_text)

    # Return the salt, iv, and encrypted text
    return {
        'salt': base64.encode(salt),
        'iv': base64.encode(iv),
        'encrypted_text': base64.encode(encrypted_text)
    }

# create a function called get_password that returns the password from the file password.txt in the data folder, creating a random 256 characters password if it does not exist
def get_password():
    password_file = os.path.join(PLUGIN_DATA_FOLDER, 'password.txt')
    if os.path.exists(password_file):
        with open(password_file, 'r') as f:
            return f.read()
    else:
        password = ''.join(random.choice(string.ascii_letters) for i in range(256))
        with open(password_file, 'w') as f:
            f.write(password)
        return password

"""

"""
Legacy hardcoded credentials removed. Use `local_config.json` next to this file to store
sensitive SMTP credentials. Example file is provided as `local_config.example.json`.
"""

def check_basic_auth():
    # Get the Authorization header from the request
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        return False

    # Check if the Authorization header starts with 'Basic'
    if not auth_header.startswith('Basic '):
        return False

    # Extract the base64-encoded credentials (after the "Basic " part)
    encoded_credentials = auth_header.split(' ', 1)[1]
    
    try:
        # Decode the base64-encoded string
        decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
        # Split the decoded string into username and password
        username, password = decoded_credentials.split(':', 1)
        logger.debug(f"username: {username}, password: {password}")
        
        # Check if the username and password match the valid credentials
        if username == VALID_USERNAME and password == VALID_PASSWORD:
            return True
        else:
            return False
    except (ValueError, UnicodeDecodeError):
        # In case the credentials are malformed or can't be decoded
        return False


subject = ""
body = ""

# Define a route for the root URL
@app.route('/')
def hello():
    return 'Hello, World! This is a Flask server.'

@app.route('/send', methods=['POST'])
async def execute():
    logger.debug("execute sendmail called")

    try:

        if not check_basic_auth():
            return Response('Unauthorized', status=401, headers={'WWW-Authenticate': 'Basic realm="Authorization Required"'})
        

        # Check basic authorization against the private_uuid
        

        payload = request.get_json(force=True)
        user_id = payload.get('user_id', None)
        destination_email = payload.get('email', None)
        book_path = payload["path"]["path"]

        logger.debug(f"payload: {payload}")
        logger.debug(f"book path: {book_path}, destination email: {destination_email}, user_id: {user_id}")

        if payload is None or user_id is None or destination_email is None or book_path is None:
            logger.debug("No payload")
            return { "error": "No payload, missing user id, missing book path, or missing destination email" }

        params = {
            "publicUuid": PUBLIC_UUID,
            "privateUuid": PLUGIN_AUTH_TOKEN, 
            "userId": user_id
        }

        settings_result = requests.get( url = GET_SETTINGS_URL, params = params)
        settings = settings_result.json()
        settings = json.loads(settings)

        logger.debug(f"settings: {settings}")


        mail_host = settings['configData']['host']
        mail_port = settings['configData']['port']
        mail_username = settings['configData']['username']
        mail_password = settings['configData']['password']

        logger.debug(f"mail_host: {mail_host}, mail_port: {mail_port}, mail_username: {mail_username}, mail_password: {mail_password}")

        # Create a multipart message and set headers
        message = MIMEMultipart()
        message["From"] = mail_username
        message["To"] = destination_email
        message["Subject"] = subject


        # Add body to email
        message.attach(MIMEText(body, "plain"))

        filename = os.path.join(DOCKER_DATA_PATH, book_path)

        # Open PDF file in binary mode
        with open(filename, "rb") as attachment:
            # Add file as application/octet-stream
            # Email client can usually download this automatically as attachment
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())

        # Encode file in ASCII characters to send by email    
        encoders.encode_base64(part)

        # Add header as key/value pair to attachment part
        part.add_header(
            "Content-Disposition",
            f'attachment; filename="sample1.epub"',
        )

        # Add attachment to message and convert message to string
        message.attach(part)
        text = message.as_string()

        # Log in to server using secure context and send email
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(mail_host, mail_port, context=context) as server:
            login_result = server.login(mail_username, mail_password)
            logger.debug("printing login_result")
            logger.debug(login_result)
            result = server.sendmail(mail_username, destination_email, text)
            logger.debug("printing result")
            logger.debug(result)
        return { "message": "Book sent to kindle successfully" }

    except Exception as e:
        logger.debug("Error sending email: " + str(e))
        return { "error": str(e) }

@app.route('/encrypt', methods=['POST'])
def encrypt_request():
    logger.debug("encrypt called")
    data = request.json
    plain_text = data['plain_text']
    password = get_password()
    result = encrypt(plain_text, password)
    return result

@app.route('/get-settings', methods=['GET'])
def get_settings():
    username = request.args.get('username')

    user_data_file = os.path.join(DATA_PATH, f'{username}.json')
    logger.debug("user_data_file: " + user_data_file)
    if os.path.exists(user_data_file):
        with open(user_data_file, 'r') as f:
            return f.read()
    else:
        # "touches the file" to create it
        with open(user_data_file, 'w+') as f:
            pass
        active = get_active_default_config()
        with open(user_data_file, 'w') as f:
            f.write(json.dumps(active))
        return active

@app.route('/set-settings', methods=['POST'])
def set_settings():
    username = request.args.get('username')
    data = request.json

    user_data_file = os.path.join(DATA_PATH, f'{username}.json')
    with open(user_data_file, 'w') as f:
        # ensure we store a JSON string
        f.write(json.dumps(data))
    return "ok"

def regitration_loop():
    while True:
        try:
            basic = HTTPBasicAuth(str(PUBLIC_UUID), str(PLUGIN_AUTH_TOKEN))
            result = requests.post(REGISTRATION_URL, auth=basic, json=PLUGIN_DATA)
            if result.status_code == 200:
                logger.debug("Registered with the server")   
            else:
                logger.debug("Could not register with the server. Is Bookminder offline? " + str(result.status_code))     
            time.sleep(REGISTRATION_INTERVAL)
        except Exception as e:
            logger.debug("Could not register with the server. Is Bookminder offline? " + str(e))
            time.sleep(REGISTRATION_RETRY_INTERVAL)

# Run the Flask app
if __name__ == '__main__':
    # We start the registration loop in a separate thread
    regitration_thread = threading.Thread(target=regitration_loop)
    regitration_thread.start()

    logger.debug("Guttenberg plugin listenting on port {}".format(PLUGIN_CONTAINER_PORT))
    app.run(port=PLUGIN_CONTAINER_PORT, host=PLUGIN_CONTAINER_HOST, debug=DEBUG)