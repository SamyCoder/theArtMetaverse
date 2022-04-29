//This function is not being used, but was used as a staging area
//for the equivalent function in webclient.js
function configureArtworkOverlay(){
    var artwork = document.getElementById("mw__Box5");
    var artWorkAudioTemplate = document.getElementById("artWorkAudioId");

    artwork.addEventListener("click", function() {
        artWorkAudioTemplate.classList.toggle("show");
    });

    
}