# This is a GNU make file that uses GNU make make extensions


# This builds and installs openCV in a subprocess that is not
# part of this build system:

OPENCV_TARGET := src/BUILD/lib/libopencv_core.so

BUILD_NO_INSTALL := $(OPENCV_TARGET)

BUILDDIR := src/BUILD

# We pick the last thing built as the target
# using compiler flag -Werror fails to build with error -Werror=sign-compare
$(OPENCV_TARGET): src
	CMAKE_OPTIONS="-DCMAKE_BUILD_TYPE=Release -DWITH_QT=ON"
	CMAKE_CONTRIB_OPTIONS="-DOPENCV_EXTRA_MODULES_PATH=../contrib/modules"
	CMAKE_SAMPLES="-DBUILD_EXAMPLES=ON -DINSTALL_C_EXAMPLES=ON -DINSTALL_PYTHON_EXAMPLES=ON"
	CMAKE_OPTIONS="$${CMAKE_OPTIONS} $${CMAKE_CONTRIB_OPTIONS} $${CMAKE_SAMPLE}"
	CXX_FLAGS="-g -Wall"
	(mkdir $(BUILDDIR) && cd $(BUILDDIR) && cmake ..\
 -G"Unix Makefiles"\
 -DCMAKE_CXX_FLAGS:STRING="$$CXX_FLAGS"\
 -DCMAKE_INSTALL_PREFIX:PATH="$(PREFIX)"\
 $$CMAKE_OPTIONS &&\
 make VERBOSE=1 -j$$(nproc))

install: install_opencv

install_opencv: $(OPENCV_TARGET)
	(cd $(BUILDDIR) && make install)


include ../../quickbuild.make
