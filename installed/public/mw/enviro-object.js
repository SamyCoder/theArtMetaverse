// This file is used on the server and the browser client.

function Enviro() {

    if (this.constructor === Enviro) {
        throw new TypeError('Abstract class "Enviro" cannot be instantiated directly.'); 
    }
};


Enviro.prototype.getName = function() {
    throw new TypeError('Cannot call abstract method');
}

Enviro.prototype.getState = function() {
    throw new TypeError('Cannot call abstract method');
}

Enviro.prototype.updateServer = function () {
    throw new TypeError('Cannot call abstract method');
}

Enviro.prototype.updateClient = function () {
    throw new TypeError('Cannot call abstract method');
}

function Lamp(name, lampOn) {

    Enviro.apply(this, arguments);

    this.name = name;
    this.lampOn = lampOn;
    this.type = "lamp";
};

Lamp.prototype = Object.create(Enviro.prototype);

Lamp.prototype.constructor = Lamp;

Lamp.prototype.getName = function() {

    return this.name;
}

Lamp.prototype.getState = function() {

    return this.lampOn;
}

Lamp.prototype.getType = function() {

    return this.type;
}


Lamp.prototype.updateServer = function() {

    this.lampOn = !this.lampOn;

    return this.lampOn;
}

Lamp.prototype.updateClient = function() {

    var lightBulb = document.getElementById(this.name);

    if(!lightBulb) return;

    var mat = lightBulb.getElementsByTagName("Material");

    var status = mat[0].getAttribute("diffuseColor");

    if (status == ".95, .9, .25") {
        mat[0].setAttribute("diffuseColor", ".64 .69 .72");
    } else {
        mat[0].setAttribute("diffuseColor", ".95, .9, .25");
    } 
}

// Browser clients, that define window, do not do module.exports (as in
// nodeJS).
if (typeof window == 'undefined') {
    module.exports = Enviro;
    module.exports = Lamp;
}
