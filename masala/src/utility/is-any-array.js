
define([], function () {

    return function (obj) {
        return Object.prototype.toString.call(obj).indexOf('Array') !== -1;
    };

});