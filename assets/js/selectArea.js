var targetAreaName = '';
var targets = [];
var modal;

$(document).ready(function(){
    console.log(appConfig);
    var areaMap = L.esri.webMap(appConfig.areaMapId, { map: L.map('area-map', { zoomControl: false }) });
    modal = $('#modal-select-area');
    areaMap.on('load', areaMapLoaded);

    function areaMapLoaded() {
        console.log(areaMap.layers[1].layer);
        areaMap._map.removeLayer(areaMap.layers[0].layer);

        for(key in areaMap.layers[1].layer._layers){
            if(areaMap.layers[1].layer._layers[key]._cache !== undefined) {
                var tokyo = areaMap.layers[1].layer._layers[key];
                console.log(tokyo);
                tokyo.on('click', function(e) {
                    console.log(e);
                    console.log(e.originalEvent.target);
                    var target = $(e.originalEvent.target);
                    var areas = $('div.modal-body > div > div > div > svg > g > path');
                    targets = [];
                    targets.push(target);
                    console.log(target);
                    console.log(areas);
                    areas.attr('class', 'leaflet-interactive');
                    target.attr('class', 'leaflet-interactive selected-area');
                    targetAreaName = e.layer.feature.properties['CSS_NAME'];
                    $('#target-area-name').text(targetAreaName);
                });
            }
        }
    }

    modal.on('shown.bs.modal', function () {
        console.log('modal shown');
    });
    modal.modal({ backdrop: false, show: true });
});