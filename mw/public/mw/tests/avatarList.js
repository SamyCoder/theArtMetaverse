(function() {

    var opts = mw_getScriptOptions();

    mw_addActor(opts.prefix + '../mw_popupDialog.css');

    opts.mw.glob('/mw/avatars/*.x3d', function(er, files) {

        console.log('glob er=' + er + ' glob files=' + files);
        if(er) {
            console.log('MW failed to get avatar list:\n   ' +
            er);
            return;
        }

        // var button = document.getElementById('select_avatar');
        // if(!button) {
        //     button = document.createElement('A');
        //     button.href = '#';
        //     button.appendChild(document.createTextNode('Select Avatar'));
        //     // TODO: could be prettier.
        //     document.body.appendChild(button);
        //     button.title = 'change avatar';
        // }

        var button = document.getElementById('menuButton');

        button.onclick = function(e) {

            var div = document.createElement('div');
            var innerHTML =
'  <h2>Select an Avatar</h2>\n' +
'  <select>\n';

            files.forEach(function(f) {
                    innerHTML +=
'     <option value="' + f + '">' +
                f.replace(/^.*\/|/g,'').replace(/\.x3d$/, '').replace(/_/g, ' '); +
                '</option>\n';
            });

            innerHTML +='  </select>\n';

            div.innerHTML = innerHTML;

            mw_addPopupDialog(div, button);
        }

    });

})();
