
// open modal
function openMap() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "block";
}

// open modal
function closeMap() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
}

function viewCheckpointRight() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('left').setAttribute('set_bind','true');
    
}
function viewCheckpointLeft() {
    var modal = document.getElementById("modal-map");
    modal.style.display = "none";
    document.getElementById('right').setAttribute('set_bind','true');
    
}
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