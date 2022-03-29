/** @file
 *
 * Implements most of the {@link MW} client and {@link Subscription}
 * code.
 *
 * @namespace file_mw
 */


// one stinking global object
var _mw = {

    connectionCount: 0, // number of times we make a webSocket connection
    client_userInitFunc: null,
    mw: {} // list of WebSocket client connections from mw_client()
};


/** @interface MW */
/** @interface Subscription */
/**
 * @typedef mw
 * @implements MW
 */
/**
 * @typedef subscription
 * @implements Subscription
 */


/** This is a factory function that makes the Mirror Worlds client which
 * includes a WebSocket connection.
 *
 * @function
 *
 * @param {function} [null] userInit - Optional argument.  Callback function
 * that is called with the created client object as the first argument.
 *
 * @param {Object} [{}] opts - Optional argument.  opts.url is the URL of the
 * WebSocket server.  The default URL is the URL is gotten from the web
 * (HTTP) server that served this javaScript file.
 *
 * @return {mw}
 */
// opts { url: 'url' }
function mw_client(
        userInit = null, opts = {})
{
    if(userInit === null)
        userInit = function(mw) {
            console.log('MW called default userInit('+mw+')');
        };


    // We handle protocols: http: https: ws: wss:
    // The http(s) protocols are converted to ws: or wss:
    var defaultUrl = location.protocol.replace(/^http/, 'ws') +
        '//' + location.hostname + ':' + location.port + '/';

    if(opts.url === undefined)
        opts.url = defaultUrl;

    if(opts.url !== defaultUrl && _mw.remoteURL !== opts.url) {

        // This will connect to a remote server.

        // keep trying until _mw.client_userInitFunc is not set
        if(typeof(_mw.client_userInitFunc) === 'function') {

            console.log('MW waiting to connect to: ' + opts.url);
            // Try again later.
            setTimeout(function() {
                // Interesting, this is recursion without adding to the
                // function call stack.  Or is it still called recursion?
                mw_client(userInit, {url: opts.url});
            }, 400/* x 1 seconds/1000*/);
            return null; // See this is returning (popping this call)
            // before we call mw_client() again.
        }

        // This _mw.client_userInitFunc is changed back to null in
        // /mw/mw_client.js

        _mw.client_userInitFunc = userInit;
        // It's not known when this script gets loaded
        mw_addActor(opts.url + '/mw/mw_client.js', userInit);
        return null; // We cannot return an object in this case.
    }


    console.log('MW WebSocket trying to connect to:' + opts.url);

    // The returned object:
    var mw = {};


    // Just to keep a list of these clients in a global called _mw
    var ConnectionNum = _mw.connectionCount;
    _mw.mw[ConnectionNum.toString()] = mw;
    ++_mw.connectionCount;


    ////////// Private object data ////////


    var url = opts.url;
    var clientId = 'unset'; // unique id from the server

    var ws =new WebSocket(url);

    // for on() and emit() socket.IO like interfaces
    var onCalls = {};

    // client side request counter
    var getSubscriptionCount = 0;

    // List of all Subscriptions that are associated with this
    // client/server
    var subscriptions = {};

    // advertisements are subscriptions that we have not loaded
    // any javaScript yet, due to race or whatever reason.
    var advertisements = {};

    // for globing files on the server
    var globFuncs = { };
    var globRequestIdCount = 0;


    var debug;
    function setDebugPrefix() {
        // Just a object local console.log() wrapper to keep prints
        // starting the same prefix for all this MW object.  By using bind
        // we keep the line number where log() was called output-ed to
        // console.log(), a simple function wrapper will not give correct
        // line numbers. This totally rocks, it's so simple and bullet
        // proof.
        debug = console.log.bind(console, 'MW Client[' +
            clientId +'](' + url + '):');
    }
    setDebugPrefix();

    // To disable debug spew:
    // var debug = function() {};


    // for socket.IO like interface
    function on(name, func) {

        mw_assert(onCalls[name] === undefined,
            "setting on('" + name + "', ...) callback a second time." +
            " Do you want to override the current callback or " +
            "add an additional callback to '" + name +
            "'.  You need to edit this code.");
        onCalls[name] = func;
    };


    function emit(name, data) {

        // for socket.IO like interface
        var args = [].slice.call(arguments);
        var name = args.shift();
        ws.send(JSON.stringify({ name: name, args: args }));
    }

    // URL accessor; because the URL may not be the same
    // as the user started with.
    /** Get the WebSocket connection URL.
     *
     * @function
     * @name MW#url
     *
     * @return {string} - WebSocket connection URL as a string.
     */
    mw.url = function() {
        return url;
    };


    ws.onmessage = function(e) {

        //debug('message:\n     ' + e.data);

        var message = e.data;
        // Look for 'P' the magic constant.
        if(message.substr(0, 1) === 'P') {

            // The message should be of the form: 'P343=' + jsonString
            // where 343 is an example source ID.  An example of a
            // minimum
            // message would be like 'P2={}'
            var idLen = 1;
            var stop = message.length - 3;
            // find a '=' so the ID is before it.
            while(idLen < stop && message.substr(idLen+1, 1) !== '=')
                ++idLen;

            if(idLen === stop) {
                debug('Bad WebSocket "on" message:\n   ' + e.data);
                return;
            }

            // We strip off the source ID and send the Payload.
            var sourceId = message.substr(1, idLen);
            var obj = JSON.parse(message.substr(2+idLen));

            mw_assert(subscriptions[sourceId] !== undefined,
                    'subscription with ID=' + sourceId + ' was not found');
            // There is an option to not have a callback to receive
            // the payload with subscriptions[sourceId].readPayload === null.

            if(subscriptions[sourceId].readerFunc !== null)
                (subscriptions[sourceId].readerFunc)(...obj.args);
            else {
                debug('No readerFunc(P=' + sourceId +
                    ') was set yet. Saving payload for later: ' +
                        subscriptions[sourceId].readerFunc);
                // We better be subscribed
                // save this current subscription state in case we
                // get a reader set later.
                subscriptions[sourceId].readPayload = obj.args;
            }

            return;
        }

        var obj = JSON.parse(e.data);
        var name = obj.name; // callback name (not subscription name)

        // We should have this form:
        // e.data = { name: eventName, args:  [ {}, {}, {}, ... ] }
        if(name === undefined || obj.args === undefined ||
                !(obj.args instanceof Array)) {
            mw_fail('MW Bad WebSocket "on" message from ' +
                    url + '\n  ' + e.data);
        }

        if(onCalls[name] === undefined)
            mw_fail('MW WebSocket on callback "' + name +
                    '" not found for message from ' + url + ':' +
                    '\n  ' + e.data);

        debug('handling message=\n   ' + e.data);

        // Call the on callback function using array spread syntax.
        //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Spread_operator
        (onCalls[name])(...obj.args);
    };

    ws.onclose = function(e) {

        debug('closed WebSocket connection');

        // Remove this client from the connection list.
        _mw.mw[ConnectionNum] = null;
        delete _mw.mw[ConnectionNum];
    };

    ws.onopen = function(e) {

        // Currently a no opt.
        debug('connected');
    };

    // pretty good client webSocket tutorial.
    // http://cjihrig.com/blog/how-to-use-websockets/

    on('initiate',/*received from the server*/ function(id) {

        clientId = id;

        // set a starting/default user name
        mw.user = 'User-' + id;
        // Now that we have the Client ID we set the
        // debug spew prefix again.
        setDebugPrefix();

        debug('received "initiate"  My client ID=' + id);

        userInit(mw);
    });


    // See what files are on the server.  Used for example to get
    // a list of avatars on the server.
    on('glob', function(globRequestId, err, files) {

        mw_assert(typeof(globFuncs[globRequestId]) === 'function',
                'bad glob received id=' + globRequestId);
        globFuncs[globRequestId](err, files);
        delete globFuncs[globRequestId];
    });


    mw.glob = function(expression, func) {
        emit('glob', expression, globRequestIdCount.toString());
        globFuncs[(globRequestIdCount++).toString()] = func;
    };


    // gotAvatarFunc(avatars) is a function that gets the argument
    // avatars that is an object which has access to the array of
    // avatars:
    // [ "/mw/avatars/teapot_red.x3d", "/mw/avatars/teapot_blue.x3d"
    // ... ]
    mw.getAvatars = function(gotAvatarFunc) {


        // We ask the server for a list of avatar files and
        // it returns it in the avatars array in the function
        // callback.
        mw.glob('/mw/avatars/*.x3d', function(err, avatars) {

            debug('glob err=' + err + ' glob avatars=' + avatars);
            if(err) {
                debug('MW failed to get avatar list:\n   ' + err);
                return;
            }

            var avatarObj = {};

            // Which avatar do we select from the array of avatars.
            // var avatarIndex = parseInt(clientId)%(avatars.length);

            // Set default to smoke avatar for demo
            var avatarIndex = 0;
            var button = document.getElementById('select_avatar');
            if(!button) {
                button = document.createElement('A');
                button.href = '#';
                button.appendChild(document.createTextNode(
                        'Select Avatar'));
                // TODO: could be prettier.
                document.body.appendChild(button);
                button.title = 'change avatar';
            }

            button.onclick = function(e) {

                var div = document.createElement('div');
                var h2 = document.createElement('h2');
                h2.innerHTML = 'Select an Avatar';
                div.appendChild(h2);
                var select = document.createElement('select');
                var innerHTML = '';

                for(var i=0;i<avatars.length;++i) {
                    innerHTML +=
                        '<option value="' + avatars[i] + '"';
                    if(i === avatarIndex)
                        innerHTML += ' selected="selected"';
                    innerHTML += '>' +
                        avatars[i].replace(/^.*\/|/g,'').
                        replace(/\.x3d$/, '').replace(/_/g, ' '); +
                        '</option>\n';
                }

                select.innerHTML = innerHTML;
                div.appendChild(select);
                mw_addPopupDialog(div, button, function() {
                    // On "Ok" callback function
                    if(avatarIndex !== select.selectedIndex) {
                        avatarIndex = select.selectedIndex;
                        avatarObj.url = avatars[avatarIndex];
                        if(avatarObj.onChange)
                            avatarObj.onChange(avatars[avatarIndex]);
                    }
                });
            };

            // Call the users  gotAvatarFunc() callback with the
            // avatar object.
            debug("avatars=" + avatars +
                " my avatar=" + avatars[avatarIndex]);

            avatarObj.url = avatars[avatarIndex];
            avatarObj.onChange = null;
            gotAvatarFunc(avatarObj);

        }); // mw.glob('/mw/avatars/*.x3d',...)

    };


    // the server is destroying a subscription
    on('destroy', function(id) {

        var s = subscriptions[id];

        if(s === undefined) {

            // We may have not loaded the javaScript for this
            // subscription yet.  This maybe okay.
            debug('got subscription (id=' + id +
                ') "destroy" for unknown subscription');
            return;
        }

        if(s.cleanupFunc)
            s.cleanupFunc();
        delete subscriptions[id];
        printSubscriptions();
    });



    // We setup subscription objects after the server tells
    // us about them in the 'advertise' and 'get' subscription
    // server reply events.  The 2 functions just below:
    function setUpSubscriptionFromClass(x)
    {
        if(subscriptions[x.id] !== undefined)
            // That's okay we know about this subscription already.
            return; // Do nothing.

        subscriptions[x.id] = subscriptions[x.className].
            copy(x.parentId, x.id, x.shortName);

        printSubscriptions();
    }



    // Learn of an existing subscription on the server.  We are
    // not the subscription creator in this case.  This is NOT
    // in reply from a request from this client.
    //
    // TODO: currently this only learns about subscriptions that have a
    // className.
    on('advertise', function(ads) {

        for (var i = 0, len = ads.length; i < len; i++) {

            var x = ads[i];

            mw_assert(x && x.className, "'advertise' className was not set");

            // TODO: add additional javaScript loading for the subscription

            if(subscriptions[x.className] === undefined) {
                if(advertisements[x.className] === undefined)
                    advertisements[x.className] = [];
                // Save this for later after some javaScript is loaded?
                debug('Will save this "advertise" for later');
                advertisements[x.className].push(x);
            } else
                setUpSubscriptionFromClass(x);
        }
    });



    // Called on server respond to clients 'get' request emit('get', ...)
    // We may or may not be the subscription creator in this case.
    // This is in reply to a client 'get' request.
    on('get', function(id, clientKey, name, className,
                shortName, thisClientIsCreator) {

        mw_assert(subscriptions[clientKey] !== undefined, '');

        if(name) {
            // There will be no more new subscriptions with this name or
            // clientKey, so we do not need this record any more.
            // subscriptions with a 'name' only get created once.
            mw_assert(name !== clientKey,
                "Bad clientKey ('" + clientKey + "') subscription");
            // Swap the key for this subscription to use the id from
            // the server.
            var s = subscriptions[id] = subscriptions[clientKey];
            // We don't need this additional reference to this any more.
            delete subscriptions[clientKey];
            initializeSubscription(s, id, shortName);
        } else {
            mw_assert(clientKey === className);
            // This is a new subscription from a subscription class
            // so we keep the subscription class and copy it.
            // One copy is for all subscriptions in the class and one [id]
            // is active.
            var s = subscriptions[id] = subscriptions[clientKey].
                copy(null/*no parentId*/, id, shortName);
        }


        if(thisClientIsCreator) {
            s.create = true;
            Object.freeze(s.create);
            if(s.creatorFunc)
                // We could not do this before the server replied because we
                // did not know if we are the creator of this subscription, at
                // least for the case of "named" subscriptions.
                //
                // If a creator function is set, we call it as an object
                // subscription method.  It can call any of the subscription
                // object methods that we set above.
                s.creatorFunc();
            // This object as the one that could have ran the constructor
            // for this distributed subscription thingy so it will have
            // the list of child and parent subscriptions, or call it the
            // family tree.
            //if(!name)
                // Save a pointer to this subscription
                //subscriptions[clientKey].creator = s;
        } else {
            s.create = false;
            Object.freeze(s.create);
        }



        // We don't need the subscription creator callback any more.
        delete s.creatorFunc;

        if(advertisements[className] !== undefined) {
            // We got other subscriptions of this class before now
            // in an 'advertise' from the server
            advertisements[className].forEach(function(x) {

                setUpSubscriptionFromClass(x);
            });

            delete advertisements[className];
        }

        printSubscriptions(); // debug printing
    });


    // Set the subscription ID.
    // Replace buffered functions with real working functions
    // that talk to the server.
    function initializeSubscription(s, id, shortName) {

        // We can't initialize more than once.
        mw_assert(s.id === null);

        s.id = id;
        s.shortName = shortName;

        s.write = function() {
            ws.send('P' + id + '=' +
                JSON.stringify({ args: [].slice.call(arguments)}));
        };

        if(s.writePayload !== null)
            // Write the last buffered write from before
            // we got an ID; i.e. flush.
            ws.send('P' + id + '=' + s.writePayload);
        delete s.writePayload;

        // TODO: do not do the following if it is not necessary.  In some
        // cases the subscription is setup with these already set.

        if(s.isSubscribed_preInit) {
            s.isSubscribed = false;
            s.subscribe();
            // now s.isSubscribed === true
        } else {
            s.isSubscribed = true;
            s.unsubscribe();
            // now s.isSubscribed === false
        }
        delete s.isSubscribed_preInit;

        s.makeOwner(s.isOwner_preInit);
        delete s.isOwner_preInit;
    }


    // A private factory that returns subscription objects.  These objects
    // returned will not have an associated subscription ID on the server.
    // They are not initialized for use yet.
    function newSubscription(
            name, className,
            shortName, description,
            creatorFunc, readerFunc, cleanupFunc, myParent=null) {

        mw_assert((name && name.length > 0) ||
                (className && className.length > 0),
                'neither name or className are set');

        mw_assert(!name || !className,
                'both name and className are set');

        var lname = name?name:className;

        if(!myParent)
            // name and className may not have a '/' in it.
            mw_assert(lname.indexOf('/') === -1,
                "name or className (" + lname + ") has a '/' in it.");

        // If these 2 default values change you may need to change other
        // stuff.
        var defaults = {
            isSubscribed: true,
            isOwner: false
         };


        // make a subscription object explicitly
        var subscription = {
            id: null,

            isSubscribed: defaults.isSubscribed,
            isSubscribed_preInit: defaults.isSubscribed,
            isOwner: defaults.isOwner,
            isOwner_preInit: defaults.isOwner,

            // subscriptions in a family tree
            children: [],
            myParent: myParent, // The word parent is reserved

            name: name,
            className: className,
            shortName: shortName,
            creatorFunc: creatorFunc,
            readerFunc: null,
            readerFunc_save: readerFunc,
            cleanupFunc: cleanupFunc,

            // We buffer the writes to this subscription
            // until we have a subscription ID.
            writePayload: null,

            // We buffer incoming payloads if we get some
            // while we are not ready to read, and have
            // a subscription ID.
            readPayload: null,

            // copy() returns a copy of this object.
            // var obj2 = obj1 does not work, obj2 is a reference
            // to obj1 and so changing obj2 fields changes obj1
            // fields.; so we may make subscriptions for a
            // subscription class.
            // TODO: Currently just used to copy a subscription
            // that is a subscription class
            copy: function(parentId=null, id, shortName) {
                mw_assert(!this.id && className);
                var s = {};
                // copy just one level deep
                // TODO: if objects get deeper we need
                // to add more code here.
                for(var k in this)
                    s[k] = this[k];
                // Do not share the children.  We are told
                // who our parent is.
                s.children = [];
                // Join a family or not.
                if(!parentId) {
                    s.myParent = parentId;
                } else {
                    mw_assert(subscriptions[parentId] !== undefined);
                    var p = subscriptions[parentId];
                    s.myParent = p;
                    p.children.push(s);
                }
                initializeSubscription(s, id, shortName);
                return s;
            },
            /** Read the subscription: Set the associated MW client to
             * read the subscription by calling the set readFunc()
             * function.
             *
             * @function
             * @name Subscription#subscribe
             */
            subscribe: function() {
                if(this.id === null) {
                    // It is not initialized yet so just
                    // buffer the state.
                    this.isSubscribed_preInit = true;
                    return;
                }
                if(this.isSubscribed) return;
                emit('subscribe', this.id);
                this.isSubscribed = true;
                this.readerFunc = this.readerFunc_save;
                if(this.readPayload && this.readerFunc) {
                    this.readerFunc(...(this.readPayload));
                    readPayload = null;
                }
            },
            /** Destroy the subscription.  Destroy this objects associated
             * subscription by contacting the MW WebSocket server.  All
             * browser clients will lose their associated subscription.
             *
             * The associated subscription cleanup callbacks will be
             * called on all the clients.
             *
             * @function
             * @name Subscription#destroy
             */
            destroy: function() {
                mw_assert(this.id, 'not initialized');
                emit('destroy', this.id);

            },
            /** Do not read the subscription: Set the associated MW client
             * to not read the subscription.  This will connect the server
             * and tell it we are not subscribing.
             *
             * @function
             * @name Subscription#unsubscribe
             */
            unsubscribe: function() {
                if(this.id === null) {
                    // It is not initialized yet so just
                    // buffer the state.
                    this.isSubscribed_preInit = false;
                    return;
                }
                if(!this.isSubscribed) return;
                emit('unsubscribe', this.id);
                this.isSubscribed = false;
                this.readerFunc = null;
            },
            /** Write to a subscription. The arguments to this function
             * can be varied.  The arguments must be consistent with the
             * corresponding subscription {@link Subscription#setReader
             * read} calls.
             *
             * @function
             * @name Subscription#write
             */
            write: function() {
                // Buffer the write for now.  We flush this buffer
                // and change this function after initialization.
                this.writePayload =
                    JSON.stringify({ args: [].slice.call(arguments)});
            },
            /** Made this MW client an owner of the subscription.
             * This will contact the server.
             *
             * If all owners of a subscription disconnect from the server
             * the subscription will be destroyed.
             *
             * @see {@link Subscription#destroy destroy}.
             *
             * @function
             * @name Subscription#makeOwner
             */
            makeOwner: function(isOwner=true) {
                if(this.id === null) {
                    // It is not initialized yet so just
                    // buffer the state.
                    this.isOwner_preInit = isOwner;
                    return;
                }
                emit('makeOwner', this.id, isOwner);
                this.isOwner = isOwner;
            },
            /** This is creates a subscription that is a child of this
             * subscription.  Child subscriptions are dependent on parent
             * subscriptions.  The Child can't exist without the parent.
             * See {@link MW#getSubscription getSubscription} for
             * arguments and other details.
             *
             * @function
             * @name Subscription#getSubscription
             */
            getSubscription:
                function(name, shortName, description,
                        creatorFunc, readerFunc=null, cleanupFunc=null) {
                    mw_assert(this.id, 'not initialized');
                    mw_assert(name.indexOf('/') === -1,
                        "name (" + name + ") has a '/' in it.");
                    var child = newSubscription(this.id + '/' + name,
                            null, shortName, description,
                            creatorFunc, readerFunc, cleanupFunc,
                            this/*Parent*/);
                    this.children.push(child);
                    child.myParent = this;
                    return child;
            },
            /** This is like creates a subscription adding that the
             * subscription as child of this subscription.  Child
             * subscriptions are dependent on parent subscriptions.  The
             * Child can't exist without the parent.  See {@link
             * MW#getSubscriptionClass getSubscriptionClass} for
             * arguments and other details.
             *
             * @function
             * @name Subscription#getSubscriptionClass
             */
            getSubscriptionClass:
                function(className, shortName, description,
                        creatorFunc, readerFunc=null, cleanupFunc=null) {
                    mw_assert(this.id, 'not initialized');
                    mw_assert(className.indexOf('/') === -1,
                        "className (" + className + ") has a '/' in it.");
                    var child = newSubscription(null,
                            className, shortName, description,
                            creatorFunc, readerFunc, cleanupFunc,
                            this/*Parent*/);
                    this.children.push(child);
                    child.myParent = this;
                    return child;
            },
            /** Set the reader callback for this subscription.
             * The arguments of the reader callback must be in the same
             * form as the arguments to the corresponding subscription
             * {@link Subscription#write write} function.
             *
             * If all owners of a subscription disconnect from the server
             * the subscription will be destroyed.
             *
             * @function
             * @name Subscription#setReader
             *
             * @param {function} readerFunc - the function to call when
             * the server pushes subscription data to this client.
             */
            setReader: function(readerFunc) {
                mw_assert(this.id, 'not initialized id=' + this.id);
                // This will be the read function if we subscribe
                this.readerFunc_save = readerFunc;
                if(this.isSubscribed) {
                    this.readerFunc = readerFunc;
                    if(this.readPayload && readerFunc !== null) {
                        this.readerFunc(...(this.readPayload));
                        this.readPayload = null;
                    }
                }
            },
            /** Set the cleanup callback function which is call if
             * this subscription is destroyed.
             *
             * @function
             * @name Subscription#setReader
             *
             * @see {@link Subscription#destroy destroy}.
             */
            setCleanup: function(cleanupFunc) {
                mw_assert(this.id, 'not initialized');
                this.cleanupFunc = cleanupFunc;
            }
        };

        ++getSubscriptionCount;

        // Make a key to store the subscription on this client for
        // until the server sends us an id via 'get' reply
        if(name)
            // TODO: confirm this is a unique key for object subscriptions
            // by just looping until it is.  Unlikely it is not...
            var clientKey = ' k-e- yZ' + getSubscriptionCount.toString();
        else
            var clientKey = className;

        if(subscription.isSubscribed)
            // if is set by default
            subscription.readerFunc = readerFunc;

        // Add it to the list of subscriptions:
        subscriptions[clientKey] = subscription;

        var parentId = myParent ? (myParent.id) : null;


        // Talk to the server.
        // We get a 'get' response with a subscription ID later.
        emit('get', clientKey, name, className, shortName, description,
                // isSubscribed and isOwner  are just default values but
                // we only know them from this code.
                subscription.isSubscribed, subscription.isOwner,
                parentId);

        return subscription;
    }


    // TODO: Figure out how to remove the static in front of the docjs generated
    // getSubscription() documentation.

    /** Create or check a named subscription.
     *
     * The format of subscription data that is shared is determined by the
     * form of the arguments for the subscription {@link Subscription#read
     * read} and {@link Subscription#write write} functions. The arguments
     * are just turned into JSON data that is send to and from the server,
     * similar to how SocketIO sends and receives arguments across
     * WebSockets.   Any MW client may write (push) to a subscription, and
     * reading is pushed for each write to all subscribed MW clients by
     * calling the registered readFunc callback.
     *
     * @function
     * @name MW#getSubscription
     *
     * @example
     * mw_client(function(mw) {
     *     mw.getSubscription('chat', 'chat', 'my chat');
     * });
     *
     * @example
     * See {@link file_subscription_lamp} and {@link file_subscription_chat}.
     *
     *
     * @param {string} name - Unique subscription name for this service.
     * @param {string} shortDescription - a short decription. For example
     * one or two words like: "red_truck".  The server
     * will append to this string making it more unique.
     * @param {string} description - a longer description.  May have HTML
     * in it.
     * @param {function} [null] creatorFunc - creatorFunc is called if this
     * subscription does not exist in the service yet.
     * @param {function} [null] readerFunc - readerFunc is if this client
     * is subscribed and a client is writing to the subscription.  The
     * readerFunc callback made also be set with the {@link
     * Subscription#setReader setReader} method.  The arguments of the
     * readerFunc callback must be in the same form as the arguments to
     * the corresponding subscription {@link Subscription#write write}
     * function.
     * @param {function} [null] cleanupFunc - cleanupFunc is called if the
     * associated subscription is destroyed on the server.
     *
     * @return {subscription} - returns a subscription object.
     */
    mw.getSubscription = function(
            name,
            shortDescription, description,
            creatorFunc=null, readerFunc=null, cleanupFunc=null) {

        return newSubscription(
                name, null, shortDescription, description,
                creatorFunc, readerFunc, cleanupFunc);
    };


    /** Create a unnamed subscription, as in we do not care what it is
     * called on the server.   The new subscription created by each client
     * that calls this is just defined by the callback functions that are
     * set.
     *
     * The format of subscription data that is shared is determined by the
     * form of the arguments for the subscription {@link
     * Subscription#setReader read} and {@link Subscription#write write}
     * functions. The arguments are just turned into JSON data that is
     * send to and from the server, similar to how SocketIO sends and
     * receives arguments across WebSockets.   Any MW client may write
     * (push) to a subscription, and reading is pushed for each write to
     * all subscribed clients by calling the registered readFunc
     * callback.
     *
     * @function
     * @name MW#getSubscriptionClass
     *
     * @example
     * mw_client(function(mw) {
     *     mw.getSubscriptionClass('avatar', 'avatar', 'avatars for everybody');
     * });
     *
     * @example
     * {@link file_subscription_viewpointAvatar}
     *
     * @param {string} className - Unique subscription class name for this service.
     * @param {string} shortDescription - a short decription. For example
     * one or two words like: "red_truck".  The server
     * will append to this string making it more unique.
     * @param {string} description - a longer description.  May have HTML
     * in it.
     * @param {function} [null] creatorFunc - creatorFunc is called when this
     * subscription is made available by the server.
     * @param {function} [null] readerFunc - readerFunc is if this client
     * is subscribed and a client is writing to the subscription.  The
     * readerFunc callback made also be set with the {@link
     * Subscription#setReader setReader} method.  The arguments of the
     * readerFunc callback must be in the same form as the arguments to
     * the corresponding subscription {@link Subscription#write write}
     * function.
     * @param {function} [null] cleanupFunc - cleanupFunc is called if the
     * associated subscription is destroyed on the server.
     *
     * @return {subscription} - returns a subscription object.
     */
    mw.getSubscriptionClass = function(
            className, /* unique for this SubscriptionClass */
            shortName, description,
            creatorFunc=null, readerFunc=null, cleanupFunc=null) {

        return newSubscription(
                null, className, shortName, description,
                creatorFunc, readerFunc, cleanupFunc);
    };


    // This function just spews for debugging and does nothing
    // else.
    function printSubscriptions() {

        debug('Subscriptions:');
        console.log('=========== Current Subscriptions =================');

        for(var key in subscriptions) {
            var s = subscriptions[key];
            if(s.id)
                console.log('   [' + s.id + '] shortName=' +
                    s.shortName + ' ---  ' +
                    (s.isSubscribed?'SUBSCRIBED ':'') +
                    (s.isOwner?'OWNER ':'') +
                    (s.name?('name=' +s.name):('className=' + s.className)));
        }

        console.log('=========== Subscription Classes ============');

        for(var key in subscriptions) {
            var s = subscriptions[key];
            if(!s.id)
                console.log('   [' + key + '] shortName=' +
                    s.shortName);
        }

        console.log('====================================================')
    }

    return mw;
}



// WebRTC
// https://www.html5rocks.com/en/tutorials/webrtc/basics/
// https://www.w3.org/TR/webrtc/
function mw_init() {

    var url = null;

    // Parse the URL query:
    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        url = location.search.replace(/.*(\?|\&)file=/,'').
            replace(/\&.*$/g, '');

    if(url === null || url.length < 1) {
        // The default mode
        // This is the only place that we declare this.
        url = 'mw_default.js';
    }

    mw_client(/*on initiate*/function(mw) {
        mw_addActor(url, null, { mw: mw });
    });
}
