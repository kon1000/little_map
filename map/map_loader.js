jQuery(document).ready(function() {
	var divForMap = jQuery('.map');
	if(divForMap.length > 0) {
		
		var OLayers = $.getScript('map/OpenLayers.js');
		var script = $.getScript('map/map_script.js');

		var style = document.createElement("link");
		style.type = "text/css";
		style.rel = "stylesheet";
		style.href = 'map/map_style.css';

		if (style.readyState){  //IE
			style.onreadystatechange = function(){
				if (style.readyState == "loaded" || style.readyState == "complete") {
					style.onreadystatechange = null;
					$.when(OLayers, script).done(function(OLayers, script) {
						littleMap.init(divForMap.attr("id"));
					});
				}
			};
		} else {  //Others
			style.onload = function(){
				$.when(OLayers, script).done(function(OLayers, script) {
					littleMap.init(divForMap.attr("id"));
				});
			}
		}

		document.getElementsByTagName("head")[0].appendChild(style);
	}

});

		


			


			

			
						
				
				

			
			
