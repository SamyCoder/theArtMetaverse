// If MotionTrackerServer() is called without new to make an Object
// we use server to keep the object.  It is a singleton.
var theObj = null;

function MotionTrackerServer(blobWriterPortNum, blobReaderPortNum,
        csvCameraSettingsFile) {

    var server;

    if(this.constructor != MotionTrackerServer) {
        // not called with "new MotionTrackerServer()"
        if(theObj !== null) {
            // We can only do this once
            console.log("sourcing " + __filename + " again\n");
            return;
        }
        console.log("making global MotionTrackerServer object");
        // We make a new object for the "this" object.
        server = theObj = {};
    } else {
        // called with new which makes 'this' be a new object 
         console.log("making \"new\" MotionTrackerServer object");
        server = this;
    }


    var io = require('socket.io')(blobWriterPortNum);
    console.log("listening for socket.io connections on port: " +
            blobWriterPortNum);
    var net = require("net");
    var bm = require('./blobManager');

    var processCallback = function (data) {

        if (data.age == 'OLD') {
            io.in('all').emit("updateBlob", data);
            io.in(data.cameraID).emit("updateBlob", data);
        }
        else if (data.age == 'LOST') {
            io.in('all').emit("removeBlob", data);
            io.in(data.cameraID).emit("removeBlob", data);
        }
        else if (data.age == 'NEW') {
            io.in('all').emit("newBlob", data);
            io.in(data.cameraID).emit("newBlob", data);
        }
    };

    server.manager = new bm(processCallback, csvCameraSettingsFile);

    server.tcpServer = net.createServer(function (socket) {
        console.log('TCP client connected');
        startCallback({"connectionType": "DATASOURCE", "id": "TCP"}, null);
        var firstPartStr = null;
        socket.on('data', function (blobString) {
            var dataSplit = blobString.toString().trim().split('&');
            dataSplit.forEach(function (element) {
                var parsedData;
                try {
                    parsedData = JSON.parse(element);
                } catch (e) {
                    if (firstPartStr != null) {
                        try {
                            parsedData = JSON.parse(firstPartStr + element);
                            element = firstPartStr + element;
                        }
                        catch (e) {
                            //console.log('invalid blob combination ', firstPartStr + element);
                        }
                    }
                    firstPartStr = element;
                    return;
                }
                if (parsedData.age == 'OLD') {
                    updateCallback(parsedData);
                }
                else if (parsedData.age == 'NEW') {
                    newCallback(parsedData);
                }
                else if (parsedData.age == 'LOST') {
                    removeCallback(parsedData);
                }
                else {
                    console.log('Blob with invalid age: ', element);
                }
            });
        });

        socket.once('error', function (error) {
            console.log('received an error from the socket ', error);
        });

        socket.once('end', function () {
            console.log('TCP client connection ended');
        });
    });



    io.on('connection', function (webSocket) {

        webSocket.once("start", function (data) {
            startCallback(data, webSocket);
        });

        webSocket.on("new", newCallback);

        webSocket.on("update", updateCallback);

        webSocket.on("remove", removeCallback);

        webSocket.once("disconnect", disconnectCallback);

        webSocket.on("reload", function () {
            manager.reloadTable();
        });
    });

    var checkBlobJSON = function (data) {
        //    if (!data.age) {
        //        return false;
        //    }
        //    if (!data.id) {
        //        return false;
        //    }
        return true;
    };


    var startCallback = function (data, webSocket) {
        if (data.connectionType && data.id !== null) {
            console.log("Starting new connection: " + JSON.stringify(data));
            switch (data.connectionType) {
                case "DATASOURCE":
                {
                    console.log("New datasource with id: " + data.id);
                    io.emit("addSource", data);
                    break;
                }
                case "LISTENER":
                {
                    console.log("New listener with id: " + data.id);
                    break;
                }
                case "TWOWAY":
                {
                    console.log("New two way connection with id: " + data.id);
                    io.emit("addSource", data);
                    break;
                }
                default:
                {
                    console.log("Invalid connection type: " + JSON.stringify(data));
                }
            }
            if (data.hasOwnProperty('reqCameras')) {
                //we now add this blob to the lists
                for (var i = 0; i < data['reqCameras'].length; i++) {
                    webSocket.join(data['reqCameras'][i]);
                    console.log('joined room: ' + data['reqCameras'][i]);
                }

            }
            else {
                if (data.hasOwnProperty('local')) {
                    console.log('joining local rooms');
                    webSocket.join('local');
                }
                else {
                    if (webSocket) {
                        console.log('joining room as all');
                        webSocket.join('all');
                    }
                }

            }
        }
        else {
            console.log("startCallback JSON ERROR: " + JSON.stringify(data));
        }
    };

    var newCallback = function (data) {
        if (checkBlobJSON(data) === true) {
            if (data.connectionType === "LISTENER") {
                console.log("Listener sent a 'new' update: " + JSON.stringify(data));
            }
            else if (data.connectionType === "DATASOURCE" || data.connectionType === "TWOWAY") {
                io.in('local').emit("newBlob", data);
                manager.processBlob(data);
            }
            else {
                console.log("newCallback Invalid connection type: " + JSON.stringify(data));
            }
        }
        else {
            console.log("newCallback JSON ERROR: " + JSON.stringify(data));
        }
    };

    var updateCallback = function (data) {
        if (checkBlobJSON(data) === true) {
            if (data.connectionType === "LISTENER") {
                console.log("Listener sent an update: " + JSON.stringify(data));
            }
            else if (data.connectionType === "DATASOURCE" || data.connectionType === "TWOWAY") {
                io.in('local').emit("updateBlob", data);
                manager.processBlob(data);
            }
            else {
                console.log("updateCallback Invalid connection type: " + JSON.stringify(data));
            }
        }
        else {
            console.log("updateCallback JSON ERROR: " + JSON.stringify(data));
        }
    };

    var removeCallback = function (data) {
        if (checkBlobJSON(data) === true) {
            if (data.connectionType === "LISTENER") {
                console.log("Listener sent a 'remove' update: " + JSON.stringify(data));
            }
            else if (data.connectionType === "DATASOURCE" || data.connectionType === "TWOWAY") {
                io.in('local').emit("removeBlob", data);
                manager.processBlob(data);
            }
            else {
                console.log("Invalid connection type: " + JSON.stringify(data));
            }
        }
        else {
            console.log("removeCallback JSON ERROR: " + JSON.stringify(data));
        }
    };

    var disconnectCallback = function () {
        console.log('disconnected');
    };

    server.tcpServer.listen(blobReaderPortNum);
    console.log("Reading blobs on tcp port: " + blobReaderPortNum);

    // If not called with new we return the singleton object.
    if(theObj === server)
        return server;
}



if(require.main === module) {

    // running this file as main like: 'node motionTracker.js'

    MotionTrackerServer(8888, 9999, "./cameraSettings.csv");

} else {

    module.exports = MotionTrackerServer;
}
