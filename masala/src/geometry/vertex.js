

define([
    'utility/class'
], function (Class) {

    return Class.extend({

        initialize: function () {
            var source;

            if (arguments.length === 1) {
                source = arguments[0];
            } else {
                source = arguments;
            }

            this.px = source[0] || 0;
            this.py = source[1] || 0;
            this.pz = source[2] || 0;

            this.nx = source[3] || 0;
            this.ny = source[4] || 0;
            this.nz = source[5] || 0;

            this.tx = source[6] || 0;
            this.ty = source[7] || 0;

            this.px = parseFloat(this.px);
            this.py = parseFloat(this.py);
            this.pz = parseFloat(this.pz);

            this.nx = parseFloat(this.nx);
            this.ny = parseFloat(this.ny);
            this.nz = parseFloat(this.nz);

            this.tx = parseFloat(this.tx);
            this.ty = parseFloat(this.ty);

            if (this.nx !== 0 || this.ny !== 0 || this.nz !== 0) {
                var normal = glm.vec3.create(),
                    normalizedNormal = glm.vec3.create();
                glm.vec3.set(normal, this.nx, this.ny, this.nz);
                glm.vec3.normalize(normalizedNormal, normal);

                this.nx = normalizedNormal[0];
                this.ny = normalizedNormal[1];
                this.nz = normalizedNormal[2];
            }
        },

        flatten: function () {
            return [
                this.px, this.py, this.pz,
                this.nx, this.ny, this.nz,
                this.tx, this.ty
            ];
        }

    });

});