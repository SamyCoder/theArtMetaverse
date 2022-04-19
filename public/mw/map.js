
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
// function viewCheckpointBird() {
//     var modal = document.getElementById("modal-map");
//     modal.style.display = "none";
//     document.getElementById('bird-eye-view').setAttribute('set_bind','true');
    
// }

// function viewCheckpointBirdRot() {
//     var modal = document.getElementById("modal-map");
//     modal.style.display = "none";
//     document.getElementById('bird-eye-view-rot').setAttribute('set_bind','true');
    
// }
// // open modal
// mapOpen.onclick = function() {
//     console.log("Open");
//   modal.style.display = "block";
// }

// // close modal
// closeMap.onclick = function() {
//     console.log("Close");
//   modal.style.display = "none";
// }