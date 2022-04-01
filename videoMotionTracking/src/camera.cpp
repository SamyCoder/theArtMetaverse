#include "camera.h"

Camera::Camera(std::string url, cv::Rect &crop) :
    video(url), crop(crop) {
}


bool Camera::getFrame(cv::UMat& frame) {
    bool status = video.read(frame);
    if(!status)
        return false;
    if(crop.height)
        frame = frame(crop);
    return true;
}
