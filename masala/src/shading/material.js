

define([
    'scaffolding/class'
], function (Class) {

    return Class.extend({

        attributeTypes: {
            'emissive': 'color',
            'ambient': 'color',
            'diffuse': 'color',
            'specular': 'color'
        },

        render: function (context) {
            var program = context._currentProgram,
                emissive = this.get('emissive'),
                ambient = this.get('ambient'),
                diffuse = this.get('diffuse'),
                specular = this.get('specular');

            context.uniform1f('materialShininess', this.get('shininess'));
            context.uniform3f('materialEmissiveK', emissive.r,
                emissive.g, emissive.b);
            context.uniform3f('materialAmbientK', ambient.r,
                ambient.g, ambient.b);
            context.uniform3f('materialDiffuseK', diffuse.g,
                diffuse.g, diffuse.b);
            context.uniform3f('materialSpecularK', specular.r,
                specular.g, specular.b);
        }

    });

});