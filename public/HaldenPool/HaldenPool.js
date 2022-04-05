(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Add Halden Pool to the Scene
    mw_addActor(prefix + '/HaldenPoolModel/Pool_w_a_view.x3d');

    // Add avatars to the scene
    mw_addActor(prefix + '../mw/subscriptions/viewpointAvatar.js');
})();
