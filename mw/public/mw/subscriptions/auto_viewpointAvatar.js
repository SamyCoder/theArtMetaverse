// This makes a simple viewpoint avatar for all users (clients) that load
// this javaScript file.  This makes two interdependent subscription
// classes.  The two subscription classes that contain the payloads that
// are:
//
//   1) the avatar URL
//   2) the avatar position and orientation
//
// The subscription (2) is a child of (1).
//
/** @file
 *
 * This javaScript codes implements a simple viewpoint avatar.
 *
 * @namespace file_subscription_viewpointAvatar
 *
 * @see
 * {@link file_test_viewpointAvatar}
 */

/*
var t_offset = (new Date).getTime();
setInterval(function() {
    var t = (((new Date).getTime() - t_offset)/1000.0).toFixed(1);
    console.log("time is: " + t + " seconds");
}, 100);
*/



(function () {

    var mw = mw_getScriptOptions().mw;


    function addAvatar(avatar) {

        console.log("Using Avatar URL: " + avatar.url);

        /* Create a new subscription for each client that calls this.
         * We don't care what this subscription is called, it's just
         * defined by this javaScript code, so it's anonymous. */
        mw.getSubscriptionClass(
            'user_viewpoint_avatar_url'/*unique class name*/,
            'user_viewpoint_avatar_url'/*shortDescription*/,
            'user viewpoint avatar URL'/*description*/,

            /* Creator initialization of this top level subscription
             * class.  Each client that runs this javaScript will run this
             * creator function once and just once. */
            function() {

                // *this* is the subscription.
                //
                // We do not read our own avatar.  We have not really
                // subscribed yet given that the subscription has not been
                // initialized on the server yet.
                //
                // Subscriptions are subscribed to by default, we don't
                // need to read our avatar URL because we know it.
                this.unsubscribe();


                // We need this subscription to go away when this client
                // quits.
                this.makeOwner();


                // TODO: Add widget event handler that will call:
                // this.write(avatarUrl) to change the
                // avatar.  That's all that is needed to change
                // the avatar, given the code below.

                /* Create a child subscription.  Create a new subscription
                 * for each client that calls this.  It will depend on the
                 * top level avatarUrl parent subscription. */
                this.getSubscriptionClass(
                    'auto_viewpoint_avatar_position'/*unique class name*/,
                    'auto_viewpoint_avatar_position'/*shortDescription*/,
                    'auto avatar viewpoint position'/*description*/,

                    /* child creator */
                    function() {

                        // *this* is the child subscription.
                        // We do not read our own avatar motions.
                        this.unsubscribe();
                        // When this client goes away this subscription
                        // is destroyed on the server.
                        this.makeOwner();

                        // Get *this* for next function scope
                        var childSubscription = this;

                        var vp = mw_getCurrentViewpoint();
                        // We don't need to write the initial veiwpoint
                        // values because it looks like setting the
                        // 'viewpointChanged' listener does that for us.

                        var it = false;
                        var pos, rot;
                        //  Math.random() between 0 and 1
                        var omega = (2.0*Math.PI)/(4.0 + Math.random()); // was 8 + rand
                        var phi0 = 2.0*Math.PI*Math.random();
                        var t = 0.0;
                        var A = 4.0 + Math.random()*2.0;
                        var itPeriod = 15; // was 100, 30,
                        var dt = itPeriod/1000.0; /*milliseconds=1sec/1000*/

                        var animate = function() {
                            t += dt; // t in seconds
                            var phi = omega * t;
                            pos.x = A * Math.sin(phi);
                            pos.z = A * Math.cos(phi);
                            childSubscription.write(pos, rot);
                            //console.log("HAY pos=" + pos.x + "  " + pos.z);
                        }

                        function vpChangedFunc(e) {
                            // send to server and in turn it's
                            // sent to other clients as our
                            // avatar's current 6D position.
                            //childSubscription.write(e.position, e.orientation);

                            // Here where it gets stupid:
                            if(! it) {
                                // We put this in an if block just incase
                                // vpChangedFunc() gets called more than once.
                                vp.removeEventListener('viewpointChanged', vpChangedFunc);
                                pos = e.position;
                                rot = e.orientation;
                                it = setInterval(animate, itPeriod);
                            }
                        };

                        // TODO: If the current view point object changes this
                        // needs to get the new view point object and then
                        // get position and orientation from that new view
                        // point object.

                        vp.addEventListener('viewpointChanged', vpChangedFunc);

                        /* If we want to keep things tidy, we can add a
                         * cleanup function for this particular
                         * subscription: */
                        this.setCleanup(function() {
                            //vp.removeEventListener('viewpointChanged', vpChangedFunc);
                            if(it)
                                clearInterval(it);
                        });
                    },
                    // we have no consumer functions for this child
                    // subscription class yet, because we need to wait for
                    // the model to load.

                    // we have no cleanup functions for this child
                    // subscription class yet
                );

                this.write(avatar.url);

                // Pass this subscription object to the next
                // callback.
                var subObj = this;

                avatar.onChange = function(avatarUrl) {
                    subObj.write(avatarUrl);
                };
            },

            /* particular consumer (reader) of this top level subscription
             * class.  So this is called each time a client writes to a
             * particular subscription of this class. */
            function(avatarUrl) {

                var pos = null, rot;

                if(this.TransformNode !== undefined) {
                    // If we are changing the avatar URL: remove the old
                    // model and than add a new model.
                    // First copy the old avatar position and orientation
                    // so we can put the new one there.
                    pos = this.TransformNode.getAttribute('translation');
                    rot = this.TransformNode.getAttribute('rotation');
                    this.TransformNode.parentNode.removeChild(this.TransformNode);
                }

                // Socket.IO is done...
// https://codeburst.io/why-you-don-t-need-socket-io-6848f1c871cd


                // Get *this* for up-coming function scope
                var subscription = this;

                mw_addActor(avatarUrl,

                    function(transformNode) {

                        // TODO: find a better way to get child subscriptions
                        var child = subscription.children[0];

                        // Save the top model node in case we need to
                        // change the avatar.

                        // So we can remove the old model above.
                        subscription.TransformNode = transformNode;

                        // Sets a consumer for a particular subscription.
                        // This client will become a reader of a
                        // particular subscription when setReader() is
                        // called here:
                        child.setReader(function(pos, rot) {

                            transformNode.setAttribute('translation',
                                pos.x + ' ' + pos.y + ' ' + pos.z);
                            transformNode.setAttribute('rotation',
                                rot[0].x + ' ' + rot[0].y + ' ' +
                                rot[0].z + ' ' + rot[1]);
                            //console.log("pos=" + pos + "  rot=" + rot);
                        });


                        // Sets a cleanup function for a particular
                        // subscription, otherwise the model will stay and
                        // stop being a moving avatar after the corresponding
                        // user quits.  Gets called by parent cleanup
                        // too.
                        child.setCleanup(function() {
                            transformNode.parentNode.removeChild(transformNode);
                        });

                        if(pos) {
                            // We are changing avatars so we need to
                            // remember where to put the avatar.
                            transformNode.setAttribute('translation', pos);
                            transformNode.setAttribute('rotation', rot);
                            //console.log(" pos= " + pos + "  rot=" + rot);
                            pos = null;
                            rot = null;
                        }

                    }, {
                        containerNodeType: 'Transform'
                });
            }

            /* No cleanup function for top level subscription for a
             * particular subscription */
           );
    }


    mw.getAvatars(function(avatar) {

        // Load an avatar from this "avatar" object.
        addAvatar(avatar);
    });

})();
