function configureArtworkOverlay(){
    var artwork = document.getElementById("mw__Box5");
    var artWorkAudioTemplate = document.getElementById("artWorkAudioId");

    artwork.addEventListener("click", function() {
        artWorkAudioTemplate.classList.toggle("show");
    });

    
}