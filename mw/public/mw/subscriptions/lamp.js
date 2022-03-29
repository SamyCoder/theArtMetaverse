/** @file
 *
 * This javaScript codes implements simple lamp that we can share whither
 * it is on or off with other clients.
 *
 * @namespace file_subscription_lamp
 *
 * @see
 * {@link file_test_lamp}
 */

(function () {


    var prefix = mw_getScriptOptions().prefix;
    var mw = mw_getScriptOptions().mw;
    var lampModelUrl = prefix + '../tests/lamp.x3d';


    // Default transformAttributes
    var transformAttributes = { translation: '-3 4 -3' };

    if(mw_getScriptOptions().transformAttributes !== undefined)
        // Different than the default transformAttributes
        transformAttributes = mw_getScriptOptions().transformAttributes;

    mw_assert(mw_getScriptOptions().id !== undefined);
    var namespace = lampModelUrl + '_' + mw_getScriptOptions().id;


    mw_addActor(lampModelUrl,

        function(transform) {

            for(var k in transformAttributes)
                transform.setAttribute(k, transformAttributes[k]);

            var bulb = mw_getElementById(namespace + '__lampBulb');
            var state = false;

            /* Get a named subscription: create it if it does not exist yet. */
            var s = mw.getSubscription(

                /* unique subscription name */
                'lamp_' + namespace.replace(/\//g, '_'),
                'lamp_on_off',/*shortDescription*/
                'turn lamp on and off',/*description*/


                /* initialization */
                function() {

                    if(this.create)
                        // We start with the initial lamp value:
                        this.write(state);
                },

                /* subscription reader function */
                function(onOff) {

                    console.log('Read that the Lamp is ' + onOff);

                    if(onOff) // on
                        // yellow-ish
                        bulb.setAttribute("diffuseColor", ".95, .9, .25");
                    else // off
                        // gray-ish
                        bulb.setAttribute("diffuseColor", ".64 .69 .72");

                    state = onOff;
                }

                /* Cleanup function not required */
            );

            // We are all writers of this shared toggle.
            mw_getElementById(namespace + '__toggleSwitch').
                addEventListener("click", function() {

                    console.log('Clicking the lamp');
                    // It does not matter that we are racing others to set
                    // the light state, we just set it based on what we
                    // see the state to be now.
                    s.write(state = !state);
            });

        },

        {
            containerNodeType: 'Transform',
            namespacename: namespace
        },

    );

})();
