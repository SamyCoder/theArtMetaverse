
// open modal
function openMap() {
    document.getElementById('bird-eye-view-map-true').setAttribute('set_bind','true');
    var modal = document.getElementById("modal-map");
    modal.style.display = "block";
}

// close modal
function closeMap() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
}

// teleport to first checkpoint on checkoint 
// on map being clicked
function viewCheckpointEnd() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('end-checkpoint').setAttribute('set_bind','true');
    
}

// teleport to second checkpoint on checkoint 
// on map being clicked
function viewCheckpointTop() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('top-checkpoint').setAttribute('set_bind','true');
    
}
