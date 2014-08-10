function initializeMap(feature) {
	var mapOuterDiv = jQuery(".mapa");
	if(mapOuterDiv.length == 0) {
		return undefined;
	}																																																						
	mapOuterDiv.html("<div id='outer' class='min'><div id='mapdiv'></div></div><div id='control_panel' class='min'><div id='description_area'></div></div><div id='light_box' class='hidden'></div><input type='button' id='close_map' class='btn btn-primary' value='Otwórz mapę'></input>");
	var outer = jQuery("#outer");
	var controlPanel = jQuery("#control_panel");
	controlPanel.hide();
	var mapLbox = jQuery("#map_light_box");
	var closeMapButton = jQuery("#close_map");
	var descriptionArea = jQuery("#description_area");
	
	function manageMapStyle() {// problem with IE8 every time map is closed or opened this function is called and it is bad (multiple selecting of main feature);
		map.updateSize();
		
		
		function lBoxClickHandler() {
			mapOuterDiv.addClass("jumbo");
			
			if(window.innerWidth >= 980) {
				if(!window.innerHeight) {
					mapOuterDiv.css({"height": document.documentElement.clientHeight - 80}); //to fix IE8...
				} else {
					mapOuterDiv.css({"height": window.innerHeight - 80});
				}
			} else {
				if(!window.innerHeight) {
					mapOuterDiv.css({"height": document.documentElement.clientHeight}); //to fix IE8...
				} else {
					mapOuterDiv.css({"height": window.innerHeight});
				}
			}
			
			/*if(!window.innerHeight) {
				mapOuterDiv.css({"height": document.documentElement.clientHeight - 80}); //to fix IE8...
			} else {
				mapOuterDiv.css({"height": window.innerHeight - 80});
			}*/
			outer.css({"width": ""});
			controlPanel.show();
			controlPanel.css({"left": 0});
			jQuery("#right").hide();
			jQuery("#footer-outer").hide();
			
			closeMapButton.unbind("click", lBoxClickHandler);
			closeMapButton.bind("click", closeMapClickHandler);
			closeMapButton.val("Zamknij mapę");
			
			mapOuterDiv.unbind("mouseenter");
			mapOuterDiv.unbind("mouseout");
			//Probably I won't need this but I leav for a moment just in case //document.getElementById("description_area").style.maxHeight = document.getElementById("controls").getClientRects()[0].top + "px"; //TODO change it because it is ugly '_'
			/*if((window.innerWidth / window.innerHeight) >= 1) {
				descriptionArea.css({
					"height": controlPanel.height() - jQuery("#controls").outerHeight()
				});
			}*/
			map.updateSize();
			
			
				if(temp_layer.features && temp_layer.features[0].geometry.CLASS_NAME === "OpenLayers.Geometry.Polygon"){ //;_; oh man this is superugly
					map.zoomToExtent(temp_layer.features[0].geometry.getBounds());
				} else {
					if(selectedFeature) {
						map.zoomToExtent(selectedFeature.geometry.bounds);
					}	
				}
			
			
			
		}
		
		function closeMapClickHandler() {
			mapOuterDiv.removeClass("jumbo");
			mapOuterDiv.css({"height": ""})
			controlPanel.css({"left": 0});
			controlPanel.hide();
			jQuery("#right").show();
			jQuery("#footer-outer").show();
			
			
			
			
			outer.css({"width": "100%"});

			map.updateSize();
			
			closeMapButton.unbind("click", closeMapClickHandler);
			closeMapButton.bind("click", lBoxClickHandler);
			closeMapButton.val("Otwórz mapę");
			
			
			select.unselectAll();
			
			select.select(getFeatureFromMapByFid(mapOuterDiv.attr("id")));

		}
		
		closeMapButton.bind("click", lBoxClickHandler);
		
		var mapDivWidth = mapOuterDiv.width();
		if(mapDivWidth <= 1000) {
			outer.css({"width": "100%"});
			
		} else if(mapDivWidth > 1000) {
			controlPanel.attr({"class": "min"});
			outer.attr({"class": "min"});
			/*descriptionArea.css({
				"height": controlPanel.height() - jQuery("#controls").outerHeight()
			});*/	
			descriptionArea.hide();
			mapLbox.attr({"class": "hidden"});
		}
	}
	
	function cent() {
			var lonLat = new OpenLayers.LonLat(19.274483, 50.203275)
				.transform(
					new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
					map.getProjectionObject() // to Spherical Mercator Projection
				);
			var zoom=13;
		
		map.setCenter (lonLat, zoom);
	}
	
	map = new OpenLayers.Map("mapdiv", {
		theme: null
	});
	
	manageMapStyle();
	
	var base = new OpenLayers.Layer.OSM();
	base.events.register("loadend",base, function() {
		jQuery.event.trigger({
			"type": "osmLoaded"
		});
	});
	map.addLayer(base);

	point_layers = [];
	//point_layers.push(pointLayer ("Kultura", "map/culture/culture.kml"));
	//point_layers.push(pointLayer ("Szlaki rowerowe", "map/bike_tracks/bike_tracks.kml"));
	/*point_layers.push(pointLayer ("Przyroda", "map/nature/nature.kml"));
	point_layers.push(pointLayer ("Banki i bankomaty", "map/banks/banks.kml"));
	point_layers.push(pointLayer ("Obiekty sakralne", "map/religion/religion.kml"));
	point_layers.push(pointLayer ("Miejsca pamięci", "map/memorials/memorials.kml"));
	point_layers.push(pointLayer ("Architektura", "map/architecture/architecture.kml"));
	point_layers.push(pointLayer ("Rekreacja", "map/recreation/recreation.kml"));*/
	getLayers("map/objects/objects.json", addSelectControl);
	
	
	var layersNum = point_layers.length;
	selectedFeature = undefined; //;_; it must be superglobal...
	
	for(var i = 0; i < point_layers.length; i++) {
		point_layers[i].events.register("loadend", point_layers[i], function() {
			jQuery.event.trigger({ //it is necessary to trigger event after layer if loaded because feature can by highlighted only after all layers are loaded
				"type": "layerLoaded",
				"feature": feature,
				"allLayers": point_layers.length
			});
		});
	}

	map.addLayers(point_layers);
	addSelectFeature(point_layers);
	

	//-------------------------------------------------------------------

	 // create layer switcher widget in top right corner of map.
	var layer_switcher= new OpenLayers.Control.LayerSwitcher();
	
	map.addControl(layer_switcher);
	map.addControl(
		new OpenLayers.Control.MousePosition({
			"numDigits": 2
		})
	);
	
	jQuery(layer_switcher.baseLbl).html('Warstwy');
	jQuery(layer_switcher.dataLbl).html('Obiekty');

	cent(); //map would not render if not centered
	
	jQuery(window).bind("resize", function() {
		//manageMapStyle(); //this is causing major bug. manageMapStyle is binding multiple times selecting (only in IE...)  
		//setLightBoxSize(mapLbox);
	});
}

//------------------------------AUXILIARY FUNCTIONS------------------------------------------

function pointLayer (name, file) {
	
	var p_layer = new OpenLayers.Layer.Vector(name, {
		"projection": map.displayProjection,
		"strategies": [new OpenLayers.Strategy.Fixed()],
		"protocol": new OpenLayers.Protocol.HTTP({
			"url": file,
			"format": new OpenLayers.Format.KML({
				"extractStyles": true,
				"extractAttributes": true
			})
		})
	});
	console.log(p_layer.projection);
	return p_layer
}

function getLayers (file, callback) {
	OpenLayers.Request.GET({ //fetches global json for objects
		url: file,
		headers: {'Accept':'application/json'},
		success: function (req) {
			var fetchedJSON = JSON.parse(req.responseText);
			
/*--------*/function getLayer(jsonPart, name) { //adds layers to map
				var g = new OpenLayers.Format.GeoJSON();
				var feature_collection = g.read(jsonPart);
				
				var myStyles = new OpenLayers.StyleMap({ //it should be elswhere probably
					"default": new OpenLayers.Style({ //if there is no property in feature's json that fragment of style is just not applied ;_; not completely sure how it works...
						externalGraphic: "${marker}",
						pointRadius: 15,
						strokeColor: "${color}",
						strokeWidth: 8,
						cursor: "pointer"
					}),
					"select": new OpenLayers.Style({
						pointRadius: 20,
						strokeWidth: 14
					})
				});

				var vector_layer = new OpenLayers.Layer.Vector(name, {
					styleMap: myStyles
				});
				
				for(var i= 0; i < feature_collection.length; i++) {
					feature_collection[i].geometry.transform(
						new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
						map.getProjectionObject() // to Spherical Mercator Projection
					);
				}
				vector_layer.addFeatures(feature_collection);
				map.addLayer(vector_layer);
/*--------*/}
						
			for(el in fetchedJSON) {
				getLayer(fetchedJSON[el], el);
			}
			callback(); //callback after all layers are loaded!!!
        }
   });
}

function addSelectControl() {
	var vectorLayers = [];
			
	for(var i = 0; i < map.layers.length; i++) { //not very pretty but it works
	  if(map.layers[i].CLASS_NAME === "OpenLayers.Layer.Vector") {
		vectorLayers.push(map.layers[i]);
	  }
	}
	
	wybor = new OpenLayers.Control.SelectFeature(vectorLayers, {
		"hover": false,
		"toggle": false,
		"clickout": true,
		"multiple": false,
		onSelect: function(e) { //TODO
			console.log(e);
		},
		onUnselect: function(e) { //TODO
			console.log(e);
		}
	});
	map.addControl(wybor);
	wybor.activate();
}

function getFeatureFromMapByFid(fid) { //It is working only after map and layers are loaded
    var layers = map.layers.slice(1, -1);
    for(var i = 0; i < layers.length; i++) {
        if(layers[i].getFeatureByFid(fid)) {
            return layers[i].getFeatureByFid(fid);
        }
    }
}

function getShortDescription(ft) { //by feature object from OL
	var featureId = ft.fid;
	var featureFolder = ft.attributes.folder;

	jQuery.ajax({
		"url": "map/showDescription.php",
		"data": {
			"type": "short", 
			"featureId": featureId,
			"featureFolder": featureFolder
		},
		"type": "POST",
		"dataType": "html",
		"success": function(htmlData) {
			jQuery("#description_area").html(htmlData);
		}
		
	});
}

function getGallery(ft) { //by feature object from OL
	var featureId = ft.fid;
	var featureFolder = ft.attributes.folder;
	
	jQuery.ajax({
		"url": "map/getGallery.php",
		"data": {
			"featureId": featureId,
			"featureFolder": featureFolder
		},
		"type": "POST",
		"dataType": "json",
		"success": function(htmlData) {
			var galleryInfo = htmlData;
			var ul = jQuery("<ul></ul>");
			for(var i = 0; i < galleryInfo.num; i++) {
				ul.append(jQuery("<li></li>").attr("id", i).attr("class", "photo"));
				jQuery.event.trigger({ //it is necessary to trigger event after layer if loaded because feature can by highlighted only after all layers are loaded
					"type": "photoContainerLoaded",
					"number": i,
					"folder": galleryInfo.path	
				});
			}
		}	
	});
}

function getLongDescription(ft) { //by feature object from OL
	var featureId = ft.fid;
	var featureFolder = ft.attributes.folder;
	
	jQuery.ajax({
		"url": "map/showDescription.php",
		"data": {
			"type": "long",
			"featureId": featureId,
			"featureFolder": featureFolder
		},
		"type": "POST",
		"dataType": "html",
		"success": function(htmlData) {
			jQuery("#description_area").html(htmlData);
			if(jQuery("#featureGallery").length != 0) {
				getGallery(ft);
			}
		}
	});
}


function showDescription(ft) { //by feature object from OL
	resizeDescription();
	getShortDescription(ft);
}

//-------------------------GALLERY--------------------------------------------------

var gallery = { //OMG ;_; make some comments...
	"windHeight": function() {
		var windHeight;
		if(!window.innerHeight) {
			windHeight = document.documentElement.clientHeight - 50; //to fix IE8...
		} else {
			windHeight = window.innerHeight - 50;
		}
		return windHeight;
	},
	"positionPhoto": function () {
		var img = jQuery(".lbox_photo");
		var imgObj = new Image(); //creating new dom element to retrieve natural height and width of image 
		imgObj.src = img.attr("src"); 
		var naturalHeight;
		var naturalWidth;
		
		naturalHeight = imgObj.height;
		naturalWidth = imgObj.width;
		
		
		
		if(naturalHeight >= naturalWidth) {
			jQuery(".photo_cont").animate({
				"height": '80%',
				"top": '10%'
			}, 200, function() {
				var newWidth = naturalWidth * (jQuery(".photo_cont").height() / naturalHeight);
				jQuery(".photo_cont").animate({
					"width": newWidth,
					"left": (jQuery(window).width() - newWidth) / 2
				}, 200, function() {
						jQuery(".lbox_photo").css({"height": '100%'});
						jQuery(".lbox_photo").fadeIn();
					});
				
			});
		} else if (naturalHeight < naturalWidth) {
			jQuery(".photo_cont").animate({
				"width": '80%',
				"left": '10%'
			}, 200, function() {
				var newHeight = naturalHeight * (jQuery(".photo_cont").width() / naturalWidth);
				jQuery(".photo_cont").animate({
					"height":  newHeight,
					"top": (gallery.windHeight() - newHeight) / 2
				}, 200, function() {
						jQuery(".lbox_photo").css({"width": '100%'});
						jQuery(".lbox_photo").fadeIn();
					});
				
			});
		}
	},
	"makePhoto": function(idForImg, imgUrl) {
		var img = jQuery("<img class='lbox_photo' id='" + idForImg + "' src='" + "/it/mapy/prototyp/" + imgUrl + "'/>");
		img.hide();
		img.bind("load", gallery.positionPhoto)
		jQuery(".photo_cont").append(img);
		jQuery(".photo_cont").bind("click", function(e) { e.stopPropagation()});
		jQuery("#exit").bind("click", gallery.closeLightBox);
		if(gallery.havePreviousPhoto()) {
			jQuery("#left_button").fadeIn();
			jQuery("#left_button").bind("click", gallery.getPreviousPhoto);
		}
		if(gallery.haveNextPhoto()) {
			jQuery("#right_button").fadeIn();
			jQuery("#right_button").bind("click", gallery.getNextPhoto);
		}
	},
	"thumbClick": function(e) {

		var imgUrl = jQuery(e.currentTarget).children().attr("class") + '/' + jQuery(e.currentTarget).children().attr("id").slice(4);
		var idForImg = jQuery(e.currentTarget).children().attr("id").slice(4);
		
		
		var light_box = jQuery("#light_box");
		light_box.attr("class", "visible");
		light_box.bind("click", gallery.closeLightBox);
		light_box.html("<div class='photo_cont'><div id='exit'></div><div class='lbox_nav' id='left_button'></div><div class='lbox_nav' id='right_button'></div></div>");
		
		jQuery(".photo_cont").css({
			height: '400px',
			width: '400px',
			background: 'url("/it/mapy/prototyp/loader.gif") no-repeat scroll 50% 50% #6B6B6B',
			left: jQuery(window).width() / 2 - 200,
			top: gallery.windHeight() / 2 - 200
		});
		
		jQuery("#left_button").hide();
		jQuery("#right_button").hide();
		
		gallery.makePhoto(idForImg, imgUrl);
		
		
		
	},
	"getPreviousPhoto": function(e) {//TODO check for unbinding eventHandlers
		var currentPhoto = jQuery(this).parent().children().last().attr("id");
		currentPhoto = jQuery(document.getElementById("thum" + currentPhoto)); //;_;
		var prevPhoto = currentPhoto.parent().prev().children();
		var idForImg = prevPhoto.attr("id").slice(4);
		var imgUrl = prevPhoto.attr("class") + '/' + idForImg;
		
		jQuery(".lbox_photo").fadeOut().remove();
		jQuery(".photo_cont").animate({
			"height": '400px',
			"width": '400px',
			"left": jQuery(window).width() / 2 - 200,
			"top": gallery.windHeight() / 2 - 200
		});
		jQuery("#left_button").hide();
		jQuery("#right_button").hide();
		jQuery("#left_button").unbind("click");
		jQuery("#right_button").unbind("click");
		
		gallery.makePhoto(idForImg, imgUrl);
	},
	"getNextPhoto": function() {
		var currentPhoto = jQuery(this).parent().children().last().attr("id");
		currentPhoto = jQuery(document.getElementById("thum" + currentPhoto)); //;_;
		var nextPhoto = currentPhoto.parent().next().children();
		var idForImg = nextPhoto.attr("id").slice(4);
		var imgUrl = nextPhoto.attr("class") + '/' + idForImg;
		
		jQuery(".lbox_photo").fadeOut().remove();
		jQuery(".photo_cont").animate({
			"height": '400px',
			"width": '400px',
			"left": jQuery(window).width() / 2 - 200,
			"top": gallery.windHeight() / 2 - 200
		});
		
		jQuery("#left_button").hide();
		jQuery("#right_button").hide();
		jQuery("#left_button").unbind("click");
		jQuery("#right_button").unbind("click");
		
		gallery.makePhoto(idForImg, imgUrl);
	},
	"closeLightBox": function() {
		var light_box = jQuery("#light_box");
		light_box.attr("class", "hidden");
		light_box.unbind("click", gallery.closeLightBox);
		jQuery("#exit").unbind("click", gallery.closeLightBox);
	},
	"havePreviousPhoto": function() {
		var currentPhoto = jQuery(".lbox_photo").attr("id");
		var thumCurrentPhoto = jQuery(document.getElementById("thum" + currentPhoto)); //;_;
		if(thumCurrentPhoto.parent().prev().length != 0) {
			return true;
		} else {
			return false;
		}
	},
	"haveNextPhoto": function() {
		var currentPhoto = jQuery(".lbox_photo").attr("id");
		var thumCurrentPhoto = jQuery(document.getElementById("thum" + currentPhoto)); //;_;
		if(thumCurrentPhoto.parent().next().length != 0) {
			return true;
		} else {
			return false;
		}
	}
}



//-----------------------------------------------------------------------------------

function more_description() {
	var controlPanel = jQuery("#control_panel");
	var outer = jQuery("#outer");
	if(controlPanel.attr("class") === "min") {
		outer.attr("class", "max");
		map.updateSize();
		controlPanel.attr("class", "max");
		getLongDescription(selectedFeature);
	} else {
		outer.attr("class", "min");
		map.updateSize();
		controlPanel.attr("class", "min");
		getShortDescription(selectedFeature);
	}
}

function resizeDescription() { //it is probably redundant
	map.updateSize();
	if((window.innerWidth / window.innerHeight) >= 1) {
		/*jQuery("#description_area").css({
			"height": jQuery("#control_panel").height() - jQuery("#controls").outerHeight()
		});*/
	}
}

			
//############################################################################################################### 

function onFeatureSelect(event) {
		var feature;
		if(event.feature != undefined) {
			feature = event.feature
		} else feature = getFeatureFromMapByFid(arguments[0].fid);
		selectedFeature = feature;
		showDescription(feature);

		
		function returnPlacemark(xmlFragment) {
			var f = new OpenLayers.Format.KML;
			var result;
			if (window.ActiveXObject) {
				result =  xmlFragment.xml; //version for IE
			} else {
				result = new XMLSerializer().serializeToString(xmlFragment); //version for normal browsers
			}
			return f.read(result);
		}
		
		
		switch(feature.data.category) {
	/*----*/case "point":
				
				//-----------------------This should be a function---------------------------------------------------				
				map.setCenter(feature.geometry.getBounds().getCenterLonLat());  //rethink and refine!!!
				lastZoomLevel = map.zoom;
				if(map.zoom < 15) {
					lastZoomLevel = map.zoom;
					map.zoomTo(15);
				}
				//---------------------------------------------------------------------------------------------------
				
				//animateMarker() //TODO it would be nice to animate selected marker or indicate that it is selected
				
				var x = feature.geometry.x;
				var y = feature.geometry.y;
				
				var defaultStyle = new OpenLayers.Style({
					"pointRadius": 30,
					"externalGraphic": "/it/mapy/prototyp/center_col.png",
					"fillColor": "#FF0000",
					"fillOpacity": 0.5,
					"stroke": false
				});

				var mark_style = new OpenLayers.StyleMap({
					"default": defaultStyle
				});
				
				temp_layer = new OpenLayers.Layer.Vector("test" ,
					{
						"styleMap": mark_style,
						"displayInLayerSwitcher": false
					}
				);
				
				var point = new OpenLayers.Feature.Vector(
					new OpenLayers.Geometry.Point(x, y)
				);
				temp_layer.addFeatures(point);
				map.addLayer(temp_layer);
				
				break;
	/*----*/case "bike_track": //below should be wrapped in some functions because this is abomination...
				lastZoomLevel = map.zoom;
				map.setCenter (feature.geometry.getBounds().getCenterLonLat());
				var idOfPlacemark = feature.fid;
				
				//----------------styles should be defined elsewhere-------------------------------------------------
				var defaultStyle = new OpenLayers.Style({
					"pointRadius": 18,
					"externalGraphic": '${marker}',
					"graphicZIndex": 9000,
					"graphicYOffset": -34
				});

				/*var selectStyle = new OpenLayers.Style({
				  'pointRadius': 20	
				});*/

				var styleForBikePoints = new OpenLayers.StyleMap({
					'default': defaultStyle/*,
					'select': selectStyle*/
				});
				//---------------------------------------------------------------------------------------------------
				
				temp_layer = new OpenLayers.Layer.Vector("test" ,
					{
						"styleMap": styleForBikePoints,
						"displayInLayerSwitcher": false
					}
				);
				
					var sty = feature.style;
					sty.strokeWidth = 8;
					sty.strokeOpacity = 0.6;
					feature.style = sty;
					feature.layer.redraw();
					map.zoomToExtent(feature.geometry.getBounds());	
				
				jQuery.ajax({ //thanks to this query for bike points is asynchronous
					"url": 'map/bike_tracks/bike_points.kml',
					"type": "GET",
					"dataType": "xml",
					"success": function(xmlData) {
						
						var beg, end;
						
						beg = returnPlacemark(jQuery(xmlData).find("[id=" + idOfPlacemark + "_start]")[0]);
						end = returnPlacemark(jQuery(xmlData).find("[id=" + idOfPlacemark + "_end]")[0]);
						
						beg[0].geometry.transform(
							new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
							map.getProjectionObject() // to Spherical Mercator Projection
						);
						end[0].geometry.transform(
							new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
							map.getProjectionObject() // to Spherical Mercator Projection
						);
						beg[0].marker = beg[0].data.marker;
						end[0].marker = end[0].data.marker;
						temp_layer.addFeatures(beg);
						temp_layer.addFeatures(end);
						map.addLayer(temp_layer);
					}
				});
				
				map.addLayer(temp_layer);
				break;
	/*----*/case "nature_point" /*or point with boundaries*/:
				lastZoomLevel = map.zoom;
				map.setCenter(feature.geometry.getBounds().getCenterLonLat());
				
				var idOfBounds = feature.fid;
				
				jQuery.ajax({
					"url": 'map/nature/boundaries.kml',
					"type": "GET",
					"dataType": "xml",
					"success": function(xmlData) {
						var boundaries;
						temp_layer = new OpenLayers.Layer.Vector("test", {
							"styleMap": styleForBikePoints,
							"displayInLayerSwitcher": false
						});
						
						//boundaries = returnPlacemark(xmlData.querySelector("[id=" + idOfBounds + "]"));
						boundaries = returnPlacemark(jQuery(xmlData).find("[id=" + idOfBounds + "]")[0]);
						
						boundaries[0].geometry.transform(
							new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
							map.getProjectionObject() // to Spherical Mercator Projection
						);
						
						temp_layer.addFeatures(boundaries);
					
						//----------------styles should be defined elsewhere-------------------------------------------------
						temp_layer.styleMap = new OpenLayers.StyleMap({
							"stroke": false,
							"fillColor": "#008000",
							"fillOpacity": 0.6
						});
						//---------------------------------------------------------------------------------------------------
						
						map.addLayer(temp_layer);
						map.zoomToExtent(temp_layer.features[0].geometry.getBounds());
					}
				});
				
				break;
				
		  //default: ??
		}
	}
	
	function onFeatureUnselect(event) {
		var feature = event;//.feature;
		//map.zoomTo(lastZoomLevel); //bugged check if(time)
		selectedFeature = undefined;
		
		jQuery("#outer").attr("class", "min");
		jQuery("#control_panel").attr("class", "min");
		map.updateSize();
		if(feature.attributes.long_description) {
			jQuery("#more_descr").val("Czytaj Więcej");
		}
		
		
		if(feature.data.category === "bike_track" || feature.data.category === "nature_point" || feature.data.category === "point" /*or nature!!!*/) { 
			temp_layer.destroy(); //TO DO change variable name!!!!   //this is for deleting additional information e.g. bike tracks' beggining and end etc
		}
		
		if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Collection") {
			var sty = feature.style;
			sty.strokeWidth = 2;
			sty.strokeOpacity = 1;
			feature.style = sty; 
			feature.layer.redraw();
		}
		jQuery("#description_area").html("Wybierz obiekt klikając na niego");
	}

function addSelectFeature(point_layers) { // WORKS
	var temp_layer;
	
	highlight = new OpenLayers.Control.SelectFeature(point_layers,{ // UGLY global variable... ;_; 
		"hover": true,
		"multiple": false,
		"highlightOnly": true,
		"renderIntent": "temporary",
		callbacks: {
			out: function(event) {
				if(event.popup) {
					map.removePopup(event.popup);
					event.popup = undefined;
				}
			}
		},
		"eventListeners": {
			"featurehighlighted": function(event){
				event.feature.popup = new OpenLayers.Popup("hint",
				   map.getLonLatFromPixel(map.controls[7].lastXy), //;_; this is dangerous. If more controls added in future it will not work...
				   null,
				   event.feature.attributes.name,
				   true
				);
				event.feature.popup.autoSize = true;
				map.addPopup(event.feature.popup);
			}
		}
	});

	map.addControl(highlight);
	highlight.activate();
	
	select = new OpenLayers.Control.SelectFeature(point_layers,{ // UGLY global variable... ;_; 
		"hover": false,
		"toggle": false,
		"clickout": true,
		"multiple": false,
		onSelect: onFeatureSelect,
		onUnselect: onFeatureUnselect
	});
	
	map.addControl(select);
	select.activate();

}	
//---------------------------------------------------------------



var numberOfLayers = 0;

function newMessageHandler(e) {
	numberOfLayers += 1;
	if(numberOfLayers === e.allLayers) { //this constant 8 is arbitrary because I have 8 layers with placemarks. It does not checking if there are more or LESS layers. It is kida unsafe when something will change in future
		if(e.feature) {
			select.select(getFeatureFromMapByFid(e.feature));
		}	
	}
}

function newPhotoContainerLoadedHandler(e) { //it should be probably in gallery object 0_o
	jQuery.ajax({
		"url": "map/getPhoto.php",
		"data": {
			"number": e.number, 
			"folder": e.folder
		},
		"type": "POST",
		"dataType": "html",
		"success": function(htmlData) {
			var photo = jQuery(htmlData).bind("click", gallery.thumbClick);
			jQuery("#featureGallery").append(photo);
		}	
	});
}

jQuery(document).on("layerLoaded", newMessageHandler);
jQuery(document).on("photoContainerLoaded", newPhotoContainerLoadedHandler);

