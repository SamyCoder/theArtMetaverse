socket = new io.connect("");

function sendMessage(memo) {
	
	var message = memo;
	
	if (message == null) {
		
		message = document.getElementById('inputField').value;
		document.getElementById('inputField').value = "";
		
	}
	
	console.log("Sending a Message!");
	socket.emit('chatmessage', name, message);
}

socket.on('newmessage', function(userName, message)
{
	var newMessage = document.createElement('li');
	
	var nameTag = document.createElement('span');
	nameTag.innerHTML = "<em>" + userName + "</em>";
	
	newMessage.appendChild(nameTag);
	newMessage.appendChild(document.createElement("br"));
	newMessage.appendChild(document.createTextNode(message));
	
	document.getElementById("messages").appendChild(newMessage);
});

function init() {

    //Initialize buttons and listeners for chat function
    var sendButton = document.getElementById("sendButton");
	sendButton.addEventListener('click', sendMessage);
    
	var formDiv = document.getElementById("inputField");
	formDiv.addEventListener('keypress', function(e) {
		
		if(e.keyCode == 13) {
		
			sendMessage();
		}
	});
	
    //Minimize and Maximize functionality for sidebar
	var minButton = document.getElementById("minButton");
    var maxButton = document.getElementById("maxButton");
    var sidebarContent = document.getElementById("widgetSpace");
    
	minButton.addEventListener('click', function(e) {
		
        if (sidebarContent.style.visibility != "hidden") {
                               
			sidebarContent.style.visibility = "hidden";
            minButton.style.visibility = "hidden";
			maxButton.style.visibility = "visible";
			
		}
    });
    
    maxButton.addEventListener('click', function(e) {
        
        if (maxButton.style.visibility != 'hidden') {
                               
            maxButton.style.visibility = "hidden";
            minButton.style.visibility = "visible";
            sidebarContent.style.visibility = "visible";
                               
        }
    });
}