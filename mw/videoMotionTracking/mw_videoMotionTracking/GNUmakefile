# This is a GNU make file that uses GNU make make extensions

# This make file can build the program mw_videoMotionTracking without
# requiring that openCV being installed installed.  It first links
# mw_videoMotionTracking with the libraries in ../opencv/src in this
# source tree

BIN = $(PREFIX)/bin

INSTALL_DIR = $(BIN)


# add this to be installed too.
INSTALLED := config.yml


CXXFLAGS := -g -Wall -std=c++11

SRC_RPATH := -Wl,-rpath,../opencv/src/BUILD/lib -L../opencv/src/BUILD/lib


mw_videoMotionTracking_SOURCES := $(wildcard *.cpp *.c)
mw_videoMotionTracking_CPPFLAGS :=\
 -I ../opencv/src/include\
 -I ../opencv/src/modules/imgproc/include\
 -I ../opencv/src/modules/highgui/include\
 -I ../opencv/src/modules/imgcodecs/include\
 -I ../opencv/src/modules/videoio/include\
 -I ../opencv/src/modules/calib3d/include\
 -I ../opencv/src/modules/flann/include\
 -I ../opencv/src/modules/features2d/include\
 -I ../opencv/src/modules/video/include\
 -I ../opencv/src/modules/core/include
mw_videoMotionTracking_LDFLAGS :=\
 $(SRC_RPATH)\
 -lopencv_video\
 -lopencv_highgui\
 -lopencv_videoio\
 -lopencv_imgproc\
 -lopencv_core

INSTALL_RPATH = patchelf --set-rpath '$(PREFIX)/lib'

POST_INSTALL_COMMAND =\
 $(INSTALL_RPATH) $(BIN)/mw_videoMotionTracking

include ../../quickbuild.make
