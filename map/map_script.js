'use strict';
var littleMap = {
	map: undefined,
	config: undefined,
	initialize: {
		config: function(callback) {
			OpenLayers.Request.GET({ //fetches config.json for objects
				url: 'map/config.json',
				headers: {'Accept':'application/json'},
				success: function (req) {
					littleMap.config = JSON.parse(req.responseText);
					callback();//if config.json is not walid or present map would not render as this callback lets whole rendering process begin						
				}
			});
		},
		DOM: {
			insert: function() {
				jQuery('.map').html('<div id="mapdiv"></div><div id="control_panel" class="min"><div id="placemarkDescription"></div></div>');
			},
			manage: function() { //TODO
			   /*
				* ataching events to buttons, 
				* adjusting style according to viewport size
				*/
			}
		},
		map: function() {
			littleMap.map = new OpenLayers.Map('mapdiv', {
				theme: null
			});
		},
		mapLayers: function() {
			littleMap.map.addLayer(new OpenLayers.Layer.OSM());
			//in config.json one shound be able to choose base layers (OSM, google maps etc)
		},
		layers: {
			addLayer: function(jsonPart, name, displayInLayerSwitcher) { //adds layers to map
				var g = new OpenLayers.Format.GeoJSON();
				var feature_collection = g.read(jsonPart);
				try { //if jsonPart does not contain proper geojson data whole map will render 
					displayInLayerSwitcher = (displayInLayerSwitcher === undefined) ? true : false;
					
					var myStyles = new OpenLayers.StyleMap({ //it should be elswhere probably
						'default': new OpenLayers.Style({ //if there is no property in feature's json that fragment of style is just not applied ;_; not completely sure how it works...
							externalGraphic: '${marker}',
							pointRadius: 15,
							strokeColor: '${strokeColor}',
							strokeOpacity: 0.6,
							strokeWidth: 8,
							cursor: 'pointer'
						}),
						'select': new OpenLayers.Style({
							pointRadius: 20,
							strokeOpacity: 1,
						}),
						'highlight': new OpenLayers.Style({
							pointRadius: 18,
							strokeOpacity: 0.8,
						})
					});

					var vector_layer = new OpenLayers.Layer.Vector(name, {
						styleMap: myStyles,
						displayInLayerSwitcher: displayInLayerSwitcher
					});
					
					for(var i= 0; i < feature_collection.length; i++) {
						feature_collection[i].geometry.transform(
							new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
							littleMap.map.getProjectionObject() // to Spherical Mercator Projection
						);
						feature_collection[i].fid = feature_collection[i].attributes.name;
					}
					vector_layer.addFeatures(feature_collection);
					littleMap.map.addLayer(vector_layer);
				} catch(e) {
					console.log(e);
				}

				
			},
			fetch: function(file, callback) {
				OpenLayers.Request.GET({ //fetches global json for objects
						url: file,
						headers: {'Accept':'application/json'},
						success: function (req) {
							var fetchedJSON = JSON.parse(req.responseText);
									
							for(var el in fetchedJSON) {
								
								if(fetchedJSON[el].type === 'FeatureCollection') {  //to be sure that part of json can be rendered as vector layer
									littleMap.initialize.layers.addLayer(fetchedJSON[el], el); //adds layer to the map
								}
							}
							
							callback(); //callback after all layers are loaded!!!
								
						}
				});
			},
			addSelectControl: function() { //TODO it should only adding selects
				var vectorLayers = littleMap.map.getLayersByClass('OpenLayers.Layer.Vector');
				
				littleMap.operations.select.hover = new OpenLayers.Control.SelectFeature(vectorLayers, { //TODO this should be moved to operations!!!
					'hover': true,
					'highlightOnly': true,
					'renderIntent': 'highlight',
                	eventListeners: {
	                    featurehighlighted: function() {
	                    	//TODO 
	                    },
	                    featureunhighlighted: function() {
	                    	//TOD	                    }
						}	                
	                }
				});

				littleMap.operations.select.click = new OpenLayers.Control.SelectFeature(vectorLayers, { //TODO this should be moved to operations!!!
					'clickout': true,
					onSelect: function(e) {
						jQuery('#placemarkDescription').html(e.attributes.name);
						if(e.attributes.additional) {
							littleMap.initialize.layers.addLayer(e.attributes.additional, 'tempLayer', false); //tempLayer is name for layer used to render additional features of placemark	
							var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];
							tempLayer.setZIndex(e.layer.getZIndex() + 1); //additional features will be over actual feature. Area should be under!!!
							
							//zooming to extent of additional placemarks layer
							littleMap.map.setCenter(tempLayer.getDataExtent().getCenterLonLat()); 
							littleMap.map.zoomToExtent(tempLayer.getDataExtent()); 
						} else {
							littleMap.map.setCenter(e.geometry.getBounds().getCenterLonLat());
						}
					},
					onUnselect: function() { 
						jQuery('#placemarkDescription').html('');
						var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];
						if(tempLayer) {
							tempLayer.destroy();	
						}
					}
				});

				littleMap.map.addControl(littleMap.operations.select.hover); //this is now working properly when added after select.click
				littleMap.operations.select.hover.activate();

				littleMap.map.addControl(littleMap.operations.select.click);
				littleMap.operations.select.click.activate();


			}
		},
		layerSwitcher: function() {
			littleMap.map.addControl(new OpenLayers.Control.LayerSwitcher());
		},
		center: function(selectedFeature) { //without centering OpenLayers will not render map
			if(selectedFeature) {
				var featureToCenter = littleMap.operations.getFromMapByFid(selectedFeature);
				var selectClick = littleMap.operations.select.click;

				littleMap.map.zoomTo(15);
				selectClick.select(featureToCenter);
				selectClick.highlight(featureToCenter); //this is for changing style
 
			} else {
				var lonLat = new OpenLayers.LonLat(littleMap.config.defaultCenter.lon, littleMap.config.defaultCenter.lat) //thsi is default point of centering- values are fetched from config.json
						.transform(
							new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
							littleMap.map.getProjectionObject() // to Spherical Mercator Projection
						);
				var zoom=13;
				
				littleMap.map.setCenter(lonLat, zoom); //centering on defaultCenter from config.json
			}
		}
	},
	operations: {
		getFromMapByFid: function(fid) {
			var vectorLayers = littleMap.map.getLayersByClass('OpenLayers.Layer.Vector');
			var feature;
			vectorLayers.forEach(function(l) {
				if(l.getFeatureByFid(fid)){
			 		feature = l.getFeatureByFid(fid);
				}
			});
			return feature;			
		},
		select: { //TODO
			hover: undefined,
			click: undefined //these two can be instantiated only after layers with placemarks are rendered
		}
	},
	init: function(featureToCenterAt) {
		littleMap.initialize.config(function() {
			littleMap.initialize.DOM.insert();
			littleMap.initialize.DOM.manage();
			littleMap.initialize.map();
			littleMap.initialize.mapLayers();
			littleMap.initialize.layers.fetch('map/objects/objects.json', function() {
				littleMap.initialize.layerSwitcher();
				littleMap.initialize.layers.addSelectControl();
				littleMap.initialize.center(featureToCenterAt);
			});			
		});
	}
};
