FROM alpine:latest

RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel \
    curl

RUN mkdir -p /opt/plugin

COPY ./gutenberg/* /opt/plugin/

RUN rm /usr/lib/python*/EXTERNALLY-MANAGED
RUN python3 -m ensurepip
RUN pip install -r /opt/plugin/requirements.txt

CMD ["python3", "/opt/plugin/main.py"]