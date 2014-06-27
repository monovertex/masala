

define([
    'utility/is-any-array',
    'utility/error',
    'utility/color'
], function (isAnyArray, error, Color) {

    function valueChoice(a, b, c) {
        return (_.isUndefined(a) ? (_.isUndefined(b) ? c : b) : a);
    }

    var parsers = {
        number: function (value) {
            if (!_.isUndefined(value) && _.isNumber(value)) {
                return value;
            }
            error('attribute should be a number (' + value + ')');
        },
        xyz: function (value, previous) {
            if (!_.isUndefined(value)) {
                if (_.isPlainObject(value)) {
                    return {
                        x: valueChoice(value.x, previous ? previous.x : 0, 0),
                        y: valueChoice(value.y, previous ? previous.y : 0, 0),
                        z: valueChoice(value.z, previous ? previous.z : 0, 0)
                    };
                } else if (isAnyArray(value) && value.length === 3) {
                    return {
                        x: valueChoice(value[0], previous ? previous.x : 0, 0),
                        y: valueChoice(value[1], previous ? previous.y : 0, 0),
                        z: valueChoice(value[2], previous ? previous.z : 0, 0)
                    };
                } else {
                    return {
                        x: valueChoice(value, previous ? previous.x : 0, 0),
                        y: valueChoice(value, previous ? previous.y : 0, 0),
                        z: valueChoice(value, previous ? previous.z : 0, 0)
                    };
                }
            }
            error('incorrect xyz format (' + value + ')');
        },
        xy: function (value, previous) {
            if (!_.isUndefined(value)) {
                if (_.isPlainObject(value)) {
                    return {
                        x: valueChoice(value.x, previous ? previous.x : 0, 0),
                        y: valueChoice(value.y, previous ? previous.y : 0, 0)
                    };
                } else if (isAnyArray(value) && value.length === 2) {
                    return {
                        x: valueChoice(value[0], previous ? previous.x : 0, 0),
                        y: valueChoice(value[1], previous ? previous.y : 0, 0)
                    };
                } else {
                    return {
                        x: valueChoice(value, previous ? previous.x : 0, 0),
                        y: valueChoice(value, previous ? previous.y : 0, 0)
                    };
                }
            }
            error('incorrect xy format (' + value + ')');
        },
        vec3: function (value, previous) {
            if (!_.isUndefined(value)) {
                if (_.isPlainObject(value)) {
                    return glm.vec3.fromValues(
                        root.parseFloat(valueChoice(value.x,
                            previous ? previous[0] : 0, 0)),
                        root.parseFloat(valueChoice(value.y,
                            previous ? previous[1] : 0, 0)),
                        root.parseFloat(valueChoice(value.z,
                            previous ? previous[2] : 0, 0))
                    );
                } else if (isAnyArray(value) && value.length === 3) {
                    return value;
                }
            }
            error('incorrect vec3 format (' + value + ')');
        },
        color: function (value) {
            if (!_.isUndefined(value)) {
                if ('r' in value && 'g' in value && 'b' in value) {
                    return new Color(value);
                }
            }
            error('incorrect color format (' + value + ')');
        }
    };

    return {

        set: function (key, value) {
            if (_.isUndefined(this.attributes)) {
                this.attributes = {};
            }

            if (!_.isUndefined(this.attributeTypes) &&
                    key in this.attributeTypes &&
                    this.attributeTypes[key] in parsers) {
                // if (key === 'rotationSensitivity') {
                //     console.log(value, this.get);
                // }
                value = parsers[this.attributeTypes[key]](value,
                    this.get(key));
            }

            this.setChainAttribute(this.attributes, key.split('.'), value);

            return this;
        },

        setChainAttribute: function (target, chain, value) {
            var first = _.first(chain);

            if (chain.length === 1) {
                target[first] = value;
            } else {
                if (_.isUndefined(target[first])) {
                    target[first] = {};
                }

                this.setChainAttribute(target[first], _.rest(chain), value);
            }
        },

        get: function (key) {
            if (!_.isUndefined(this.attributes)) {
                return this.getChainAttribute(this.attributes, key.split('.'));
            }
        },

        getChainAttribute: function (target, chain) {
            var first = _.first(chain);

            if (chain.length === 1) {
                return target[first];
            } else {
                if (!_.isUndefined(target[first])) {
                    return this.getChainAttribute(target[first], _.rest(chain));
                }
            }
        }

    };

});