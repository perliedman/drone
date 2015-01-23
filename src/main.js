var L = require('leaflet');
var Ease = require('./ease');
require('leaflet-fullscreen');
require('leaflet-control-geocoder');

var map = L.map('map', { zoomControl: false, attributionControl: false });
var geocoder = L.Control.Geocoder.nominatim();

function location(p, cb) {
    function tryGeocode(z) {
        geocoder.reverse(p, map.options.crs.scale(z), function(results) {
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

function setLocationInfo(name) {
    var el = L.DomUtil.get('location-info');
    el.classList.remove('fade-in-left');
    setTimeout(function() {
        el.innerText = name;
        el.classList.add('fade-in-left');
    }, 100);
}

function randomLocation(cb) {
    var p = L.latLng(Math.random() * 180 - 90, Math.random() * 360 - 180);
    location(p, function(err, result) {
        if (!err) {
            cb(undefined, {
                latLng: p,
                name: result.name
            });
        } else {
            randomLocation(cb);
        }
    });
}

randomLocation(function(err, loc) {
    var p = loc.latLng;
    var tc = Math.random() * Math.PI * 2;
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
            randomLocation(function(err, loc) {
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
        var q, dphi, lat, lon, dlon;
        var lat1 = p.lat / 180 * Math.PI;
        var lon1 = p.lng / 180 * Math.PI;
        var d = 2500 / 6371 * Math.PI / (3600*20);
        
        lat = lat1 + d * Math.cos(tc);
        if (Math.abs(lat) > Math.PI/2) {
            console.log('d too large. You can\'t go this far along this rhumb line!');
            newLocation();
            return;
        }

        if (Math.abs(lat-lat1) < 1e-6){
            q = Math.cos(lat1);
        } else {
            dphi = Math.log(Math.tan(lat/2+Math.PI/4)/Math.tan(lat1/2+Math.PI/4));
            q = (lat-lat1)/dphi;
        }
        
        dlon = -d*Math.sin(tc) / q;
        lon = (lon1 + dlon + Math.PI) % (2*Math.PI) - Math.PI;

        p = L.latLng(lat / Math.PI * 180, lon / Math.PI * 180);

        map.setView(p, map.getZoom(), {animate: false});
    }
    
    function updateLocationInfo() {
        location(p, function(err, result) {
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

    setInterval(updatePosition, 20);
    setInterval(updateLocationInfo, 60 * 1000);

    L.DomEvent.on(window, 'keyup', function(e) {
        if (e.keyCode === 78) {
            newLocation();
        }
    })
});
