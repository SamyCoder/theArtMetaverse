#include <cstdlib>
#include <string>
#include <stdlib.h>
#include <memory>
#include <iostream>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <opencv2/core.hpp>
#include <opencv2/highgui.hpp>
#include "config.h"
#include "camera.h"
#include "display.h"
#include "track.h"
#include "objecttracker.h"
#include "difference.h"
#include "blob.h"
#include "blobSender.h"
#include <opencv2/calib3d.hpp>



static
void sendTracks(int cameraId, cv::Size imgSize, ObjectTracker* tracker, blobSender& sender) {
    Blob blobData;
    memset(&blobData, 0, sizeof(blobData));
    blobData.cameraID = cameraId;

    // Send deleted blobs first
    for(int id : tracker->getDeletedTracks()) {
        blobData.id = id;
        sender.sendRemoveBlob(&blobData);
    }

    // Then send new/updated blobs
    for(const std::unique_ptr<Track>& track : tracker->getTracks()) {
        blobData.id = track->getId();
        const cv::Rect& bbox = track->getBBox();
        blobData.bounding_x = bbox.x;
        blobData.bounding_y = bbox.y;
        blobData.bounding_width = bbox.width;
        blobData.bounding_height = bbox.height;
        blobData.origin_x = bbox.x + (bbox.width * 0.5);
        blobData.origin_y = bbox.y + (bbox.height * 0.5);
        blobData.area = cv::contourArea(track->getContour());

        blobData.image_width = imgSize.width;
        blobData.image_height = imgSize.height;

        if(track->getAge() == 1) {
            sender.sendNewBlob(&blobData);
        } else {
            sender.sendUpdateBlob(&blobData);
        }
    }
}

static int
usage(char *argv0) {
    std::cout
        << "  Usage: " << std::endl
        << "    " << argv0 << " ID CONFIG.yml [--no-display]" << std::endl
        <<  "  Or:" << std::endl 
        << "    " << argv0
        << " ID cameraURL serverAddress serverPORT [ CROP_X CROP_Y CROP_W CROP_H ] [--no-display]"
        << std::endl
        << std::endl
        << "  Run video motion tracking program."
        << std::endl
        << "  The program accepts 2, 4, or 8 arguments in the orders shown above, in addition to"
        << std::endl
        << "  the optional --no-display switch which must be last."
        << std::endl
        << std::endl
        << "TODO: Write a better command-line interface."
        << std::endl;
    return 1;
}


int main(int argc, char *argv[]) {

    // This is all the current configurable parameters that we will need
    // and expose to the user to run this program.
    std::string masterAddress;
    std::string videoURL;
    std::string cameraTitle;
    int masterPortNumber = 0;
    cv::Rect crop(0,0,0,0); // not cropped, height=0, by default

    int id; // camera ID
    bool haveDisplay = true;

    if((argc > 3 && strcmp(argv[3],"--no-display") == 0) ||
            (argc > 5 && strcmp(argv[5],"--no-display") == 0)||
            (argc > 9 && strcmp(argv[9],"--no-display") == 0))
    {
        haveDisplay = false;
        --argc;
    }

    if(argc == 3) {
        if(Config_getParameters(argv[2], id = strtol(argv[1], NULL, 10),
                masterAddress, videoURL, cameraTitle, masterPortNumber, crop))
        return usage(argv[0]); // error
    } else if(argc == 5 || argc == 9) {
        id = strtol(argv[1], NULL, 10);
        videoURL = argv[2];
        masterAddress = argv[3];
        masterPortNumber = strtol(argv[4], NULL, 10);
        if(argc == 9) {
            crop.x = strtol(argv[5], NULL, 10);
            crop.y = strtol(argv[6], NULL, 10);
            crop.width = strtol(argv[7], NULL, 10);
            crop.height = strtol(argv[8], NULL, 10);
        }
    } else
        return usage(argv[0]);

    // Initialize system objects
    blobSender sender(masterAddress.c_str(), masterPortNumber);
    Camera camera(videoURL, crop);
    Display *display = 0;
        if(haveDisplay) display = new Display(cameraTitle);
    ObjectTracker* tracker = new DifferenceTracker();

    // Start video processing
    try {
        cv::UMat frame;
        while(camera.getFrame(frame)) {
            tracker->processFrame(frame);
            if(display)
                display->showFrame(frame, tracker->getMaskImage(), tracker->getTracks());
            sendTracks(id, {frame.cols, frame.rows}, tracker, sender);
            // Only the least-signficant byte is used, sometimes the rest is garbage so 0xFF is needed
            int key = cv::waitKey(10) & 0xFF;
            if(key == 27) { // Escape pressed
                break;
            }
        }
    } catch(const std::exception& ex) {
        std::cerr << "Error occurred: " << ex.what() << std::endl;
        return 1;
    }
    return 0;
}
