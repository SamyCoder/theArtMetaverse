"use strict";
/**
 * Created by Eric on 10/7/2015.
 */
/** This File will hold a process that will manage all the blobs send to
 * the server.  It will then notify the server of what blobs it needs to
 * send
 */

var method = BlobManager.prototype;

function BlobManager(sendBlobCallback, csvCameraSettingsFile) {
    this.callback = sendBlobCallback;
    var GlobalCoordinate = require("./globalCoordinate");
    this.coordinateConverter = new GlobalCoordinate(csvCameraSettingsFile);
}

function placeInTable(blob, cameraTable) {
    var thisCID = blob.cameraID;
    if (!(thisCID in cameraTable)) {
        cameraTable[thisCID] = {};
    }
    cameraTable[thisCID][blob.id] = blob;
}

function removeFromTable(blob, cameraTable) {
    try {
        if (!delete(cameraTable[blob.cameraID][blob.id])) {
            console.log('failed deleting blob: ' + JSON.stringify(blob));
        }
    }
    catch (err) {
        console.log("Could Not remove blob: " + err);
    }
}


function processRemove(blob, callback) {
    callback(blob);
}


function processUpdate(blob, callback) {
    callback(blob);
}

function processAdd(blob, callback) {
    callback(blob);
}

method.processBlob = function (blob) {
    blob = this.coordinateConverter.makeGlobal(blob);
    if (blob.hasOwnProperty('invalid')) {
        //we are done, do not send this blob
        return;
    }
    if (blob.age == "LOST") {
        processRemove(blob, this.callback);
    }
    else if (blob.age == "OLD") {
        processUpdate(blob, this.callback);
    }
    else {
        processAdd(blob, this.callback)
    }
};

method.reloadTable = function () {
    this.coordinateConverter.reloadCSV();
};

module.exports = BlobManager;
