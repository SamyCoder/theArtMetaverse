// Simple example callbacks.

// Simple hello function to test that it is called.
function hello(node) {

    var text = '';
    if(node) text = ' with name ' + node.nodeName;
    console.log("hello(node) called with node=" + node + text);
}


// Just a stupid animation example.  Pass in a node and this will make it
// rotate with randomly changing direction with with a continuous rate,
// i.e. not jerky, like it has inertia.

function move(node) {

    var transNode = node;

    if(node.nodeName !== 'matrixtransform') {
        transNode = document.createElement('matrixtransform');
        node.parentNode.appendChild(transNode);
        node.parentNode.removeChild(node);
        transNode.appendChild(node);
    }

    var mat = x3dom.fields.SFMatrix4f.parseRotation('1 0 0 0');
    var z = Math.random()*2.0 - 1.0,
        y = Math.random()*2.0 - 1.0,
        x = Math.random()*2.0 - 1.0;
    var n = Math.sqrt(x*x + y*y + z*z);
            x /= n, y /= n, z /= n;

    // This is the rate at which we change the direction that we are
    // rotating.
    //
    // TODO: make this consistent with the frame rate from the
    // requestAnimationFrame() calls.
    var rate = 0.02;

    function animate() {
        // pick a random vector direction
        var rz = Math.random()*2.0 - 1.0,
            ry = Math.random()*2.0 - 1.0,
            rx = Math.random()*2.0 - 1.0;

        // Normalize this direction
        n = Math.sqrt(rx*rx + ry*ry + rz*rz);
        rx /= n, ry /= n, rz /= n;

        // change our direction a little in this direction
        x += rate*rx;
        y += rate*ry;
        z += rate*rz;

        // keep our direction normalized
        var n = Math.sqrt(x*x + y*y + z*z);
        x /= n, y /= n, z /= n;

        // make a "small rotation" rotation matrix that
        // rotates in this slightly changed direction.
        var rmat= x3dom.fields.SFMatrix4f.parseRotation( '' +
            x + ' ' + y + ' ' + z + ' 0.004');

        // Rotation
        mat = mat.mult(rmat);
        transNode.setFieldValue("matrix", mat);

        requestAnimationFrame(animate);
    }

    animate();
}

