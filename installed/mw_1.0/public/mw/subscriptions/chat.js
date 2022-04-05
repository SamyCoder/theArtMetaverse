
(function () {

    // TODO: this needs to be rewritten with a lot more polish
    //
    // TODO: add an enter name thingy.  The name would only
    // be associated with this chat session.
    //
    // TODO: Chat session history???  So you can see the whole session if
    // you join late.  This may require additions to the subscription
    // client/server protocol.

    var mw =  mw_getScriptOptions().mw;

    // TODO: make this HTML better.
    var ul_messages = document.createElement('ul');
    var button = document.createElement('A');
    button.href = '#';
    button.appendChild(document.createTextNode('Chat'));
    // TODO: could be prettier.
    document.body.appendChild(button);
    button.title = 'chat';
    var div = document.createElement('div');
    div.innerHTML = '<h2>Chat</h2>\n';
    div.appendChild(ul_messages);
    var input = document.createElement('textarea');
    div.appendChild(input);
    input.autofocus = true;

    button.onclick = function(e) {
        // TODO: kind of a dumb place to put a chat session.
        mw_addPopupDialog(div, button);
    };


    /* Get a named subscription: create it if it does not exist yet. */
    var s = mw.getSubscription(

        'chat'/*unique subscription name*/,
        'simple_chat'/*shortName*/,
        'simple chat'/*description*/,

        /* subscription creator initialization */
        function() {

            // We start with this initial value for this subscription
            this.write('<em>' + mw.user + "</em> created chat");
        },

        /* subscription reader */
        function(message) {

            var li = document.createElement('li');
            li.innerHTML = message;
            ul_messages.appendChild(li);
        }

        /*TODO: No Cleanup function yet*/
    );

    s.write('<em>' + mw.user + '</em> joined chat session');

    input.onkeyup = function(e) {
        if(e.keyCode == 13 /*<enter>*/) {
            s.write('<em>' + mw.user + '</em> ' + input.value);
            input.value = '';
        }
    };

})();
