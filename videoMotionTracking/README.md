This directory contains the source to the video tracking server program
that installs as `mw_videoMotionTracking`. 

## Ports

This software was developed on Ubuntu 16.04 and will likely work on many
GNU/Linux systems.


## Prerequisite's

`mw_videoMotionTracking` depends on the OpenCV package which is at
https://github.com/opencv.   On Ubuntu (16.04) building OpenCV required
the following prerequisite packages:

```
 git\
 cmake\
 build-essential\
 qt5-default\
 python-dev\
 python3-dev\
 python-numpy\
 python3-numpy\
 default-jdk\
 default-jre\
 ant\
 libavcodec-dev\
 libavformat-dev\
 libavutil-dev\
 libswscale-dev\
 libavresample-dev\
 libv4l-dev
```

Running the script INSTALL_opencv may be able to download and install the
required OpenCV libraries for you.  OpenCV may some day come distributed
as a package manager packaged software package, but with this script we
are building `mw_videoMotionTracking` using the source of OpenCV from its
github repositories.

INSTALL_opencv may require you to run it with a couple of options.
See the output from running
```
./INSTALL_opencv --help
```
Running `INSTALL_opencv` does not require super user privileges if
you chose path options that you have write access to.


## Building 

`mw_videoMotionTracking` builds using the standard [CMake]
(https://cmake.org/) build system.  For example, run from the terminal:
```
mkdir build
cd build
cmake ..\
 -DCMAKE_INSTALL_PREFIX:PATH=/MY/PREFIX
make
make install
```
where `/MY/PREFIX` is the top encapsulated installation directory
of your choosing.


## Running

You can get brief help for running the program by running
```
mw_videoMotionTracking --help
```


## TODO

More details about what `mw_videoMotionTracking` is and more about how to
run it.


## Developer Notes

**config** We currently only use the config, config.cpp and config.h, code
in main.cpp.  It'd be nice to keep it that way so as to keep the rest of
the code more modular.  And so there would be a possibility to make what
makes the blob tracker into a reusable library API that is not so
particular as to how it is configured.


