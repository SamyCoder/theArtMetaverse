body {
    margin: 0 auto;
    font: 13px Helvetica, Arial;
}

p {
    margin-top:0;
    margin-bottom:0
}

#main {
    width: auto;
    height: 100%;
}

#x3d {
    height: 80%;
    max-width: 100%;
    min-height: 300px;
    min-width: 700px;
    border: none;
    width: 100%;
}

#info {
    background-color: #CECEE7;
    height: 20%;
    width: 100%;
    min-height: 120px;
}

#sidebar {
    position: absolute;
    width: 300px;
    top: 0;
    right: 0;
    bottom: 0;
}

#maxButton {
    visibility: hidden;
    right: 0;
    cursor: pointer;
}

#minButton {
    visibility: visible;
    cursor: pointer;
}

.minmaxB {
    position: fixed;
    height: 100%;
    padding-left: 7px;
    padding-right: 7px;
    background: #DDD;
    border: none;
}

#content {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    padding: 0;
    width: 273px;
    visibility: visible;
    background-color: rgba(200,200,253,0.7);
}

#toolbar {
    height: 100px;
    padding: 20px;
}

#messageBlock {
    position: fixed;
    width: 100%;
    top: 200px;
    bottom: 0;
}

#messages {
    list-style-type: none; 
    margin: 0; 
    padding: 0;
    top: 0;
}

#messages li {
    padding: 5px 10px;
}

#messages li:nth-child(odd) { 
    background: #eee; 
}

#inputField {
    position: absolute;
    bottom: 10px;
    left: 10px;
    width: 190px;
    height: 25px;
}

#sendButton { 
    position: fixed;
    bottom: 10px;
    right: 10px;
    height: 30px;
    width: 50px;
    background: rgb(130, 224, 255);
    border: none;
}
