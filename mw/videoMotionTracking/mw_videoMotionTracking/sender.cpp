#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>


#include "sender.h"

// TODO: methods in this class call exit on failure.
// TODO: This code does not use std:err like all the other code.
// TODO: Should use std::string not char *

Sender::Sender(const char *hostName, int portNumber) :
    hostName(hostName), portNumber(portNumber)
{
    struct sockaddr_in serv_addr;
    struct hostent *server;

    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
        perror("ERROR opening socket");
        exit(1);
    }

    server = gethostbyname(hostName);

    if (server == NULL) {
        fprintf(stderr,"ERROR no such host: %s\n", hostName);
        exit(1);
    }

    memset((char *)&serv_addr, 0, sizeof(serv_addr));
    serv_addr.sin_family = AF_INET;
    memcpy((char *)&serv_addr.sin_addr.s_addr, (char *)server->h_addr,
           server->h_length);

    serv_addr.sin_port = htons(portNumber);

    if(connect(sockfd,(struct sockaddr *) &serv_addr,sizeof(serv_addr)) < 0) {
        fprintf(stderr,"ERROR connecting to host: %s:%d: %s\n", hostName, portNumber, strerror(errno));
        exit(1);
    }
}

int Sender::writeDataToServer(std::string data)
{
    size_t len = data.length();
    const char *d = data.c_str();
    ssize_t ret;

    // The OS does not guarantee that the number of bytes requested to send are sent.

    while(len) {

        ret = send(sockfd, d, len, 0);
        if(ret <= 0) break;

        len -= ret;
        d += ret;
    }

    if(ret == 0) {
        fprintf(stderr,"Connection to %s:%d was closed", hostName, portNumber);
        exit(1);
    }

    if(ret < 0) {
         perror("ERROR writing to socket");
         exit(1);
    }

    return 0;
}
