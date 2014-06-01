

define([], function () {

    var factories = [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
            function () { return new ActiveXObject('Msxml3.XMLHTTP'); },
            function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
        ],
        create = function () {
            var obj = void 0;

            _.each(factories, function (factory) {
                if (_.isUndefined(obj)) {
                    try {
                        obj = factory();
                    } catch (e) { }
                }
            });

            return obj;
        };

    return function (url, callback) {
        var request = create();

        if (_.isUndefined(request)) {
            throw('AJAX request could not be instiantiated.');
        }

        request.open('GET', url, true);

        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;

            if (request.status !== 200 && request.status !== 304) {
                console.error('Error loading file: ' + url);
                return;
            }

            callback(request.responseText, request);
        };

        if (request.readyState == 4) return;
        request.send();
    };

});