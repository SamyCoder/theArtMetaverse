#pragma once

#include <string>
#include <opencv2/core.hpp>
#include <opencv2/videoio.hpp>

class Camera {
public:
    Camera(std::string url, cv::Rect &crop);

    bool getFrame(cv::UMat& frame);

private:
    cv::VideoCapture video;
    cv::Rect crop;
};
