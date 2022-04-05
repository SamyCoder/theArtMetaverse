(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Add MAC Model to the Scene
    mw_addActor(prefix + '/MACSummer2017/MossArt_Composed_UG_cameras.x3d');

    // Add avatars to the scene
    mw_addActor(prefix + '../mw/subscriptions/viewpointAvatar.js');
})();
