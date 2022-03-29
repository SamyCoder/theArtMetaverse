/** @file
 *
 * This javaScript codes loads a very simple world and a simple  {@link
 * MW#getSubscription subscription}.
 *
 * @namespace file_test_simpleSubscription
 */


(function() {

    var prefix = mw_getScriptOptions().prefix;
    var mw = mw_getScriptOptions().mw;

    // Our very simple test world:
    mw_addActor(prefix + 'plane.x3d');
    mw_addActor(prefix + 'gnome.x3d');

    var interval;
    var localCounter = 0;

    /* Get a named subscription: create it if it does not exist yet. */
    var s = mw.getSubscription(

        'simple_named_hello'/*unique subscription name*/,
        'simple_counter_subscription'/*short description*/,
        'simple named subscription that writes to the console.log()'/*description*/,

        /* subscription initialization */
        function() {

            if(this.create) {
                // In this case we are the creator of this subscription.
                console.log('We made the named subscription id=' +
                        this.id + " with name=" + this.name);
                this.write('Creator ' + mw.user, localCounter/*counter initialization*/);
            } else {
                // In this case we are NOT the creator of this subscription.
                console.log('We connected to the existing named subscription id=' +
                    this.id + " with name=" + this.name);
            }
        },

        /* subscription reader callback function */
        function(user, counter) {

            console.log("Subscription id=" + this.id + " contains counter: " +
                    counter + "\n from user: " + user);
            localCounter = counter;
        },

        /*The Cleanup function.*/
        function() {

            console.log("Calling Cleanup function for Subscription id=" + this.id +
                    " which had the name=" + this.name);
            clearInterval(interval);
        }
    );

    interval = setInterval(function() { 
        s.write('User ' + mw.user, ++localCounter);
    }, 3000/*thousandth's of a second*/);

})();
