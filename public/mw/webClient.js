// This is a generated file
// Socket connection from client to server
var socket;

var privateSocket; //for a private user connection

// Unique Identifier for each client
// connection provided by server
var uniqueId;

// var onlineUsersList = [] //global variable to store the names of current online users

// This is where all user information is stored.
var clientInfo = {

	// This is a string of the user's chosen name. Its value 
	// is provided by the user later on
	name:null,

	// The position of user's active Viewpoint
	// in the format [float, float, float]
	position:{"x": 2, "y": 1.5, "z": 5},

	// The orientation of the user's active Viewpoint
	// in the format [[boolean, boolean, boolean], float(radians)]
	orientation:[{"x": 0, "y": 0, "z": 0}, 0],

	// The path to the user's chosen avatar
	// avatar:"avatars/FemaleTeen_aopted.x3d"
	avatar:"avatars/DeerAv.x3d"
}

//-------------------------------------------------------
/**
 * Failure Exit alerts user when the service has
 * malfunctioned and stops the service
 */
var exit = function exit() {

    var text = "Something has gone wrong";
    for(var i=0; i < arguments.length; ++i)
        text += "\n" + arguments[i];
    console.log(text);
    alert(text);
    window.stop();
}


//-------------------------------------------------------
/*
 * A wrapper of document.getElementById(id) that adds
 * a check to insure that the element exists
 *
 * @param {string} id - The HTML id attribute value for the desired object
 */
function getElementById(id) {

    var element = document.getElementById(id);

    if(element == null)
        exit("document.getElementById(" + id + ") failed");
    return element;
}

//-------------------------------------------------------
/*
 * Primary function called on document load
 */
function init() {

	// Scene model for client session
    var model = getElementById('mw_model');

    // default model
    // TODO: make this url path more relative so it works with URL=file://
	var url = '/mw/example.x3d';
    if(location.search.match(/.*(\?|\&)file=.*/) != -1){
        url = location.search.replace(/.*(\?|\&)file=/,'').replace(/\&.*$/g, '');
	}

    // if(typeof url == undefined || url.length < 1) {

    //     // The default mode
    //     // This is the only place that we declare this.
    //     var url = '/mw/example.x3d';
    // }

    model.url = url;

	//-------------------------------------------------------
	/**
	 * Waits until the scene model has fully loaded and then
	 * establishes socket callbacks
	 */
    model.onload = function() {

		// Wait for user to enter a username for their session
        clientInfo.name = prompt("Enter your name:");

		// If the user has failed to enter a name,
		// store its value as an empty string momentarily
        if(clientInfo.name === null || clientInfo.name.length < 1) {

            clientInfo.name = "";
        }

		// Connect to Mirror Worlds server
        socket = new io.connect('');
		privateSocket = new io.connect(''); //for private mssges

		privateSocket.on('connect', function(){
			/**
			 * Fired upon a disconnection and insures that client will
			 * not reconnect.
			 */
			 privateSocket.on('disconnect', function() {				

                //socket.disconnect();

				// Delete all other listeners and events
                privateSocket.removeAllListeners();

				// Delete reference to socket 
                privateSocket = null;

				// Inform user that a disconnect has occured
                exit('server at ' + location.host + ' disconnected');
            });

			console.log("Private Connection Socket");

			/**
			 * This is for private messaging
			 */
			 privateSocket.on('chatUpdatePrivate', function(user, privateMessage){
				var msg = document.createElement('li');
				
				var privateSelectTag = document.getElementById('online-user-list');
				var privateOption = privateSelectTag.options[privateSelectTag.selectedIndex];
				var nameOfPrivateUserSelected = privateOption.text;

				console.log('The private user selected: ', nameOfPrivateUserSelected);
				// console.log('I am the user private', user);
				// console.log('I am the message private', privateMessage); 
				//if (user == nameOfPrivateUserSelected){
				/**
				 * TODO: (Just an idea) Find a way to capture users change (the selected person for private chat) in the lib/mw_server.js, if possible
				 * and then send that or emit that information here through the sockets so that we can make sure
				 * using selection statements that we can only send messages to the person we want to privately. 
				 */
				
				// WIZARDSSSS WORK
				if (nameOfPrivateUserSelected == "Users Online"){
					var nameTag = document.createElement('span');
					nameTag.innerHTML = "<em>" + user + "</em>";

					msg.appendChild(nameTag);
                	msg.appendChild(document.createElement("br"));
	                msg.appendChild(document.createTextNode(privateMessage));

					getElementById("messages-private").appendChild(msg);
				}
			});

		});

		//-------------------------------------------------------
		/**
		 * Fired upon a connection including a successful reconnection
		 * (measures are taken below to prevent reconnection)
		 */
        socket.on('connect', function() {

			//-------------------------------------------------------
			/**
			 * Fired upon a disconnection and insures that client will
			 * not reconnect.
			 */
            socket.on('disconnect', function() {				

                //socket.disconnect();

				// Delete all other listeners and events
                socket.removeAllListeners();

				// Delete reference to socket 
                socket = null;

				// Inform user that a disconnect has occured
                exit('server at ' + location.host + ' disconnected');
            });

			console.log("Emitting New Connection");

			// Send server initial client information
            socket.emit('newconnection', clientInfo);

			//-------------------------------------------------------
			/**
			 * Fired when client connects for the first time
			 *
			 * @param {string} myId - This is the server generated unique 
			 * 		identifier for the user
			 *
			 * @param {array} userList - This is an array of users in the 
			 * 		scene and their names, position, orientation, and avatars
			 */
            socket.on('initiate', function(myId, userList) {

				console.log("Initiate");

				// Save unique id provided by server
				uniqueId = myId;

				// If no public name was entered in the prompt,
				// name defaults to unique id
				if (clientInfo.name == "") {

					clientInfo.name = myId;
				}

				// Get location in HTML to store avatars
                var avatarGroup = getElementById("avatarGroup");
                avatarGroup.innerHTML = "";
				

				// Get X3D Scene object 
                var scene = document.getElementsByTagName("Scene")[0];
                
				// Get user console 
				var userConsole = getElementById("users");
				userConsole.innerHTML = "";

				// Add content for each of the users
                for (var userId in userList) {

                    var current = userList[userId];

					// Generate a Transform to hold current's avatar
        		    var userAvatar = document.createElement('Transform');
              	    userAvatar.setAttribute("translation", "0 -.5 .5");
              		userAvatar.setAttribute("rotation", "0 0 0 0");
                   	userAvatar.setAttribute("id", userId + "Avatar");
					
					//console.log("user avatar", userAvatar);
                    
					// Generate an Inline to hold X3D avatar
                    var characterOfAvatar = document.createElement('inline');
                    characterOfAvatar.setAttribute("id", userId + "Inline");
                    characterOfAvatar.setAttribute("url", current.avatar);

					//console.log("character of avatar", characterOfAvatar);

                    // Add x3d model to the avatar Transform
                   	userAvatar.appendChild(characterOfAvatar);

                    // If adding self, add to a bundle with camera
                   	if (userId == uniqueId) {

						// Generate a Transform to hold user's camera and avatar
                     	var userBundle = document.createElement('Transform');
                        userBundle.setAttribute("id", userId + "Bundle");

                        userBundle.setAttribute("translation", current.position.x + " " +
                        	current.position.y + " " + current.position.z);

                       	userBundle.setAttribute("rotation", current.orientation[0].x + " " +
                          	current.orientation[0].y + " " + current.orientation[0].z + " " +
                          	current.orientation[1]);

						// Make generated bundle a child of the X3D scene
                  		scene.appendChild(userBundle);

						// Make avatar a child of the bundle
                        userBundle.appendChild(userAvatar);

                        // Add a message to the chat window that someone is joining
                        var welcomeMessage = "" + current.name + " is joining the scene.";
						socket.emit('chatMessage', "", welcomeMessage);
                    } 

                   	// If adding someone else, add them to the group of other avatars
                    else {

                    	avatarGroup.appendChild(userAvatar)
                    }

					console.log("Updating console");

					console.log(current.position.y);
					console.log(current.orientation);

					// Add user and information to HTML console
    		        var userListEntry = document.createElement('span');
        		    var newPLine = document.createElement('p');
           			userListEntry.setAttribute("id", userId);
           			userListEntry.innerHTML = (current.name + " observing at: " 
						+ current.position.x + ", " + current.position.y + ", " + current.position.z);
            		userConsole.appendChild(newPLine);					
            		userConsole.appendChild(userListEntry);

					
					// console.log("This is what I am pushing", current.name);
					// onlineUsersList.push(current.name);
					// console.log("The name array", onlineUsersList);

					var privateOnlineUser = document.createElement('option');
					var addThisPrivateUser = document.getElementById('online-user-list');
					privateOnlineUser.setAttribute("id", userId);
					privateOnlineUser.innerHTML = current.name;
					addThisPrivateUser.appendChild(privateOnlineUser);
                }
            });

			

			//-------------------------------------------------------
			/**
			 * Fired when a new user (that is not yourself) connects
			 *
			 * @param {array} newestUser - This is the array of user data
			 * @param {string} userId - This is the unique identifier for the new user
			 */
            socket.on('addUser', function(newestUser, userId) {	

                console.log("New User Fired");

				// Get container for avatar group
        		var avatarGroup = getElementById("avatarGroup");

				// Create node to contain avatar information
                var userAvatar = document.createElement('Transform');

				// Set avatar position and orientation information
                userAvatar.setAttribute("translation", newestUser.position.x + " " +
                	newestUser.position.y + " " + newestUser.position.z);

                userAvatar.setAttribute("rotation", newestUser.orientation[0].x + " " +
                    newestUser.orientation[0].y + " " + newestUser.orientation[0].z + " " +
                    newestUser.orientation[1]);

				// Set avatar id
                userAvatar.setAttribute("id", userId + "Avatar");

               	console.log("Created node: " + userAvatar.getAttribute("id"));

				// Create inline to hold X3D avatar
                var inlineElement = document.createElement('inline');
                inlineElement.setAttribute("id", userId + "Inline");
                inlineElement.setAttribute("url", newestUser.avatar);

				// Make avatar a child of the avatar group
                userAvatar.appendChild(inlineElement);
                avatarGroup.appendChild(userAvatar);

                // Update HTML Console
                console.log("Adding User: ", userId);
        		var userList = getElementById("users");

				// console.log("Users List", userList);

       			var userListEntry = document.createElement('span');;
       			var newPLine = document.createElement('p');
        		userListEntry.setAttribute("id", userId);
        		userListEntry.innerHTML = (newestUser.name + " observing at: " +
                	newestUser.position.x + ", " + newestUser.position.y + ", " +
                	newestUser.position.z);
        		userList.appendChild(newPLine);
        		userList.appendChild(userListEntry);

				var privateOnlineUser = document.createElement('option');
				var addThisPrivateUser = document.getElementById('online-user-list');
				privateOnlineUser.setAttribute("id", userId);
				privateOnlineUser.innerHTML = newestUser.name;
				addThisPrivateUser.appendChild(privateOnlineUser);

				//addThisPrivateUser.setAttribute("onclick", "privateChatWithUser()");

            });

			// function privateChatWithUser(){
			// 	console.log("Hello I am private");
			// }
			//-------------------------------------------------------
			/**
			 * Fired when a client (that is not yourself) is leaving the scene
			 *
			 * @param {array} user - This is the array of user information
			 * @param {string} id - This is the unique identifier for the user
			 */
			socket.on('deleteUser', function(user, id) {

				// Get a reference to the avatar in the scene
                var removeAvatar = document.getElementById(id + "Avatar");

				// Check if the avatar exists
                if(removeAvatar != null) {

        	  		var avatars = getElementById("avatarGroup");
                   	avatars.removeChild(removeAvatar);
                }

                // Remove User's HTML Content
                var users = getElementById("users");
        		var remove = getElementById(id);
        		users.removeChild(remove);

				var onlineUser = document.getElementById('online-user-list');
				var removeUser = getElementById(id);
				onlineUser.removeChild(removeUser);
			});

			//-------------------------------------------------------
			/**
			 * Fired when a client changes their position
			 *
			 * @param {array} user - This is the array of user information
			 * @param {string} id - This is the unique indentifier for the user
			 */
			socket.on('clientUpdate', function(user, id) {

				console.log("Update Fired");
				console.log(user)

				// Get a reference to the user bundle
				var userTransform = document.getElementById(id + "Bundle");

				// If there is no bundle for this user, see if there is
				// another container for this user
               	if (userTransform == null) {

               		userTransform = document.getElementById(id + "Avatar");

					// If no other container exists, do not update
                    if (userTransform == null) {
					
						return;
                    }
                }	

				// Get reference to avatar container
				var userAvatar = getElementById(id + "Inline");
				
				// Check is the avatar for this user has changed
				if (userAvatar.getAttribute("url") != user.avatar) {

					userAvatar.setAttribute("url", user.avatar);  
				}

				// Change avatar position
				userTransform.setAttribute("translation", user.position.x + " " + 
					user.position.y + " " + user.position.z);

				// Change avatar orientation
				userTransform.setAttribute("rotation", user.orientation[0].x + " " + 
					user.orientation[0].y + " " + user.orientation[0].z + " " +
					user.orientation[1]);
                
				// Update HTML Console
                getElementById(id).innerHTML = (user.name + " observing at: " 
					+ user.position.x + "," + user.position.y + ", " + user.position.z);
			});
            
			//-------------------------------------------------------
			/**
			 * Fired when a message has been posted to the chatroom
			 *
			 * @param {string} userName - This is the name the user provided when logging in
			 * @param {string} message - This is the content to be posted to the chat window
			 */
			socket.on('chatUpdate', function(userName, message) {

				// Create new line item to hold message
				var newMessage = document.createElement('li');

				// If a user with a userName posted the message
				if (userName != "") {

					var nameTag = document.createElement('span');
					nameTag.innerHTML = "<em>" + userName + "</em>";

					newMessage.appendChild(nameTag);
                	newMessage.appendChild(document.createElement("br"));
	                newMessage.appendChild(document.createTextNode(message));

				} 

				// If no userName has been provided, message should be 
				// formatted as a notification
				else {

					var note = document.createElement('span');
					note.innerHTML = "<em>" + message + "</em>";
					newMessage.appendChild(note);
				}

				// Add the new message to the chat window
                getElementById("messages").appendChild(newMessage);
			});



			//-------------------------------------------------------
			/**
			 * Fired when an object in the scene has changed 
			 * states (i.e. A lamp has been turned on/off)
			 *
			 * @param {string} type - This is the type of object that 
			 * 		has been changed (lamp)
			 *
			 * @param {string} id - This is the unique identifier for the
			 * 		object being updated
			 *
			 * @param {boolen} state - This is the state for the object
			 * 		object in the scene (lamp on = true, lamp off = false)
			 */
			socket.on('sceneUpdate', function(type, id, state) {

				console.log("Scene Update");


				switch (type) {

					case "lamp" :               	

						// Get the light bulb element in the scene
						var lightBulb = getElementById("mw__" + id);

						if (!lightBulb) {

							break;
						}

						// Get material for that object
               			var mat = lightBulb.getElementsByTagName("Material");

                		if (!state) {

							// Set color to gray
                    		mat[0].setAttribute("diffuseColor", ".64 .69 .72");
                		} 
						else {
                    
							// Set color to yellow
							mat[0].setAttribute("diffuseColor", ".95, .9, .25");
                		}
						break;
					
					// case "private" :
					// 	//call something to update name 
					// 	break;
				}
			});

        });	

		// Set up the models, lamps, and in-scene events
		configureScene();
		// Set up the widgets 
     	configureToolbar();
		
		 /* NOTE:  After a correct html element has been identified to interact with and add something 
		 in the metaverse DO not uncomment it!!*/
		configureArtworkOverlay();

		addCheckpointActivation();

		setUpNotesApp();
    };

	//-------------------------------------------------------
	/**
	 * Sets up events that occur within the X3D scene
     */
    function configureScene() {

		console.log("Configure Scene");

		//-------------------------------------------------------
		/**
		 * Fired whenever a user presses the 1 or 3 key on the
		 * keyboard in order to change views
		 *
		 * @param e - the key pressed
		 */
		window.addEventListener('keypress', function(e) {

			var avatar = getElementById(uniqueId + "Avatar");

            // Switch to first person view by pressing 1
            if(e.keyCode === 49) {

            	console.log("Change to First Person View");
                avatar.setAttribute("translation", "0 -.5 .5");
            }

            // Switch to third person view by pressing 3
            else if(e.keyCode === 51) {

                console.log("Change to Third Person View");
                avatar.setAttribute("translation", "0 -.5 -.5");
            }
        });

		// Add listener to lamp button
        var lampToggle2 = document.getElementById("mw__lampButton2");

        if(lampToggle2) {
           
			//------------------------------------------------------- 
			/**
			 * Fired when the yellow button on lamp post 2 is clicked
			 * and sends updated state to Mirror Worlds server
			 */
			lampToggle2.addEventListener("click", function() {
				socket.emit('environmentChange', "lamp", "lamp2");

			});
		};

        // Add listener to lamp button
        var lampToggle1 = document.getElementById("mw__lampButton1");

        if(lampToggle1) {
       
			//------------------------------------------------------- 
			/**
			 * Fired when the yellow button on lamp post 1 is clicked
			 * and sends updated state to Mirror Worlds server
			 */
			lampToggle1.addEventListener("click", function() {
				socket.emit('environmentChange', "lamp", "lamp1");

			});
		};

		console.log("Setting Camera Location");

        // Set up camera to provide location data
        var x3d = document.getElementsByTagName("X3D")[0];
        var camera = x3d.runtime.getActiveBindable("Viewpoint");

		console.log(camera);

		// Attach default camera if none exists in the scene already
		if (camera == undefined) {

			camera = document.createElement("viewpoint");
			var scene = x3d.getElementsByTagName("Scene");

			scene[0].appendChild(camera);

        	camera.setAttribute("position", "2 1.5 5");
			camera.setAttribute("orientation", "0 0 0 0");
		}
		else {

			camPos = camera.position.split(" ");
			clientInfo.position = {"x": camPos[0], "y": camPos[1], "z": camPos[2]};

			camRot = camera.orientation.split(" ");
			clientInfo.orientation = [{"x": camRot[0], "y": camRot[1], "z": camRot[2]}, camRot[3]];		}

       	// Add listener to camera to update server with location data
       	camera.addEventListener('viewpointChanged', sendUpdate);
	};

	//This function is triggered by clicking on a piece of artwork
	//within the art gallery
	var art = document.getElementById("sampleArt"); //the art work
	var audio = document.getElementById("audio-source"); //the audio
	var player = document.getElementById("audio-player"); //the audio player
	var arttitle = document.getElementById("art-title"); //the title of the artwork
	function configureArtworkOverlay(){
		//The pieces of artwork have ids on them within the .x3d file called
		//artworld.x3d and they are referenced here
		var artwork_one = document.getElementById("mw__artid_one");
		var artwork_two = document.getElementById("mw__artid_two");
		var artwork_three = document.getElementById("mw__artid_three");
		var artwork_four = document.getElementById("mw__artid_four");
		
		var close_btn = document.getElementById("close_info_btn");
		var artWorkAudioTemplate = document.getElementById("artWorkAudioId");

		//this array is meant to hold the data of each of the artworks and in
		//the future we hope to use this instead of hardcoding the data
		//using the changeToRightImage() and changeToLeftImage() functions
		var objects = [ {"id": 0, "image_url":"../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg", "sound_file":"/mw/sounds/Maskcat.wav", "location":(-4.32, 1.84, 0.93)}, 			
			{"id": 1, "image_url":"../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg", "sound_file":"/mw/sounds/Postap.wav", "location":(-4.32, 1.84, 0.93)},
			{"id": 2, "image_url":"../glTF_X3D_HTML_DOM/Sponza/ghostperson.png", "sound_file":"/mw/sounds/Ghostperson.wav", "location":(-4.32, 1.84, 0.93)},
			{"id": 3, "image_url":"../glTF_X3D_HTML_DOM/Sponza/cat.jpg", "sound_file":"/mw/sounds/Attkcat.wav", "location":(-4.32, 1.84, 0.93)}
			
		];

		//closes the artwork overlay
		close_btn.addEventListener("click", function() {
				
			artWorkAudioTemplate.classList.toggle("show");	
					
		});

		//here we are adding event listeners on each artwork
		//and we make sure to place all of the correct information
		//into the artwork overlay
		artwork_one.addEventListener("click", function() {
			art.style.width = '160px';
			art.style.height = '180px';
			art.src = "../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg";
			audio.src = "/mw/sounds/Postap.wav";
			player.load();
			document.getElementById('PostAp').setAttribute('set_bind','true');
			artWorkAudioTemplate.classList.toggle("show");
			arttitle.innerHTML = "Post Apocalypse by Emily N.";
		});

		artwork_two.addEventListener("click", function() {
			art.style.width = '160px';
			art.style.height = '180px';
			art.src = "../glTF_X3D_HTML_DOM/Sponza/ghostperson.png";
			audio.src="/mw/sounds/Ghostperson.wav";
			player.load();
			console.log("2");
			document.getElementById('Ghostperson').setAttribute('set_bind','true');
			artWorkAudioTemplate.classList.toggle("show");			
			arttitle.innerHTML = "Ghost Person by Emily N.";
		});

		artwork_three.addEventListener("click", function() {
			art.style.width = '120px';
			art.style.height = '160px';
			document.getElementById('Cat').setAttribute('set_bind','true');	
			art.src = "../glTF_X3D_HTML_DOM/Sponza/cat.jpg";
			audio.src= "/mw/sounds/Attkcat.wav";
			player.load();			
			artWorkAudioTemplate.classList.toggle("show");
			arttitle.innerHTML = "Attack of the Feline by Emily N.";
			
			
		});

		artwork_four.addEventListener("click", function() {
			artWorkAudioTemplate.classList.toggle("show");		
			art.style.width = '120px';
			art.style.height = '160px';
			art.src = "../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg";
			audio.src = "/mw/sounds/Maskcat.wav";
			document.getElementById('Maskcat').setAttribute('set_bind','true');
			player.load();
			arttitle.innerHTML = "Mask Cat by Emily N.";
		});

		//This is where we set event listeners on the
		//right and left buttons to make sure they
		//change the information on the panel to the correct
		//artwork information
		var right = document.getElementById("right_btn1");
		var left = document.getElementById("left_btn1");


		right.addEventListener("click", function() {		
			changeToRightImage();
		});
		

		left.addEventListener("click", function() {
			changeToLeftImage();
		});
	}

	var modal = document.getElementById("modal-map");
	function addCheckpointActivation(){

		var chkpt_end_1 = document.getElementById("checkpoint-end-one");
		var chkpt_top_2 = document.getElementById("checkpoint-top-two");
		
		console.log('run the activationwtc')
		console.log(chkpt_end_1);
		chkpt_end_1.addEventListener("click", function() {
			console.log("button 1 clicked");
			modal.style.display = "none";
			document.getElementById('end-checkpoint').setAttribute('set_bind','true');
		});

		chkpt_top_2.addEventListener("click", function() {
			console.log("button 2 clicked");
			modal.style.display = "none";
			document.getElementById('top-checkpoint').setAttribute('set_bind','true');
		});


	}

	// This function loads any notes within the users localstorage
	//into the scrollable list. it also adds notes to this list
	//when the user clicks on the add button.
	function setUpNotesApp(){
		// If user adds a note, add it to the localStorage
		let addBtn = document.getElementById("addBtn");
		addBtn.addEventListener("click", function(e) {
			let addTxt = document.getElementById("addTxt");
			let notes = localStorage.getItem("notes");

			if (notes == null) notesObj = [];
			else notesObj = JSON.parse(notes);

			notesObj.push(addTxt.value);
			localStorage.setItem("notes", JSON.stringify(notesObj));
			addTxt.value = "";

			showNotes();
		});
	}

	//-------------------------------------------------------
	/**
	 * Send position data to server if change is great than 1cm
	 *
	 * @param {viewpoint} e - This is the camera that has been moved
	 */
	function sendUpdate(e) {

		if (uniqueId != null) {

			if (Math.abs(clientInfo.position.x - e.position.x) >= .01 ||
				Math.abs(clientInfo.position.y - e.position.y) >= .01 ||
				Math.abs(clientInfo.position.z - e.position.z) >= .01) {	
						
				clientInfo.position = e.position;
				clientInfo.orientation = e.orientation;

				// Send server updated position and orientation
				socket.emit('serverUpdate', uniqueId, clientInfo);
			}
		}
	};

	//-------------------------------------------------------
	/**
	 * Sets up widgets in the toolbar
	 */
    function configureToolbar() {

		console.log("Configure Toolbar");

        var selectAvatar = getElementById("selectAvatar");
		//-------------------------------------------------------
		/**
	 	 * Fired when a user selects a different value in the
		 * avatar drop down menu in the toolbar
		 */
        selectAvatar.addEventListener('change', function() {

			console.log("Avatar change");

			clientInfo.avatar = selectAvatar.value;
			// console.log("av select - socket", uniqueId);
			// console.log("avatar - client", clientInfo);
			socket.emit('serverUpdate', uniqueId, clientInfo);
		});

        var sendButton = getElementById("sendButton");

		//-------------------------------------------------------
		/**
	 	 * Fired when user clicks the send button in the chatroom
		 * or hits the return key on their keyboard
		 */
        sendButton.addEventListener('click', sendMessage);

        var formDiv = getElementById("inputField");
        formDiv.addEventListener('keypress', function(e) {

            if(e.keyCode == 13) {

                sendMessage();
            }
        });

		var privateSendButton = getElementById("privateSendButton");
		privateSendButton.addEventListener('click', sendPrivateMessage);
		var privateMssg = getElementById("privateInputField");
		privateMssg.addEventListener('keypress', function(e) {
			if (e.keyCode == 13){
				sendPrivateMessage();
			}
		});

        var minButton = getElementById("minButton");
        var maxButton = getElementById("maxButton");
        var sidebarContent = getElementById("sideBar");

		//-------------------------------------------------------
		/**
	 	 * Fired when user clicks the minimize button and
		 * hides the toolbar
		 */
        minButton.addEventListener('click', function() {

            sidebarContent.className = "inactive";
            minButton.className = "minmaxB inactive";
            maxButton.className = "minmaxB active";
        });

		//-------------------------------------------------------
		/**
	 	 * Fired when user clicks the maximize button and
		 * expands the toolbar
		 */
        maxButton.addEventListener('click', function() {

            sidebarContent.className = "active";
            minButton.className = "minmaxB active";
            maxButton.className = "minmaxB inactive";
        });
    };

	//-------------------------------------------------------
	/**
     * Sends the specified message to all connected users 
	 * in the chatroom
	 *
	 * @param {string} memo - This is the message to be posted
	 * 		in the chatroom
     */
    function sendMessage(memo) {

        var message = memo;

		// If the memo is empty, get the 
		// message from the input box and 
		// clear the input box
        if(message == null) {

            var field = getElementById('inputField');
            message = field.value;
            field.value = "";

        }

        console.log("Sending a Message!");

		// Send message to server for distribution
        socket.emit('chatMessage', clientInfo.name, message);
    }

	/**
	 * This function is for private messages
	 */
	 function sendPrivateMessage(privateMemo){
		var privateMssg = privateMemo;
		if(privateMssg == null) {

            var field = getElementById('privateInputField');
            privateMssg = field.value;
            field.value = "";
        }

		// TODO: Check 1st parameter ?????
        socket.emit('ptivateMessage', clientInfo.name, privateMssg);

	 }

	//This function determines what artwork the overlay
	//was on currently and properly changes the information on
	//overlay to the image that is to the right of the current artwork
	//when the right arrow button is pressed
	//This is also where the teleportation happens
	function changeToRightImage() {		
		if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg") {
			art.src = "../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg";
			art.style.width = '160px';
			art.style.height = '180px';
			audio.src = "/mw/sounds/Postap.wav";
			player.load();
			document.getElementById('PostAp').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Post Apocalypse by Emily N.";
		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg") {
			art.src = "../glTF_X3D_HTML_DOM/Sponza/ghostperson.png";
			art.style.width = '120px';
			art.style.height = '160px';
			audio.src="/mw/sounds/Ghostperson.wav";
			player.load();
			document.getElementById('Ghostperson').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Ghost Person by Emily N.";

		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/ghostperson.png") {
			art.src = "../glTF_X3D_HTML_DOM/Sponza/cat.jpg";
			art.style.width = '120px';
			art.style.height = '160px';
			audio.src= "/mw/sounds/Attkcat.wav";
			player.load();
			document.getElementById('Cat').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Attack of the Feline by Emily N.";

		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/cat.jpg") {
			art.src = "../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg";
			art.style.width = '120px';
			art.style.height = '160px';
			audio.src = "/mw/sounds/Maskcat.wav";
			player.load();
			document.getElementById('Maskcat').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Mask Cat by Emily N.";

		}
	}

	//This function determines what artwork the overlay
	//was on currently and properly changes the information on
	//overlay to the image that is to the left of the current artwork
	//when the left arrow button is pressed
	//This is also where the teleportation happens
	function changeToLeftImage() {
		if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg") {
			console.log("CAT");
			art.src = "../glTF_X3D_HTML_DOM/Sponza/cat.jpg";
			art.style.width = '120px';
			art.style.height = '160px';
			audio.src= "/mw/sounds/Attkcat.wav";
			player.load();
			document.getElementById('Cat').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Attack of the Feline by Emily N.";

		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/cat.jpg") {
			var id = 3;
			art.src = "../glTF_X3D_HTML_DOM/Sponza/ghostperson.png";
			art.style.width = '160px';
			art.style.height = '180px';
			audio.src="/mw/sounds/Ghostperson.wav";
			player.load();
			document.getElementById('Ghostperson').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Ghost Person by Emily N.";

		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/ghostperson.png") {
			art.src = "../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg";
			art.style.width = '160px';
			art.style.height = '180px';
			audio.src = "/mw/sounds/Postap.wav";
			player.load();
			document.getElementById('PostAp').setAttribute('set_bind','true');//this line makes the user teleport
			arttitle.innerHTML = "Post Apocalypse by Emily N.";

		}
		else if (art.getAttribute("src") == "../glTF_X3D_HTML_DOM/Sponza/post_ap.jpg") {
			document.getElementById('Maskcat').setAttribute('set_bind','true');//this line makes the user teleport
			art.src = "../glTF_X3D_HTML_DOM/Sponza/maskcat.jpg";
			art.style.width = '120px';
			art.style.height = '160px';
			audio.src = "/mw/sounds/Maskcat.wav";
			arttitle.innerHTML = "Mask Cat by Emily N.";

			player.load();
		}
	}

}
