jQuery(document).ready(function() {
		var divForMap = jQuery(".map");
		
		if(divForMap.length > 0) {
			
			function loadScript(url, callback){

			    var script = document.createElement("script")
			    script.type = "text/javascript";
			
			    if (script.readyState){  //IE
			        script.onreadystatechange = function(){
			            if (script.readyState == "loaded" ||
			                    script.readyState == "complete"){
			                script.onreadystatechange = null;
			                callback();
			            }
			        };
			    } else {  //Others
			        script.onload = function(){
			            callback();
			        };
			    }
			
			    script.src = url;
			    document.getElementsByTagName("head")[0].appendChild(script);
			}
			
			function loadStyle(url, callback){

				var style = document.createElement("link")
				style.href = url;
				style.rel = "stylesheet";
				style.type = "text/css";
		
				if (style.readyState){  //IE
					style.onreadystatechange = function(){
						if (style.readyState == "loaded" ||
								style.readyState == "complete"){
							style.onreadystatechange = null;
							callback();
						}
					};
				} else {  //Others
					style.onload = function(){
						callback();
					};
				}
			
				
				document.getElementsByTagName("head")[0].appendChild(style);
			}
			
			
			loadStyle("map/map_style.css", function() {
				loadScript(
					"map/OpenLayers.js"
					, function() {
				      		loadScript("map/map_script.js"
				      		, function() {
				      		littleMap.init(divForMap.attr("id")); //if .map element does not have id with feature map will render without selection (TODO there should be config.json to set default point for centering)
					});
				});
			});
			
		}
	});
