

define([
    'app/shading/constants',
    'app/utility/class',
    'app/utility/color'
],
function (constants, Class, Color) {

    return Class.extend({

        initialize: function (options) {
            this.color = new Color(options.color);
            this.radius = options.radius;
        },

        output: function () {
            return {
                position: this.node.position,
                type: constants.TYPE_RAW.POINT,
                color: this.color,
                radius: this.radius
            };
        },

        setNode: function (node) {
            this.node = node;
        }

    });

});