import os, base64
from functools import wraps
from flask import g, request, redirect, url_for

PUBLIC_UUID = os.environ.get('PUBLIC_UUID', None)
PLUGIN_AUTH_TOKEN = os.environ.get('PLUGIN_AUTH_TOKEN', None)

not_authorized_msg = "Not Authorized"
not_authorized_status = 401

def auth_guard(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            if PUBLIC_UUID is None or PLUGIN_AUTH_TOKEN is None:
                return { "error": not_authorized_msg }, not_authorized_status
            authorization_base64 = request.headers.get('Authorization', None)
            if authorization_base64 is None:
                return { "error": not_authorized_msg }, not_authorized_status
            authorization_decoded = base64.b64decode(authorization_base64).decode('utf-8')
            received_uuid, received_token = authorization_decoded.split(':')
            if received_uuid != PUBLIC_UUID or received_token != PLUGIN_AUTH_TOKEN:
                return { "error": not_authorized_msg }, not_authorized_status
            return f(*args, **kwargs)
        except Exception as e:
            return { "error": e}, not_authorized_status
    return decorated_function
