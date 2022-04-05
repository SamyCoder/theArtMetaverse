(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Add MAC Model to the Scene
    mw_addActor(prefix + '/MACDec12/MOSS_exterior.x3d');

    // Add avatars to the scene
    mw_addActor(prefix + '../mw/subscriptions/viewpointAvatar.js');
})();
