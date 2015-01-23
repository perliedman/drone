var L = require('leaflet');

require('leaflet-control-geocoder');

var geocoder = L.Control.Geocoder.nominatim();

function location(p, scaleFn, cb) {
    function tryGeocode(z) {
        geocoder.reverse(p, scaleFn(z), function(results) {
            if (results && results.length > 0) {
                cb(undefined, results[0]);
            } else if (z > 0) {
                tryGeocode(z - 1);
            } else {
                cb('Location not found :(');
            }
        });
    }

    tryGeocode(5);
}

function randomLocation(scaleFn, cb) {
    var p = L.latLng(Math.random() * 180 - 90, Math.random() * 360 - 180);
    location(p, scaleFn, function(err, result) {
        if (!err) {
            cb(undefined, {
                latLng: p,
                name: result.name
            });
        } else {
            randomLocation(scaleFn, cb);
        }
    });
}

module.exports = {
    location: location,
    randomLocation: randomLocation
};
