#!/bin/bash

set -ex

cd "$(dirname ${BASH_SOURCE[0]})"

opencv_prefix=${opencv_prefix:=${HOME}/installed}
mw_videoMotionTracking_prefix=${mw_videoMotionTracking_prefix:=${HOME}/installed}

builddir="$PWD/build"
mkdir -p $builddir


if [ ! -e "$opencv_prefix" ] ; then
    rm -rf $builddir/opencv
    mkdir $builddir/opencv
    ./INSTALL_opencv\
 --prefix $opencv_prefix\
 --builddir $builddir/opencv
else
    echo "$opencv_prefix is already installed"
fi


export PATH=$opencv_prefix/bin:${PATH}
export PKG_CONFIG_PATH=$opencv_prefix/lib/pkgconfig:$PKG_CONFIG_PATH

rm -rf build/mw_videoMotionTracking

mkdir build/mw_videoMotionTracking
cd build/mw_videoMotionTracking
cmake ../..\
 -G"Unix Makefiles"\
 -DCMAKE_CXX_FLAGS="-g -Wall -Werror"\
 -DCMAKE_INSTALL_PREFIX:PATH="$mw_videoMotionTracking_prefix"
#make VERBOSE=1 -j$(nproc)
make VERBOSE=1
make VERBOSE=1 install
set +x
echo "SUCCESS"
