# This is a GNU makefile

hostname = $(shell hostname)

# The file "config.make" is from running ./configure [options]
# It is not required, and we have default values in this files
# if it does not exist.
-include config.make

# By adding .ONESHELL: all the lines in a recipe are passed to a single
# invocation of the shell
.ONESHELL:


#######################################################################
#          DEFAULT CONFIGURATION
#
#  TODO: The default (?=) values here need to be consistent
#  with the Usage() function in ./configure and values in server.js
#
#  To help make it so that running ./configure is not required, we set
#  some default parameters values here.  Some of these parameters are
#  required at at build time and run time.
#######################################################################

# variable ?= "Is this if it does not exist yet"

PREFIX ?= $(PWD)/installed
jscompress ?= cat
csscompress ?= cat
shabang ?= \#!/usr/bin/env node
port ?= 9999
s_port ?= 4443

build_date = $(shell date)

# The relative paths between BIN PUBLIC and MODULES must stay consistent
# with the main part of the mw_server program node js code in server.js.

# where to install local files that run programs.
# They are not seen from the web, so they are private.
BIN = $(PREFIX)/bin

# files that are not visible from the web, that this
# package installation needs.
ETC = $(PREFIX)/etc

# Files that this package installs that are seen on the web.
PUBLIC = $(PREFIX)/public

#######################################################################
#######################################################################

# We'll get needed nodejs modules from lib/package.json
# and put them in this directory
node_modules = lib/node_modules

# TODO: We are currently assuming that the generated compressed
# javaScript and CSS files are in one directory.  If that changes
# we need to change built_js_files and built_css_files
built_js_files = $(patsubst %.jsp,%.js,$(wildcard public/mw/*.jsp))
built_css_files = $(patsubst %.cs,%.css,$(wildcard public/mw/*.cs))

keys = etc/key.pem etc/cert.pem

# version of x3dom to install
x3dom_version = x3dom-1.7.1
# The directory where we unzip the x3dom files
x3dom_dir = public/mw/x3dom

js_files = $(sort $(wildcard etc/*.js) $(built_js_files))
css_files = $(sort $(wildcard etc/*.css) $(built_css_files))


# files we install in public
# TODO: Is this required to be a flat single directory?
public_files = $(sort $(js_files) $(css_files)\
 $(wildcard public/mw/*)\
 $(x3dom_dir) public/mw/avatars)

# files we install in etc/
etc_files = $(keys)


built_files = $(sort\
 bin\
 mw_server lib/mw_server bin/mw_server\
 $(built_js_files)\
 $(built_css_files)\
 $(keys)\
 $(x3dom_dir)\
 $(node_modules))

sep = /////////////////////////////////////////////////////\n


build: $(built_files)

# We npm get a copy of socket.io and other dependencies
# via the file lib/package.json
$(node_modules):
	cd lib/ && npm install


config.make:
	echo "# This is a generated file" > $@

bin:
	mkdir -p bin

# Make it so we may run mw_server from a path in bin/
bin/mw_server: bin
	mkdir -p bin
	ln -s ../lib/mw_server $@

# Make it so we may run mw_server from the top source dir.
mw_server:
	ln -s lib/mw_server $@

# This javaScript is used by the client and the nodeJS server,
# so we install a symlink so it's accessible from two paths.

lib/mw_server: lib/mw_server.js GNUmakefile config.make
	(mkdir -p lib &&\
	echo "$(shabang)" > $@ &&\
        echo "// This is a generated file" >> $@ &&\
	echo "// build date: $(build_date)" >> $@ &&\
        echo "/****** Built configurated defaults ******/" >> $@ &&\
        echo "var config = {};" >> $@ &&\
        echo "config.http_port = \"$(port)\";" >> $@ &&\
        echo "config.https_port = \"$(s_port)\";" >> $@ &&\
        for i in lib/mw_server.js ; do echo "$(sep)// START $$i" >> $@;\
	cat $$i >> $@; done &&\
        chmod 755 $@) || (rm -f $@ ; rmdir bin ; exit 1)

etc:
	mkdir etc

# ref: http://superuser.com/questions/226192/openssl-without-prompt
$(keys): etc
	openssl req\
 -new\
 -nodes\
 -x509\
 -newkey rsa:2048\
 -keyout etc/key.pem\
 -subj "/C=US/ST=Denial/L=Bleaksburg/O=Dis/CN=$(hostname)" \
 -out etc/cert.pem\
 -days 36500

$(x3dom_dir):
	mkdir -p $(x3dom_dir) && (cd $(x3dom_dir) &&\
          wget http://x3dom.org/download/1.7.1/$(x3dom_version).zip &&\
          unzip $(x3dom_version).zip) || (rm -rf $(x3dom_dir) ; exit 1)


%.js: %.jsp
	echo "// This is a generated file" > $@ &&\
	$(jscompress) $^ >> $@
%.css: %.cs
	echo "/* This is a generated file */" > $@ &&\
	$(csscompress) $^ >> $@
mkdirs:
	mkdir -p $(ETC) $(BIN) $(PUBLIC)/mw $(MODULES) $(PREFIX)/lib

install: mkdirs build
	cp -R $(etc_files) $(ETC)/
	cp -R lib/* $(PREFIX)/lib/
	cp -R $(public_files) $(PUBLIC)/mw/
	ln -fs ../lib/mw_server $(BIN)/mw_server
	rm $(PREFIX)/lib/mw_server.js

clean:
	rm -rf $(built_files) bin etc isolate-*-v8.log

distclean: clean
	rm -f config.make

