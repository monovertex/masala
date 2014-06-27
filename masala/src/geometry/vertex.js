

define([
    'scaffolding/class'
], function (Class) {

    return Class.extend({

        set: function (key, value) {
            switch (key) {
                case 'position':
                    if (_.isPlainObject(value)) {
                        value = glm.vec3.fromValues(value.x, value.y, value.z);
                    } else if (_.isArray(value)) {
                        value = glm.vec3.fromValues(value[0], value[1],
                            value[2]);
                    }
                    break;
                case 'normal':
                    if (_.isPlainObject(value)) {
                        value = glm.vec3.fromValues(value.x, value.y, value.z);
                    } else if (_.isArray(value)) {
                        value = glm.vec3.fromValues(value[0], value[1],
                            value[2]);
                    }
                    glm.vec3.normalize(value, value);
                    break;
                case 'texCoords':
                    if (_.isPlainObject(value)) {
                        value = glm.vec2.fromValues(value.x, value.y);
                    } else if (_.isArray(value)) {
                        value = glm.vec2.fromValues(value[0], value[1]);
                    }
                    break;
            }

            Class.prototype.set.call(this, key, value);
        },

        get: function (key) {
            var value = Class.prototype.get.call(this, key);

            switch (key) {
                case 'position':
                    if (_.isUndefined(value)) {
                        return [0, 0, 0];
                    }
                    break;
                case 'normal':
                    if (_.isUndefined(value)) {
                        return [0, 0, 0];
                    }
                    break;
                case 'texCoords':
                    if (_.isUndefined(value)) {
                        return [0, 0];
                    }
                    break;
            }

            return value;
        },

        flatten: function () {
            var position = this.get('position'),
                normal = this.get('normal'),
                texCoords = this.get('texCoords');

            return [
                position[0], position[1], position[2],
                normal[0], normal[1], normal[2],
                texCoords[0], texCoords[1]
            ];
        }

    });

});