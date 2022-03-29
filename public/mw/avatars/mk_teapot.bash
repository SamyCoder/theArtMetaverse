#!/bin/bash

set -e

# Example Usage: mk_teapot '1 0 0'
# makes a red teapot
function mk_teapot()
{
    local file="$(basename $0)"
    sed teapot.x3d.xxx -e "s/@RGB_COLOR@/$1/g" > ${file%%.bl}
}
