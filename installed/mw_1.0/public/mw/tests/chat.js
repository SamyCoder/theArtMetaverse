(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Our very simple test world:
    mw_addActor(prefix + 'plane.x3d');
    mw_addActor(prefix + 'gnome.x3d');

    mw_addActor(prefix + '../subscriptions/chat.js');
})();
