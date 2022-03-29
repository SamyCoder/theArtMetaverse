// This makes a simple blob avatar for all users (clients) that load
// this javaScript file.  This makes two interdependent subscription
// classes.  The two subscription classes that contain the payloads that
// are:
//
//   1) the blob avatar URL
//   2) the blob avatar position and orientation
//
// The subscription (2) is a child of (1).
//
/** @file
 *
 * This javaScript codes implements a simple blob avatar.
 *
 * @namespace file_subscription_blobAvatars
 *
 * @see
 * {@link file_test_blobAvatars}
 */

(function () {

    var mw = mw_getScriptOptions().mw;
    var groupNode = null; // top level
    var masterTransformNode = null;

    mw_addActor(mw_getScriptOptions().prefix + "../avatars/av2c_q.x3d",
        function(transformNode) {
            masterTransformNode = transformNode;
            groupNode = transformNode.parentNode;
            groupNode.removeChild(transformNode);
            // We clone this master Node and add clones to the scene in
            // the subscription read callback.
        },{
            containerNodeType: 'Transform'
    });


    mw.getSubscription(
        'blob_avatar_position'/*unique name*/,
        'blob_avatar_position'/*shortDescription*/,
        'blob avatar position'/*description*/,

        /* creator callback */
        function() {

            this.subscribe();
            this.makeOwner(false);
        },
        /* read callback */
        function(id, exists, pos, rot) {

            if(groupNode === null) return;

            if(this.BlobTransforms === undefined) {
                this.BlobTransforms = {};
            }

            if(exists) {
                if(this.BlobTransforms[id] === undefined) {
                    this.BlobTransforms[id] = masterTransformNode.cloneNode(true/*deep*/);
                    groupNode.appendChild(this.BlobTransforms[id]);
                }
            } else if(!exists) {
                if(this.BlobTransforms[id] !== undefined) {
                    groupNode.removeChild(this.BlobTransforms[id]);
                    delete this.BlobTransforms[id];
                }
                return;
            }

            this.BlobTransforms[id].setAttribute('translation',
                    pos[0] + ' ' + pos[1] + ' ' + pos[2]);

            console.log("blob at: " + this.BlobTransforms[id].getAttribute('translation'));

            this.BlobTransforms[id].setAttribute('rotation',
                            rot[0] + ' ' + rot[1] + ' ' +
                            rot[2] + ' ' + rot[3]);
        }
    );

})();
