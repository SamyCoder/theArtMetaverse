export function configureArtworkOverlay(){
    // lamp buttons from the scene for now will trigger an "artwork" to pop-up for audio
    var lampToggle2 = document.getElementById("mw__lampButton2");
    // lamp buttons from the scene for now will trigger an "artwork" to pop-up for audio
    var lampToggle1 = document.getElementById("mw__lampButton1");
    // This is the audio div that we will use to place objects in for each artwork
    var artWorkAudioTemplate = document.getElementById("artWorkAudio");


    /**
     * Example here the works on w3
     */
    // var spann = document.getElementById("myPopup");
    // var popupbut = document.getElementById("Thebutton");

    // popupbut.addEventListener("click", function() {
    //         spann.classList.toggle("show");
    //     });


    if(lampToggle1) {

        //------------------------------------------------------- 
        /**
         * Fired when the yellow button on lamp post 1 is clicked
         * and sends updated state to Mirror Worlds server
         */
        lampToggle1.addEventListener("click", function() {
            artWorkAudioTemplate.classList.toggle("show");
        });
    };

    if(lampToggle2) {
    
        //------------------------------------------------------- 
        /**
         * Fired when the yellow button on lamp post 2 is clicked
         * and sends updated state to Mirror Worlds server
         */
        lampToggle2.addEventListener("click", function() {
            artWorkAudioTemplate.classList.toggle("show");
        });
    };
}