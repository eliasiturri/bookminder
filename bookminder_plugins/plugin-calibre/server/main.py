from flask import Flask, request, jsonify
import os, sys, uuid
import subprocess

from flask import Request
import logging




app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16 MB

class CustomRequest(Request):
    def __init__(self, *args, **kwargs):
        super(CustomRequest, self).__init__(*args, **kwargs)
        self.max_form_parts = 200000


app.request_class = CustomRequest

print("MAX_CONTENT_LENGTH: ", app.config['MAX_CONTENT_LENGTH'])

@app.before_request
def fix_transfer_encoding():
    """
    Sets the "wsgi.input_terminated" environment flag, thus enabling
    Werkzeug to pass chunked requests as streams.  The gunicorn server
    should set this, but it's not yet been implemented.
    """

    transfer_encoding = request.headers.get("Transfer-Encoding", None)
    if transfer_encoding == u"chunked":
        request.environ["wsgi.input_terminated"] = True

def parse_opf_metadata(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
        metadata = {}
        for line in lines:
            if '<dc:' in line:
                key = line.split('<dc:')[1].split('>')[0]
                value = line.split('>')[1].split('<')[0]
                metadata[key] = value
    return metadata

@app.route('/')
def test():
    command = "calibre -v"
    res = subprocess.run(command, shell=True, capture_output=True)
    print("printing res")
    print(res)
    return jsonify(res.stdout.decode('utf-8'))

@app.route('/get-file-metadata', methods=['POST'])
def get_file_metadata():

    app.logger.info("get-file-metadata")

    file = request.files['file']
    print("file: ", type(file))
    filename = request.files['filename']
    print("file: ", type(file))

    uuid_str = str(uuid.uuid4())

    # create directory ./data/{uuid}
    os.mkdir(f'./data/{uuid_str}')

    filename = f'./data/{uuid_str}/{uuid_str}_{filename}'
    output_opf = f'./data/{uuid_str}/{uuid_str}.opf'
    output_cover = f'./data/{uuid_str}/{uuid_str}.png'

    # save the file to the server in the folder ./data
    with open(filename, 'wb') as f:
        f.write(file)

    res = subprocess.run(f'ebook-meta --to-opf={output_opf} --get-cover={output_cover}', shell=True, capture_output=True)

    metadata = None
    cover = None
    if os.path.exists(output_opf):
        metadata = parse_opf_metadata(output_opf)
    if os.path.exists(output_cover):
        # get the cover in base64
        with open(output_cover, 'rb') as f:
            cover = f.read().encode('base64')

    return jsonify({"metadata": metadata, "cover": cover})

if __name__ == '__main__':
    gunicorn_logger = logging.getLogger('gunicorn.error')
    app.logger.handlers = gunicorn_logger.handlers
    app.logger.setLevel(gunicorn_logger.level)

    subprocess.run([
        sys.executable,  # Use the current Python interpreter
        '-m', 'gunicorn',  # Run Gunicorn
        '-w', '4',  # Number of workers
        '-b', '0.0.0.0:5000',  # Bind address
        'main:app'  # Module and application
    ])
    #app.run(host='0.0.0.0', port=5000, debug=False)

