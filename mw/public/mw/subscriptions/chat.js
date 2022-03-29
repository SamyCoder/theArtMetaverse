/** @file
 *
 * This javaScript codes implements chat session that is shared with other
 * clients.
 *
 * @namespace file_subscription_chat
 *
 * @see
 * {@link file_test_lamp}
 */

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
    var ul_messages = document.getElementById('messages');
    /*var button = document.createElement('A');
    button.href = '#';
    button.appendChild(document.createTextNode('Chat'));
    // TODO: could be prettier.
    var tempLoc = document.getElementById()
    document.body.appendChild(button);
    button.title = 'chat';
    var div = document.createElement('div');
    div.innerHTML = '<h2>Chat</h2>\n';
    div.appendChild(ul_messages);*/

    console.log("I actually enter the file");
    var input = document.getElementById('inputField');
    var send = document.getElementById('sendButton');
  //  div.appendChild(input);
    input.autofocus = true;

    // button.onclick = function(e) {
    //     // TODO: kind of a dumb place to put a chat session.
    //     mw_addPopupDialog(div, button);
    // };


    /* Get a named subscription: create it if it does not exist yet. */
    var s = mw.getSubscription(

        'chat'/*unique subscription name*/,
        'simple_chat'/*shortName*/,
        'simple chat'/*description*/,

        /* subscription creator initialization */
        function() {

            if(this.create)
                // We start with this initial value for this subscription
                this.write('<em>' + mw.user + "</em> created chat");
            else
                this.write('<em>' + mw.user + '</em> joined chat session');
        },

        /* subscription reader */
        function(message) {

            var li = document.createElement('li');
            li.innerHTML = message;
            ul_messages.appendChild(li);
        }

        /*TODO: No Cleanup function yet*/
    );

    input.onkeyup = function(e) {
        if(e.keyCode == 13 /*<enter>*/) {
            s.write('<em>' + mw.user + '</em> ' + input.value);
            input.value = '';
        }
    };
    send.onclick = function(e) {
          s.write('<em>' + mw.user + '</em> ' + input.value);
          input.value = '';
    };

})();
