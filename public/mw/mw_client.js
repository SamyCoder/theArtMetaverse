// This is so that we may add Mirror Worlds WebSocket server connections
// from different Mirror Worlds WebSocket servers.  With this we can have
// more that one Mirror Worlds server connection.  So we can watch updates
// from other virtual worlds.

// To use add:
//
//        mw_client(callback, {opt: remoteURL});
//
// where remoteURL is to the other Mirror Worlds server,
// like http://example.com


// Give a hoot don't pollute. The name space.
(function() {

    mw_assert(typeof(_mw.client_userInitFunc) === 'function',
            'Coding logic error in ' + document.currentScript.src);

    // Get the first part of the URL to this server.
    var url = document.currentScript.src.match(/^http(s|)\:\/\/[^\/]*/, '');

    mw_assert(url && url.length, 'cannot get service from ' +
            document.currentScript.src);

    // ws://example.com:2344 or wss://example.com:2345
    url = url[0].replace(/^http/,'ws');

    console.log('MW adding client with url: ' + url);

    _mw.remoteURL = url;
    mw_client(_mw.client_userInitFunc, {url: url});
    _mw.remoteURL = null;

    _mw.client_userInitFunc = null;

})();
