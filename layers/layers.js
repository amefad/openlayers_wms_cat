 //definizione proiezioni
 var projUTM32 = 'EPSG:25832';
        proj4.defs(projUTM32, '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
 var projUTM32_84 = 'EPSG:32632';
        proj4.defs(projUTM32_84, '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs');
 var proj3857 = 'EPSG:3857';
        proj4.defs(proj3857, '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs');
 var proj3003 = 'EPSG:3003';
        proj4.defs(proj3003, '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs');
 var proj4326 = 'EPSG:4326';
        proj4.defs(proj3003, '+proj=longlat +datum=WGS84 +no_defs');
		
 var projExtent = ol.proj.get('EPSG:3857').getExtent();
 var startResolution = ol.extent.getWidth(projExtent) / 256;
 var resolutions = new Array(22);
 for (var i = 0, ii = resolutions.length; i < ii; ++i) {
	resolutions[i] = startResolution / Math.pow(2, i);
 }
		
var tileGrid = new ol.tilegrid.TileGrid({
        extent: projExtent,
        resolutions: resolutions,
        tileSize: [1024, 1024]
      });		

var visualizza_catasto = function(val){
	lyr_Particelle_2.setOpacity(val);
	lyr_Fabbricati_3.setOpacity(val);
	lyr_Vestizioni_4.setOpacity(val);
	
};
	  
var wms_layers = [];
var url_sfondo_0 = "http://wms.pcn.minambiente.it/ogc?map%3D/ms_ogc/WMS_v1.3/raster/IGM_25000.map";
var layername_sfondo_0 = "CB.IGM25000.32";
var lyr_sfondo_0 = null;
creasfondoWMS = function(src,lay,pro){

			lyr_sfondo_0 = new ol.layer.Tile({
                             source: new ol.source.TileWMS(({
                              url: src,
                              attributions: [new ol.Attribution({html: ''})],
							  projection: pro,		
                              params: {
                                "LAYERS": lay,
                                "TILED": "true",
                                "VERSION": "1.3.0"},
							  tileGrid: tileGrid,	
                            })),
                            title: "WMS Utente",
                            opacity: 1.000000,
                            
                            
                          });
              //wms_layers.push([lyr_sfondo_0, 0]);
				};
creasfondoWMS(url_sfondo_0,layername_sfondo_0,projUTM32_84);
			 var tileserverOSM = "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png";
			  var lyr_OpenStreetMap_1 = new ol.layer.Tile({
                            source: new ol.source.OSM(({
                              url: tileserverOSM,
    attributions: [new ol.Attribution({html: '<a href="http://www.openstreetmap.org" target="_blank">&copy Openstreetmap Contributors</a>'})],
							  projection: proj3857,	
                            })),
                            title: "OpenStreetMap",
                            opacity: 1.000000,
                            
                            
                          });
              wms_layers.push([lyr_OpenStreetMap_1, 0]);

			 var tileserverNE = "./layers/natural_earth/{z}/{x}/{y}.png";
			  var lyr_NaturalEarth_1 = new ol.layer.Tile({
                            source: new ol.source.XYZ	(({
                              url: tileserverNE,
    attributions: [new ol.Attribution({html: '<a href="http://www.naturalearth.org" target="_blank">&copy Natural Earth</a>'})],
							  projection: proj3857,	
							  maxZoom: 7,
                            })),
                            title: "Natural Earth",
                            opacity: 1.000000,
							//maxResolution: 2.5,
                            minResolution: 600	
                          });
              wms_layers.push([tileserverNE, 0]);

/*******************************
Layer sfondo BING Maps
********************************/			  
 var lyr_BingMapsAerial_1 =new ol.layer.Tile();
 
 function load_bingmaplayer(){
	 lyr_BingMapsAerial_1.setSource(new ol.source.BingMaps({
				key: bmk,
				imagerySet: 'Aerial',
				maxZoom: 19
				}));  
	 }			  
			  
			  
/*******************************
Inizio layer WMS Catasto
********************************/			  

			  var lyr_Particelle_2 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php",
							attributions: [new ol.Attribution({html: '<a href="http://www.agenziaentrate.gov.it/wps/content/Nsilib/Nsi/Schede/FabbricatiTerreni/Consultazione+cartografia+catastale/InfoGen+Consultazione+cartografia/?page=schedefabbricatieterreni" target="_blank">Agenzia Entrate</a>'})],
							  projection: projUTM32,	
                              params: {
                                "LAYERS": "CP.CadastralParcel",
                                "TILED": "false",
                                "VERSION": "1.3.0"},
                                tilegrid: tileGrid,	
                            })),
                            title: "Particelle",
                            opacity: 0.700000,
                            maxResolution: 2.5,
                            minResolution: 0

                          });
              wms_layers.push([lyr_Particelle_2, 1]);

              var lyr_Fabbricati_3 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php",
    attributions: [new ol.Attribution({html: '<a href=""></a>'})],
							  projection: projUTM32,
                              params: {
                                "LAYERS": "fabbricati",
                                "TILED": "true",
                                "VERSION": "1.3.0"},
                                tileGrid: tileGrid,
                            })),
                            title: "Fabbricati",
                            opacity: 0.900000,
                            maxResolution: 2.5,
                            minResolution: 0,
                            
                          });
              wms_layers.push([lyr_Fabbricati_3, 0]);
			  var lyr_Vestizioni_4 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php",
    attributions: [new ol.Attribution({html: '<a href=""></a>'})],
							 projection: projUTM32,
                              params: {
                                "LAYERS": "vestizioni",
                                "TILED": "true",
                                "VERSION": "1.3.0"},
								tileGrid: tileGrid,
                            })),
                            title: "Vestizioni",
                            opacity: 1.000000,
                            maxResolution: 2.5,
                            minResolution: 0,
                            
                          });
              wms_layers.push([lyr_Vestizioni_4, 0]);
			  
			  var lyr_Mappe_5 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php",
    attributions: [new ol.Attribution({html: '<a href=""></a>'})],
							  projection: projUTM32,
                              params: {
                                "LAYERS": "CP.CadastralZoning",
                                "TILED": "true",
                                "VERSION": "1.3.0"},
							tileGrid: tileGrid,
                            })),
                            title: "Mappe",
                            opacity: 1.000000,
                            maxResolution: 15,
                            minResolution: 1,
                          });
              wms_layers.push([lyr_Mappe_5, 0]);
		
		var lyr_Province_6 = new ol.layer.Tile({
                            source: new ol.source.TileWMS(({
                              url: "https://wms.cartografia.agenziaentrate.gov.it/inspire/wms/ows01.php",
    attributions: [new ol.Attribution({html: '<a href=""></a>'})],
							  projection: projUTM32,
                              params: {
                                "LAYERS": "province",
                                "TILED": "true",
                                "VERSION": "1.3.0"},
							tileGrid: tileGrid,
                            })),
                            title: "Province",
                            opacity: 1.000000,
                            maxResolution: 100000,
                            minResolution: 8,
                          });
              wms_layers.push([lyr_Province_6, 0]);
		


lyr_sfondo_0 = lyr_NaturalEarth_1;
lyr_sfondo_0.setVisible(true);
lyr_Particelle_2.setVisible(true);
lyr_Fabbricati_3.setVisible(true);
lyr_Vestizioni_4.setVisible(false);
lyr_Mappe_5.setVisible(true);
lyr_Province_6.setVisible(true);

//var layersList = [lyr_sfondo_0,lyr_Particelle_2,lyr_Fabbricati_3,lyr_Vestizioni_4,lyr_Mappe_5];
var layersList = [lyr_sfondo_0,lyr_Particelle_2,lyr_Fabbricati_3,lyr_Vestizioni_4,lyr_Mappe_5, lyr_Province_6];
/*lyr_Confine_comunale_6.set('fieldAliases', {'AREA': 'AREA', 'PERIMETER': 'PERIMETER', 'CODISTAT': 'CODISTAT', 'NOMCOM': 'NOMCOM', 'PROVINCIA': 'PROVINCIA', 'ID1': 'ID1', });
lyr_Confine_comunale_6.set('fieldImages', {'AREA': 'TextEdit', 'PERIMETER': 'TextEdit', 'CODISTAT': 'TextEdit', 'NOMCOM': 'TextEdit', 'PROVINCIA': 'TextEdit', 'ID1': 'TextEdit', });
lyr_Confine_comunale_6.set('fieldLabels', {'AREA': 'no label', 'PERIMETER': 'no label', 'CODISTAT': 'no label', 'NOMCOM': 'no label', 'PROVINCIA': 'no label', 'ID1': 'no label', });
lyr_Confine_comunale_6.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});*/
