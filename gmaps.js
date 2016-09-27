
// This application requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

//Initialize both the base map and the overlay
var map = null;
var oldmap = null;

//First load the map in the browser
function loadMap(){
	//Initialize with a location
    var alicante = new google.maps.LatLng(38.345628,-0.480759);
    var myOptions = {
        zoom: 17,
        center: alicante,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    //Create the map and add it to the html view
    map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
 	
 	 //Setup the different input for autocomplete and search of places and addresses
 	 var input = /** @type {!HTMLInputElement} */(document.getElementById('pac-input'));

    var types = document.getElementById('type-selector');
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    var infowindow = new google.maps.InfoWindow();
    var marker = new google.maps.Marker({
          map: map,
          anchorPoint: new google.maps.Point(0, -29)
        });

    autocomplete.addListener('place_changed', function() {
          infowindow.close();
          marker.setVisible(false);
          var place = autocomplete.getPlace();
          if (!place.geometry) {
            window.alert("Autocomplete's returned place contains no geometry");
            return;
          }

          // If the place has a geometry, then present it on a map.
          if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
          } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);  // Why 17? Because it looks good.
          }
          marker.setIcon(/** @type {google.maps.Icon} */({
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(35, 35)
          }));
          marker.setPosition(place.geometry.location);
          marker.setVisible(true);

          var address = '';
          if (place.address_components) {
            address = [
              (place.address_components[0] && place.address_components[0].short_name || ''),
              (place.address_components[1] && place.address_components[1].short_name || ''),
              (place.address_components[2] && place.address_components[2].short_name || '')
            ].join(' ');
          }

          infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
          infowindow.open(map, marker);
    });

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
    function setupClickListener(id, types) {
    		var radioButton = document.getElementById(id);
    		radioButton.addEventListener('click', function() {
      	autocomplete.setTypes(types);
    		});
  	 }

  	 setupClickListener('changetype-all', []);
    setupClickListener('changetype-address', ['address']);
    setupClickListener('changetype-establishment', ['establishment']);
    setupClickListener('changetype-geocode', ['geocode']);
      
	 //Refresh the catastro map when the map has moved
  	 google.maps.event.addListener(map, 'dragend',
        function(){
            overlay()
        })
 	 //Refresh also when there is a change of scale
    google.maps.event.addListener(map, 'zoom_changed',
        function(){
            overlay()
        })
    //We will do this only the first time the map is loaded
    google.maps.event.addListenerOnce(map, 'tilesloaded',
        function(){
            overlay()
        }) 
}
 
//This function places the catastro image over the google maps
function overlay(){
	 //The size of the map to retrieve will be limited by the current view
	try{
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
 
    if(oldmap != null){
        oldmap.setMap(null);  //'Despinta' la imagen anterior para que no se solapen mucho
        oldmap = null;
    }
    //Draw the overlay using the catastro map
    oldmap = new google.maps.GroundOverlay('https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?SERVICE=WMS&SRS=EPSG:4326&REQUEST=GETMAP&bbox='+sw.lng()+','+sw.lat()+','+ne.lng()+','+ne.lat()+'&width=800&height=480&format=PNG&transparent=Yes&layers=parcela'    , map.getBounds());
    oldmap.setMap(map);
    //Add a listener to collect the right click event and send the data to the iframe.
    //While  catastro doesn't update to allow CORS this is the most suitable form of presenting the data
    google.maps.event.addListener(oldmap, 'dblclick', 
		function(event) {
		var xMin = event.latLng.lat();
    		var yMin = event.latLng.lng();
    		var xMax = xMin + 0.001;
    		var yMax = yMin + 0.001;
	    
		var url='https://ovc.catastro.meh.es/Cartografia/INSPIRE/spadgcwms.aspx?service=wms&request=getfeatureinfo&srs=epsg:4326&width=50&height=50&FORMAT=image/png&query_Layers=BU.BUILDING&query_Layers=CP.CADASTRALPARCEL&bbox=' + xMin + ',' + yMin + ',' + xMax + ',' + yMax + '&i=25&j=25'					
		var x = document.getElementById('catastro')
    		x.setAttribute("src", url);

		})
	}
	catch(err){
		alert(err.message);
	}
};

