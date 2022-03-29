
(function() {

    var opts = mw_getScriptOptions();

    mw_addActor(opts.prefix+'plane.x3d');
    mw_addActor(opts.prefix+'gnome.x3d');

    mw_client(
        function(mw) {

            console.log('MW added Mirror Worlds connection ' + mw.url());
        },
        { url: 'http://localhost:8881'}
    );

})();
