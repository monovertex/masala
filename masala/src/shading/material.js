

define([
    'utility/class',
    'utility/color'
], function (Class, Color) {

    return Class.extend({

        initialize: function (options) {
            this.shininess = options.shininess;

            _.each(
                ['emissive', 'ambient', 'diffuse', 'specular'],
                function (component) {
                    this[component] = new Color(options[component]);
                },
                this
            );
        },

        render: function (context) {
            var program = context._currentProgram;

            context.uniform1f(program.getUniformLoc('materialShininess'),
                this.shininess);
            context.uniform3f(program.getUniformLoc('materialEmissiveK'),
                this.emissive.r, this.emissive.g, this.emissive.b);
            context.uniform3f(program.getUniformLoc('materialAmbientK'),
                this.ambient.r, this.ambient.g, this.ambient.b);
            context.uniform3f(program.getUniformLoc('materialDiffuseK'),
                this.diffuse.r, this.diffuse.g, this.diffuse.b);
            context.uniform3f(program.getUniformLoc('materialSpecularK'),
                this.specular.r, this.specular.g, this.specular.b);
        }

    });

});