
define([
    'scaffolding/namespace'
], function (namespace) {

    namespace.simplex = namespace.simplex || {

        generator: new SimplexNoise(),

        noise2D: function () {
            return this.generator.noise2D(arguments);
        },
        noise3D: function () {
            return this.generator.noise3D(arguments);
        },
        noise4D: function () {
            return this.generator.noise4D(arguments);
        },

        getFbmNoise: function (coordinates, frequency, amplitude) {
            switch (coordinates.length) {
                case 2:
                    return this.noise2D(
                        coordinates[0] * frequency,
                        coordinates[1] * frequency
                    ) * amplitude;
                case 3:
                    return this.noise3D(
                        coordinates[0] * frequency,
                        coordinates[1] * frequency,
                        coordinates[2] * frequency
                    ) * amplitude;
                case 4:
                    return this.noise4D(
                        coordinates[0] * frequency,
                        coordinates[1] * frequency,
                        coordinates[2] * frequency,
                        coordinates[3] * frequency
                    ) * amplitude;
            }
        },

        fbm: function (iterations, persistence, scale, low, high) {
            var coordinates = Array.prototype.slice.call(arguments, 5),
                maxAmplitude = 0,
                amplitude = 1,
                frequency = scale,
                noise = 0,
                i;

            for (i = 0; i < iterations; ++i) {
                noise += this.getFbmNoise(coordinates, frequency, amplitude);
                maxAmplitude += amplitude;
                amplitude *= persistence;
                frequency *= 2;
            }

            noise /= maxAmplitude;
            noise = noise * (high - low) / 2 + (high + low) / 2;

            return noise;
        }

    };

});