var L = require('leaflet');
var Locations = require('./locations');
var Drone = require('./drone');

require('leaflet-fullscreen');
require('leaflet-hash');

var map;

function main(loc) {
    var newLocation = (function() {
        var sceneChangeTimer;

        return function () {
            L.DomUtil.get('new-location').classList.remove('fade-out');
            L.DomUtil.get('new-location').classList.remove('hidden');
            Locations.randomLocation(map.options.crs.scale, function(err, loc) {
                if (!err) {
                    L.DomUtil.get('new-location').classList.add('fade-out');

                    if (sceneChangeTimer) {
                        clearTimeout(sceneChangeTimer);
                    }

                    sceneChangeTimer = setTimeout(newLocation, 5 * 60 * 1000);

                    drone.pos = loc.latLng;
                    setLocationInfo(loc.name);
                }
            });
        };
    })();
    var drone,
        locationInfoTimer;

    function setLocationInfo(name) {
        var el = L.DomUtil.get('location-info');
        el.classList.remove('fade-in-left');
        setTimeout(function() {
            el.innerText = name;
            el.classList.add('fade-in-left');
        }, 100);

        clearTimeout(locationInfoTimer);
        locationInfoTimer = setTimeout(updateLocationInfo, 60 * 1000);
    }

    function updateLocationInfo() {
        Locations.location(drone.pos, map.options.crs.scale, function(err, result) {
            if (!err) {
                setLocationInfo(result.name);
            } else {
                newLocation();
            }
        });
    }

    drone = new Drone(loc.latLng, Math.random() * Math.PI * 2);
    drone.on('move', function(e) {
        map.setView(e.position, undefined, { animate: false });
    });
    drone.on('moveerror', function() {
        newLocation();
    });

    map.setView(drone.pos, 8);
    setLocationInfo(loc.name);

    if (!map.isFullscreen()) {
        map.toggleFullscreen();
    }

    L.DomEvent.on(window, 'keypress', function(e) {
        var c = String.fromCharCode(e.charCode).toLowerCase();
        switch (c) {
        case '+':
            map.zoomIn();
            break;
        case '-':
            map.zoomOut();
            break;
        case 'n':
            newLocation();
            break;
        case 'p':
            drone.togglePause();
            break;
        }
    });
}

map = L.map('map', { zoomControl: false, attributionControl: false });
L.tileLayer('http://api.tiles.mapbox.com/v3/liedman.l1561h3i/{z}/{x}/{y}.png').addTo(map);
var hash = L.hash(map);
hash.stopListening();
hash.update();
setInterval(function() { hash.onMapMove(); }, 2000);

var center;

try {
    center = map.getCenter();
} catch (e) {}

if (center) {
    Locations.location(center, map.options.crs.scale, function(err, result) {
        if (!err) {
            main({
                latLng: center,
                name: result.name
            });
        }
    });
} else {
    Locations.randomLocation(map.options.crs.scale, function(err, loc) {
        if (!err) {
            main(loc);
        } else {
            console.log('FATAL: couldn\'t get random location: ' + err);
        }
    });
}
