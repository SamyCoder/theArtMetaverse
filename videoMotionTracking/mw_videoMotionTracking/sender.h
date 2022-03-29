#pragma once

#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>

#include <iostream>


#define SERVER_PORT_NUMBER 9999


class Sender {
public:
    Sender(const char *hostName, int portNumber);
    int writeDataToServer(std::string data);

private:
    int sockfd;
    const char *hostName;
    int portNumber;

};
