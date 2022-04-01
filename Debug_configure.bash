#!/bin/bash

# DO NOT CHECK THIS IN

set -ex

cd "$(dirname ${BASH_SOURCES[0]})"

./configure --prefix /home/kars10/installed --port 8888 --no-compress
