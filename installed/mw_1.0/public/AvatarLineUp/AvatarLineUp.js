(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Add MAC Model to the Scene
    mw_addActor(prefix + '../mw/tests/plane.x3d');

    mw_addActor(prefix + '../mw/avatars/FemaleTeen_aopted.x3d', null,
        {
            transformAttributes: {translation: '-1.5 4 -1.5'}
        });

    mw_addActor(prefix + '../mw/avatars/MaleTeen_aopted.x3d', null,
        {
            transformAttributes: {translation: '-1.5 4 -1.5'}
        });

    mw_addActor(prefix + '../mw/avatars/mWorldAvatar.x3d');

    mw_addActor(prefix + '../mw/avatars/Regina_aopted.x3d');

    mw_addActor(prefix + '../mw/avatars/Warrior_aopted.x3d');

    mw_addActor(prefix + '../mw/avatars/XBot_aopted.x3d');

    mw_addActor(prefix + '../mw/avatars/YBot_aopted.x3d');

    mw_addActor(prefix + '../mw/avatars/yellow_teapot.x3d', null,
        {
            id: '1',
            transformAttributes: {translation: '-100 4 -100'}
        });

})();
