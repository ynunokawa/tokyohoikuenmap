$(document).ready(function(){
    // Basemap changed
    $("#selectStandardBasemap").on("change", function(e) {
        setBasemap($(this).val());
    });
    // Search
    var input = $(".geocoder-control-input");
    input.focus(function(){
        $("#panelSearch .panel-body").css("height", "150px");
    });
    input.blur(function(){
        $("#panelSearch .panel-body").css("height", "auto");
    });

    function setBasemap(basemap) {
      if (basemapLayer) {
        map.removeLayer(basemapLayer);
      }
      if (basemap === 'OpenStreetMap') {
        basemapLayer = L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
      }
      else {
        basemapLayer = L.esri.basemapLayer(basemap);
      }
      map.addLayer(basemapLayer);
      if (layerLabels) {
        map.removeLayer(layerLabels);
      }
      if (basemap === 'ShadedRelief' || basemap === 'Oceans' || basemap === 'Gray' || basemap === 'DarkGray' || basemap === 'Imagery' || basemap === 'Terrain') {
        layerLabels = L.esri.basemapLayer(basemap + 'Labels');
        map.addLayer(layerLabels);
      }
        
      // add world transportation service to Imagery basemap
      if (basemap === 'Imagery') {
        worldTransportation.addTo(map);            
      } else if (map.hasLayer(worldTransportation)) {
        // remove world transportation if Imagery basemap is not selected    
        map.removeLayer(worldTransportation);
      }
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
    $(window).resize(function() {
        attachSearch();
    });
    attachSearch();
});