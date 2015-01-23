var L = require('leaflet');

module.exports = function(latLng /* L.LatLng */, d /* Number (meters) */, tc /* Number (radians) */) {
    var q, dphi, lat, lon, dlon;
    var lat1 = latLng.lat / 180 * Math.PI;
    var lon1 = latLng.lng / 180 * Math.PI;
    
    lat = lat1 + d * Math.cos(tc);
    if (Math.abs(lat) > Math.PI/2) {
        throw 'd too large. You can\'t go this far along this rhumb line!';
    }

    if (Math.abs(lat-lat1) < 1e-6){
        q = Math.cos(lat1);
    } else {
        dphi = Math.log(Math.tan(lat/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
        q = (lat-lat1)/dphi;
    }
    
    dlon = -d*Math.sin(tc) / q;
    lon = (lon1 + dlon + Math.PI) % (2*Math.PI) - Math.PI;

    return L.latLng(lat / Math.PI * 180, lon / Math.PI * 180);
};
