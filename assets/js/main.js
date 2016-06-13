var visibleHoikuen = ['練馬区'];
var capacityLayer;

var webmap = L.esri.webMap('fb531718fd8d46dca745625d16954f1b', { map: L.map('map') });
webmap.on('load', webmapLoaded);
webmap.on('metadataLoad', metadataLoaded);

function webmapLoaded() {
    initBasemapControl();
    initLayerControl();
}
function metadataLoaded() {
    console.log(webmap.portalItem);
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