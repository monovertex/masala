
define([], function () {

    return function() {

        var lastTime = 0,
            vendors = ['webkit', 'moz'];

        _.each(vendors, function (vendor) {
            if (_.isUndefined(root.requestAnimationFrame)) {
                root.requestAnimationFrame =
                    root[vendor + 'RequestAnimationFrame'];

                root.cancelAnimationFrame =
                    root[vendor + 'CancelAnimationFrame'] ||
                    root[vendors + 'CancelRequestAnimationFrame'];
            }
        });

        if (_.isUndefined(root.requestAnimationFrame)) {
            root.requestAnimationFrame = function(callback, element) {
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

        if (_.isUndefined(root.cancelAnimationFrame)) {
            root.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }
    };

});