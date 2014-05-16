

define(['app/utility/class'], function (Class) {

    return Class.extend({
        initialize: function() {
            if (arguments.length == 1) {
                this.r = arguments[0].r || 0;
                this.g = arguments[0].g || 0;
                this.b = arguments[0].b || 0;
            } else {
                this.r = arguments[0] || 0;
                this.g = arguments[1] || 0;
                this.b = arguments[2] || 0;
            }
        },

        flat: function () {
            return [this.r, this.g, this.b];
        }
    });

});