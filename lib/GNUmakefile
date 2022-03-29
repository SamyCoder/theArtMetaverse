# This is a GNU make file that uses GNU make make extensions


sep = /////////////////////////////////////////////////////

mw_server: mw_server.js GNUmakefile ../config.make
	(echo "#!$(NODEJS_SHABANG)" > $@ &&\
        echo "// This is a generated file" >> $@ &&\
	echo "// build date: $(shell date)" >> $@ &&\
        echo "/****** Built with these configured defaults ******/" >> $@ &&\
        echo "var config = {};" >> $@ &&\
        echo "config.http_port = \"$(HTTP_PORT)\";" >> $@ &&\
        echo "config.https_port = \"$(HTTPS_PORT)\";" >> $@ &&\
        for i in mw_server.js ; do echo -e "$(sep)\n// START $$i" >> $@;\
	cat $$i >> $@; done &&\
        chmod 755 $@) || (rm -f $@ ; exit 1)

# Remove these files for cleaner and distclean target
CLEANERFILES := package-lock.json

# Where to install files from this directory
INSTALL_DIR = $(PREFIX)/lib

# Additional build and installed targets from this directory; that is in
# addition to the many automatically built and installed based on the
# suffix rules in common.make
BUILD := mw_server
INSTALLED := mw_server node_modules


include ../quickbuild.make
