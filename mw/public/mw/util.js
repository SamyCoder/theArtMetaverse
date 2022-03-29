
function mw_fail() {

    // TODO: add stack trace or is browser debugger enough?
    var text = "Something has gone wrong:\n";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    line = '\n--------------------------------------------------------';
    text += line + '\nCALL STACK' + line + '\n' +
        new Error().stack + line;
    console.log(text);
    alert(text);
    window.stop();
    throw text;
}

function mw_assert(val, msg=null) {

    if(!val) {
        if(msg)
            mw_fail(msg);
        else
            mw_fail("JavaScript failed");
    }
}


// This starts the popup with widget showing
// and has buttons that hide it.
function _mw_addPopupDialog(widget, button, func = null) {

    if(button.onclick)
        document.body.appendChild(widget);

    var background = document.createElement('div');
    background.className = 'background_dimmer';
    document.body.appendChild(background);

    // stop keying <enter> from clicking the button
    // by removing the onclick callback
    button.onclick = null;

    widget.className = 'widget_box';

    var bottom = document.createElement('div');
    bottom.className = 'widget_bottom';

    function hide() {
        document.body.removeChild(background);
        widget.style.visibility = 'hidden';
        widget.removeChild(bottom);

        // reset the button
        button.onclick = function() {

            // restart Popup Dialog
            _mw_addPopupDialog(widget, button, func);
        };
        return false;
    }


    var b = document.createElement('button');
    b.appendChild(document.createTextNode('cancel'));
    b.onclick = hide;
    b.className = 'widget_button';
    bottom.appendChild(b);

    b = document.createElement('button');
    b.appendChild(document.createTextNode(' ok '));
    b.onclick = function() {
        hide();
        if(func) func();
    };
    b.className = 'widget_button';
    bottom.appendChild(b);

    widget.appendChild(bottom);

    // Start by showing the Popup Dialog.
    widget.style.visibility = 'visible';

    background.onclick = hide;

    console.log('MW showing popup widget:\n   ' +
            widget.innerHTML);
}


/** Adds an pop simple up dialog.
 *
 * @param {Node}[div] HTML DOM node element that is added as a child of the
 * pop up dialog
 * @param {Node}[button] HTML DOM node element that has an onclick method.
 * @param {function}[null] func - is a function that is called
 * with no arguments when the pop up has the "Okay" pressed.
 */
function mw_addPopupDialog(div, button, func=null) {

    mw_addActor(_mw_popup_css_url, function() {
            _mw_addPopupDialog(div, button, func);
    });
}


/** A simple error checking wrapper of document.getElementById()
 * which will spew to console.log and call alert() if it fails.
 */
function mw_getElementById(id) {

    var element = document.getElementById(id);
    if(!element) mw_fail("document.getElementById(" + id + ") failed");
    return element;
}


// Searches node and all its' children and
// returns an array of returnFunc() things that testFunc() was true for.
// There are default testFunc and returnFunc functions.
function _mw_findNodes(node, param,
        returnFunc = function(node, param) {
            return node.getAttribute(param);
        },
        testFunc = function(node, param) {
            return node.hasAttribute && node.hasAttribute(param);
        }) {

    if(node === undefined || !node) return [];

    var ret = [];

    if(testFunc(node, param))
        ret = [returnFunc(node, param)];

    for(node = node.firstChild; node !== undefined && node ;
            node = node.nextSibling) {
        var r = _mw_findNodes(node, param, returnFunc, testFunc);
        if(r.length > 0) ret = ret.concat(r);
    }

    return ret;
}


// Searches node and all its' children and
// returns an array of all nodes with attribute from node and all
// its' children.
function _mw_findAttributes(node, attribute) {

    return _mw_findNodes(node, attribute);
}


// actorCalls is an array of strings.
function _mw_runFunctions(actorCalls)
{
    actorCalls.forEach(
            function(call) {
                console.log('MW Calling: ' + call.call + '(' +
                        call.node + ')');
                window[call.call](call.node);
            }
            );
}


function mw_getCurrentViewpoint()
{
    if(_mw.viewpoint !== undefined) return _mw.viewpoint;

    var x3d = document.getElementsByTagName("X3D");
    mw_assert(x3d && x3d.length > 0, 'first x3d tag not found');
    x3d = x3d[0];
    mw_assert(x3d, 'first x3d tag not found');
    // TODO: I've seen this assertion fail, so it looks like there is
    // a race condition in x3dom.js
    mw_assert(x3d.runtime, "x3d.runtime does not exist");
    // This call suggests that there is just one active viewpoint at any time
    // for a given x3d tag.  So there must be more x3d tags if you need
    // more views.
    var viewpoint = x3d.runtime.getActiveBindable("Viewpoint");

    // Attach default viewpoint if none exists
    // This must be  if(viewpoint == undefined)
    // not if(viewpoint === undefined) WTF?
    if(viewpoint == undefined) {

        viewpoint = document.createElement("viewpoint");
        var scene = x3d.getElementsByTagName("Scene");

        mw_getScene().appendChild(viewpoint);
        //viewpoint.setAttribute("position", "2 1.5 5");
        //viewpoint.setAttribute("orientation", "0 0 0 0");
    }
    _mw.viewpoint = viewpoint;
    return viewpoint;
}


function _mw_addScript(src, onload, opts) {

    console.log('MW Adding Script src= ' + src);
    var script = document.createElement('script');
    document.head.appendChild(script);
    script.onload = onload;
    // script._mw_opts = opts Is how to pass arbitrary data to a script
    // we have not loaded yet.

    script._mw_opts = opts;
    script.src = src;
    script.onerror = function() {
        mw_fail(script.src + ' failed to load');
    };
}


function _mw_addCss(href, onload) {

    console.log('MW Adding CSS href= ' + href);
    var link = document.createElement('link');
    document.head.appendChild(link);
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", href)
        link.onload = onload;
    link.onerror = function() {
        mw_fail(href + ' failed to load');
    };
}


// actorScriptUrls and actorCalls are arrays of strings.
function _mw_addScripts(actorScriptUrls, actorCalls, opts) {

    if(actorCalls && actorCalls.length > 0) {

        var count = actorScriptUrls.length;
        var check = function() {
            --count;
            if(count === 0)
                // We call after all scripts are loaded:
                _mw_runFunctions(actorCalls);
        };

    } else
        var check = null;


    actorScriptUrls.forEach( function(src) {

        _mw_addScript(src, check, opts);
    });
}


function _mw_addX3d(url, onload = null,
        opts = null) {

    // x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:
    //
    // This code a little convoluted to work around a x3dom bug.
    //
    // We are not able to load a inline without putting it in a group of
    // some kind.  If we do not, some of the attributes of the children of
    // the inline seem to just disappear.  It must be a x3dom BUG.  If you
    // wish to fix this by using the inline as the container group node,
    // please run tests to be sure all the possible cases work.  BUG:
    // TODO: fix x3dom inline so it does not lose children and
    // sub-children attributes when being loaded with javaScript.  Please
    // heed this warning, or pain will ensue.
    //
    // TODO: check x3dom web BUG tickets for this bug.
    //
    /// x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG: x3dom BUG:

    if(opts === null)
        var opts = { containerNodeType: 'group' };
    if(opts.containerNodeType === undefined ||
            opts.containerNodeType === null)
        opts.containerNodeType = 'group';

    if(opts.parentNode ===  undefined || opts.parentNode === null)
        var group = document.createElement(opts.containerNodeType);
    else
        var group = opts.parentNode;

    mw_assert(group);

    var inline = document.createElement('inline');
    var namespacename = url;
    if(opts.namespacename !== undefined)
        namespacename = opts.namespacename;
    mw_assert(inline);
    inline.setAttribute("namespacename", namespacename);

    inline.onerror = function() {
        mw_fail(url + ' failed to load');
    };

    group.appendChild(inline);

    mw_getScene().appendChild(group);

    inline.onload = function() {

        var dir = inline.url.replace(/[^\/]*$/, '');
        // This is where x3dom discards attributes if not for the
        // extra group node above the <inline>.
        var actorScripts = _mw_findNodes(inline, 'data-mw_script',
                function(node, attribute) {
                    var src = node.getAttribute(attribute);
                    if(src.substr(0,1) !== '/') {
                        return  dir + src;
                    }
                    else
                        return src;
                }
                );
        var actorCalls = _mw_findNodes(this, 'data-mw_call',
                function(node, attribute) {
                    return {
                        node: node ,
                        call: node.getAttribute(attribute)
                    };
                }
                );

        // if the xd3 file had data-mw_script and/or data-mw_call
        // attributes we load the scripts and run the "mw_call" functions.
        _mw_addScripts(actorScripts, actorCalls, opts);

        inline.onload = null;


        if(typeof(onload) === 'function') {
            console.log('MW loaded ' + url + ' calling load handler');
            onload(group);
        } else
            console.log('MW loaded ' + url + ' no load handler');
    };

    inline.setAttribute('url', url);
}


function _mw_addActor(url, onload = null, opts = null) {

    var suffix = url.replace(/^.*\./g, '').toLowerCase();

    switch (suffix) {
        case 'x3d':
            _mw_addX3d(url, onload, opts);
            return;
        case 'js':
            _mw_addScript(url, onload, opts);
            return;
        case 'css':
            _mw_addCss(url, onload);
            return;
        default:
            console.log('MW Unknown Actor type: ' + url);
    }
}

/** Get the X3D Scene node.
 */
function mw_getScene() {

    if(_mw.scene === undefined) {
        var scenes = _mw_findNodes(
                document.getElementsByTagName("BODY")[0], 'SCENE',
                function (node, nodeName) {
                    return node; // what to return in an array
                },
                function (node, nodeName) {
                    // The test function
                    return node.nodeName === nodeName;
                }
                );
        mw_assert(scenes.length === 1, 'scenes=' + scenes);
        _mw.scene = scenes[0];
    }
    return _mw.scene;
}

/** Load a file from a given URL.
 *
 * This adds particular option depending on the file type loaded.
 * File types are:
 *
 *   .x3d - X3D files
 *
 *   .js - javaScript files
 *
 *   .css - CSS style files
 *
 *  @param {string} [null] url - The relative or full URL of the file.
 *  If url is an Array this will load all URLs in the Array, and
 *  the onload callback will be called after all the URLs are loaded.
 *  @param {function} [null] onload - Function called after the file
 *  is loaded.
 *  @param {Object} [null] opt - Additional options.
 *
 *
 *  @see
 *  {@link file_test_simple}
 *
 *  @see
 *  {@link file_test_viewpointAvatar}
 *
 *  @see
 *  {@link file_test_chat}
 *
 *  @see
 *  {@link file_test_viewpointAvatar_lamp_chat}
 */
// Add a node from a served file:
//
//    <inline> for .x3d added to <scene>
//    <script> for .js
//    <link>   for .css
//
//  url is:
//
//    1. full path
//    2. relative to document.currentScript if not in handler
//    3. scriptNode.Dir/url if in a handler in a mw_addActor()
//       loaded script file
//
//  Works with url being an array.
//
function mw_addActor(url = null, onload = null, opts = null) {

    mw_assert(url !== null, 'mw_addActor(url = null,,)');
    // TODO: consider adding a query part to the URL

    //console.log('mw_addActor(' + url + ', ' + onload, opts);

    if(url.constructor === Array) {
        if(url.length > 1) {
            var len = url.length;
            while(url.length > 1)
                _mw_addActor(url.shift(), function(node) {
                    if(--len === 1)
                        // Do the last one last.
                        _mw_addActor(url.shift(), onload, opts);
                }, opts);
        } else if(url.length === 1)
            _mw_addActor(url[0], onload, opts);
    } else {
        _mw_addActor(url, onload, opts);
    }
}


function _mw_currentScriptAddress() {

    // document.currentScript is not defined in script handlers.
    mw_assert(document.currentScript,
            'you cannot get the current script in a handler');
    return document.currentScript.
        src.replace(/^.*:\/\//, '').replace(/\/.*$/, '');
}


// returns a string that is the URL without the filename
// and including the last '/'.
// This will not work in a callback function.
function _mw_getCurrentScriptPrefix() {

    mw_assert(document.currentScript,
            '_mw_getCurrentScriptPrefix(): you cannot get ' +
            'the current script in a handler');
    return document.currentScript.src.replace(/[^\/]*$/,'');
}


/** A utility object that is used to get options to javaScript loaded with
 * mw_addActor().
 *
 * @example
 * {@link file_subscription_lamp}
 */ 
function mw_getScriptOptions() {

    mw_assert(document.currentScript,
            'mw_getScriptOptions(): you cannot get ' +
            'the current script in a handler');


    if(document.currentScript._mw_opts)
        var opts = document.currentScript._mw_opts;
    else
        var opts = {};


    if(opts.script === undefined) {
        opts.script = document.currentScript;
    }

    if(opts.src === undefined) {
        opts.src = document.currentScript.src;
    }

    if(opts.prefix === undefined) {
        opts.prefix = _mw_getCurrentScriptPrefix();
    }

    if(opts.mw === undefined) {
        var keys = Object.keys(_mw.mw);
        mw_assert(keys.length > 0, 'mw_getScriptOptions(): for ' +
                'src=' + opts.src + '\n    ' +
                'No WebSockets client conection found');
        opts.mw = _mw.mw[keys[0]];
    }

    return opts;
}


// We need to calculate the URL path now and not in the call
// of a function later.
var _mw_popup_css_url = _mw_getCurrentScriptPrefix() + 'mw_popupDialog.css';

