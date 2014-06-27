

define([
    'shading/constants',
    'scaffolding/class',
    'utility/color'
], function (constants, Class, Color) {

    return Class.extend({

        attributeTypes: {
            'color': 'color'
        },

        output: function () {
            return {
                position: this.get('node').get('position'),
                type: constants.TYPE_RAW.POINT,
                color: this.get('color'),
                radius: this.get('radius')
            };
        }

    });

});