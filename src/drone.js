var L = require('leaflet'),
    Ease = require('./ease'),
    rhumbline = require('./rhumbline');

module.exports = L.Class.extend({
    includes: L.Mixin.Events,

    options: {
        updateInterval: 50,
        speed: 2500
    },

    initialize: function(startPos, startCourse, options) {
        L.setOptions(this, options);

        this.pos = startPos;
        this.course = startCourse;
        this._setupNextTurn(new Date().getTime());
        this._startTimers();
    },

    pause: function() {
        this._paused = true;
        this._stopTimers();
    },

    unpause: function() {
        this._paused = false;
        this._lastT = new Date().getTime();
        this._startTimers();
    },

    togglePause: function() {
        if (this._paused) {
            this.unpause();
        } else {
            this.pause();
        }
    },

    updatePosition: function() {
        var t = new Date().getTime(),
            dt = this._lastT ? t - this._lastT : undefined;

        this._lastT = t;

        if (this._paused || !dt) return;

        this._turn(t, dt);
        this._move(dt);

    },

    _startTimers: function() {
        this._updateTimer = setInterval(L.bind(this.updatePosition, this), this.options.updateInterval);
    },

    _stopTimers: function() {
        clearInterval(this._updateTimer);
    },

    _turn: function(t, dt) {
        var p;

        this._timeToTurn -= dt;

        if (this._timeToTurn <= 0) {
            this._turnTimer -= dt;
            p = Math.min(1, (-this._turnStart + t) / this._turnTime);
            this.course = Ease.easeInOutCubic(p) * this._courseChange + this._startCourse;

            if (this._turnTimer <= 0) {
                this._setupNextTurn(t);
            }
        }
    },

    _move: function(dt) {
        try {
            this.pos = rhumbline(this.pos, 2500 / 6371 * Math.PI / (3600 * (1000 / dt)), this.course);
            this.fire('move', {position: this.pos});
        } catch (e) {
            this.fire('moveerror');
        }
    },

    _setupNextTurn: function(t) {
        this._timeToTurn = Math.random() * 3 * 60 * 1000;
        this._turnStart = t + this._timeToTurn;
        this._courseChange = Math.random() * Math.PI / 2 - Math.PI / 4;
        this._turnTimer = this._turnTime = Math.abs(this._courseChange) / Math.PI * 2 * 60 * 1000;
        this._startCourse = this.course;
    }
});
