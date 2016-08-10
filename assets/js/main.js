var visibleHoikuen = [];
var webmap, capacityLayer, tokyo23Layer;

function getAreaName() {
    var initAreaName = '練馬区';
    var urlParams = location.search.substring(1).split('&');
    for(var i=0; urlParams[i]; i++) {
        var param = urlParams[i].split('=');
        if(param[0] === 'ku') {
            initAreaName = decodeURIComponent(param[1])
        }
    }
    return initAreaName;
}
function getAreaBounds(e) {
    //console.log(e.feature);
    if(e.feature.properties['CSS_NAME'] === visibleHoikuen[0]) {
        L.geoJson(e.feature, {
            onEachFeature: function(geojson, l) {
                webmap._map.fitBounds(l.getBounds());
            }
        });
    }
}

function initWebmap() {
    webmap = L.esri.webMap('fb531718fd8d46dca745625d16954f1b', { map: L.map('map') });
    webmap.on('load', webmapLoaded);
    webmap.on('metadataLoad', metadataLoaded);
}
function webmapLoaded() {
    initHomeControl();
    initGeocoder();
    initBasemapControl();
    initLayerControl();
    //getAreaBounds();
}
function metadataLoaded() {
    console.log(webmap.portalItem);
}

function initHomeControl() {
    var HomeControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'home-control');
            container.innerHTML = '<h5><a href="home.html">ホームへ戻る</a></h5>';
            return container;
        }
    });
    webmap._map.addControl(new HomeControl());
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
    providers: providers,
    placeholder: '住所/地名を入力'
  }).addTo(webmap._map);

  var results = L.layerGroup().addTo(webmap._map);

  searchControl.on('results', function(data){
    console.log(data.results);
    results.clearLayers();
    var resultIcon = L.vectorIcon({
        className: 'geocoder-result-icon',
        svgHeight: 14,
        svgWidth: 14,
        type: 'circle',
        shape: {
            r: '6',
            cx: '7',
            cy: '7'
        },
        style: {
            fill: 'rgba(255,102,0,0.8)',
            stroke: '#fff',
            strokeWidth: 0
        }
    });
    var result = L.marker(data.results[0].latlng, { icon: resultIcon }).bindPopup('<div class="leaflet-popup-content-title"><h4>' + data.results[0].text + '</h4></div>');
    results.addLayer(result);
    result.openPopup();
  });
}

function initBasemapControl() {
    var basemaps = {};
    basemaps[webmap.layers[0].title] = webmap.layers[0].layer;
    basemaps['地理院地図'] = L.tileLayer('http://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
        attribution: "<a href='http://maps.gsi.go.jp/development/ichiran.html' target='_blank'>地理院タイル</a>"
    });
    basemaps['Esri 地形図'] = L.esri.basemapLayer("Topographic");
    basemaps['Esri 衛星画像'] = L.esri.basemapLayer("Imagery");
    
    var basemapControl = L.control.layers(basemaps, {}, {
        position: 'topright'
    });
    basemapControl.addTo(webmap._map);
    basemapControl._layersLink.innerHTML = '<div>背景</div>';
}

function initLayerControl() {
    var overlayMaps = {};
    var overlayHoikuenMaps = {};
    webmap.layers.reverse().map(function(l, i) {
        console.log(l);
        if(i !== webmap.layers.length-1) {
            if(l.title.match(/区$/) !== null) {
                overlayHoikuenMaps[l.title] = l.layer;
                if(l.title === visibleHoikuen[0]) {
                    webmap._map.addLayer(l.layer);
                }
                l.layer.on('addfeature', setCapacitiesZIndex); // 必須ではないので描画パフォーマンスと相談
            }
            else {
                overlayMaps[l.title] = l.layer;
            }
            if(l.title === '保育園（定員）') {
                capacityLayer = l.layer;
            }
            if(l.title === '東京都（23区）') {
                tokyo23Layer = l.layer;
                for(key in tokyo23Layer._layers){
                    if(tokyo23Layer._layers[key]._cache !== undefined) {
                        tokyo23Layer._layers[key].on('createfeature', getAreaBounds);
                    }
                }
            }
        }
    });
    var layerControl = L.control.layers({}, overlayMaps, {
        position: 'topright',
        autoZIndex: false
    });
    var hoikuenLayerControl = L.control.layers({}, overlayHoikuenMaps, {
        position: 'topright',
        autoZIndex: false
    });
    hoikuenLayerControl.addTo(webmap._map);
    layerControl.addTo(webmap._map);
    console.log(layerControl);
    layerControl._layersLink.innerHTML = '<div>その他</div>';
    hoikuenLayerControl._layersLink.innerHTML = '<div>保育園</div>';
    webmap._map.on('overlayadd', addVisibleHoikuen);
    webmap._map.on('overlayremove', removeVisibleHoikuen);

    setWhereCapacityLayer();
    //setCapacitiesZIndex();
    //capacityLayer.addTo(webmap._map);
}

function setWhereCapacityLayer() {
    var where = arrayToWhere(visibleHoikuen);
    console.log(capacityLayer._layers);
    console.log(where);
    for(key in capacityLayer._layers){
        if(capacityLayer._layers[key]._cache !== undefined) {
            console.log(key);
            capacityLayer._layers[key].setWhere(where);
        }
    }
    setCapacitiesZIndex();
}
function arrayToWhere(arr) {
    var where = '';
    if(arr.length === 0) {
        where = '1=0';
    }
    else {
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
    }
    return where;
}

function addVisibleHoikuen(e) {
    console.log(e);
    if(e.name.match(/区$/) !== null) {
        visibleHoikuen.push(e.name);
        console.log(visibleHoikuen);
        setWhereCapacityLayer();
    }
    setCapacitiesZIndex(); // 必須ではないので描画パフォーマンスと相談
}
function removeVisibleHoikuen(e) {
    console.log(e);
    if(e.name.match(/区$/) !== null) {
        visibleHoikuen.map(function(v, i) {
            if(v === e.name) {
                visibleHoikuen.splice(i, 1);
            }
        });
        console.log(visibleHoikuen);
        setWhereCapacityLayer();
    }
}

function setCapacitiesZIndex() {
    setTimeout(function() {
        console.log('setZIndex!!!');
        for(key in capacityLayer._layers){
            if(capacityLayer._layers[key]._cache !== undefined) {
                capacityLayer._layers[key].eachFeature(function(l) {
                    //console.log(l);
                    l.setZIndexOffset(-99999);
                });
            }
        }
    }, 1000);
}

visibleHoikuen.push(getAreaName());
initWebmap();