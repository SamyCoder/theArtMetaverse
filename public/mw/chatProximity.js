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
				}
			});