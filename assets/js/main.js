var visibleHoikuen = [];
var webmap, map, hoikuenLayer, capacityLayer, tokyo23Layer, basemapLayer;

$(document).ready(function(){
    $('#select-fin-btn').on('click', function () {
        if (targets.length > 0) {
            modal.modal('hide');
            initWebmap();
        } else {
            $('#target-area-name').css('display', 'inline');
            $('#target-area-name').html('未選択です<i class="fa fa-hand-o-down" aria-hidden="true"></i>');
        }

        // 選択した区の範囲を取得・ズーム
        function getAreaBounds(e) {
            //console.log(e.feature);
            if(e.feature.properties['CSS_NAME'] === targetNames[0]) {
                L.geoJson(e.feature, {
                    onEachFeature: function(geojson, l) {
                        map.fitBounds(l.getBounds());
                    }
                });
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
            initLayerControl();
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

        var results = L.layerGroup().addTo(map);

        // 結果取得イベントリスナ―
        searchControl.on('results', function(data){
            console.log(data.results);
            results.clearLayers();
            var resultIcon = L.icon({
                iconUrl: 'assets/css/images/baby.png', // http://icooon-mono.com/license
                iconRetinaUrl: 'assets/css/images/baby.png',
                iconSize: [48, 48],
                iconAnchor: [24, 24],
                //popupAnchor: [-3, -76],
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

                        for(key in tokyo23Layer._layers){
                            if(tokyo23Layer._layers[key]._cache !== undefined) {
                                tokyo23Layer._layers[key].on('createfeature', getAreaBounds);
                            }
                        }
                    }
                }
            });

            setWhere();
        }

        // 保育園レイヤー＋保育園（定員）レイヤーの属性フィルタリング
        function setWhere() {
            var where = arrayToWhere(targetNames);
            console.log(capacityLayer._layers);
            console.log(where);
            for(key in capacityLayer._layers){
                if(capacityLayer._layers[key]._cache !== undefined) {
                    console.log(key);
                    // 保育園（定員）レイヤーのフィルタリング
                    capacityLayer._layers[key].setWhere(where);
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
                    hoikuenLayer._layers[key].setWhere(where);
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
                map.setView(latLon);

                if (!mapillaryMarker) {
                    var mapillaryIcon = L.icon({
                        iconUrl: 'assets/css/images/baby.png', // http://icooon-mono.com/license
                        iconRetinaUrl: 'assets/css/images/baby.png',
                        iconSize: [48, 48],
                        iconAnchor: [24, 24],
                        //popupAnchor: [-3, -76],
                    });
                    mapillaryMarker = L.marker(latLon, { icon: mapillaryIcon }).addTo(map);
                } else {
                    mapillaryMarker.setLatLng(latLon);
                }
            });
        };

    });
});