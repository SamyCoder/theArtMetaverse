html {
    background-color: #FFF;
    height: 100%;
    margin: 0;
    padding: 0;
}

body {
    height: 100%;
    margin: 0;
    font: 13px Helvetica, Arial; 
}

p {
	margin-top:0;
	margin-bottom:0
}

X3D {
    height: 100%;
    width: 100%;
    border: none;
}

section {
    display: table;
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 0;
}

#sceneContainer {
    background-color: rgba(135, 206, 250, 0.5);
    width: 100%;
    bottom: 130px;
    z-index: -3;
    top: 0;
    position: fixed;
    display: table-row;
    pointer-events: all;
}

#bottomBar {
    background-color: rgba(207, 207, 207, 1);
    width: 100%;
    height: 100px;
    z-index: -4;
    bottom: 0;
    position: fixed;
    padding: 20px 20px 10px 40px;
    display: table-row;
}

#users {
    max-height: 100px;
    overflow:hidden;
    overflow-y:scroll;
}

#sideBar {
    width: 250px;
    height: 100%;
    left: 0;
    z-index: 4;
    position: absolute;
}

.active {
    visibility: visible;
    pointer-events: all;
}

.inactive {
    visibility: hidden;
    pointer-events: none;
}

#maxButton {
    left: 0;
}

#minButton {
    margin-left: 249px;
}

.minmaxB {
	position: fixed;
    display: inline-block;
    height: 100%;
	padding-left: 5px;
	padding-right: 5px;
    background: #FFF;
    border: none;
    cursor: pointer;
}

.minmaxB:hover {
    background: rgb(130, 224, 255);
}

#widgetSpace {
    background-color: rgba(255, 255, 255, .5);
    height: 100%;
    width: 232px;
    position: absolute;
    display: table;
    border-collapse: collapse;
    left: 0;
}

.one-edge-shadow {
	-webkit-box-shadow: 0 1px 6px 0px #2b2b2b;
    -moz-box-shadow: 0 1px 6px 0px #2b2b2b;
    box-shadow: 0 1px 6px 0px #2b2b2b;
}

.shadow {
    -webkit-box-shadow: 0 1px 6px 0px #2b2b2b;
    -moz-box-shadow: 0 1px 6px 0px #2b2b2b;
    box-shadow: 0 1px 6px 0px #2b2b2b;
    
}

.widget {
    background-color: rgba(255, 255, 255, .5);
    display: table-row;
    position: relative;
    min-height: 30px;
    width: 100%;
}

.widgetHeader {
    font-weight: bold;
    background: rgba(175, 175, 175, 1);
    border: 1px solid #999999;
    padding: 15px 0px 15px 15px;
    width: 232px;
    height: 30px;
    display:inline-block;
}

.widgetContent {
    overflow: hidden;
    overflow-y: scroll;
    display: inline-block;
    width: 230px;
    height: 100%;
    min-height: 0px;
    padding: 10px;
}

#inputField {
	margin-left: 5px;
	width: 155px;
	height: 25px;
    position: absolute;
    bottom: 10px;
    left: 0;
}

#messages {
	list-style-type: none;
    margin-bottom: 30px;
    margin-top: 0px;
	padding: 0;
    max-height: 75%;
    overflow:hidden;
    overflow-y:scroll;
}

#messages li {
	padding: 5px 10px;
}

#messages li:nth-child(odd) { 
	background: #eee; 
}

#sendButton { 
    margin-left: 5px;
    height: 30px;
	width: 50px;
	background: rgb(130, 224, 255);
	border: none;
    position: absolute;
    bottom: 10px;
    right: 25px;
    font-weight: bold;
}