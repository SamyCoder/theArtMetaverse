/**
 * This file serves as an example for how to listen to the server using
 * the socket.io api from their node-js library.
 */


var address = 'http://mw.icat.vt.edu:8888';
var getSubscription = false;


if(module.parent && module.parent.exports && module.parent.exports) {
    var e = module.parent.exports;
    var config = e.config
    if(config && config.blobs_url && typeof config.blobs_url === 'string')
        address = config.blobs_url;
    if(e.getSubscription)
        getSubscription = e.getSubscription;
}


// list of blobs keyed with id number
var blobs = {}; // = { 447270: {}, 447274: {}, ... }
var subscription = null;



function sendPayload(blobId, state/*true exists*/, pos, rot) {

    if(blobs[blobId] === undefined) return;

    var args = [].slice.call(arguments);

    // TODO: Keep this consistent with mw.js
    subscription.sendPayload('P' + subscription.id + '=' +
        JSON.stringify({ args: args }));
}


// Adds a blob to the list of blobs and create 2 subscriptions
function newBlob(blobId, origin) {

    if(!getSubscription) return null;

    // TODO: Mix this protocol so there are no magic strings, and in
    // effect it is not a protocol.
    //
    // These magic strings must match in subscriptions/blobAvatars.js
    //
    if(subscription === null)
        subscription = getSubscription("blob_avatar_position"/*name*/,
            null/*className*/, "blob_avatar_position"/*shortName*/,
            'blob avatar position'/*description*/,
            false/*isOwner we have no socket*/, null/*parentId*/, null/*socket*/);

    blobs[blobId] = {
        posi: origin, // position initial
    }

    return blobs[blobId];
}

// Stupid fixed rotation value that we send:
//                 x    y    z    e
var rotation = [ 0.0, 0.0, 1.0, 0.0];
var scale = 1.0;
// Applied without scale
//               x    y    z
var offset = [ 0.0, 1.0, 3.0 ];


function getBlobPosition(id, origin) {

    var p = blobs[id].posi;// position initial
    return [
        scale * (origin.x - 4.0* p.x) + offset[0], // x
        scale * (origin.y - 4.0* p.y) + offset[1], // y
        scale * (origin.z - p.z) + offset[2]  // z
    ];
}

var socket = require('socket.io-client')(address);

//We are telling the server we will listen for all blobs
//socket.emit('start', {connectionType: 'LISTENER'});
/*
 If we wanted to listen for specific camera ids we need to populate a
 reqCameras field with an array of ids
 Example:

     socket.emit('start', {connectionType: 'LISTENER', reqCameras: [0,1,2]});
     //will subscript to cameras 0,1,and 2
 */
/*
 you can also only receive the blobs without the global transformation by
 adding the local: true field to your spec
 */

/**
 * This will inform the user when the connection to the server occurs to
 * help diagnose between being unable to connect and not receiving the
 * blobs form the server for some reason
 */
socket.on('connect', function () {
    console.log('connected to blob server!');
    //We are telling the server we will listen for all blobs
    socket.emit('start', {connectionType: 'LISTENER'});
});

/**
 * This will alert the user when a network/socket error is encountered and
 * give a detailed error message so that the issue can be addressed
 */
socket.on('error', function (err) {
    console.log('an error occurred on the socketIO socket: ' + err);
});

/**
 * Listen for new blobs and log when they are received
 * The newBlob event will be emitted by the server when a blob has been created.
 */
socket.on('newBlob', function (blob) {
    //console.log('newblob was received with data: ' + JSON.stringify(blob));
    var origin = blob.origin;
    newBlob(blob.id, origin);
    sendPayload(blob.id, true/*it exists*/,
        getBlobPosition(blob.id, origin), rotation);
});
/**
 * Listen for update blobs. Logging update blobs is turned off by default
 * as update blobs can come in a steady stream so logging them would
 * clutter stdout and lead to a more confusing example.  an updateBlob
 * event will be sent when an existing blobs has updated coordinates to
 * notify of those changes.
 */
socket.on('updateBlob', function (blob) {
    //logging update blobs may spit out too much
    if(blobs[blob.id] === undefined) return;
    //console.log('updateBlob' + JSON.stringify(blob));
    sendPayload(blob.id,  true/*it exists*/,
        getBlobPosition(blob.id, blob.origin), rotation);
});
/**
 * Listen for remove blobs and log when they are received.
 * The removeBlob event will be sent when an existing blob is not longer
 * in the world and should be removed.
 */
socket.on('removeBlob', function (blob) {
    //console.log('removedBlob was received with data: ' + JSON.stringify(blob));
    sendPayload(blob.id,  false/*it does NOT exists*/);
    delete blobs[blob.id];
});


console.log('loaded nodeJS module: ' + __filename +
    ' with blob server at: ' + address);
