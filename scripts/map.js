// Simple Google Maps marker loader using data/markers.json
// Add your Google Maps API key to the variable below or include the Maps script in the site head.
var GMAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // <-- replace with real key

function loadScript(src, cb){
  var s = document.createElement('script'); s.src = src; s.async = true; s.defer = true;
  s.onload = cb; document.head.appendChild(s);
}

function initMap(){
  var mapEl = document.getElementById('map');
  if(!mapEl) return;
  var center = {lat: 42.6979, lng: 23.3217};
  var map = new google.maps.Map(mapEl, {center:center,zoom:12});

  fetch('/data/markers.json').then(r=>r.json()).then(data=>{
    var markers = [];
    Object.keys(data).forEach(cat=>{
      data[cat].forEach(item=>{
        var m = new google.maps.Marker({position:{lat:item.lat,lng:item.lng},map:map,title:item.name});
        m.category = cat;
        var infow = new google.maps.InfoWindow({content: `<strong>${item.name}</strong><div>${item.address||''}</div>`});
        m.addListener('click', ()=>infow.open(map,m));
        markers.push(m);
      });
    });

    // controls
    document.querySelectorAll('#map-controls input[type=checkbox]').forEach(cb=>{
      cb.addEventListener('change', function(){
        var cat = this.dataset.cat;
        markers.forEach(m => {
          if(m.category === cat){
            m.setMap(this.checked ? map : null);
          }
        });
      });
    });
  });
}

// Auto-load Maps script if API key provided
if(typeof window !== 'undefined'){
  if(GMAPS_API_KEY && GMAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY'){
    loadScript(`https://maps.googleapis.com/maps/api/js?key=${GMAPS_API_KEY}&callback=initMap`);
  }else{
    // try to init if maps already included
    window.initMap = initMap;
  }
}
