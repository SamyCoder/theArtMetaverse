/* We have 3 run cases: 
 *
 *   1. running mw_server from some where else where it's installed:
 *
 *     - mw_server can be in your PATH, and can run many instances
 *
 *   2. running mw_server from the source directory:
 *
 *     - Easier for development
 *
 *   3. you can run 'node lib/mw_server.js'
 *
 *     - This works but does not have the builders configuration changes
 *       to the default parameters from running ./configure
 *
 * Both these two cases need to be tested to make a release.
 *
 * We also keep it so that if a user wishes to they may move the whole
 * installed directory tree to a different directory and still be able to
 * use it without any changes to any file.  They just need to keep the
 * installed files with all their relative paths the same.  To make this
 * so, we require that all these projects files must not depend on the
 * absolute path, at least at startup time, and the path to other
 * installed project files must be computed from __dirname in this file,
 * or be a relative path (not full path).
 *
 * Hence the structure of the source files is the same as the installed
 * files.
 *
 * In nodeJS __dirname resolves symlinks to the real full path.  That's
 * just what it does, so we work with it.
 */


/* config is defined above then this program spliced together via 'make'. */

if(config == null)
    var config = {};

/* Command line and environment optional configuration override some
 * config values via this local 'options' module. */
require("./options").parse(config);

var path = require('path')
  , http = require('http').createServer(http_handler)
  , io = require('socket.io').listen(http)
  , fs = require('fs')
  , url = require('url')
  , querystring = require('querystring');

// Blob tracking module for the Moss Arts Center
//if (config.blob) {

	//var mt = require("./motionTracker");
	//var mtServer = mt.MotionTrackerServer('mw.icat.vt.edu:8888', 'mw.icat.vt.edu:9999', "./cameraSettings.csv", io);
//}

// Adds a Date/Time prefix to every console.log() and console.error()
// call.  Comment this out to remove the spew prefix
//require('./console'); // It does not work well.
var doc_root = config.doc_root;

// Counter used to create unique id's
var uniCount = 0;

// List of Connected Users
var users = {};

// List of object in the scene and their states
var sceneObjects = {lamp1: true, lamp2: true};

http.listen(parseInt(config.http_port));


/*
 * Handle Path Names for the server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 */
function http_handler(req, res) 
{
    var urL = url.parse(req.url);
    var pathname = urL.pathname;

    //console.log("stuff=" + pathname + "    c=" + config.mw_dir_str);

    if(config.mw_dir_str !== pathname.substr(0, config.mw_dir_str_length) ) {
        // regular file not beginning with '/mw/'
        send(req, res, pathname, doc_root + pathname);
        return;
    }


    // It is an internal mirror worlds pathname beginning with '/mw/'

    send(req, res, pathname, path.join(config.mw_prefix, pathname));
}


// TODO: This function is no good for sending large files, because it
// reads the whole file into one buffer.
/*
 * Send to http(s) server connection
 *
 * @param req - Data included in request (IP Address, HTTP headers, url, etc.)
 * @param res - Data sent back to browser from server
 * @param pathname - URL pathname
 * @param fullpath - full path to file
 */
function send(req, res, pathname, fullpath)
{
    fs.readFile(fullpath, function(err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Error getting ' + pathname);
            console.error(err);
            return;
        }

        res.writeHead(200);
        res.end(data);
        console.log('sent: ' + pathname + ' to: ' +
                req.connection.remoteAddress);
    });
}

//----------------------------------------------
/**
 * Socket Connection and defined socket events
 *
 * @param socket - the connected socket
 */
io.on('connection', function (socket)
{ 

	//if (config.blob) {

		//mtServer.mtConnection(socket);
	//}

	//----------------------------------------------
	/**
	 * Received when a new client opens a WebSocket connection successfully
	 *
	 * @param startPacket - the array of user information
	 */
	socket.on('newconnection', function(startPacket) {

		console.log("New user'" + startPacket.name + "'is connecting.");

		// Make unique id for new user
		var id = "user" + genId();

		// Set socket id to unique user id
   		 socket.username = id;

		// If Client did not enter a name, name defaults to id
		if (startPacket.name == '') {

			console.log("NO NAME ENTERED");
			startPacket.name = id;
		}
    
		// Add the new client to the list of all clients
   		users[id] = startPacket;

		// Send connecting client its new id, the list of users, 
		socket.emit('initiate', id, users);

		// Send connecting client the states of the objects in the scene
		//socket.emit('sceneUpdate', "lamp", "lamp1", sceneObjects["lamp1"]);
		//socket.emit('sceneUpdate', "lamp", "lamp2", sceneObjects["lamp2"]);	

		// Send connecting client data to existing users
		socket.broadcast.emit('addUser', users[id], id);
	});

	//----------------------------------------------
	/**
	 * Received when a client changes their position
	 *
	 * @param {string} uniqueId - the user's unique identifier
	 * @param packet - packet of user information
	 */
	socket.on('serverUpdate', function(uniqueId, packet) {

		// Check if user is in the list
		if (users[uniqueId] != undefined) {

			// Update the master list with the client's new information
			users[uniqueId] = packet;

			try {

				// Inform all clients to update their scenes
				io.emit('clientUpdate', users[uniqueId], uniqueId);

			} catch (e) {

				console.log(e);
			}
		}
		else {

			console.log("User does not exist");
		}
  	});

	//----------------------------------------------
	/**
	 * Received when a client posts a message to the chat room
	 * or a notification needs to be added to the chat room
	 *
	 * @param {string} userName - the name of the user sending the message
	 * @param {string} message - details of chat room message
	 */
	socket.on('chatMessage', function(userName, message) {

		// Distribute message to all clients
		io.emit('chatUpdate', userName, message); 
  	});

	//----------------------------------------------
	/**
	 * Received when a client changes the state of an element in the scene 
	 *
	 * @param {string} type - the type of object changed (ex. lamp)
	 * @param {string} objectId - the id for the object being updated
	 */
	socket.on('environmentChange', function(type, objectId) {

		switch (type) {

			case "lamp" :

				sceneObjects[objectId] = !sceneObjects[objectId];

				io.emit('sceneUpdate', type, objectId, sceneObjects[objectId]);

			break;
		}
	});  

	//----------------------------------------------
	/**
	 * Received when a client disconnects (closes their browser window/tab).
	 */
	socket.on('disconnect', function() {

		// Ensure user is in the client list
		if (users[socket.username] != null) {

			// Add a notification to the chat room 
			var goodbyeNote = "" + users[socket.username].name + " is leaving the scene.";
			io.emit('chatUpdate', "", goodbyeNote);

          // Inform all clients to update and account for the removed user.
          io.emit('deleteUser', users[socket.username], socket.username);

          // Remove the client from the master list
          delete users[socket.username];

		console.log(users);
      }
  });
});

http.listen(() => {
    var address =  http.address();

    // If there is no binding (or so called ANY) address than we will be
    // listening on all Internet interfaces, including localhost
    // (127.0.0.1) if it's setup and usable.  It should be called "all
    // addresses".
    //
    // nodejs http server has address='::' for the ANY address interface,
    // or so it appears.
    //
    // Since the native nodejs does not provide an interface to get all
    // known IP interfaces, we just punt and use 'localhost' and
    // 'hostname', where hostname may not even have a working DNS
    // lookup.

    if(address.address.toString() === '::')
        console.error('Server listening on All Addresses on port ' +
                address.port + "\n" +
                'So you may be able to connect via:\n\n' +
                '           http://localhost:' + address.port + '/mw/index.html\n' +
                '      or:  http://' + require('os').hostname() +
                ':' + address.port + '/mw/index.html\n');
    else
        console.error('server listening at: http://' + address.address + ':' + address.port);
});

//----------------------------------------------
/**
 * Generates Unique Id - this is the only
 * place this gets incremented
 */
function genId() {

	//TODO make counter wrap
	return uniCount++;
}
