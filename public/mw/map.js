
// open modal
function openMap() {
    document.getElementById('bird-eye-view-map-true').setAttribute('set_bind','true');
    var modal = document.getElementById("modal-map");
    modal.style.display = "block";
}

// open modal
function closeMap() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
}

function viewCheckpointEnd() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('end-checkpoint').setAttribute('set_bind','true');
    
}
function viewCheckpointTop() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('top-checkpoint').setAttribute('set_bind','true');
    
}
