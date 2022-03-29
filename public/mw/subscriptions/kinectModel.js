// Illustrate kinectModel for a client that load this javaScript file.
// This requires two interdependent subscription classes.
// The subsciption model holds:
//
//  1) the model's joint data in JSON
//  2) position and orientation (?)
//
//  The subscription (2) is a child of (1).
//
//  The frameRate will be dictated at the listener side, not this
//  'illustrator' side.

(function () {

    var mw = mw_getScriptOptions().mw;

    console.log("Kinect User connected");

    /* Create a new subscription for each client that calls this.
     * We will not consider what this subscription is called.
     */
    mw.getSubscriptionClass(
            'kinect_JSON_joint' /*unique class name*/,
            'kinect_JSON_joint' /*shortName*/,
            'kinect joint data' /*description*/,

            /* Creator initialization of this top level subscription
             * class. This is called eah time a new subscription of this
             * class is created. Each client that runs this javascript
             * will run this creator function.
             */
            function() {
                
                // *this* is the subscription.
                //
                // We will exclude the client from reading his/her own
                // joint data. We have not really subscribed yet given
                // that the subscription has not been initialized on the
                // server yet.
                //
                // Subscriptions are subscribed to by default, we don't
                // need to read out avatar URL because we know it.
                this.unsubscribe();

                //We need this subscription to go away when this client
                //quits.
                this.makeOwner();

                // TODO: Add widget even handler that will call:
                // this.write(jointModel) to change the frame rate of the joint
                // data. This will be implemented gradually...

                /* Create a child subscription. Create a new subscription
                 * for each client that calls this. It will depend on the
                 * top level jointModel parent subscription */
                this.getSubscriptionClass(
                        'kinect_JSON_position' /*unique class name*/,
                        'kinect_JSON_position' /*shortName*/,
                        'kinect joint data position' /*description*/,

                        /* child creator */
                        function() {

                            // *this* is the child subscription.
                            // We do not read our own avatar motions.
                            this.unsubscribe();
                            // When this client goes away this
                            // subscription is destroyed on the server.
                            this.makeOwner();

                            // Get *this* for next function scope
                            var childSibscription = this;

                            var vp = mw_getCurrentViewpoint();
                            //We don't need to write the initial viewpoint
                            //values because it looks like setting the
                            //'viewpointChanged' listener does that for
                            //us.

                            function writerFunc(e) {
                                //send to server and it turn it's sent to
                                //other clients as our avatar's current 6D
                                //position.
                                childSubscription.write(e.position, e.orientation);
                            };

                            // TODO: If the current view point object
                            // changes, this needs to get the new view
                            // point object and then get position and
                            // orientation from that new view point
                            // object.
                            
                            vp.addEventListener('viewpointChanged', writerFunc);

                            /* If we want to keep things tidy, we can add a
                             * cleanup function for this particular
                             * subscription: */
                             this.setCleanup(function() {
                               vp.removeEventListener('viewpointChanged', writerFunc);
                        });

                    },
                    // we have no consumer functions for this child
                    // subscription class yet, because we need to wait for
                    // the model to load.

                    // we have no cleanup functions for this child
                    // subscription class yet
                );

                this.write(jointModel)
                            // If we want to keep things tidy, we can add
                            // a cleanup function for this particular
                            // subscription: 
                            this.setCleanup(function() {
                                vp.removeEventListener('viewpointChanged', writerFunc);
                            });

                        },

                        // we have no consumer functions for this child
                        // subscription class yet, because we need to wait
                        // for the model to load.
                        
                        // we have no cleanup functions for this child
                        // subscription class yet
                    );

                    this.write(

                            TransformNode.getAttribute('translation');
                            rot = this.TransformNode.getAttribute('rotation');
                            this.TransformNode.parentNode.removeChild(this.TransformNode;
                         }

                         //Get *this* for up-coming function scope
                         var subscription = this;

                         mw_addActor(frameRate,

                             function (transformNode) {
                                 
                                 // TODO: find a better way to get child
                                 // subscriptions?
                                 var child = subscription.children[0];

                                 // Top model is saved for instance when
                                 // we change the frameRate.
                                 subsciption.TransformNode = transformNode;

                                 // Sets a consumer for a particular
                                 // subscription.
                                 // This client will read a particular
                                 // subscription when setReader() is
                                 // called:
                                 child.setReader(function(pos, rot) {

                                     transformNode.setAttribute('translation', pos.x + ' ' + pos.y + ' ' + pos.z);
                                     transformNode.setAttribute('rotation', rot[0].x + ' ' + rot[0].y + ' ' + rot[0].z + ' ' rot[1]);

                                 };

                                 // Sets a cleanup function for a
                                 // particular subscription, otherwise the
                                 // model will stay and stop being active
                                 // after the corresponding user quits.
                                 // Gets called by parent cleanup too.
                                 child.setCleanup(function() {
                                     transformNode.parentNode.removeChild(transformNode);
                                 });

                                 if(poTransformNode.getAttribute('translation')////////////////////////////////////////////
                                     rot = this.TransformNode.getAttribute('rotation');
                                     this.TransformNode.parentNode.removeChild(this.TransformNode);
                             }

                             // Get *this* for up-coming function scope
                             var subscription = this;

                             mw_addActor(frameRate,

                                 function(transformNode) {

                                     // TODO: find a better way to get
                                     // child subscriptions?
                                     var child = subscritpion.children[0];

                                     //Top model is saved for instance
                                     //when we change the frameRate.
                                     sub
