// Notes feature resource: https://www.geeksforgeeks.org/how-to-create-notes-taking-site-using-html-bootstrap-and-javascript/

showNotes();

// Function to show elements from localStorage
function showNotes() {
	let notes = localStorage.getItem("notes");

	if (notes == null) notesObj = [];
	else notesObj = JSON.parse(notes);

	let html = "";

	notesObj.forEach(function(element, index) {
		html += `<div class="noteCard my-2 mx-2 card"
			style="width: 18rem;">
				<div class="card-body">
					<h5 class="card-title">
						Note ${index + 1}
					</h5>
					<p class="card-text">
						${element}
					</p>

				<button id="${index}" onclick=
					"deleteNote(this.id)"
					class="btn btn-primary">
					Delete Note
				</button>
			</div>
		</div>`;
	});

	let notesElm = document.getElementById("notes");

    if (notesElm != null){
        if (notesObj.length != 0){
            notesElm.innerHTML = html;
        }
        else{
            notesElm.innerHTML = `Nothing to show!
            Use "Add a Note" section above to add notes.`;
        }
    }
}

// Function to delete a note
function deleteNote(index) {
	let notes = localStorage.getItem("notes");

	if (notes == null) notesObj = [];
	else notesObj = JSON.parse(notes);

	notesObj.splice(index, 1);

	localStorage.setItem("notes",
		JSON.stringify(notesObj));

	showNotes();
}

// close modal
function closeNotes() {
    var modal = document.getElementById("modal-notes");
    modal.style.display = "none";
}
// open modal
function openNotes() {
    var modal = document.getElementById("modal-notes");
    modal.style.display = "block";
}
