/*******************************************************************
 * Implemntation of multi-user X3DOM - client side.
 * author: Matthew Bock
 * This version focuses on minimizing data transfer, but it still
 * sends and receives updates as soon as they happen with no regard
 * to time since the last update.
 *
 * edited by: Karsten Dees, Nick Hu {11/04/2016}
 ******************************************************************/
 
//-------------------------------------------------------
// Data Fields
//-------------------------------------------------------
 
var socket;
var name;
var spawnPosition = {"x": 2, "y": 1.5, "z": 1};
var spawnOrientation = [{"x": 0, "y": 1, "z": 0}, 0];
var avatarType = "avatars/pumba.x3d";
var x3d;

//-------------------------------------------------------
/*
 * Sets up the X3D scene
 */
function configureScene()
{
    //Set up camera to provide location data
    var camera = x3d.runtime.getActiveBindable("Viewpoint");
    var cPos = "" + spawnPosition.x + " " + spawnPosition.y + " " +
            spawnPosition.z;
    var cRot = "" + spawnOrientation[0].x + " " +
            spawnOrientation[0].y + " " + spawnOrientation[0].z + " " +
            spawnOrientation[1];
    camera.setAttribute("position", cPos);
    camera.setAttribute("orientation", cRot);
    
    //Add listener to camera to update server with location data
    var cam = document.getElementById('firstPerson');
    cam.addEventListener('viewpointChanged', positionUpdated);


    //Add listener to lamp button
    var lampToggle = document.getElementById("mw__lampToggle");

    if (lampToggle)
        lampToggle.addEventListener('click', function(e) {
            console.log("You toggled the lamp!");
        
            socket.emit('environmentChange', "lamp1");
        });
    
    //Add listener to lamp button
    var lampToggle2 = document.getElementById("mw__lampToggle2");

    if(lampToggle2)
        lampToggle2.addEventListener('click', function(e) {
            console.log("You toggled the lamp!");
        
            socket.emit('environmentChange', "lamp2");
        });
}

//-------------------------------------------------------
/*
 * Sets up chat window and user toolbar
 */
function configurePage() 
{
    //Add listener to update server with avatar selection
    var selectAvatar = document.getElementById("selectAvatar");
    
    selectAvatar.addEventListener('change', function() {
        
        socket.emit('newavatar', name, selectAvatar.value);
    });
    
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
    var sidebarContent = document.getElementById("content");
    var sidebar = document.getElementById("sidebar");
    
    minButton.addEventListener('click', function(e) {

        if (sidebarContent.style.visibility != "hidden") {

	    sidebarContent.style.visibility = "hidden";
            minButton.style.visibility = "hidden";
	    maxButton.style.visibility = "visible";

            sidebar.style.pointerEvents = "none";
            sidebarContent.style.pointerEvents = "none";
            maxButton.style.pointerEvents = "all";
        }
    });

    maxButton.addEventListener('click', function(e) {
        
        if (maxButton.style.visibility != 'hidden') {

            maxButton.style.visibility = "hidden";
            minButton.style.visibility = "visible";
            sidebarContent.style.visibility = "visible";

            sidebar.style.pointerEvents = "all";
            sidebarContent.style.pointerEvents = "all";
        }
    });
}

//-------------------------------------------------------
/*
 * Sends position data to server
 */
function positionUpdated(e)
{	
    var pos = e.position;
    var rot = e.orientation;
    
    //Tell the server that this client has moved and send new location data
	socket.emit('updateposition', name, pos, rot, avatarType);
}

//-------------------------------------------------------
/*
 * Sends the specified message to all connected users in the chatroom
 */
function sendMessage(memo) {
	
	var message = memo;
	
	if (message == null) {
		
		message = document.getElementById('inputField').value;
		document.getElementById('inputField').value = "";
		
	}
	
	console.log("Sending a Message!");
	socket.emit('chatmessage', name, message);
}

//-----------------------------
// HTML Manipulators
//-----------------------------

/*
 * Builds HTML list of connected users
 *
 * @param fullListOfUsers - the list of connected users
 */
function buildList(fullListOfUsers)
{
    var userList = document.getElementById("users");
    userList.innerHTML = "";

    //Add each user to the HTML list
    for (var key in fullListOfUsers)
    {
        var current = fullListOfUsers[key];
	var userListEntry = document.createElement('span');
	var newPLine = document.createElement('p');
	userListEntry.setAttribute("id", key);
	userListEntry.innerHTML = (key + " observing at: " + current[1].x +
                ", " + current[1].y + ", " + current[1].z);
	userList.appendChild(newPLine);					
	userList.appendChild(userListEntry);
    }
}

/*
 * Adds a new user to the HTML list of users
 *
 * @param newestUser - user to be added to the list
 */
function addUser(newestUser)
{
    console.log("Adding User: ", newestUser[0]);
    var userList = document.getElementById("users");
    var userListEntry = document.createElement('span');
    var newPLine = document.createElement('p');
    userListEntry.setAttribute("id", newestUser[0]);
    userListEntry.innerHTML = (newestUser[0] + " observing at: " +
            newestUser[1].x + ", " + newestUser[1].y + ", " +
            newestUser[1].z);
    userList.appendChild(newPLine);
    userList.appendChild(userListEntry);
}

/*
 * Removes a user from the HTML list of users
 *
 * @param goodbyeUser - user to be deleted
 */
function removeUser(goodbyeUser)
{
    var users = document.getElementById("users");
    var remove2 = document.getElementById(goodbyeUser[0]);
    users.removeChild(remove2);
}

/*
 * Updates the HTML list with new position data
 *
 * @param updateUser - the updated user
 */
function updateList(updateUser)
{
   document.getElementById(updateUser[0]).innerHTML = 
		(updateUser[0] + " observing at: " +
		updateUser[1].x + ", " + updateUser[1].y + 
		", " + updateUser[1].z);
}

/*
 * Start up client side operations
 */
function init()
{

    var model = document.getElementById('mw_model')
    if(!model) {
        alert('X3D <inline id=mw_model> was not found');
        return;
    }
    // default model
    // TODO: make this url path more relative so it works with URL=file://


    if(location.search.match(/.*(\?|\&)file=.*/) != -1)
        var url = location.search.replace(/.*(\?|\&)file=/,'').replace(/\&.*$/g, '');

    if(typeof url == undefined || url.length < 1)
        // The default model // This is the only place that we declare
        // this.
        var url = '/mw/example.x3d';

    model.url = url;

    name = prompt("Enter your name:");

    if(name === null || name.length < 1)
        // TODO: do more for this case
        return;

    socket = new io.connect('');

    x3d = document.getElementsByTagName("X3D")[0];


    //-------------------------------------------------------
    /*
     * Tell the server the user has successfully connected
     */
    socket.on('connect', function()
    {
        socket.emit('newconnection');
    });

    //-------------------------------------------------------
    /*
     * Received the first time this client connects to the server -- gets 
     * the client up to speed with all of the current data
     *
     * @param fullListOfUsers - the list of connected users
     */
    socket.once('firstupdate', function(fullListOfUsers, enviroStates)
    {
    
   	for (var eKey in enviroStates) {
            
	    var curr = enviroStates[eKey];

	    console.log(curr);

	    var newEnviro;

	    switch (curr.type) {

	        case "lamp":
		    newEnviro = new Lamp(curr.name, curr.lampOn);
		    break;
	    }

	    newEnviro.updateClient();

        }

        //Add your own Name and information to fullListOfUsers
	if(fullListOfUsers[0] === undefined) {
		
	    fullListOfUsers[name] = [name, spawnPosition,
                    spawnOrientation, avatarType];
	}

	//Adds Avatar to X3D scene for new user
	var avatarGroup = document.getElementById("avatarGroup");
	avatarGroup.innerHTML = "";
	var scene = document.getElementsByTagName("Scene")[0];
	
        for (var key in fullListOfUsers)
	{
	    var current = fullListOfUsers[key];
        
            //Generate a Transform for key's avatar
	    var userAvatar = document.createElement('Transform');
	    userAvatar.setAttribute("translation", "0 0 5");
	    userAvatar.setAttribute("rotation", "0 0 0 0");
	    userAvatar.setAttribute("id", key + "Avatar"); 
        
            //Generate x3d model of avatar
	    var characterOfAvatar = document.createElement('inline');
            characterOfAvatar.setAttribute("id", key + "Inline");
        
            //current[3] == user's choice of avatar
	    characterOfAvatar.setAttribute("url", current[3]);
        
            //Add x3d model to the avatar Transform
	    userAvatar.appendChild(characterOfAvatar);
		
            //if adding self, add to a bundle with camera
	    if(current[0] == name) {
	        var userBundle = document.createElement('Transform');
		userBundle.setAttribute("id", key + "Bundle");
		userBundle.setAttribute("translation", current[1].x + " " +
                        current[1].y + " " + current[1].z);
		userBundle.setAttribute("rotation", current[2][0].x + " " +
                        current[2][0].y + " " + current[2][0].z + " " +
                        current[2][1]);
			
		var scene = document.getElementsByTagName("Scene")[0];
			
		scene.appendChild(userBundle);
		userBundle.appendChild(userAvatar);
            
                //Add a message to the chat window that someone is joining
                var welcomeMessage = "" + name + " is joining the scene.";
                socket.emit('newnote', welcomeMessage);
            
	    } 
            //if adding someone else, add them to the group of other avatars
            else {
			avatarGroup.appendChild(userAvatar)
	    }
	}

	//Build the list of connected users
	buildList(fullListOfUsers);
	
	//Tell the server the user's spawn location data and default avatar
	socket.emit('login', name, spawnPosition, spawnOrientation,
                avatarType);

    });

    //-------------------------------------------------------
    /*
     * Triggered whenever the user changes location 
     * to update the X3D scene and the HTML tags
     *
     * @param updateUser - the updated user
     */
    socket.on('update', function(updatedUser)
    {
        var userTransform = document.getElementById(updatedUser[0] + "Bundle");
	
        if (userTransform == null) {
        
            var userTransform = document.getElementById(updatedUser[0] +
                    "Avatar");
        
            if (userTransform == null) {
                return;
            }
        }
    
        userTransform .setAttribute("translation", updatedUser[1].x +
                " " + updatedUser[1].y + " " + updatedUser[1].z);
    
        userTransform .setAttribute("rotation", updatedUser[2][0].x +
                " " + updatedUser[2][0].y + " " + updatedUser[2][0].z +
                " " + updatedUser[2][1]);
		
        //Update HTML
        updateList(updatedUser);
    });

    //-------------------------------------------------------
    /*
     * Triggered whenever a new user connects -- updates 
     * all users with the added user's information
     *
     * @param newestUser - the updated user
     * @param fullListOfUsers - all of the connected users
     */
    socket.on('newuser', function(newestUser)
    {	
	var duplicateNames = document.getElementById(newestUser[0]);
	
	if(newestUser[0] != null && name != newestUser[0] &&
                duplicateNames == null)
	{	
	    //Add Users Avatar
            var avatarGroup = document.getElementById("avatarGroup");

	    var userAvatar = document.createElement('Transform');

	    userAvatar.setAttribute("translation", newestUser[1].x + " " +
                    newestUser[1].y + " " + newestUser[1].z);
	    userAvatar.setAttribute("rotation", newestUser[2][0].x + " " +
                    newestUser[2][0].y + " " + newestUser[2][0].z + " " +
                    newestUser[2][1]);
	    userAvatar.setAttribute("id", newestUser[0] + "Avatar");

	    console.log("Created node: " + userAvatar.getAttribute("id"));

	    var inlineElement = document.createElement('inline');
            inlineElement.setAttribute("id", newestUser[0] + "Inline");
	    inlineElement.setAttribute("url", newestUser[3]);

	    userAvatar.appendChild(inlineElement);
	    avatarGroup.appendChild(userAvatar);
        
	    //Update HTML
	    addUser(newestUser);
	}
    });

    //-------------------------------------------------------
    /*
     * Triggered whenever a user disconnects -- removes
     * the deleted user from everyone else's list
     *
     * @param removableUser - the user to be deleted
     */
    socket.on('deleteuser', function(removableUser) 
    {
	// Remove the avatar from the scene.
	var removeAvatar =
            document.getElementById(removableUser[0] + "Avatar");

	if(removeAvatar != null)
	{
	    var avatars = document.getElementById("avatarGroup");
	    avatars.removeChild(removeAvatar);
	}
    
        //Remove User's HTML Content
        removeUser(removableUser);
    });

    //-------------------------------------------------------
    /*
     * Triggered when someone changes their avatar
     *
     */
    socket.on('changeAvatar', function(userName, avatar) 
    {
        var userAvatar = document.getElementById(userName + "Inline");
        userAvatar.setAttribute("url", avatar);    
    })

    //-------------------------------------------------------
    /*
     * Triggered when a message has been posted to the chatroom
     *
     */
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

    //-------------------------------------------------------
    /*
     * Triggered when a notification has been posted to the chatroom
     */
    socket.on('notification', function(message) {
	
	var note = document.createElement('li');
	
	var noteText = document.createElement('span');
	noteText.innerHTML = "<em>" + message + "</em>";
    
        note.appendChild(noteText);
	
	document.getElementById("messages").appendChild(note);
    });

    //-------------------------------------------------------
    /*
     * Triggered when someone toggles the lamp in the scene
     */
    
    socket.on('updateEnvironment', function(eName, eState, eType) {
      
    	var newEnviro;

	switch (eType) {
	
	    case "lamp":
	    newEnviro = new Lamp(eName, eState);
	    break;
	
	}

    	newEnviro.updateClient();
    });
    
    //-------------------------------------------------------
    /*
     * Toggle Camera View 
     */
    window.addEventListener('keypress', function(e) {
	
        var avatar = document.getElementById(name + "Avatar");
	
        //Switch to first person view by pressing 1
        if(e.keyCode === 49) {
		
	    console.log("Change to First Person View");
	    avatar.setAttribute("translation", "0 0 5");
        }
    
        //Switch to third person view by pressing 3
        if(e.keyCode === 51) {
		
	    console.log("Change to Third Person View");
	    avatar.setAttribute("translation", "0 0 -5");
        }
    });


    configureScene();

    configurePage();
}
