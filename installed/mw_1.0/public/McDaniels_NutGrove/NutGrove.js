(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Add MAC Model to the Scene
    mw_addActor(prefix + '/NutGroveModel/grove1_Xb.x3d');

    // Add avatars to the scene
    mw_addActor(prefix + '../mw/subscriptions/viewpointAvatar.js');
})();
