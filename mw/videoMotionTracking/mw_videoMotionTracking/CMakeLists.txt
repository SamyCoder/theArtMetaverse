cmake_minimum_required(VERSION 2.8)
project(mw_videoMotionTracking)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
find_package(OpenCV REQUIRED)
file(GLOB_RECURSE SOURCES src/*.cpp)
add_executable(mw_videoMotionTracking ${SOURCES})
target_link_libraries(mw_videoMotionTracking ${OpenCV_LIBS})
install(TARGETS mw_videoMotionTracking DESTINATION bin)
# We assume that we run with the libraries that we find at build time,
# you'd think that was a reasonable default, but not so for CMake.
# Without this set_target_properties() the installed program will not find
# the openCV libraries at run time, and will fail to run unless you set
# LD_LIBRARY_PATH to find the directory where the openCV libraries are
# installed.
set_target_properties(mw_videoMotionTracking PROPERTIES INSTALL_RPATH_USE_LINK_PATH TRUE)
install(FILES config.yml DESTINATION share/mw_videoMotionTracking/)
