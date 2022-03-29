# This is a GNU make file that is particular to this mirror worlds
# package.



# PREFIX is there from quickbuild


#CSS_COMPRESS ?= yui-compressor --line-break 70 --type css
CSS_COMPRESS ?= cat

#JS_COMPRESS ?= yui-compressor --line-break 70 --type js
JS_COMPRESS ?= cat

# How to run node js with the system #! at the top of the
# file that is being run
NODEJS_SHABANG ?= /usr/bin/env node


HTTP_PORT ?= 8888

HTTPS_PORT ?= 8383

CONFIG_VARS := HTTP_PORT HTTPS_PORT

#IN_VARS := HTTP_PORT HTTPS_PORT NODEJS_SHABANG
