

define([
    'shading/constants',
    'shading/point'
], function (constants, Point) {

    return Point.extend({

        initialize: function (options) {
            Point.prototype.initialize.apply(this, arguments);

            this.angleInner = options.angleInner;
            this.angleOuter = options.angleOuter;

            if (_.isUndefined(options.direction)) {
                this.direction = glm.vec3.fromValues(0, -1, 0);
            } else {
                this.direction = glm.vec3.fromValues(options.direction. x || 0,
                    options.direction.y || -1, options.direction.z || 0);
            }
        },

        output: function () {
            return _.extend({
                type: constants.TYPE_RAW.SPOT,
                angleInner: this.angleInner,
                angleOuter: this.angleOuter,
                direction: this.direction
            }, Point.prototype.output.apply(this, arguments));
        }

    });

});