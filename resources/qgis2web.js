isTracking = false;
geolocateControl = function(opt_options) {
    var options = opt_options || {};
    var button = document.createElement('button');
    button.className += ' fa fa-map-marker';
    var handleGeolocate = function() {
        if (isTracking) {
            map.removeLayer(geolocateOverlay);
            isTracking = false;
      } else if (geolocation.getTracking()) {
            map.addLayer(geolocateOverlay);
            map.getView().setCenter(geolocation.getPosition());
			//map.getView().setZoom(19);
            isTracking = true;
      }
    };
    button.addEventListener('click', handleGeolocate, false);
    button.addEventListener('touchstart', handleGeolocate, false);
    var element = document.createElement('div');
    element.className = 'geolocate ol-unselectable ol-control';
    element.appendChild(button);
    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};
ol.inherits(geolocateControl, ol.control.Control);

var measuring = false;
measureControl = function(opt_options) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<img src="resources/measure-control.png" />';

  var this_ = this;
  var handleMeasure = function(e) {
    if (!measuring) {
        this_.getMap().addInteraction(draw);
        createHelpTooltip();
        createMeasureTooltip();
        measuring = true;
    } else {
        this_.getMap().removeInteraction(draw);
        measuring = false;
        this_.getMap().removeOverlay(helpTooltip);
        this_.getMap().removeOverlay(measureTooltip);
    }
  };

  button.addEventListener('click', handleMeasure, false);
  button.addEventListener('touchstart', handleMeasure, false);

  var element = document.createElement('div');
  element.className = 'measure-control ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(measureControl, ol.control.Control);
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container
});

var expandedAttribution = new ol.control.Attribution({
    collapsible: false
});






//var extent = [122671.52920962148, 3916790.02113798, 1598392.565858857, 5228813.525576125];
var extent = [139774.25645555626, 3749427.6188027603, 1581289.8386129222, 5396175.927911345];
var map = new ol.Map({
    controls: ol.control.defaults({attribution:false}).extend([
        expandedAttribution,new measureControl(),new geolocateControl()
    ]),
	
    target: document.getElementById('map'),
    renderer: 'canvas',
    overlays: [overlayPopup],
    layers: layersList,
    view: new ol.View({
		projection: 'EPSG:25832',
         maxZoom: 28, minZoom: 4,
		// extent: extent,
		// center: ol.extent.getCenter(extent),
		center: ol.proj.transform([11.72872,40.76913], 'EPSG:4326', projUTM32),
		zoom: 7,
		
		
    })
});

map.getView().fit(extent, map.getSize());

var layerSwitcher = new ol.control.LayerSwitcher({tipLabel: "Layers"});
map.addControl(layerSwitcher);

//map.getView().fit([1314160.0, 5094608.4, 1314760.0, 5095608.4], map.getSize());

var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}


var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = false;
var doHover = false;

var highlight;
var onPointerMove = function(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var popupText = '';
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var count = 1;
    var clusteredFeatures;
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        // We only care about features from layers in the layersList, ignore
        // any other layers which the map might contain such as the vector
        // layer used by the measure tool
        if (layersList.indexOf(layer) === -1) {
            return;
        }
        var doPopup = false;
        if (count == 1) {
            for (k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] != "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            currentLayer = layer;
            clusteredFeatures = feature.get("features");
            var clusterFeature;
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    popupText = '<ul>';
                    for(var n=0; n<clusteredFeatures.length; n++) {
                        clusterFeature = clusteredFeatures[n];
                        currentFeatureKeys = clusterFeature.getKeys();
                        popupText = popupText + '<li><table>'
                        for (var i=0; i<currentFeatureKeys.length; i++) {
                            if (currentFeatureKeys[i] != 'geometry') {
                                popupField = '';
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                                } else {
                                    popupField += '<td colspan="2">';
                                }
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                    popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                                }
                                if (layer.get('fieldImages')[currentFeatureKeys[i]] != "Photo") {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? Autolinker.link(String(clusterFeature.get(currentFeatureKeys[i]))) + '</td>' : '');
                                } else {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                                }
                                popupText = popupText + '<tr>' + popupField + '</tr>';
                            }
                        } 
                        popupText = popupText + '</table></li>';    
                    }
                    popupText = popupText + '</ul>';
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText = '<table>';
                    for (var i=0; i<currentFeatureKeys.length; i++) {
                        if (currentFeatureKeys[i] != 'geometry') {
                            popupField = '';
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                            } else {
                                popupField += '<td colspan="2">';
                            }
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                            }
                            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "Photo") {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? Autolinker.link(String(currentFeature.get(currentFeatureKeys[i]))) + '</td>' : '');
                            } else {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                            }
                            popupText = popupText + '<tr>' + popupField + '</tr>';
                        }
                    }
                    popupText = popupText + '</table>';
                }
            }
        }
        count++;
    });

    if (doHighlight) {
        if (currentFeature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (currentFeature) {
                var styleDefinition = currentLayer.getStyle().toString();

                if (currentFeature.getGeometry().getType() == 'Point') {
                    var radius = styleDefinition.split('radius')[1].split(' ')[1];

                    highlightStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: "#ffff00"
                            }),
                            radius: radius
                        })
                    })
                } else if (currentFeature.getGeometry().getType() == 'LineString') {

                    var featureWidth = styleDefinition.split('width')[1].split(' ')[1].replace('})','');

                    highlightStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffff00',
                            lineDash: null,
                            width: featureWidth
                        })
                    });

                } else {
                    highlightStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: '#ffff00'
                        })
                    })
                }
                featureOverlay.getSource().addFeature(currentFeature);
                featureOverlay.setStyle(highlightStyle);
            }
            highlight = currentFeature;
        }
    }

    if (doHover) {
        if (popupText) {
            overlayPopup.setPosition(coord);
            content.innerHTML = popupText;
            container.style.display = 'block';        
        } else {
            container.style.display = 'none';
            closer.blur();
        }
    }
};

var onSingleClick = function(evt) {
    if (doHover) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var popupText = '';
    var currentFeature;
    var currentFeatureKeys;
    var count = 1;
    var clusteredFeatures;
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (feature instanceof ol.Feature) {
            var doPopup = false;
            if (count == 1) {
                for (k in layer.get('fieldImages')) {
                    if (layer.get('fieldImages')[k] != "Hidden") {
                        doPopup = true;
                    }
                }
                currentFeature = feature;
                clusteredFeatures = feature.get("features");
                var clusterFeature;
                if (typeof clusteredFeatures !== "undefined") {
                    if (doPopup) {
                        popupText = '<ul>';
                        for(var n=0; n<clusteredFeatures.length; n++) {
                            clusterFeature = clusteredFeatures[n];
                            currentFeatureKeys = clusterFeature.getKeys();
                            popupText = popupText + '<li><table>'
                            for (var i=0; i<currentFeatureKeys.length; i++) {
                                if (currentFeatureKeys[i] != 'geometry') {
                                    popupField = '';
                                    if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                    popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                                    } else {
                                        popupField += '<td colspan="2">';
                                    }
                                    if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                        popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                                    }
                                    if (layer.get('fieldImages')[currentFeatureKeys[i]] != "Photo") {
                                        popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? Autolinker.link(String(clusterFeature.get(currentFeatureKeys[i]))) + '</td>' : '');
                                    } else {
                                        popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                                    }
                                    popupText = popupText + '<tr>' + popupField + '</tr>';
                                }
                            } 
                            popupText = popupText + '</table></li>';    
                        }
                        popupText = popupText + '</ul>';
                    }
                } else {
                    currentFeatureKeys = currentFeature.getKeys();
                    if (doPopup) {
                        popupText = '<table>';
                        for (var i=0; i<currentFeatureKeys.length; i++) {
                            if (currentFeatureKeys[i] != 'geometry') {
                                popupField = '';
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                    popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                                } else {
                                    popupField += '<td colspan="2">';
                                }
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                    popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                                }
                                if (layer.get('fieldImages')[currentFeatureKeys[i]] != "Photo") {
                                    popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? Autolinker.link(String(currentFeature.get(currentFeatureKeys[i]))) + '</td>' : '');
                                } else {
                                    popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                                }
                                popupText = popupText + '<tr>' + popupField + '</tr>';
                            }
                        }
                        popupText = popupText + '</table>';
                    }
                }
            }
            count++;
        }
    });

    var viewProjection = map.getView().getProjection();
    var viewResolution = map.getView().getResolution();
    for (i = 0; i < wms_layers.length; i++) {
        if (wms_layers[i][1]) {
            var url = wms_layers[i][0].getSource().getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, viewProjection,
                {
                    'INFO_FORMAT': 'text/html',
                    
                });
            if (url) {
 				//TODO Abilitare richiesta cross-domain
				/*$.ajax({
					url: url,
					type: "GET",
					dataType: "html",
					success: function (data) {
					var result = $('<div />').append(data);
					//valorzza il popup text con l'html di risposta
					//TODO parsing della response
					popupText = result;
					},
					error: function (xhr, status) {
					alert("Sorry, there was a problem!");
				},
				complete: function (xhr, status) {
				
				
					//$('#showresults').slideDown('slow')
				}
				  //var result = parser.readFeatures(response);
				  //if (result.length) {
					//var info = [];
					//for (var i = 0, ii = result.length; i < ii; ++i) {
					  //info.push(result[i].get('formal_en'));
					//}
					//container.innerHTML = info.join(', ');
				  //} else {
					//container.innerHTML = '&nbsp;';
				  //}
				});
				*/
				
				
                popupText = popupText + '<a href="' + url + '" target="info">Dettagli</a>';
            }
        }
    }

    if (popupText) {
        overlayPopup.setPosition(coord);
        content.innerHTML = popupText;
        container.style.display = 'block';        
    } else {
        container.style.display = 'none';
        closer.blur();
    }
};


    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        if (measuring) {
            /** @type {string} */
            var helpMsg = 'Click to start drawing';
            if (sketch) {
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
        }
    });
    

map.on('pointermove', function(evt) {
    onPointerMove(evt);
});
map.on('singleclick', function(evt) {
    onSingleClick(evt);
});

/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var sketch;


/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click to continue drawing the line';






var source = new ol.source.Vector();

var measureLayer = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 3
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});

map.addLayer(measureLayer);

var draw; // global so we can remove it later
function addInteraction() {
  var type = 'LineString';
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (type),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });

  var listener;
  draw.on('drawstart',
      function(evt) {
        // set sketch
        sketch = evt.feature;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
          var geom = evt.target;
          var output;
            output = formatLength( /** @type {ol.geom.LineString} */ (geom));
            tooltipCoord = geom.getLastCoordinate();
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

  draw.on('drawend',
      function(evt) {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip();
        ol.Observable.unByKey(listener);
      }, this);
}


/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'tooltip hidden';
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'tooltip tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  map.addOverlay(measureTooltip);
}


var wgs84Sphere = new ol.Sphere(6378137);

/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function(line) {
  var length;
  var coordinates = line.getCoordinates();
  length = 0;
  var sourceProj = map.getView().getProjection();
  for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
      var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
      length += wgs84Sphere.haversineDistance(c1, c2);
    }
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};

addInteraction();


      var geolocation = new ol.Geolocation({
  projection: map.getView().getProjection()
});


var accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
      new ol.geom.Point(coordinates) : null);
});

var geolocateOverlay = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [accuracyFeature, positionFeature]
  })
});

geolocation.setTracking(true);


var geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  lang: 'it-IT',
  placeholder: 'Cerca indirizzo...',
  limit: 5,
  keepOpen: true
});
geocoder.element.firstElementChild.childNodes.item('button').className='fa fa-info';
map.addControl(geocoder);

geocoder.on('addresschosen', function(evt){
	console.info(evt);
	  var feature = evt.feature,
      coord = evt.coordinate,
      address = evt.address;
	
	map.getView().setCenter(coord);
	map.getView().setZoom(18);
	
});

  var cat_provider = TecnoBitSearch({
    url: './layers/geocoding.php'
  });

var cat_geocoder = new Geocoder('nominatim', {
      // Specify the custom provider instance as the "provider" value
  provider: cat_provider,
  autoComplete: true,
  autoCompleteMinLength: 9,
  lang: 'it-IT',
  placeholder: 'Comune_foglio.mappale (CCCC_FFFFAA[.MMM])...',
  limit: 10,
  //targetType: 'text-input',
  keepOpen: true,
  preventDefault: true
});
cat_geocoder.container.id = 'gcd-cat-container';
cat_geocoder.container.className = 'ol-geocoder gcd-gl-container gcd-cat-container'; 
map.addControl(cat_geocoder);

/* cat_geocoder.on('addresschosen', function(evt){
	console.info(evt);
	  var feature = evt.feature,
      coord = evt.coordinate,
      
	
	map.getView().setCenter(coord);
	map.getView().setZoom(18);
	
}); */

cat_geocoder.on('addresschosen', function(evt){
	console.info(evt);
	
    if (evt.bbox) {
	 //feature.bbox.transform(projUTM32,'EPSG:4326')
      map.getView().fit(evt.bbox, { duration: 500 });
    } else {
	  var feature = evt.feature;
      map.getView().animate({ zoom: 19, center: evt.coordinate });
	  lyr_Vestizioni_4.setVisible(true);
    }
  });


function TecnoBitSearch(options){
	
	var url = options.url;
    return {
      /**
       * Get the url, query string parameters and optional JSONP callback
       * name to be used to perform a search.
       * @param {object} options Options object with query, key, lang,
       * countrycodes and limit properties.
       * @return {object} Parameters for search request
       */
      getParameters: function (opt) {
        return {
          url: url,
          callbackName: 'callback',
          params: {
            q: opt.query
          }
        };
      },
      /**
       * Given the results of performing a search return an array of results
       * @param {object} data returned following a search request
       * @return {Array} Array of search results
       */
      handleResponse: function (results) {
        // The API returns a JSON single point
         if (results && results.features && results.features.length) {
          return results.features.map(function (feature) {
            return {
              lon: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1],
              address: {
                // Simply return a name in this case, could also return road,
                // building, house_number, city, town, village, state,
                // country
                name: feature.properties.search_full
              },
              bbox: feature.bbox
            };
          });
        } else {
          return;
        }
      }
    };
	
}




var attribution = document.getElementsByClassName('ol-attribution')[0];
var attributionList = attribution.getElementsByTagName('ul')[0];
var firstLayerAttribution = attributionList.getElementsByTagName('li')[0];
var qgis2webAttribution = document.createElement('li');
qgis2webAttribution.innerHTML = '<a href="https://github.com/tomchadwin/qgis2web">qgis2web</a>';
attributionList.insertBefore(qgis2webAttribution, firstLayerAttribution);

//inserimento sfondo da parte dell'utente
//Aggiunta Amedeo Fadini


var cambiasfondo = function(){
	//rimuove il layer di sfondo se presente
	map.removeLayer(lyr_sfondo_0)
	url_sfondo_0 = $('#sfondolink').val();
	layername_sfondo_0 = $('#sfondolayer').val();
	tipolayer = $('#tipolink').val();
	//seleziona i parametri in base ai valori del form per lo sfondo utente
	switch (tipolayer) {
		case 'osm':
			lyr_sfondo_0 = lyr_OpenStreetMap_1;
			break;
		case 'igm':
			var url_sfondo_0 = $('#sfondolink').val();
			var layername_sfondo_0 = $('#sfondolayer').val();
			srs_selected = $('#srs_link').val();
			prj_sfondo_0 = window[srs_selected];
			creasfondoWMS(url_sfondo_0,lyr_sfondo_0,prj_sfondo_0);
			break;
		case 'bingmap_aer':
			lyr_sfondo_0 = lyr_BingMapsAerial_1;
			break;
	}
	//aggiunge il layer alla mappa al livello più basso
	map.getLayers().insertAt(0, lyr_sfondo_0);
	lyr_sfondo_0.setVisible(true);
};

//Aggiorna i campi del form per lo sfondo utente
var aggiornacampi = function(val){
	switch (val){
		case 'igm':
			$('#parametri_wms').toggle(true);
			$('#sfondolink').val("http://wms.pcn.minambiente.it/ogc?map%3D/ms_ogc/WMS_v1.3/raster/IGM_25000.map");
			$('#sfondolayer').val('CB.IGM25000.32')
			$('[name=srs]').val( 'projUTM32_84' );
			break;
				
		case 'wms':
			$('#parametri_wms').toggle(true);
			$('#sfondolink').val('');
			$('#sfondolayer').val('')
			$('[name=srs]').val( 'proj4326' );
			break;
			
		default:
			$('#parametri_wms').toggle(false);
			$('[name=srs]').val( '' );
	}
	
}


/**
 * OpenLayers 3 Cookbook - Chapter 4
 * Implementing a work in progress indicator for map layers
 * with OpenLayers 3 (ol3)
 *
 * Peter J Langley
 * http://pjlangley.com
 * http://www.codechewing.com
 */
var rasterSource = lyr_Particelle_2;
var progressBar = document.getElementById('js-progress-bar');
var tilesLoaded = 0;
var tilesPending = 0;

rasterSource.on('tileloadend', function() {
  ++tilesLoaded;

  var percentage = Math.round(tilesLoaded / tilesPending * 100);
  progressBar.style.width = percentage + '%';

  if (percentage >= 100) {
    setTimeout(function() {
      progressBar.parentNode.style.opacity = 0;
      progressBar.style.width = 0;
      tilesLoaded = 0;
      tilesPending = 0;
    }, 600);
  }
});

rasterSource.on('tileloadstart', function() {
  progressBar.parentNode.style.opacity = 1;
  ++tilesPending;
});

      rasterSource.on('imageloadend', function() {
		console.log('image loaedd');
      });

//zoom a tutta itali
