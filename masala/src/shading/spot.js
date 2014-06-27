

define([
    'shading/constants',
    'shading/point'
], function (constants, Point) {

    return Point.extend({

        defaults: {
            direction: { x: 0, y: -1, z: 0 }
        },

        attributeTypes: {
            'direction': 'vec3'
        },

        output: function () {
            return _.extend({
                type: constants.TYPE_RAW.SPOT,
                angleInner: this.get('angleInner'),
                angleOuter: this.get('angleOuter'),
                direction: this.get('direction')
            }, Point.prototype.output.apply(this, arguments));
        }

    });

});