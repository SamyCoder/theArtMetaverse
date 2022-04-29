# Mirror Worlds Main Server


## Ports

Currently being developed on GNU/Linux systems: Debian 8.6, and Xubuntu
16.04.  It is expected to work on most GNU/Linux systems.


## Package Dependences


### nodeJS

### yui-compressor (optional, build-time only)


## Installing

It builds and installs using GNU make and bash.  In a bash shell, from
the directory with this README file is, run:


```
./configure --prefix=/INSTALLATION/PREFIX && make && make install
```
where ```/INSTALLATION/PREFIX``` the directory to install all the
installed files.  Running ```make``` the first time will download
files from the Internet via ```npm``` and ```wget```.

See:

```
./configure --help
```
for more configuration options.

## Running the server

The Mirror Worlds server is installed as mw_server in the directory
```PREFIX/bin/```.  Run
```mw_server --help```
for help.


#### Example:

From a bash shell:
```
mw_server --doc_root ${HOME}/public_html --http_port=3333 > access.log 2> error.log &
```



## Developer Notes

### Web Client Functions:

initiate - This method is only fired once when client connects for the 
first time. This sets up the user's unique id provided by the server, the
avatars in the scene, and the current status of item in the scene (i.e. lamps).
 
addUser - This sets up an avatar for when a new user connects

deleteUser - This removes the appropriate avatar from the scene when a user
disconnects

clientUpdate - Primary update function that moves the avatars around the scene
and changes the values in the user console at the bottom of the html page.

chatUpdate - This adds the necessary text to the chat room when someone 
joins/leaves the scene or posts a message.

sceneUpdate - This updates the state of the items in the scene (i.e. lamps).

### On file structure

Making nodeJS applications that use many files requires a planning the for
the file directory structure.  No matter how you lay it out there will
always be give and take.  ref: https://gist.github.com/branneman/8048520

1. We decided to keep the installed executables directory (bin/) free of
   any files that the user does not directly execute.  We use the fact
   that NodeJs resolves symbolic links to full file paths in __dirname to
   lib/ where we keep all the code.

2. We decided to keep the test running of the programs not require that
   the package be installed.  The structure of the source files is close
   to that of the installed files.

3. We decided to have the package installation be automated.


### Profiling
- https://nodejs.org/en/docs/guides/simple-profiling/
