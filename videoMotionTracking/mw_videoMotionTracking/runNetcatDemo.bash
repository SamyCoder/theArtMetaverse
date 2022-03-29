#!/bin/bash

xfce4-terminal --geometry 140x40+1196-19 -x nc -l 5555

set -ex

cd $(dirname ${BASH_SOURCE[0]})

./mw_videoMotionTracking\
 11 rtsp://192.168.1.4:554/live/ch1\
 127.0.0.1 5555

