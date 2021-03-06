(function() {

    var prefix = mw_getScriptOptions().prefix;

    // Our very simple test world:
    mw_addActor(prefix + 'plane.x3d');
    mw_addActor(prefix + 'gnome.x3d');

    // TODO: get client to cache the ../subscriptions/lamp.js file.

    mw_addActor(prefix + '../subscriptions/lamp.js', null,
            {
                id: '0'/*unique ID to this URL lamp*/
            });

    mw_addActor(prefix + '../subscriptions/lamp.js', null,
            {
                id: '1'/*unique ID to this URL lamp*/,
                // move to different location than the one
                // above lamp.
                transformAttributes: { translation: '-1.5 4 -1.5' }
            });
})();
