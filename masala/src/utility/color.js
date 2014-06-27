

define(function () {

    return function () {
        if (arguments.length === 3) {
            this.r = arguments[0] || 0;
            this.g = arguments[1] || 0;
            this.b = arguments[2] || 0;
        } else if (_.isPlainObject(arguments[0])) {
            this.r = arguments[0].r || 0;
            this.g = arguments[0].g || 0;
            this.b = arguments[0].b || 0;
        }

        this.flatten = function () {
            return [this.r, this.g, this.b];
        };
    };

});