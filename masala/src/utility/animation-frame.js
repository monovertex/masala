
define([], function () {

    var lastTime = 0,
        vendors = ['webkit', 'moz'],
        requestAnimationFrame = root.requestAnimationFrame,
        cancelAnimationFrame = root.cancelAnimationFrame;

    _.each(vendors, function (vendor) {
        if (_.isUndefined(requestAnimationFrame)) {
            requestAnimationFrame = root[vendor + 'RequestAnimationFrame'];

            cancelAnimationFrame = root[vendor + 'CancelAnimationFrame'];
        }
    });

    if (_.isUndefined(requestAnimationFrame)) {
        requestAnimationFrame = function(callback, element) {
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

    if (_.isUndefined(cancelAnimationFrame)) {
        cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    return {
        request: requestAnimationFrame.bind(root),
        cancel: cancelAnimationFrame.bind(root)
    };

});