# This is a GNU make file that uses GNU make make extensions


# There to install selected files in this directory.  We must use = and
# not := because PREFIX is set later when common.make is included.  It's
# (= and :=) a GNU make thing.
INSTALL_DIR = $(PREFIX)/etc


# cert.pem.bl will make both key.pem and cert.pem
# but we must add key.pem to the clean files and
# cert.pem is automatically added to cleanfiles
# because it's built with a script with it's name
# cert.pem with .bl added.
CLEANFILES := key.pem


INSTALLED := key.pem cert.pem


include ../quickbuild.make

