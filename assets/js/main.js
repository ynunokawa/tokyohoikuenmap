var visibleHoikuen = [];
var webmap, map, capacityLayer, tokyo23Layer, basemapLayer;

$(document).ready(function(){
    $('#select-fin-btn').on('click', function () {

        // URL パラメーターから選択した区名の取得
        /*function getAreaName() {
            var initAreaName = appConfig.defaultAreaName;
            var urlParams = location.search.substring(1).split('&');
            for(var i=0; urlParams[i]; i++) {
                var param = urlParams[i].split('=');
                if(param[0] === 'ku') {
                    initAreaName = decodeURIComponent(param[1])
                }
            }
            return initAreaName;
        }*/

        // 選択した区の範囲を取得・ズーム
        function getAreaBounds(e) {
            //console.log(e.feature);
            if(e.feature.properties['CSS_NAME'] === visibleHoikuen[0]) {
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
            attachSearch();

            $(window).resize(function() {
                attachSearch();
            });

            map.on('overlayadd', addVisibleHoikuen);
            map.on('overlayremove', removeVisibleHoikuen);
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
                    if(l.title.match(/区$/) !== null) {
                        overlayHoikuenMaps[l.title] = l.layer;
                        if(l.title === visibleHoikuen[0]) {
                            map.addLayer(l.layer);
                        }
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
            // 23区別保育園レイヤー コントロール
            /*var hoikuenLayerControl = L.control.layers({}, overlayHoikuenMaps, {
                position: 'topright',
                autoZIndex: false
            });
            hoikuenLayerControl.addTo(webmap._map);
            hoikuenLayerControl._layersLink.innerHTML = '<div>保育園</div>';*/

            setWhereCapacityLayer();
        }

        // 保育園（定員）レイヤーの属性フィルタリング
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

        // レイヤーの表示イベントリスナ―
        function addVisibleHoikuen(e) {
            console.log(e);
            // 保育園レイヤー判定
            if(e.name.match(/区$/) !== null) {
                visibleHoikuen.push(e.name);
                console.log(visibleHoikuen);
                setWhereCapacityLayer();
            }
        }

        // レイヤーの非表示イベントリスナ―
        function removeVisibleHoikuen(e) {
            console.log(e);
            // 保育園レイヤー判定
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

        visibleHoikuen.push(targetAreaName);
        initWebmap();

    });
});