#!/bin/bash

set -ex

cd "$(dirname ${BASH_SOURCE[0]})"

#nohup=$nohup

$nohup ./mw_server\
 --doc_root /home/kars10/public_html/mw_root\
 --http_port 8887 

#tail -f access
