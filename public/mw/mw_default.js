// Note: this script does not pollute the name space.
// Load this with mw_addActor('mw_default.js', mw)
// where mw is the mirror worlds client from mw_client().



// Run this after this script is loaded which is after the mirror worlds
// client is setup.
(function() {

    var pre = mw_getScriptOptions().prefix;

    mw_addActor(pre+'test/plane.x3d');
    mw_addActor(pre+'test/gnome.x3d');
    mw_addActor(pre+'subscription/viewpointAvatar.js');

})();
