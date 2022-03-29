/** @file
 *
 * This javaScript codes loads a very simple world and a simple
 * viewpointAvatar as a {@link MW#getSubscriptionClass subscription}.
 *
 * @see
 * {@link file_subscription_viewpointAvatar}
 *
 * @namespace file_test_chat
 */

(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Our very simple test world:
    mw_addActor(prefix + 'plane.x3d');
    mw_addActor(prefix + 'gnome.x3d');

    mw_addActor(prefix + '../subscriptions/viewpointAvatar.js');

})();
