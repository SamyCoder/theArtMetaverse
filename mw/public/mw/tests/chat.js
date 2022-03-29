/** @file
 *
 * This javaScript codes loads a very simple world and a simple chat
 * session as a {@link MW#getSubscription subscription}.
 *
 * @see
 * {@link file_subscription_chat}
 *
 * @namespace file_test_chat
 */


(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Our very simple test world:
    mw_addActor(prefix + 'plane.x3d');
    mw_addActor(prefix + 'gnome.x3d');

    mw_addActor(prefix + '../subscriptions/chat.js');
})();
