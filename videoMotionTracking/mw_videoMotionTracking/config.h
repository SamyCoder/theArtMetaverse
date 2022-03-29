#pragma once

#include <string>
#include <opencv2/core.hpp>

// See ../config.yml for an example config file to parse by this code.

bool Config_getParameters(std::string filename, int id,
        std::string &masterAddress, std::string &videoURL,
        std::string &cameraTitle, int &masterPortNumber,
        cv::Rect &crop);
