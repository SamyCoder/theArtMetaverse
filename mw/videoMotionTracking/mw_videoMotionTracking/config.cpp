#include "config.h"
#include <iostream>

#include <string>
#include <opencv2/core.hpp>

// The Config object has no reason to persist, so there is no point in
// making it an object.  We only need to get the runtime parameters that
// have the given id, and that is it.  So just make this a single function
// that gets the 5 parameters from the id and config file.


// Returns true on error, and spews to std::cerr.
//
// Returns false if it gets the all the config information, and
// spews to std::cerr.
bool Config_getParameters(std::string filename, int id,
        std::string &masterAddress, std::string &videoURL,
        std::string &cameraTitle, int &masterPortNumber,
        cv::Rect &crop) {

    
    cv::FileStorage file(filename, cv::FileStorage::READ);

    if(!file.isOpened()) {
        std::cerr << "Failed to read YML configuration file " <<
            filename << std::endl;
        file.release();
        return true; // error
    }

    // Find entry with "id".  We do this just once, so there is no point
    // in speeding up the search.
    cv::FileNode node;
    int _id;

    for(cv::FileNode n : file["cameras"]) {
        n["id"] >> _id;
        if(_id != id) continue;
        node = n;
    }

    if(id != _id) {
        std::cerr << "Failed to read camera id=" << id <<
            " YML configuration file " <<
            filename << std::endl;
        file.release();
        return true; // error
    }

    file["server"]["address"] >> masterAddress ;
    node["url"] >> videoURL;
    std::string str;
    node["id"] >> str;
    cameraTitle = "camera " + str;
    file["server"]["port"] >> masterPortNumber;
    node["crop"] >> crop;

    node["name"] >> str;
    std::cerr << "Reading from camera " << str << " ";
    node["desc"] >> str;
    std::cerr << str << " at URL: " << videoURL << std::endl;

    std::cerr << "Writing to Server: " << masterAddress
        << ":" << masterPortNumber << std::endl;

    file.release();

    return false; // success returns false
}

