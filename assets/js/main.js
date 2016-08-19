var visibleHoikuen = [];
var webmap, map, hoikuenLayer, capacityLayer, tokyo23Layer, basemapLayer, results;
var currentWhere;

$(document).ready(function(){
    $('#select-fin-btn').on('click', function () {
        if (targets.length > 0) {
            modal.modal('hide');
            getAreaBounds();
            setWhere();
        } else {
            $('#target-area-name').css('display', 'inline');
            $('#target-area-name').html('未選択です<i class="fa fa-hand-o-down" aria-hidden="true"></i>');
        }
    });

    // 選択した区の範囲を取得・ズーム
    function getAreaBounds() {
        var targetAreaLayer;
        for(key in tokyo23Layer._layers){
            if(tokyo23Layer._layers[key]._cache !== undefined) {
                targetAreaLayer = tokyo23Layer._layers[key];
                tokyo23Layer._layers[key].on('createfeature', getAreaBounds);
            }
        }
        console.log(targetAreaLayer);
        for(key in targetAreaLayer._layers){
            if(targetAreaLayer._layers[key].feature.properties['CSS_NAME'] === targetNames[0]) {
                L.geoJson(targetAreaLayer._layers[key].feature, {
                    onEachFeature: function(geojson, l) {
                        map.fitBounds(l.getBounds());
                    }
                });
            }
        }
    }

    // Web マップの初期化
    function initWebmap() {
        webmap = L.esri.webMap(appConfig.hoikuenMapId, { map: L.map('map', { zoomControl: false }) }); // A leaflet plugin to display ArcGIS Web Map: https://github.com/ynunokawa/L.esri.WebMap
        webmap.on('load', webmapLoaded);
        webmap.on('metadataLoad', metadataLoaded);
    }

    // Web マップ読み込み後に実行（各コントロールの初期化）
    function webmapLoaded() {
        map = webmap._map;
        basemapLayer = webmap.layers[0].layer;

        initZoomControl();
        initGeocoder();
        initLocate();
        initLayerControl();
        initList();
        initMapillary(); // **Beta**
        attachSearch();

        $(window).resize(function() {
            attachSearch();
        });
    }

    // Web マップ メタデータ読み込み後に実行
    function metadataLoaded() {
        console.log(webmap.portalItem);
    }

    // Attach search control for desktop or mobile
    function attachSearch() {
        var parentName = $(".geocoder-control").parent().attr("id"),
            geocoder = $(".geocoder-control"),
            width = $(window).width();
        if (width <= 767 && parentName !== "geocodeMobile") {
            geocoder.detach();
            $("#geocodeMobile").append(geocoder);
        } else if (width > 767 && parentName !== "geocode"){
            geocoder.detach();
            $("#geocode").append(geocoder);
        }
    }

    function initZoomControl() {
        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);
    }

    function initList() {
        var hoikuenLayerURL = 'http://services3.arcgis.com/iH4Iz7CEdh5xTJYb/arcgis/rest/services/保育園23区/FeatureServer/0';
        map.on('moveend', function (e) {
            console.log(e);
            var symbolNinka = ' <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="14" width="14" style="margin-bottom: -3px; margin-top: 0px; margin-left: 0px;"><g><circle cx="7" cy="7" r="5" stroke="#fff" stroke-width="3" fill="rgb(237,81,81)"></circle></g></svg>';
            var symbolNinshoA = ' <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="14" width="14" style="margin-bottom: -3px; margin-top: 0px; margin-left: 0px;"><g><circle cx="7" cy="7" r="5" stroke="#fff" stroke-width="3" fill="rgb(20,158,206)"></circle></g></svg>';
            var symbolNinshoB = ' <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="14" width="14" style="margin-bottom: -3px; margin-top: 0px; margin-left: 0px;"><g><circle cx="7" cy="7" r="5" stroke="#fff" stroke-width="3" fill="rgb(167,198,54)"></circle></g></svg>';
            var countQuery = L.esri.query({
                url: hoikuenLayerURL
            });
            countQuery.within(map.getBounds());

            countQuery.where("種別=N'認可保育所' AND " + currentWhere);
            countQuery.count(function(error, count, response){
                console.log('認可保育所:', count);
                $('#ninka-num').text(count);
            });
            countQuery.where("種別=N'認証保育所（A型）' AND " + currentWhere);
            countQuery.count(function(error, count, response){
                console.log('認証保育所（A型）:', count);
                $('#ninshoA-num').text(count);
            });
            countQuery.where("種別=N'認証保育所（B型）' AND " + currentWhere);
            countQuery.count(function(error, count, response){
                console.log('認証保育所（B型）:', count);
                $('#ninshoB-num').text(count);
            });

            if (map.getZoom() > 14) {
                var query = L.esri.query({
                    url: hoikuenLayerURL
                });
                query.within(map.getBounds());
                query.where(currentWhere);
                query.orderBy('定員', 'DESC');
                query.run(function(error, featureCollection, response){
                    $('#ninka-list').html('');
                    $('#ninshoA-list').html('');
                    $('#ninshoB-list').html('');
                    console.log(featureCollection);
                    featureCollection.features.map(function (f, i) {
                        var item;
                        if (f.properties['種別'] === '認可保育所') {
                            item = $('<a href="#" class="list-group-item">' + f.properties['施設名'] + symbolNinka + '<span class="badge teiin">' + f.properties['定員'] + '</span>' + '</a>');
                            $('#ninka-list').append(item);
                        } else if (f.properties['種別'] === '認証保育所（A型）') {
                            item = $('<a href="#" class="list-group-item">' + f.properties['施設名'] + symbolNinshoA + '<span class="badge teiin">' + f.properties['定員'] + '</span>' + '</a>');
                            $('#ninshoA-list').append(item);
                        } else if (f.properties['種別'] === '認証保育所（B型）') {
                            item = $('<a href="#" class="list-group-item">' + f.properties['施設名'] + symbolNinshoB + '<span class="badge teiin">' + f.properties['定員'] + '</span>' + '</a>');
                            $('#ninshoB-list').append(item);
                        }
                        item.on('click', function () {
                            map.setView(f.geometry.coordinates.reverse(), 18);
                        });
                    });
                });
            }
            else {
                $('#ninka-list').html('');
                $('#ninshoA-list').html('');
                $('#ninshoB-list').html('');
            }
        });
    }

    function initLocate() {
      L.control.locate({
          position: 'bottomright',
          drawMarker: false,
          drawCircle: false
      }).addTo(map);
      map.on('locationfound', function (e) {
        results.clearLayers();
        var resultIcon = L.icon({
            iconUrl: 'assets/css/images/baby.png', // http://icooon-mono.com/license
            iconRetinaUrl: 'assets/css/images/baby.png',
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            //popupAnchor: [-3, -76],
        });
        var result = L.marker(e.latlng, { icon: resultIcon });
        results.addLayer(result);
        //var radius = e.accuracy / 2;
        //L.circle(e.latlng, radius).addTo(map);
      });
    }

    // 住所検索コントロールの初期化
    function initGeocoder() {
    var providers = [];
    var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider(); // ArcGIS 住所検索サービス
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

    // 住所検索コントロール
    var searchControl = L.esri.Geocoding.geosearch({
        position: 'bottomleft',
        providers: providers,
        placeholder: '住所/地名を入力'
    }).addTo(map);

    results = L.layerGroup().addTo(map);

    // 結果取得イベントリスナ―
    searchControl.on('results', function(data){
        console.log(data.results);
        results.clearLayers();
        var resultIcon = L.icon({
            iconUrl: 'assets/css/images/baby.png', // http://icooon-mono.com/license
            iconRetinaUrl: 'assets/css/images/baby.png',
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            popupAnchor: [0, -12],
        });
        // 検索結果のハイライト・ポップアップ表示
        var result = L.marker(data.results[0].latlng, { icon: resultIcon }).bindPopup('<div class="leaflet-popup-content-title"><h4>' + data.results[0].text + '</h4></div>');
        results.addLayer(result);
        result.openPopup();
    });
    }

    // 保育園レイヤー コントロールの初期化
    function initLayerControl() {
        var overlayMaps = {};
        var overlayHoikuenMaps = {};
        webmap.layers.reverse().map(function(l, i) {
            console.log(l);
            if(i !== webmap.layers.length-1) {
                if(l.title === '保育園') {
                    hoikuenLayer = l.layer;
                }
                if(l.title === '保育園（定員）') {
                    capacityLayer = l.layer;
                }
                if(l.title === '東京都（23区）') {
                    tokyo23Layer = l.layer;

                    /*for(key in tokyo23Layer._layers){
                        if(tokyo23Layer._layers[key]._cache !== undefined) {
                            tokyo23Layer._layers[key].on('createfeature', getAreaBounds);
                        }
                    }*/
                }
            }
        });

        //setWhere();
    }

    // 保育園レイヤー＋保育園（定員）レイヤーの属性フィルタリング
    function setWhere() {
        currentWhere = arrayToWhere(targetNames);
        console.log(capacityLayer._layers);
        console.log(currentWhere);
        for(key in capacityLayer._layers){
            if(capacityLayer._layers[key]._cache !== undefined) {
                console.log(key);
                // 保育園（定員）レイヤーのフィルタリング
                capacityLayer._layers[key].setWhere(currentWhere);
            }
        }
        for(key in hoikuenLayer._layers){
            if(hoikuenLayer._layers[key]._cache !== undefined) {
                console.log(key);
                hoikuenLayer._layers[key].on('createfeature', function (f) {
                    // ポップアップ表示時はツールチップ非表示
                    f.target._layers[String(f.feature.id)].on('click', function () {
                        $('[data-toggle="tooltip"]').tooltip('hide');
                    });

                    // 各フィーチャの SVG Path にラベル ツールチップ適用
                    setTimeout(function () {
                        var path = $(f.target._layers[String(f.feature.id)]._path);
                        path.attr({
                            'data-toggle': 'tooltip',
                            'data-placement': 'top'
                        });
                        path.tooltip({ title: f.feature.properties['施設名'], container: 'body' });
                    }, 100);
                });
                // 保育園レイヤーのフィルタリング
                hoikuenLayer._layers[key].setWhere(currentWhere);
            }
        }
    }

    // 保育園（定員）レイヤーの属性フィルタリング用 WHERE 句の生成
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

    // **Beta**
    function initMapillary() {
        var mapillaryMarker;
        var mly = new Mapillary.Viewer('mapillary-view',
                appConfig.mapillaryAppId,
                appConfig.mapillaryPhotoKey);

        mly.on('nodechanged', function (node) {
            var latLon = [node.latLon.lat, node.latLon.lon];
            results.clearLayers();
            map.setView(latLon);

            var mapillaryIcon = L.icon({
                iconUrl: 'assets/css/images/baby.png', // http://icooon-mono.com/license
                iconRetinaUrl: 'assets/css/images/baby.png',
                iconSize: [48, 48],
                iconAnchor: [24, 24],
                //popupAnchor: [-3, -76],
            });
            mapillaryMarker = L.marker(latLon, { icon: mapillaryIcon }).addTo(map);
            results.addLayer(mapillaryMarker);
        });
    }

    initWebmap();
});
