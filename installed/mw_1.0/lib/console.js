// local module to modify the behavior of console.log() and console.error()
//
// A good explanation of Object.bind(), call(), and apply()
// http://geekswithblogs.net/shaunxu/archive/2013/12/12/bind-call-and-apply-in-javascript-function.aspx
// Funny thing we don't need to use them here. 


// According to the official node js docs,
// https://nodejs.org/dist/latest-v7.x/docs/api/console.html#console_class_console
// the global console is defined as:
//
//       console = new Console(process.stdout, process.stderr);
//
// We will assume that is so.

var log = console.log,
    err = console.error;

// replace the global console object log() function
console.log = function(...arg) {

    // We prepend this to the access log:
    // TODO: Adding stack caller line number and Date info seems a little heavy.
    process.stdout.write(new Date() + ': ');
    log(...arg);
};

// replace the global console object log() function
console.error = function(...arg) {

    // We prepend this to the error log:
    // TODO: Adding stack caller line number and Date info seems a little heavy.
    process.stderr.write(new Date() + ': E: ');
    err(...arg);
};

