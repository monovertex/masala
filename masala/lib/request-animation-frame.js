
define(['underscore'], function (_) {

    return function() {

        var lastTime = 0,
            vendors = ['webkit', 'moz'];

        _.forEach(vendors, function (vendor) {
            if (_.isUndefined(window.requestAnimationFrame)) {
                window.requestAnimationFrame =
                    window[vendor + 'RequestAnimationFrame'];

                window.cancelAnimationFrame =
                    window[vendor + 'CancelAnimationFrame'] ||
                    window[vendors + 'CancelRequestAnimationFrame'];
            } else {
                return false;
            }
        });

        if (_.isUndefined(window.requestAnimationFrame)) {
            window.requestAnimationFrame = function(callback, element) {
                var currentTime = new Date().getTime(),
                    timeToCall = Math.max(0, 16 - (currentTime - lastTime)),
                    id;

                id = setTimeout(function () {
                    callback(currTime + timeToCall);
                }, timeToCall);

                lastTime = currentTime + timeToCall;

                return id;
            };
        }

        if (_.isUndefined(window.cancelAnimationFrame)) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    };

});