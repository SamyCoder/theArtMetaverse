/** @file
 *
 * This javaScript codes loads a very simple test world.
 *
 * @see
 * {@link mw_getScriptOptions}
 *
 * @namespace file_test_simple
 */

// Run this after this script is loaded which is after the mirror worlds
// client is setup.
(function() {

    var pre = mw_getScriptOptions().prefix;

    mw_addActor(pre + 'plane.x3d');
    mw_addActor(pre + 'gnome.x3d');

})();
