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
				jQuery('.map').html('<div id="mapdiv"><p id="hint"></p></div><div id="control_panel" class="min"><div id="placemarkDescription"></div></div>');
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
			// TODO in config.json one shound be able to choose base layers (OSM, google maps etc)
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
							cursor: 'pointer',
							graphicYOffset: -29
						}),
						'select': new OpenLayers.Style({
							pointRadius: 20,
							graphicYOffset: -39,
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
				
				/*
				 * Mouse position control
				 */
				 
				littleMap.operations.mousePosition = new OpenLayers.Control.MousePosition();
				littleMap.map.addControl(littleMap.operations.mousePosition);
				
				/*
				 * Feature selecting control
				 */
				
				var vectorLayers = littleMap.map.getLayersByClass('OpenLayers.Layer.Vector');
				
				littleMap.operations.select = new OpenLayers.Control.SelectFeature(vectorLayers, { //instance of this is in littleMap.operations.select
					'clickout': true,
					'callbacks': {
						'over': function(f) { //f means function get reference to feature
							jQuery('#hint').html(f.attributes.name);
						},
						'out': function(f) {
							jQuery('#hint').html('');	
						}
					},
					'onSelect': function(f) { //f means function get reference to feature
						try {
							f.popup.destroy();
						} catch(e) {
						
						}
						jQuery('#placemarkDescription').html(f.attributes.name);
						if(f.attributes.additional) {
							littleMap.initialize.layers.addLayer(f.attributes.additional, 'tempLayer', false); //tempLayer is name for layer used to render additional features of placemark	
							var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];
							tempLayer.setZIndex(f.layer.getZIndex() + 1); //additional features will be over actual feature. Area should be under!!!
							
							//zooming to extent of additional placemarks layer
							littleMap.map.setCenter(tempLayer.getDataExtent().getCenterLonLat()); //this is wrong e.g. if layer is ring track it shows onli little part of placemark layer!!!
							littleMap.map.zoomToExtent(tempLayer.getDataExtent()); 
						} else {
							littleMap.map.setCenter(f.geometry.getBounds().getCenterLonLat());
						}
					},
					'onUnselect': function() { 
						jQuery('#placemarkDescription').html('');
						var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];
						if(tempLayer) {
							tempLayer.destroy();	
						}
					}
				});

				littleMap.map.addControl(littleMap.operations.select);
				littleMap.operations.select.activate();

			}
		},
		layerSwitcher: function() {
			littleMap.map.addControl(new OpenLayers.Control.LayerSwitcher());
		},
		center: function(selectedFeature) { //without centering OpenLayers will not render map
			if(selectedFeature) {
				var featureToCenter = littleMap.operations.getFromMapByFid(selectedFeature);
				var selectClick = littleMap.operations.select;

				littleMap.map.zoomTo(15);
				selectClick.select(featureToCenter); //;_; why this is not highlighting feature??...
				selectClick.highlight(featureToCenter); //this is for changing style// ugly hack TODO remove!!!
 
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
	'operations': {
		'getFromMapByFid': function(fid) {
			var vectorLayers = littleMap.map.getLayersByClass('OpenLayers.Layer.Vector');
			var feature;
			vectorLayers.forEach(function(l) {
				if(l.getFeatureByFid(fid)){
			 		feature = l.getFeatureByFid(fid);
				}
			});
			return feature;			
		},
		'select': undefined,
		'mousePosition': undefined
	},
	init: function(featureToCenterAt) {
		littleMap.initialize.config(function() {
			littleMap.initialize.DOM.insert();
			littleMap.initialize.DOM.manage();
			littleMap.initialize.map(); //base layer should render in there
			//here should be centering from config.json
			littleMap.initialize.mapLayers();
			littleMap.initialize.layers.fetch('map/objects/objects.json', function() {
				/*
					Waiting for all layers is too long:
					-first center map in default point
					-load asynchronously all layers
					-center on placemark if need
				*/
				littleMap.initialize.layerSwitcher();
				littleMap.initialize.layers.addSelectControl();
				littleMap.initialize.center(featureToCenterAt);
			});			
		});
	}
};
