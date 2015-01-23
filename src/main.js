var L = require('leaflet');
var Ease = require('./ease');
var rhumbline = require('./rhumbline');
var Locations = require('./locations');
var updateInterval = 50;
var paused = false;

require('leaflet-fullscreen');
require('leaflet-hash');

var map;

function main(loc) {
    var p = loc.latLng;
    var tc = Math.random() * Math.PI * 2;

    function setLocationInfo(name) {
        var el = L.DomUtil.get('location-info');
        el.classList.remove('fade-in-left');
        setTimeout(function() {
            el.innerText = name;
            el.classList.add('fade-in-left');
        }, 100);
    }

    map.setView(p, 8);
    setLocationInfo(loc.name);

    (function() {
        var startCourse;
        var courseChange;
        var tstart;
        var tend;

        function waitForTurn() {
            setTimeout(newTurn, Math.random() * 3 * 60 * 1000);
        }

        function newTurn() {
            courseChange = Math.random() * Math.PI / 2 - Math.PI / 4;
            startCourse = tc;
            tstart = new Date().getTime();
            tend = tstart + Math.abs(courseChange) / Math.PI * 2 * 60 * 1000;
            setTimeout(turn, 20);
        }

        function turn() {
            var t = new Date().getTime();
            var p = Math.max(1, (t - tstart) / (tend - tstart));
            tc = Ease.easeInOutCubic(p) * courseChange + startCourse;
            if (p < 1) {
                setTimeout(turn, 20);
            } else {
                waitForTurn();
            }
        }

        return waitForTurn;
    })()();

    var newLocation = (function() {
        var sceneChangeTimer;

        return function () {
            Locations.randomLocation(map.options.crs.scale, function(err, loc) {
                if (!err) {
                    if (sceneChangeTimer) {
                        clearTimeout(sceneChangeTimer);
                    }

                    sceneChangeTimer = setTimeout(newLocation, 5 * 60 * 1000);

                    p = loc.latLng;
                    setLocationInfo(loc.name);
                }
            });
        };
    })();

    function updatePosition() {
        if (paused) return;

        try {
            p = rhumbline(p, 2500 / 6371 * Math.PI / (3600 * (1000 / updateInterval)), tc);
            map.setView(p, undefined, { animate: false });
        } catch (e) {
            newLocation();
        }
    }
    
    function updateLocationInfo() {
        Locations.location(p, map.options.crs.scale, function(err, result) {
            if (!err) {
                setLocationInfo(result.name);
            } else {
                newLocation();
            }
        });
    }

    L.tileLayer('http://api.tiles.mapbox.com/v3/liedman.l1561h3i/{z}/{x}/{y}.png').addTo(map);

    if (!map.isFullscreen()) {
        map.toggleFullscreen();
    }

    setInterval(updatePosition, updateInterval);
    setInterval(updateLocationInfo, 60 * 1000);

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
            paused = !paused;
            break;
        }
    });
}

map = L.map('map', { zoomControl: false, attributionControl: false });
var hash = L.hash(map);
hash.stopListening();
hash.update();
setInterval(function() { hash.onMapMove(); }, 2000);

if (map.getCenter()) {
    Locations.location(map.getCenter(), map.options.crs.scale, function(err, result) {
        if (!err) {
            main({
                latLng: map.getCenter(),
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
