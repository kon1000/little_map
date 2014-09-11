 (function() {
'use strict';
/*******************************************************************************
 *                           LITTLE MAP
 *
 * Instantiation of the littleMap object.
 *
 * If function gets or return f it means that this is OpenLayers feature object
 *
 */



  window.littleMap = {    
    map: undefined,
    config: undefined,
    vectorLayers: undefined,
	categories: [],
    featureSwitcher: undefined,
    category: undefined,
    polyfills: undefined,
    state: {
      selectedFeatures: [],
      size: '' 
    },
    initialize: {
      config: undefined,
      DOM: {
        insert: undefined,
        manage: undefined,
      },
      map: undefined,
      baseLayers: undefined,
      layers: {},
      layerSwitcher: undefined,
      center: undefined
    },
    helpers: {},
    style: undefined //should be here?? on in layers?? 
  };


/*******************************************************************************
 *                               POLYFILLS
 *
 * So far there are polyfill for:
 * 1) Array.prototype.forEach
 * 2) Array.prototype.indexOf
 *
 */

littleMap.polyfills = function() {
  /*
   * in featureSwitcher I use custom tag attribute.
   * Maybe it should be declared here???
   */
  if (!Array.prototype.forEach) {
    //TODO CHECK!!!
    Array.prototype.forEach = function(f) {
      for (var i = 0; i < this.length; i++) {
        f(this[i], i);
      }
    };
  }

  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(el) {
      for (var i = 0; i < this.length; i++) {
        if (el === this[i]) return i;
      }
      return -1;
    };
  }
}

/*******************************************************************************
 *                             INITIALIZE
 */

/*******************************************************************************
 * config
 */

littleMap.initialize.config = function(callback) {
  /*
   * TODO good but need changes in initialize.DOM
   * littleMap.category = jQuery('.map').attr('id').slice(9);
   */
  OpenLayers.Request.GET({ //TODO change to jQuery fetches config.json for objects  
    url: 'map/config.json', //PATH
    headers: {
      'Accept': 'application/json'
    },
    success: function(req) {
      littleMap.state.size = jQuery('.map').attr('data-size');
      littleMap.config = JSON.parse(req.responseText);
        /* 
         *  If config.json is not walid or present map will not 
         *  render.
         *
         *  !!! This callback lets whole rendering process begin.
         */
      callback(); 
    }
  });
}

/*******************************************************************************
 * dom insert
 *
 * TODO elements for littleMap modules should be in config.dom
 * TODO tidy up!!!!!!
 */

littleMap.initialize.DOM.insert = function() {
  var classMapDiv = jQuery('.map'); //TODO maybe this could be to chose
  
  
  classMapDiv.append('<div id="mapdiv"></div>');
  var mapDiv = jQuery('#mapdiv');
  mapDiv.prepend('<div id="little_map_controls_div"><div id="l_sw">Warstwy</div></div>');
  var controlsDiv = jQuery('#little_map_controls_div');
  mapDiv.append('<p id="hint"></p>');
  mapDiv.append('<button id="open_map_button">Otwórz mapę</button>');

  if (classMapDiv.attr('data-category')) {
  //TODO good but category should be in custom attribute // if(littleMap.catgory){
    /*
     * This 9 is arbitrary ("category:".length === 8)
     * TODO it would be better do use custom attribute
     *
     * The syntax for .map is:
     * 1)   <div id="unique_feature_ID" class="map"> 
     *     -> for displaying particular feature
     * 
     * 2)  <div data-catedogy="chosen_category" class="map">
     *     -> for displaying map of categories
     *
     * In second option littleMap displays list/buttons/whatever
     * for selecting features
     */ 
    
    /* 
     * TODO category of the map should be set in initialize.config and shold be 
     * stored in littleMap.state (or config)
     */ 
    littleMap.category = classMapDiv.attr('data-category');

    /*
     * Below is creates featureswitcher.
     * elHoldingFSw depends on environment!!!
     */
    //var elHoldingFSw = jQuery('#mapdiv');
    controlsDiv.prepend('<div id="feature_switcher"></div>');   
 
  }
  
  jQuery('.map').prepend('<div id="placemarkDescription"></div>');
  
  if(littleMap.state.size === "embedded") {
    jQuery('#placemarkDescription').hide();  
  }
  
};

/*******************************************************************************
 * dom manage
 */

littleMap.initialize.DOM.manage = { 
  /*
   * TODO ideas!
   * 1) ataching events to buttons
   * 2) adjusting style according to viewport size
   * 3) changing size of the map
   */
  openButtonHandler: function() { 
    if(littleMap.state.size === "embedded") {
      littleMap.state.size = "jumbo";
      jQuery('#open_map_button').html('Zamknij mapę');
      jQuery('#placemarkDescription').show();
      jQuery('.map').attr('data-size', 'jumbo');
      littleMap.map.updateSize();
    } else {
      littleMap.state.size = "embedded";
      jQuery('#open_map_button').html('Otwórz mapę');
      jQuery('#placemarkDescription').hide();
      jQuery('.map').attr('data-size', 'embedded'); 
      littleMap.map.updateSize();
    }
  },
  init: function() {
    if(littleMap.state.size === "embedded") {
      jQuery('#open_map_button').on('click', this.openButtonHandler); 
    }
    
  }
}

/*******************************************************************************
 * map
 *
 * TODO think if it should be merge with base layers
 */

littleMap.initialize.map = function() {
  var contrDiv = document.getElementById('controls');
  littleMap.map = new OpenLayers.Map('mapdiv', {
    theme: null,
    controls: []
  });
  var controls = []; 
  controls.push(new OpenLayers.Control.Zoom());
  controls.push(new OpenLayers.Control.Navigation());
  littleMap.map.addControls(controls);
  littleMap.map.controls.forEach(function(c) {
    c.activate();
  });
  
  jQuery('#l_sw').on('click', function() {
    jQuery('.layersDiv').slideToggle();
  });
}

/*******************************************************************************
 * base layers
 */

littleMap.initialize.baseLayers = function() {
  /*
   *  TODO in config.json one shound be able to choose 
   *  base layers (OSM, google maps etc)
   */
  littleMap.map.addLayer(new OpenLayers.Layer.OSM());
};

/*******************************************************************************
 * layers
 */

littleMap.initialize.layers.addLayer = function(jsonPart, 
                                                name, 
                                                displayInLayerSwitcher) {
  var g = new OpenLayers.Format.GeoJSON();
  var feature_collection = g.read(jsonPart);
  try {
    /*
     * if jsonPart does not contains proper geojson
     * data whole map will render without invalid
     * layer
     */
    displayInLayerSwitcher = (displayInLayerSwitcher === undefined) ? true
                                                                    : false;

    /*
     * TODO rethink if styles declarations should be somewhere else
     */

    var vector_layer = new OpenLayers.Layer.Vector(name, {
      styleMap: littleMap.style,
      displayInLayerSwitcher: displayInLayerSwitcher
    });

    /*
     * TODO think about supporting different projections
     *      it is saved in gejson in crs property
     */

    for (var i = 0; i < feature_collection.length; i++) {
      feature_collection[i].geometry.transform(
        new OpenLayers.Projection('EPSG:4326'), // transform from WGS 1984
        littleMap.map.getProjectionObject() // to Spherical Mercator Projection
      );
      feature_collection[i].fid = feature_collection[i].attributes.id;
    }
    vector_layer.addFeatures(feature_collection);
    littleMap.map.addLayer(vector_layer);

    } catch (e) {
      /* 
       * Optional catching of error from invalid layers json data
       */
    }
}

littleMap.initialize.layers.fetch = function(file, callback) {
  /*
   * This is fetching json with all layers and turning it into OpenLayers vector
   * layers using function addLayer
   */
  OpenLayers.Request.GET({ //fetches global json for objects
    url: file,
    headers: {
      'Accept': 'application/json'
    },
    success: function(req) {
      var fetchedJSON = JSON.parse(req.responseText);

      for (var el in fetchedJSON) {
        if (fetchedJSON[el].type === 'FeatureCollection') {
          /*
           * To be sure that part of json can be rendered as vector layer
           */

          littleMap.initialize.layers.addLayer(fetchedJSON[el], el); 
        }
      }
      callback(); //callback after all layers are loaded!!!
    }
  });
}

littleMap.initialize.layers.addSelectControl = function() { 
  /*
   * TODO it should only adding selects
   */
  
  /*
   * Mouse position control //TODO (re)move
   */

  littleMap.helpers.mousePosition = new OpenLayers.Control.MousePosition();
  littleMap.map.addControl(littleMap.helpers.mousePosition);

  /*
   * Feature selecting control
   */

  var vectorLayers = littleMap.map.getLayersByClass('OpenLayers.Layer.Vector');
  
  function overFeature(f) {
    /*
     * f means function get reference to feature
     */
    f.renderIntent = "select"; //highlighting feature when hover
    f.layer.redraw();
    jQuery('#hint').html(f.attributes.name);
  }
  
  function outFeature(f) {
    if (f !== littleMap.state.selectedFeatures[0]) {
      /*
      * if feature out is not selected
      * change style to default
      */
      f.renderIntent = "default";
      f.layer.redraw();
    }
    jQuery('#hint').html('');
  }

  function onSelectFeature(f) { 
    if (f.attributes.additional) {
      littleMap.initialize.layers.addLayer(f.attributes.additional, 
                                           'tempLayer', 
                                           false);
      /*
       * tempLayer is name for layer used to render additional
       * features of placemark
       */  
      var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];

      //zooming to extent of additional placemarks layer
      littleMap.map.setCenter(tempLayer.getDataExtent().getCenterLonLat());
      littleMap.map.zoomToExtent(tempLayer.getDataExtent());
    } else {
      littleMap.map.setCenter(f.geometry.getBounds().getCenterLonLat());

      if (f.geometry.getArea() > 0 || f.geometry.getLength() > 0) {
        /*
         *  zooming to feature only if it is a track (getLength) or area 
         *  (getArea)
         *  TODO (possible tweak) it would be zoom to features with area is to 
         *  big if area is small borders of area are on the edge of map
         */
        littleMap.map.zoomToExtent(f.geometry.getBounds());
      } else {
	if(littleMap.map.zoom < 16) {
	  littleMap.map.zoomTo(16);
	}
        
      }

    }
    littleMap.state.selectedFeatures.push(f); 
      /*
       * this is adding feature to global (for app) selectedFeatures table
       * getting description asynchronously
       */
    
    littleMap.getFeatureDescription(f);
    
    littleMap.featureSwitcher.helpers.highlightSelected();
  }

  function onUnselectFeature() {
    jQuery('#placemarkDescription').html('');
    var tempLayer = littleMap.map.getLayersByName('tempLayer')[0];
    if (tempLayer) {
      tempLayer.destroy();
    }
    /*
     * removes feature from global (for app) state.selectedFeatures table
     */  
    littleMap.state.selectedFeatures.pop();
    //manageing feature_select!!!
    document.getElementById('feature_select').selectedIndex = 0;
    document.getElementById('category_select').selectedIndex = 0;
  }

  littleMap.helpers.select = new OpenLayers.Control.SelectFeature(vectorLayers, {
    /*
     * instance of this is in littleMap.helpers.select
     */  
    clickout: true,
    callbacks: {
      over: overFeature,
      out: outFeature 
    },
    onSelect: onSelectFeature,
    onUnselect: onUnselectFeature 
  });

  littleMap.map.addControl(littleMap.helpers.select);
  littleMap.helpers.select.activate();
}

/*******************************************************************************
 * layer switcher
 */

littleMap.initialize.layerSwitcher = function() {
  littleMap.map.addControl(new OpenLayers.Control.LayerSwitcher({
    div: document.getElementById('l_sw')
  }));
  jQuery('.layersDiv').hide();

}

/*******************************************************************************
 * center
 */

littleMap.initialize.center = function(selectedFeature) { 
  /*
   * WARNING! without centering OpenLayers will not render map
   */
  if (selectedFeature === undefined) {
    var lon = littleMap.config.defaultCenter.lon;
    var lat = littleMap.config.defaultCenter.lat;
    /*
     * this is default point of centering- values are fetched from config.json
     */
    var lonLat = new OpenLayers.LonLat(lon, lat).transform(
      new OpenLayers.Projection('EPSG:4326'), // from WGS 1984
      littleMap.map.getProjectionObject() // to Spherical Mercator
    );
    var zoom = 13;

    littleMap.map.setCenter(lonLat, zoom); //centering from config.json
  } else {
    var featureToCenter = littleMap.helpers.getFromMapByFid(selectedFeature);
    var selectClick = littleMap.helpers.select;

    littleMap.map.zoomTo(15);
    selectClick.select(featureToCenter);
    //TODO find if there is a way to redraw only feature!!!!!!!!!
    featureToCenter.layer.redraw(); // necessary after manual selecting
  }
}


/*******************************************************************************
 *                             HELPERS
 * these are helper functions
 */

littleMap.helpers = {
  getVectorLayers: function() {
    var vLClass = 'OpenLayers.Layer.Vector';
    littleMap.vectorLayers = littleMap.map.getLayersByClass(vLClass);  
  },
  getFromMapByFid: function(fid) { 
    var feature;
    littleMap.vectorLayers.forEach(function(layer) {
      if (layer.getFeatureByFid(fid)) {
        feature = layer.getFeatureByFid(fid);
      }
    });
    return feature;
  },
  getFromMapByCategory: function(category) {
    var features = [];

    littleMap.vectorLayers.forEach(function(layer) {
      layer.features.forEach(function(f) {
        if (f.attributes.categories) {
          if (f.attributes.categories.indexOf(category) !== -1) {
            features.push(f);
          }
        }
      });
    });
    return features;
  },
  getCategoriesFromLayer: function(l) {
    var cats = [];
	l.features.forEach(function(f) {
	  if (f.attributes.categories) {
	    f.attributes.categories.forEach(function(c) {
		  if(cats.indexOf(c) === -1) {
		    cats.push(c);
		  }
		});
	  }
    });
	return cats;
  },
  getAllCategories: function() {
    littleMap.vectorLayers.forEach(function(l) { //TODO this should be in helpers
	  var tempCats = littleMap.helpers.getCategoriesFromLayer(l);
		
	  tempCats.forEach(function(c) {
		if(littleMap.categories.indexOf(c) === -1) {
		  littleMap.categories.push(c);
		} 
	  });
	});
  },
  select: undefined, //TODO this should be moved to OpenLayers.map object
  mousePosition: undefined  //TODO the same
}

/*******************************************************************************
 *                   GETTING FEATURE DESCRIPTION
 *
 */

littleMap.getFeatureDescription = function(f) {
/*
 * TODO check if unbinding all eventhandlers!!!!
 */

var objectsPath = 'map/objects/' + f.attributes.id + '.json'; //PATH
var placemarkJSON = jQuery.getJSON(objectsPath);

jQuery.when(placemarkJSON).then(function(placemarkJSON) {
  var descrDiv = jQuery('#placemarkDescription');
  if(descrDiv.length > 0) {
    jQuery('#placemarkDescription').html('<h3>' + f.attributes.name + '</h3>');
    jQuery('#placemarkDescription').append(placemarkJSON.intro);

    if (placemarkJSON.description) { 
      /*
       * remove if descriptions should be expanded after hitting read more
       */
      jQuery('#placemarkDescription').append(placemarkJSON.description);
    }
    littleMap.getFeatureGallery(f);

    /*
     *  featureSwitcher functionality in feature description
     */

    jQuery('span[data-fid]').on({ //TODO this needs tweaking
      mouseenter: littleMap.featureSwitcher.helpers.dataFidEnterHandler,
      mouseleave: littleMap.featureSwitcher.helpers.dataFidLeaveHandler,
      click: '' //TODO think what it should do (open modal??)
    });
  }  
  

  /*
   * Below is optional expanding of long feature description
   */

  /*function placeDescr() {
    jQuery('#more').html('Mniej');
    jQuery('#placemarkDescription').append('<div class="additional_descr">' + placemarkJSON.description + '</div>');
    jQuery('#more').off('click');
    jQuery('#more').on('click', removeDescr);  
  }
  
  function removeDescr() {
    jQuery('#more').html('WiÄ™cej');
    jQuery('.additional_descr').remove();
    jQuery('#more').off('click');
    jQuery('#more').on('click', placeDescr);  
  }
  
  if(placemarkJSON.description) {
    jQuery('#placemarkDescription').append('<button id="more">WiÄ™cej</button>');
    jQuery('#more').on('click', function() {
      placeDescr();
    });
  }*/

});
}

/*******************************************************************************
 *                        GALLERY
 *
 */
littleMap.getFeatureGallery = function(f) {
  var fPhotos = f.attributes.photos,
      descrArea = jQuery('#placemarkDescription'),
      tempImg; 
  if(fPhotos) {
    fPhotos.forEach(function(p) {
      tempImg = jQuery('<img src="map/objects/img/' + p + '"/>');
      descrArea.append(tempImg);
    }); 
  }
}


/*******************************************************************************
 *                        FEATURE SWITCHER 
 */

/*******************************************************************************
 * featureSwitcher
 */

littleMap.featureSwitcher = { //TODO it should be object
  init: function(featureArray) {
    littleMap.featureSwitcher.mode = jQuery('.map').attr('data-view');  
    var featureSwitcher = jQuery('#feature_switcher');
    featureSwitcher.append('<select id="category_select"></select>');
    jQuery('#category_select').append('<option selected disabled style="display=none;">Wybierz kategorię</option>'); 
    littleMap.categories.forEach(function(c) {
      var option = jQuery('<option></option>');
      option.attr('data-cat', c);  
      option.html(c);  
      jQuery('#category_select').append(option);
    });

    var options = jQuery('#category_select').find('option');
    var match = jQuery.grep(options, function(n) {
     return jQuery(n).attr('data-cat') == littleMap.category;
    });
    jQuery(match).prop("selected", "selected");

	
    littleMap.featureSwitcher.div = featureSwitcher[0];
    switch (littleMap.featureSwitcher.mode) {
      case 'blog'://deprecated
        featureArray.forEach(function(feature) {
          var par = jQuery('<p></p>'); 
          par.attr('data-fid', feature.attributes.id);
          par.html(feature.attributes.name); 
          featureSwitcher.append(par);
        });
      break;
      case 'select':
        featureSwitcher.append('<select id="feature_select"></select>');
	jQuery('#feature_select').html("");
	jQuery('#feature_select').append('<option selected disabled style="display=none;">Wybierz obiekt</option>');
        featureArray.forEach(function(f) {    
          var option = jQuery('<option></option>');
          option.attr('data-fid', f.attributes.id);  
          option.html(f.attributes.name);  
          jQuery('#feature_select').append(option);
	  document.getElementById('feature_select').selectedIndex = -1;
        });
	var options = jQuery('#feature_select').find('option');
        var match = jQuery.grep(options, function(n) {
          return jQuery(n).attr('data-fid') == littleMap.state.selectedFeatures[0].attributes.id;
        });
        jQuery(match).prop("selected", "selected");

      break;
      case 'ulist'://deprecated
	    var list = jQuery('<ul></ul>');
	    var temp;
	    featureArray.forEach(function(f, ind) {
	      var evenOrOdd = ind % 2 === 0 ? 'even' : 'odd';
	      temp = jQuery('<li>'+ f.attributes.name +'</li>');
	      temp.attr('data-fid', f.attributes.id);
          temp.addClass(evenOrOdd);
	      list.append(temp);
	    });
	featureSwitcher.append(list);
	
    }


    /*
     * WARNING THIS is wrong
     * <select> does not have such events as click, etc.
     * workinkg only in FF
     * needs to be rewritten!
     */
    jQuery('*[data-cat]').on({ //TODO this needs tweaking
      mouseenter: "",
      mouseleave: "",
      click: this.helpers.changeCategory
    });

    jQuery('*[data-fid]').on({ //TODO this needs tweaking
      mouseenter: this.helpers.dataFidEnterHandler,
      mouseleave: this.helpers.dataFidLeaveHandler,
      click: this.helpers.dataFidClickHandler
    });
  }
}

/*******************************************************************************
 * featureSwitcher helpers
 */

littleMap.featureSwitcher.helpers = {
  dataFidEnterHandler: function() {
    var fid = jQuery(this).attr('data-fid');
    var feature = littleMap.helpers.getFromMapByFid(fid);
    littleMap.helpers.select.highlight(feature);
  },
  dataFidLeaveHandler: function() {
    var fid = jQuery(this).attr('data-fid');
    var feature = littleMap.helpers.getFromMapByFid(fid);

    if (feature.layer.selectedFeatures[0]) { 
              
      if (feature.fid !== feature.layer.selectedFeatures[0].fid) { 
        /*
         * checks if selected feature is the
         * same with selected
         * if yes it is unselected
         */  
        littleMap.helpers.select.unhighlight(feature);
      }
    } else {
      littleMap.helpers.select.unhighlight(feature);
    }
  },
  dataFidClickHandler: function() {
    var fid = jQuery(this).attr('data-fid');
    var selectedFeatures = littleMap.state.selectedFeatures;

    if (selectedFeatures[0]) {
      /*
       * If features are selected from featureSwitcher
       * it is necessary to unselect previously selected feature
       */
      littleMap.helpers.select.unselect(selectedFeatures[0]);
      selectedFeatures.pop();
    }

    var feature = littleMap.helpers.getFromMapByFid(fid);
    littleMap.helpers.select.select(feature);
  },
  highlightSelected: function() { //TODO
    if(littleMap.featureSwitcher.mode === "select") {
      //TODO
    }
  },
  changeCategory: function() { //TODO needs tweaking
    //duplication of code!!!
    var c = jQuery(this).attr('data-cat');
    jQuery('#feature_select').html("");
    jQuery('#feature_select').append('<option selected disabled style="display=none;">Wybierz obiekt</option>');
    var toSelect = littleMap.helpers.getFromMapByCategory(c);
    toSelect.forEach(function(f) {    
      var option = jQuery('<option></option>');
      option.attr('data-fid', f.attributes.id);  
      option.html(f.attributes.name);  
      jQuery('#feature_select').append(option);
    });
    document.getElementById('feature_select').selectedIndex = 0;
	
    jQuery('*[data-fid]').on({ //TODO this needs tweaking
      mouseenter: littleMap.featureSwitcher.helpers.dataFidEnterHandler,
      mouseleave: littleMap.featureSwitcher.helpers.dataFidLeaveHandler,
      click: littleMap.featureSwitcher.helpers.dataFidClickHandler
    });
  }
}

/*******************************************************************************
 * STYLE
 */

littleMap.style = new OpenLayers.StyleMap({
  //default property must be quoted because of IE8...
  'default': new OpenLayers.Style({
    pointRadius: 11,
    strokeOpacity: 1,
    strokeWidth: 2,
    cursor: 'pointer',
    graphicYOffset: -29
  }),
  select: new OpenLayers.Style({
    pointRadius: 16,
    graphicYOffset: -39,
    strokeOpacity: 0.5,
    strokeWidth: 8
  }),
  highlight: new OpenLayers.Style({
    pointRadius: 16,
    strokeOpacity: 0.8,
  })
});

littleMap.style.styles['default'].addRules([
  new OpenLayers.Rule({
    filter: new OpenLayers.Filter.Comparison({
      type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
      property: "fillOpacity",
      value: null
    }),
    symbolizer: {
      fillOpacity: '${fillOpacity}'
    }
  }),
  new OpenLayers.Rule({
    filter: new OpenLayers.Filter.Comparison({
      type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
      property: "marker",
      value: null
    }),
    symbolizer: {
      externalGraphic: 'map/img/${marker}'
    }
  }),
  new OpenLayers.Rule({
    filter: new OpenLayers.Filter.Comparison({
      type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
      property: "strokeColor",
      value: null
    }),
    symbolizer: {
      strokeColor: '${strokeColor}'
    }
  }),
  new OpenLayers.Rule({
    filter: new OpenLayers.Filter.Comparison({
      type: OpenLayers.Filter.Comparison.NOT_EQUAL_TO,
      property: "fillColor",
      value: null
    }),
    symbolizer: {
      fillColor: '${fillColor}'
    }
  }),
  new OpenLayers.Rule({
    elseFilter: true
  })
]);
      

/*******************************************************************************
 *                              INIT
 *
 * This is final initialization of the map.
 *
 * 1) If there is no config.json or it is invalid map would not
 *  render. There should be default coordinates for centering map. 
 *
 * 2) If featureToCenterAt is undefined map will render in default place
 *   from config.json
 *
 */

littleMap.init = function(featureToCenterAt) {
  var init = littleMap.initialize;
  var help = littleMap.helpers;
  
  littleMap.polyfills();
  init.config(function() {
    //TODO good but need changes var cat = littleMap.category;
    
    init.DOM.insert();
    OpenLayers.ImgPath = 'map/img/';
    init.DOM.manage.init();
    init.map();
    init.baseLayers();
    init.center(); //centering from config.json
    var objectsPath = 'map/objects/objects.json';
    init.layers.fetch(objectsPath, function() {
      /*
       *  Waiting for all layers is too long:
       *  -first map is centered in default point
       *  -loading asynchronously all layers
       *  -center on placemark if need
       */
	  
      help.getVectorLayers();
	  help.getAllCategories();
	  
      init.layerSwitcher();
      init.layers.addSelectControl();
      init.center(featureToCenterAt);
      var cat = littleMap.category
      if (cat) { //TODO test- it might slower loading
        var featuresWithCat = help.getFromMapByCategory(cat);
	//TODO feature switcher should render even if no category is given!!
        littleMap.featureSwitcher.init(featuresWithCat);
      }
    });
  });
}

})();
