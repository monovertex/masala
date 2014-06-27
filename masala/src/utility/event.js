
define([], function () {

    return function (source, eventName, data) {
        this.name = eventName;
        this.data = data;
        this.source = source;
    };

});