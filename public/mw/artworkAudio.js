export function configureArtworkOverlay(){
    console.log("in art work config");
    // lamp buttons from the scene for now will trigger an "artwork" to pop-up for audio
    // var lampToggle2 = document.getElementById("mw__lampButton2");
    // lamp buttons from the scene for now will trigger an "artwork" to pop-up for audio
    // var lampToggle1 = document.getElementById("mw__lampButton1");
    // This is the audio div that we will use to place objects in for each artwork
    
    var artwork = document.getElementById("mw__Box5");

    /**
     * Example here the works on w3
     */
    // var spann = document.getElementById("myPopup");
    // var popupbut = document.getElementById("Thebutton");

    artwork.addEventListener("click", function() {
            var artWorkAudioTemplate = document.getElementsByClassName("artWorkAudio");
            console.log("artworkaudiotemp");
            console.log(artWorkAudioTemplate);
            artWorkAudioTemplate.classList.toggle("show"); //This is not running for some reason
            console.log("after toggle");
            console.log(artWorkAudioTemplate);
    });


    // if(lampToggle1) {
    // 	console.log("lamp1");

    // 	//------------------------------------------------------- 
    // 	/**
    // 	 * Fired when the yellow button on lamp post 1 is clicked
    // 	 * and sends updated state to Mirror Worlds server
    // 	 */
    // 	lampToggle1.addEventListener("click", function() {
    // 		console.log("clicked1");
    // 		artWorkAudioTemplate.classList.toggle("show");
    // 		console.log("added or removed class1")
    // 		console.log(artWorkAudioTemplate.classList)
    // 	});
    // };

    // if(lampToggle2) {
    // 	console.log("lamp2");

    // 	//------------------------------------------------------- 
    // 	/**
    // 	 * Fired when the yellow button on lamp post 2 is clicked
    // 	 * and sends updated state to Mirror Worlds server
    // 	 */
    // 	lampToggle2.addEventListener("click", function() {
    // 		console.log("clicked2");
    // 		artWorkAudioTemplate.classList.toggle("show");
    // 		console.log("added or removed class2")
    // 		console.log(artWorkAudioTemplate.classList)
    // 	});
    // };
}