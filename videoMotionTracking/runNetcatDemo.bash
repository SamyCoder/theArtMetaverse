#!/bin/bash

# This will not work unless
# build/mw_videoMotionTracking/mw_videoMotionTracking exists

xfce4-terminal --geometry 140x40+1196-19 -x nc -l 5555

set -ex

cd $(dirname ${BASH_SOURCE[0]})

build/mw_videoMotionTracking/mw_videoMotionTracking\
 11\
 config.yml

