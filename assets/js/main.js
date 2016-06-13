var visibleHoikuen = ['練馬区'];
var capacityLayer;

var webmap = L.esri.webMap('fb531718fd8d46dca745625d16954f1b', { map: L.map('map') });
webmap.on('load', webmapLoaded);
webmap.on('metadataLoad', metadataLoaded);

function webmapLoaded() {
    initGeocoder();
    initBasemapControl();
    initLayerControl();
}
function metadataLoaded() {
    console.log(webmap.portalItem);
}

function initGeocoder() {
  var providers = [];
  var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
  /*var hoikuen = L.esri.Geocoding.featureLayerProvider({
    url: 'http://services3.arcgis.com/iH4Iz7CEdh5xTJYb/arcgis/rest/services/CITY/FeatureServer/0',
    searchFields: ['施設名'],
    label: '保育園',
    formatSuggestion: function(feature){
      return feature.properties['施設名'];
    }
  });*/ // it dose not work.. N prefix is required into where clause?
  providers.push(arcgisOnline);
  //providers.push(hoikuen);

  var searchControl = L.esri.Geocoding.geosearch({
    providers: providers
  }).addTo(webmap._map);

  var results = L.layerGroup().addTo(webmap._map);

  searchControl.on('results', function(data){
    console.log(data.results);
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
      results.addLayer(L.marker(data.results[i].latlng));
    }
  });
}

function initBasemapControl() {
    var basemaps = {};
    basemaps[webmap.layers[0].title] = webmap.layers[0].layer;
    basemaps['地理院地図'] = L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
    });

    L.control.layers(basemaps, {}, {
        position: 'topright'
    }).addTo(webmap._map);
}

function initLayerControl() {
    var overlayMaps = {};
    webmap.layers.reverse().map(function(l, i) {
        console.log(l);
        if(i !== webmap.layers.length-1) {
            if(l.title.match(/区$/) !== null) {
                overlayMaps[l.title] = l.layer;
            }
            if(l.title === '保育園（定員）') {
                capacityLayer = l.layer;
            }
        }
    });
    var layerControl = L.control.layers({}, overlayMaps, {
        position: 'topright'
    });
    layerControl.addTo(webmap._map);
    console.log(layerControl);
    webmap._map.on('overlayadd', addVisibleHoikuen);
    webmap._map.on('overlayremove', removeVisibleHoikuen);

    setWhereCapacityLayer();
    capacityLayer.addTo(webmap._map);
}

function setWhereCapacityLayer() {
    var where = arrayToWhere(visibleHoikuen);
    console.log(capacityLayer._layers);
    console.log(where);
    for(key in capacityLayer._layers){
        if(capacityLayer._layers[key]._cache !== undefined) {
            capacityLayer._layers[key].setWhere(where, function(response) {
                console.log(response);
            }, function(error) { console.log(error); });
        }
    }
}
function arrayToWhere(arr) {
    var where = '';
    arr.map(function(a, i) {
        if(arr.length === 1) {
            where += "市区_1=N'" + a + "'";
        }
        else {
            if(arr.length === i+1) {
                where += "(市区_1=N'" + a + "')";
            }
            else {
                where += "(市区_1=N'" + a + "') OR ";
            }
        }
    });
    return where;
}

function addVisibleHoikuen(e) {
    console.log(e);
    visibleHoikuen.push(e.name);
    console.log(visibleHoikuen);
    setWhereCapacityLayer();
}
function removeVisibleHoikuen(e) {
    console.log(e);
    visibleHoikuen.map(function(v, i) {
        if(v === e.name) {
            visibleHoikuen.splice(i, 1);
        }
    });
    console.log(visibleHoikuen);
    setWhereCapacityLayer();
}
