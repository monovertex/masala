
(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(
            ['lodash', 'gl-matrix', 'keypress', 'simplex-noise', 'webgl-debug'],
            function(_, glm, keypress) {
                return factory(root, _, glm, keypress, SimplexNoise,
                    root.WebGLDebugUtils);
            }
        );
    } else {
        root.Masala = factory(root, root._, root, root.keypress,
            root.SimplexNoise, root.WebGLDebugUtils);
    }

}) (this, function(root, _, glm, keypress, SimplexNoise, WebGLDebugUtils) {

    var modules = {};


modules['utility/color'] = (function () {

    return function () {
        if (arguments.length === 3) {
            this.r = arguments[0] || 0;
            this.g = arguments[1] || 0;
            this.b = arguments[2] || 0;
        } else if (_.isPlainObject(arguments[0])) {
            this.r = arguments[0].r || 0;
            this.g = arguments[0].g || 0;
            this.b = arguments[0].b || 0;
        }

        this.flatten = function () {
            return [this.r, this.g, this.b];
        };
    };

}) ();

modules['utility/config'] = (function (Color) {

    return {
        CANVAS: {
            debug: false,
            backgroundColor: new Color({ r: 0, b: 0, g: 0 }),
            preloadAnimation: true,
            fpsCounter: true
        },

        SCENE: {
            paths: {
                meshes: '/masala/meshes/',
                shaders: '/masala/shaders/'
            }
        }
    };
}) (modules['utility/color']);

modules['scaffolding/namespace'] = (function (config) {

    return {
        config: config
    };

}) (modules['utility/config']);

modules['utility/event'] = (function () {

    return function (source, eventName, data) {
        this.name = eventName;
        this.data = data;
        this.source = source;
    };

}) ();

modules['scaffolding/class/events'] = (function (Event) {

    return {

        listenTo: function (object, eventName, callback) {
            if (_.isUndefined(object.eventListeners)) {
                object.eventListeners = {};
            }

            if (_.isUndefined(this.listeningTo)) {
                this.listeningTo = [];
            }

            if (_.isUndefined(object.eventListeners[eventName])) {
                object.eventListeners[eventName] = {};
            }

            if (_.isUndefined(object.eventListeners[eventName][this.uid])) {
                object.eventListeners[eventName][this.uid] = [];
                this.listeningTo.push(object.eventListeners[eventName]);
            }

            object.eventListeners[eventName][this.uid].push(callback);

            return this;
        },

        trigger: function (eventName, data) {
            if (!_.isUndefined(this.eventListeners)) {
                var event = new Event(this, eventName, data);

                if (eventName in this.eventListeners) {
                    _.each(
                        this.eventListeners[eventName],
                        function (listeners) {
                            _.each(listeners, function (callback) {
                                if (_.isFunction(callback)) {
                                    callback(event);
                                }
                            }, this);
                        },
                        this
                    );
                }
            }

            return this;
        },

        stopListeningTo: function (object, eventName, callback) {
            if (!_.isUndefined(object) &&
                    !_.isUndefined(object.eventListeners)) {
                if (_.isUndefined(eventName)) {
                    _.each(object.eventListeners, function (listeners) {
                        delete listeners[this.uid];
                    }, this);
                } else if (!_.isUndefined(object.eventListeners[eventName])) {
                    if (_.isUndefined(callback)) {
                        delete object.eventListeners[eventName][this.uid];
                    } else {
                        if (!_.isUndefined(
                                object.eventListeners[eventName][this.uid])) {
                            object.eventListeners[eventName][this.uid] =
                                _.without(
                                    object.eventListeners[eventName][this.uid],
                                    callback
                                );
                        }
                    }
                }
            }

            return this;
        },

        stopListening: function () {
            if (!_.isUndefined(this.listeningTo)) {
                _.each(this.listeningTo, function (listeners) {
                    delete listeners[this.uid];
                }, this);
            }
        }

    };

}) (modules['utility/event']);

modules['utility/is-any-array'] = (function () {

    return function (obj) {
        return Object.prototype.toString.call(obj).indexOf('Array') !== -1;
    };

}) ();


modules['utility/error'] = (function () {

    return function (message) {
        throw('Masala: ' + message + '!');
    };

}) ();


modules['scaffolding/class/attributes'] = (function (isAnyArray,error,Color) {

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

}) (modules['utility/is-any-array'],modules['utility/error'],modules['utility/color']);


modules['scaffolding/class'] = (function (events,attributes) {

    var Class = function (attributes) {
            this.uid = _.uniqueId();

            if (!_.isUndefined(this.defaults) &&
                    _.isPlainObject(this.defaults)) {
                _.each(this.defaults, function (attribute, key) {
                    this.set(key, _.cloneDeep(attribute));
                }, this);
            }

            _.each(attributes, function (attribute, key) {
                this.set(key, attribute);
            }, this);

            if (!_.isUndefined(this.initialize) &&
                    _.isFunction(this.initialize)) {
                this.initialize.apply(this, arguments);
            }
        };

    _.extend(Class.prototype, events, attributes);

    Class.extend = function (properties, staticProperties) {
        var parent = this,
            child,
            Surrogate;

        child = function () { return parent.apply(this, arguments); };

        _.merge(child, parent, staticProperties);

        Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (properties) {
            _.merge(child.prototype, properties);
        }

        return child;
    };

    return Class;

}) (modules['scaffolding/class/events'],modules['scaffolding/class/attributes']);

modules['gl/program/constants'] = {
    TYPE: {
        VERTEX: 'vertex',
        FRAGMENT: 'fragment'
    },
    PREDEFINED: {
        BASIC: {
            vertex: 'basic.vert',
            fragment: 'basic.frag'
        },
        LIGHTING: {
            PHONG: {
                vertex: 'lighting/phong.vert',
                fragment: 'lighting/phong.frag'
            },
            GOURAUD: {
                vertex: 'lighting/gouraud.vert',
                fragment: 'lighting/gouraud.frag'
            }
        },
        POSTPROCESSING: {
            BLUR: {
                GAUSSIAN: {
                    X: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/gaussian/x.frag'
                    },
                    Y: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/gaussian/y.frag'
                    }
                },
                MOTION: {
                    vertex: 'postprocessing/common.vert',
                    fragment: 'postprocessing/blur/motion.frag'
                }
            },
            INVERT: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/invert.frag'
            },
            GRAYSCALE: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/grayscale.frag'
            },
            BLOOM: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/bloom.frag'
            },
            ANTIALIASING: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/fxaa.frag'
            }
        }
    },
    ATTRIBUTES: {
        VERTEX_POSITION: 'vPosition',
        VERTEX_NORMAL: 'vNormal',
        VERTEX_TEX_COORDS: 'vTexCoords'
    }
};

modules['gl/program'] = (function (Class,programConstants) {

    return Class.extend({

        initialize: function (attributes, options) {
            var context = this.get('context'),
                program = context.createProgram();

            _.bindAll(this, 'getUniformLoc', 'getAttribLoc', 'use');

            _.each(options.sources, function(source, type) {
                var shader;

                if (type === programConstants.TYPE.FRAGMENT) {
                    shader = context.createShader(context.FRAGMENT_SHADER);
                } else if (type === programConstants.TYPE.VERTEX) {
                    shader = context.createShader(context.VERTEX_SHADER);
                } else {
                    throw('Unknown shader type');
                }

                context.shaderSource(shader, source);
                context.compileShader(shader);

                if (!context.getShaderParameter(shader,
                        context.COMPILE_STATUS)) {
                    throw('Shader compilation error: \n' +
                        context.getShaderInfoLog(shader));
                }

                context.attachShader(program, shader);
            }, this);

            context.linkProgram(program);

            if (!context.getProgramParameter(program, context.LINK_STATUS)) {
                throw('Could not link program: \n' +
                    context.getProgramInfoLog(program));
            }

            this.set('program', program)
                .set('uniforms', {})
                .set('attributes', {});
        },

        getUniformLoc: function (uniform) {
            var context = this.get('context'),
                uniforms = this.get('uniforms'),
                program = this.get('program');

            if (_.isUndefined(uniforms[uniform])) {
                uniforms[uniform] = context.getUniformLocation(program,
                    uniform);
            }

            return uniforms[uniform];
        },

        getAttribLoc: function (attribute) {
            var context = this.get('context'),
                attributes = this.get('attributes'),
                program = this.get('program');

            if (_.isUndefined(attributes[attribute])) {
                attributes[attribute] = context.getAttribLocation(program,
                    attribute);

                if (attributes[attribute] > 0 || attributes[attribute] === 0) {
                    context.enableVertexAttribArray(attributes[attribute]);
                }
            }

            return attributes[attribute];
        },

        use: function () {
            var context = this.get('context');

            context.useProgram(this.get('program'));
            context._currentProgram = this;
        }

    });

}) (modules['scaffolding/class'],modules['gl/program/constants']);


modules['gl/texture'] = (function (Class) {

    return Class.extend({

        initialize: function (attributes, options) {
            var context = this.get('context'),
                texture = context.createTexture(),
                wrapS = 'REPEAT',
                wrapT = 'REPEAT',
                filterMag = 'NEAREST',
                filterMin = 'NEAREST';

            if (!_.isUndefined(options.wrap)) {
                if (_.isString(options.wrap)) {
                    wrapS = options.wrap;
                    wrapT = wrapS;
                } else {
                    if (!_.isUndefined(options.wrap.s)) {
                        wrapS = options.wrap.s;
                    }

                    if (!_.isUndefined(options.wrap.t)) {
                        wrapT = options.wrap.t;
                    }
                }
            }

            if (!_.isUndefined(options.filter)) {
                if (_.isString(options.filter)) {
                    filterMag = options.filter;
                    filterMin = filterMag;
                } else {
                    if (!_.isUndefined(options.filter.min)) {
                        filterMin = options.filter.min;
                    }

                    if (!_.isUndefined(options.filter.mag)) {
                        filterMag = options.filter.mag;
                    }
                }
            }

            // Create texture, inverse it.
            context.bindTexture(context.TEXTURE_2D, texture);
            context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true);

            // Wrap options.
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_S,
                context[wrapS]
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_WRAP_T,
                context[wrapT]
            );

            // Filter options.
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MIN_FILTER,
                context[filterMin]
            );
            context.texParameteri(
                context.TEXTURE_2D,
                context.TEXTURE_MAG_FILTER,
                context[filterMag]
            );

            // Buffer data.
            if (_.isNull(options.source) ||
                    options.source instanceof Float32Array) {
                context.texImage2D(
                    context.TEXTURE_2D,
                    0,
                    context[options.format] || context.RGBA,
                    options.width,
                    options.height,
                    0,
                    context[options.format] || context.RGBA,
                    context[options.type] || context.UNSIGNED_BYTE,
                    options.source
                );

                this.set('width', options.width);
                this.set('height', options.height);

            } else if (options.source instanceof Image) {
                context.texImage2D(
                    context.TEXTURE_2D,
                    0,
                    context[options.format] || context.RGBA,
                    context[options.format] || context.RGBA,
                    context[options.type] || context.UNSIGNED_BYTE,
                    options.source
                );
            }

            if (filterMin.indexOf('MIPMAP') !== -1) {
                context.generateMipmap(context.TEXTURE_2D);
            }

            this.set('texture', texture);

            this.unbind();
        },

        bind: function () {
            var context = this.get('context');

            context.bindTexture(context.TEXTURE_2D, this.get('texture'));
        },

        unbind: function () {
            var context = this.get('context');

            context.bindTexture(context.TEXTURE_2D, null);
        },

        render: function (unit, uniformName) {
            var context = this.get('context'),
                program = context._currentProgram;

            context.activeTexture(context.TEXTURE0 + unit);
            this.bind();

            if (!_.isUndefined(uniformName)) {
                context.uniform1i(uniformName, unit);
            }
        }

    });

}) (modules['scaffolding/class']);

modules['utility/constants'] = {
    SIZE: {
        FLOAT: 4,
        BYTE: 1,
        SHORT: 2
    }
};

modules['geometry/constants'] = (function (constants) {
    return {
        VERTEX: {
            SIZE: (8 * constants.SIZE.FLOAT),
            ITEM_SIZE: {
                POSITION: 3,
                NORMAL: 3,
                TEX_COORD: 2
            },
            ITEM_OFFSET: {
                POSITION: (0 * constants.SIZE.FLOAT),
                NORMAL: (3 * constants.SIZE.FLOAT),
                TEX_COORD: (6 * constants.SIZE.FLOAT)
            }
        },
        OBJ: {
            VERTEX: 'v',
            NORMAL: 'vn',
            TEXCOORD: 'vt',
            FACE: 'f',
            FACE_FORMAT: {
                V: 'v',
                VT: 'vt',
                VTN: 'vtn',
                VN: 'vn'
            }
        },
        MESHES: {
            CUBE: 'cube.obj'
        }
    };
}) (modules['utility/constants']);


modules['geometry/vertex'] = (function (Class) {

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

}) (modules['scaffolding/class']);


modules['geometry/mesh/parse'] = (function (Vertex,constants) {

    function parseObj(source) {
        var OBJ = constants.OBJ,
            lines = source.split(/[\n\r]+/g),
            raw = {
                vertices: [],
                normals: [],
                texcoords: [],
                faces: []
            },
            faceFormat,
            faceItem,
            vertices = [],
            indices = [],
            firstIndex,
            lastIndex,
            i;

        _.each(lines, function (line) {
            var dest;

            line = line.trim();

            if (line.substring(0, OBJ.NORMAL.length) ===
                    OBJ.NORMAL) {
                dest = raw.normals;
            } else if (line.substring(0, OBJ.TEXCOORD.length) ===
                    OBJ.TEXCOORD) {
                dest = raw.texcoords;
            } else if (line.substring(0, OBJ.VERTEX.length) ===
                    OBJ.VERTEX) {
                dest = raw.vertices;
            } else if (line.substring(0, OBJ.VERTEX.length) ===
                    OBJ.FACE) {
                dest = raw.faces;
            }

            if (!_.isUndefined(dest)) {
                dest.push(line.split(/ +/g).slice(1));
            }
        });

        faceItem = raw.faces[0][0];

        if (faceItem.indexOf('//') !== -1) {
            faceFormat = OBJ.FACE_FORMAT.VN;
        } else {
            var slashCount = faceItem.split('/').length - 1;

            if (slashCount === 0) {
                faceFormat = OBJ.FACE_FORMAT.V;
            } else if (slashCount === 1) {
                faceFormat = OBJ.FACE_FORMAT.VT;
            } else {
                faceFormat = OBJ.FACE_FORMAT.VTN;
            }
        }

        _.each(raw.faces, function (face) {

            if (face.length === 3) {
                indices.push(vertices.length);
                indices.push(vertices.length + 1);
                indices.push(vertices.length + 2);
            } else if (face.length > 3) {
                firstIndex = vertices.length;
                lastIndex = firstIndex + 1;

                for (i = 0; i < face.length - 2; i++, lastIndex++) {
                    indices.push(firstIndex);
                    indices.push(lastIndex);
                    indices.push(lastIndex + 1);
                }
            } else return;

            _.each(face, function (faceItem) {
                var faceItemData = faceItem.split('/'),
                    position = raw.vertices[parseInt(
                        faceItemData[0], 10) - 1],
                    normal,
                    texCoords;

                if (faceFormat === OBJ.FACE_FORMAT.VTN ||
                        faceFormat === OBJ.FACE_FORMAT.VN) {
                    normal = raw.normals[parseInt(faceItemData[2], 10) - 1];
                }

                if (faceFormat === OBJ.FACE_FORMAT.VT ||
                        faceFormat === OBJ.FACE_FORMAT.VTN) {
                    texCoords = raw.texcoords[parseInt(
                        faceItemData[1], 10) - 1];
                }

                switch (faceFormat) {
                    case OBJ.FACE_FORMAT.V:
                        vertex = new Vertex({
                            position: position
                        });
                        break;
                    case OBJ.FACE_FORMAT.VN:
                        vertex = new Vertex({
                            position: position,
                            normal: normal
                        });
                        break;
                    case OBJ.FACE_FORMAT.VTN:
                        vertex = new Vertex({
                            position: position,
                            normal: normal,
                            texCoords: texCoords
                        });
                        break;
                    case OBJ.FACE_FORMAT.VT:
                        vertex = new Vertex({
                            position: position,
                            texCoords: texCoords
                        });
                        break;
                }

                vertices.push(vertex);
            });
        });

        return { vertices: vertices, indices: indices };
    }

    return {
        parse: function (source) {
            if (_.isString(source)) {
                return parseObj(source);
            } else {
                return {
                    vertices: _.map(source.vertices, function (attributes) {
                        return new Vertex(attributes);
                    }),
                    indices: _.flatten(source.indices, true)
                };
            }
        }
    };
}) (modules['geometry/vertex'],modules['geometry/constants']);


modules['geometry/mesh'] = (function (geometryConstants,programConstants,Class,parse) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'linkAttributes');

            var context = this.get('context'),
                rawData = this.parse(options.source),
                vbo = context.createBuffer(),
                ibo = context.createBuffer(),
                coordsList, flat, i, maxCoord = 0;

            coordsList = _.flatten(_.reduce(
                rawData.vertices,
                function (result, vertex) {
                    flat = vertex.flatten();

                    for (i = 0; i < 3; i++) {
                        if (Math.abs(flat[i]) > maxCoord) {
                            maxCoord = Math.abs(flat[i]);
                        }
                    }

                    result.push(flat);
                    return result;
                },
                []
            ), true);

            context.bindBuffer(context.ARRAY_BUFFER, vbo);

            context.bufferData(
                context.ARRAY_BUFFER,
                new Float32Array(_.map(coordsList, function (coord) {
                    return coord / maxCoord;
                })),
                context.STATIC_DRAW
            );

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, ibo);

            context.bufferData(
                context.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(rawData.indices),
                context.STATIC_DRAW
            );

            this.set('vbo', vbo);
            this.set('ibo', ibo);
            this.set('indexCount', rawData.indices.length);
        },

        render: function () {
            var context = this.get('context');

            context.bindBuffer(context.ARRAY_BUFFER, this.get('vbo'));

            this.linkAttributes();

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.get('ibo'));

            context.drawElements(context.TRIANGLES, this.get('indexCount'),
                context.UNSIGNED_SHORT, 0);
        },

        linkAttributes: function () {
            var context = this.get('context'),
                VERTEX = geometryConstants.VERTEX;

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_POSITION,
                VERTEX.ITEM_SIZE.POSITION,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.POSITION
            );

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_NORMAL,
                VERTEX.ITEM_SIZE.NORMAL,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.NORMAL
            );

            context.vertexAttribPointer(
                programConstants.ATTRIBUTES.VERTEX_TEX_COORDS,
                VERTEX.ITEM_SIZE.TEX_COORD,
                context.FLOAT,
                false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.TEX_COORD
            );
        }

    }, parse));

}) (modules['geometry/constants'],modules['gl/program/constants'],modules['scaffolding/class'],modules['geometry/mesh/parse']);

modules['interaction/actor/constants'] = (function () {

    var NO_MOVEMENT = 0,
        MOVE_POSITIVE = 1,
        MOVE_NEGATIVE = -1;

    return {
        NO_MOVEMENT: NO_MOVEMENT,
        MOVE_POSITIVE: MOVE_POSITIVE,
        MOVE_NEGATIVE: MOVE_NEGATIVE,
        ROTATIONS: {
            'yaw': 'y',
            'pitch': 'z',
            'roll': 'x',
            NONE: 0
        },
        MOUSE_FACTOR: -0.0005,
        DEFAULTS: {
            MOVEMENT: {
                MINIMUM_SPEED: 0.5,
                MAXIMUM_SPEED: 10,
                ACCELERATION: 3,
                DECCELERATION: 5
            },
            ROTATION: {
                SPEED: 0.35,
                SENSITIVITY: 1,
                ORDER: ['x', 'z', 'y']
            }
        },
        CONTROLS: {
            'forward': { axis: 'x', direction: MOVE_POSITIVE },
            'backward': { axis: 'x', direction: MOVE_NEGATIVE },
            'right': { axis: 'z', direction: MOVE_POSITIVE },
            'left': { axis: 'z', direction: MOVE_NEGATIVE },
            'up': { axis: 'y', direction: MOVE_POSITIVE },
            'down': { axis: 'y', direction: MOVE_NEGATIVE },

            'rollLeft': {
                axis: 'x',
                direction: MOVE_NEGATIVE,
                rotation: true
            },
            'rollRight': {
                axis: 'x',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'yawLeft': {
                axis: 'y',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'yawRight': {
                axis: 'y',
                direction: MOVE_NEGATIVE,
                rotation: true
            },
            'pitchUp': {
                axis: 'z',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'pitchDown': {
                axis: 'z',
                direction: MOVE_NEGATIVE,
                rotation: true
            }
        }
    };
}) ();

modules['interaction/actor/movement'] = (function (constants) {

    var defaults = constants.DEFAULTS.MOVEMENT;

    return {

        defaults: {
            movementSpeed: 0,
            movementControlToggle:  constants.NO_MOVEMENT,
            movementToggle: constants.NO_MOVEMENT,
            accelerationToggle: false,
            acceleration: defaults.ACCELERATION,
            deceleration: defaults.ACCELERATION,
            speed: {
                max: defaults.MAXIMUM_SPEED,
                min: defaults.MINIMUM_SPEED
            }
        },

        attributeTypes: {
            'movementSpeed': 'xyz',
            'movementControlToggle': 'xyz',
            'movementToggle': 'xyz',
            'accelerationToggle': 'xyz',

            'speed.max': 'xyz',
            'speed.min': 'xyz',
            'acceleration': 'xyz',
            'deceleration': 'xyz'
        },

        updateMovement: function (interval) {
            var movementToggle = this.get('movementToggle'),
                accelerationToggle = this.get('accelerationToggle'),
                movementSpeed = this.get('movementSpeed'),
                minSpeed = this.get('speed.min'),
                maxSpeed = this.get('speed.max'),
                acceleration = this.get('acceleration'),
                deceleration = this.get('deceleration'),
                movementControlToggle = this.get('movementControlToggle');

            _.each(['x', 'y', 'z'], function (axis) {
                var distance;

                if (movementToggle[axis] !== constants.NO_MOVEMENT) {
                    if (accelerationToggle[axis]) {
                        if (movementSpeed[axis] < minSpeed[axis]) {
                            movementSpeed[axis] = minSpeed[axis];
                        }

                        if (movementSpeed[axis] < maxSpeed[axis]) {
                            movementSpeed[axis] += (interval *
                                acceleration[axis]);
                        }

                        if (movementSpeed[axis] > maxSpeed[axis]) {
                            movementSpeed[axis] = maxSpeed[axis];
                        }
                    } else {
                        if (movementSpeed[axis] > minSpeed[axis]) {
                            movementSpeed[axis] -= (interval *
                                deceleration[axis]);

                            if (movementControlToggle[axis] !==
                                    constants.NO_MOVEMENT) {
                                movementSpeed[axis] -= (interval *
                                    acceleration[axis]);
                            }
                        }

                        if (movementSpeed[axis] < minSpeed[axis]) {
                            movementSpeed[axis] = 0;
                        }
                    }

                    if (movementSpeed[axis] > minSpeed[axis]) {
                        distance = interval * movementSpeed[axis] *
                            movementToggle[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    } else {
                        movementToggle[axis] = constants.NO_MOVEMENT;
                    }
                }

                if (movementToggle[axis] === constants.NO_MOVEMENT &&
                        movementControlToggle[axis] !== constants.NO_MOVEMENT) {
                    movementToggle[axis] = movementControlToggle[axis];
                }

                if (movementToggle[axis] === movementControlToggle[axis]) {
                    accelerationToggle[axis] = true;
                }

                if (movementControlToggle[axis] === constants.NO_MOVEMENT) {
                    accelerationToggle[axis] = false;
                }

            }, this);
        },

        move: function (direction, distance) {
            var position = this.get('node').get('position');

            glm.vec3.add(position, position, glm.vec3.multiply(
                [], direction, [distance, distance, distance]));
        },

        moveForward: function (distance) {
            this.move(this.get('forward'), distance);
        },

        moveUp: function (distance) {
            this.move(this.get('up'), distance);
        },

        moveRight: function (distance) {
            this.move(this.get('right'), distance);
        },
    };

}) (modules['interaction/actor/constants']);

modules['interaction/actor/rotation'] = (function (constants) {

    var defaults = constants.DEFAULTS.ROTATION;

    return {

        defaults: {
            rotationToggle: constants.NO_MOVEMENT,
            rotationMouseControl: constants.ROTATIONS.NONE,
            rotationAngle: 0,
            rotationGimbals: true,
            rotationAxisOrder: defaults.ORDER,
            rotationSensitivity: defaults.SENSITIVITY,
            rotationSpeed: defaults.SPEED,
        },

        attributeTypes: {
            'rotationToggle': 'xyz',
            'rotationMouseControl': 'xy',
            'rotationAngle': 'xyz',
            'rotationSensitivity': 'xy',
            'rotationSpeed': 'xyz'
        },

        cursorMove: function (ev) {
            var angles = {},
                data = ev.data,
                rotationMouseControl = this.get('rotationMouseControl'),
                rotationSensitivity = this.get('rotationSensitivity');

            angles[rotationMouseControl.x] = constants.MOUSE_FACTOR *
                rotationSensitivity.x * data.x;
            angles[rotationMouseControl.y] = constants.MOUSE_FACTOR *
                rotationSensitivity.y * data.y;

            this.rotate(angles, true);
        },

        updateRotation: function (interval) {
            this.rotate(interval);
        },

        getAngleIncrease: function (axis, angleData, exact) {
            if (exact) {
                if (_.isPlainObject(angleData)) {
                    return angleData[axis] || 0;
                } else {
                    return angleData || 0;
                }
            } else {
                return this.get('rotationSpeed')[axis] * angleData *
                    this.get('rotationToggle')[axis];
            }
        },

        rotate: function (angleData, exact) {
            if (this.get('rotationGimbals')) {
                this.rotateGimbals(this.get('rotationAxisOrder'), angleData,
                    exact);
            } else {
                this.rotateDirect(this.get('rotationAxisOrder'), angleData,
                    exact);
            }
        },

        rotateDirect: function (order, angleData, exact) {

            _.each(order, function (axis) {
                var angleIncrease = this.getAngleIncrease(axis, angleData,
                        exact);

                switch (axis) {
                    case 'x': this.rotateX(angleIncrease); break;
                    case 'y': this.rotateY(angleIncrease); break;
                    case 'z': this.rotateZ(angleIncrease); break;
                }
            }, this);

        },

        rotateGimbals: function (axes, angleData, exact) {

            var axis = _.first(axes),
                angle = this.get('rotationAngle')[axis],
                angleIncrease = this.getAngleIncrease(axis, angleData, exact);

            if (axes.length > 1) {
                switch (axis) {
                    case 'x': this.rotateX(-angle); break;
                    case 'y': this.rotateY(-angle); break;
                    case 'z': this.rotateZ(-angle); break;
                }

                this.rotateGimbals(_.rest(axes), angleData, exact);
            }

            if (angleIncrease !== 0) {
                angle += angleIncrease;
                this.set('rotationAngle.' + axis, angle);

                if (axes.length === 1) {
                    switch (axis) {
                        case 'x': this.rotateX(angleIncrease); break;
                        case 'y': this.rotateY(angleIncrease); break;
                        case 'z': this.rotateZ(angleIncrease); break;
                    }
                }
            }

            if (axes.length > 1) {
                switch (axis) {
                    case 'x': this.rotateX(angle); break;
                    case 'y': this.rotateY(angle); break;
                    case 'z': this.rotateZ(angle); break;
                }
            }
        },

        rotateX: function (angle) {
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), forward,
                    angle);

            glm.vec3.normalize(up, glm.vec3.transformQuat(up, up, rotation));
            glm.vec3.normalize(right, glm.vec3.transformQuat(right, right,
                rotation));
        },

        rotateY: function (angle) {
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), up, angle);

            glm.vec3.normalize(forward, glm.vec3.transformQuat(forward, forward,
                rotation));
            glm.vec3.normalize(right, glm.vec3.transformQuat(right, right,
                rotation));
        },

        rotateZ: function (angle) {
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), right,
                    angle);

            glm.vec3.normalize(up, glm.vec3.transformQuat(up, up, rotation));
            glm.vec3.normalize(forward, glm.vec3.transformQuat(forward, forward,
                rotation));
        }
    };

}) (modules['interaction/actor/constants']);


modules['interaction/cursor/lock'] = (function () {

    var el = document.body,
        vendorUtilities = {
            'native': {
                detect: function () {
                    return 'pointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.pointerLockElement;
                },
                getEventName: _.constant('pointerlockchange'),
                getMovementX: _.constant('movementX'),
                getMovementY: _.constant('movementY'),
                lock: el.requestPointerLock,
                exitLock: document.exitPointerLock
            },
            'moz': {
                detect: function () {
                    return 'mozPointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.mozPointerLockElement;
                },
                getEventName: _.constant('mozpointerlockchange'),
                getMovementX: _.constant('mozMovementX'),
                getMovementY: _.constant('mozMovementY'),
                lock: el.mozRequestPointerLock,
                exitLock: document.mozExitPointerLock
            },
            'webkit': {
                detect: function () {
                    return 'webkitPointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.webkitPointerLockElement;
                },
                getEventName: _.constant('webkitpointerlockchange'),
                getMovementX: _.constant('webkitMovementX'),
                getMovementY: _.constant('webkitMovementY'),
                lock: el.webkitRequestPointerLock,
                exitLock: document.webkitExitPointerLock
            }
        };

    var utility;

    _.each(vendorUtilities, function (vendorUtility) {
        if (vendorUtility.detect()) {
            utility = vendorUtility;
        }
    });

    utility.lock = utility.lock.bind(el);
    utility.exitLock = utility.exitLock.bind(document);

    return _.extend(utility, {

        requestLock: function () {
            if (this.lockRequests > 0) {
                this.lock();
            }
        },

        addLockRequest: function () {
            this.lockRequests = this.lockRequests || 0;
            this.lockRequests++;
        },

        removeLockRequest: function () {
            this.lockRequests = this.lockRequests || 1;
            this.lockRequests--;

            if (this.lockRequests === 0 && this.isLocked()) {
                this.exitLock();
            }
        },

        getElement: function () {
            return el;
        },

        isLocked: function () {
            return this.getLockElement() === this.getElement();
        }

    });

}) ();

modules['interaction/cursor'] = (function (namespace,Class,lock) {

    var Cursor = Class.extend(_.extend({

        initialize: function () {
            _.bindAll(this, 'mouseMove', 'requestLock');

            document.addEventListener(this.getEventName(), (function () {
                if (this.isLocked()) {
                    document.addEventListener('mousemove', this.mouseMove);
                } else {
                    document.removeEventListener('mousemove', this.mouseMove);
                }
            }).bind(this));
        },

        mouseMove: function (ev) {
            var x = ev[this.getMovementX()],
                y = ev[this.getMovementY()];

            this.trigger('move', { x: x, y: y });
        }

    }, lock));

    namespace.cursor = namespace.cursor || new Cursor();

    return namespace.cursor;

}) (modules['scaffolding/namespace'],modules['scaffolding/class'],modules['interaction/cursor/lock']);


modules['interaction/keyboard'] = (function (Class,namespace) {

    var Keyboard = Class.extend({

        initialize: function () {
            this.set('listener', new keypress.Listener());
        },

        listen: function (keys, downCallback, upCallback) {
            this.get('listener').register_combo({
                keys: keys,
                on_keydown: downCallback,
                on_keyup: upCallback
            });
        }

    });

    namespace.Keyboard = namespace.Keyboard || new Keyboard();

    return namespace.Keyboard;

}) (modules['scaffolding/class'],modules['scaffolding/namespace']);


modules['interaction/actor'] = (function (Class,constants,movement,rotation,cursor,error,Keyboard) {

    return Class.extend(_.merge({

        set: function (key, value) {

            switch (key) {
                case 'speed':
                    if (_.isPlainObject(value)) {
                        if ('max' in value) {
                            Class.prototype.set.call(this, 'speed.max',
                                value.max);
                        }

                        if ('min' in value) {
                            Class.prototype.set.call(this, 'speed.min',
                                value.min);
                        }

                        return this;
                    } else {
                        error('speed configuration must contain minimum or ' +
                            'maximum properties');
                    }
                    break;
                case 'rotationAxisOrder':
                    if (_.isArray(value) && value.length === 3 &&
                            _.indexOf(value, 'x') !== -1 &&
                            _.indexOf(value, 'y') !== -1 &&
                            _.indexOf(value, 'z') !== -1) {
                        return Class.prototype.set.call(this, key, value);
                    } else {
                        error('incorrect format for rotationAxisOrder');
                    }
                    break;
            }

            return Class.prototype.set.call(this, key, value);
        },

        defaults: {
            forward: { x: 1, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        },

        attributeTypes: {
            'up': 'vec3',
            'forward': 'vec3',
            'right': 'vec3'
        },

        initialize: function () {

            _.bindAll(this, 'cursorMove');

            var forward = this.get('forward'),
                up = this.get('up'),
                right = glm.vec3.create();

            glm.vec3.normalize(forward, forward);
            glm.vec3.normalize(up, up);

            glm.vec3.cross(right, forward, up);
            glm.vec3.normalize(right, right);
            this.set('right', right);

            glm.vec3.cross(up, right, forward);
            glm.vec3.normalize(up, up);

            this.setControls(this.get('controls'));

        },

        update: function (interval) {
            this.updateRotation(interval);
            this.updateMovement(interval);
        },

        toggleControl: function (toggle, rotation, axis, direction) {
            var value = (toggle ? direction : constants.NO_MOVEMENT);

            if (rotation) {
                this.get('rotationToggle')[axis] = value;
            } else {
                this.get('movementControlToggle')[axis] = value;
            }
        },

        setDefaultValues: function (configuration, target) {
            if (!_.isUndefined(configuration)) {
                if (_.isPlainObject(configuration)) {
                    _.each(configuration, function (configValue, axis) {
                        if (_.isNumber(configValue)) {
                            target[axis] = configValue;
                        }
                    });
                } else if (_.isNumber(configuration)) {
                    _.each(target, function (targetValue, axis) {
                        target[axis] = configuration;
                    });
                }
            }
        },

        setControls: function (controls) {
            var mouse = false,
                rotationMouseControl = this.get('rotationMouseControl');

            rotationMouseControl.x = constants.ROTATIONS.NONE;
            rotationMouseControl.y = constants.ROTATIONS.NONE;

            _.each(controls, function (key, control) {
                if (control === 'mouse') {
                    mouse = true;
                    rotationMouseControl.x = constants.ROTATIONS[key.x];
                    rotationMouseControl.y = constants.ROTATIONS[key.y];

                    if (!_.isUndefined(key.sensitivity)) {
                        this.set('rotationSensitivity', key.sensitivity);
                    }
                } else {
                    control = constants.CONTROLS[control];

                    Keyboard.listen(
                        key,

                        (function () {
                            this.toggleControl(true, control.rotation,
                                control.axis, control.direction);
                        }).bind(this),

                        (function () {
                            this.toggleControl(false, control.rotation,
                                control.axis);
                        }).bind(this)
                    );
                }
            }, this);

            if (mouse) {
                cursor.addLockRequest();
                this.listenTo(cursor, 'move', this.cursorMove);
            } else {
                cursor.removeLockRequest();
                this.stopListeningTo(cursor, 'move', this.cursorMove);
            }
        }
    }, movement, rotation));

}) (modules['scaffolding/class'],modules['interaction/actor/constants'],modules['interaction/actor/movement'],modules['interaction/actor/rotation'],modules['interaction/cursor'],modules['utility/error'],modules['interaction/keyboard']);


modules['interaction/camera'] = (function (Actor) {

    return Actor.extend({

        defaults: {
            fov: 60,
            zNear: 0.1,
            zFar: 500
        },

        attributeTypes: {
            fov: 'number',
            zNear: 'number',
            zFar: 'number'
        },

        initialize: function (attributes, options) {
            Actor.prototype.initialize.apply(this, arguments);

            this.set('viewMatrix', glm.mat4.create())
                .set('projectionMatrix', glm.mat4.create())
                .set('eyePosition', glm.vec3.create())
                .set('currentViewProjectionMatrix', glm.mat4.create())
                .set('inverseViewProjectionMatrix', glm.mat4.create());
        },

        use: function (context) {
            context._currentCamera = this;
        },

        render: function (width, height, context) {

            if (context._currentCamera === this) {
                var position = this.get('node').get('position'),
                    eyePosition = this.get('eyePosition'),
                    viewMatrix = this.get('viewMatrix'),
                    modelMatrix = this.get('modelMatrix'),
                    projectionMatrix = this.get('projectionMatrix'),
                    currentViewProjectionMatrix =
                        this.get('currentViewProjectionMatrix');

                glm.vec3.transformMat4(eyePosition, position, modelMatrix);

                glm.mat4.lookAt(viewMatrix, position,
                    glm.vec3.add([], position, this.get('forward')),
                    this.get('up'));

                glm.mat4.multiply(viewMatrix, modelMatrix, viewMatrix);

                glm.mat4.perspective(projectionMatrix,
                    this.get('fov') * Math.PI / 180, width / height,
                    this.get('zNear'), this.get('zFar'));

                this.set('previousViewProjectionMatrix',
                    glm.mat4.clone(currentViewProjectionMatrix));

                glm.mat4.multiply(currentViewProjectionMatrix,
                    projectionMatrix, viewMatrix);
                glm.mat4.invert(this.get('inverseViewProjectionMatrix'),
                    currentViewProjectionMatrix);

                this.sendUniforms(context);
            }

        },

        sendUniforms: function (context) {
            var eyePosition = this.get('eyePosition');

            context.uniformMatrix4fv('viewMat', false, this.get('viewMatrix'));

            context.uniform3f('eyePosition', eyePosition[0], eyePosition[1],
                eyePosition[2]);

            context.uniformMatrix4fv('projectionMat', false,
                this.get('projectionMatrix'));

            context.uniformMatrix4fv('viewProjectionMat', false,
                this.get('currentViewProjectionMatrix'));

            context.uniformMatrix4fv('viewProjectionInverseMat', false,
                this.get('inverseViewProjectionMatrix'));

            context.uniformMatrix4fv('previousViewProjectionMat', false,
                this.get('previousViewProjectionMatrix'));
        },

        prepareRender: function (modelMatrix) {
            this.set('modelMatrix', modelMatrix);
        }

    });

}) (modules['interaction/actor']);

modules['gl/canvas/initialize'] = (function (Program,Texture,Mesh,Camera) {

    return {
        initializeScene: function (ev) {
            var scene = ev.source || ev;

            this.trigger('startLoading');

            if (scene.isLoaded()) {
                var context = this.get('context'),
                    sources = scene.get('sources'),
                    resources = {
                        ambientLight: sources.ambientLight,
                        backgroundColor: sources.backgroundColor,
                        programs: {},
                        meshes: {},
                        nodes: {},
                        lights: _.clone(sources.lights),
                        actors: _.clone(sources.actors),
                        camera: _.clone(sources.cameras),
                        materials: _.clone(sources.materials),
                        textures: {},

                        allMeshes: {},
                        allTextures: [],

                        cameraOptions: _.clone(sources.cameraOptions),
                        actorOptions: _.clone(sources.actorOptions),
                        lightOptions: _.clone(sources.lightOptions),

                        defaultCamera: sources.defaultCamera
                    };

                // Programs.
                _.each(sources.programs, function (source, key) {
                    resources.programs[key] = new Program(
                        { context: context },
                        { sources:
                            _.reduce(source, function (result, path, key) {
                                result[key] = sources.shaders[path];
                                return result;
                            }, {}) }
                    );
                }, this);

                resources.defaultProgram =
                    resources.programs[sources.defaultProgram];

                if (!_.isUndefined(sources.postprocessing) &&
                        _.isArray(sources.postprocessing)) {
                    resources.postprocessing = [];

                    _.each(sources.postprocessing, function (name) {
                        if (name in resources.programs) {
                            resources.postprocessing.push(
                                resources.programs[name]);
                        }
                    });
                }

                // Meshes.
                _.each(sources.meshSources, function (source, key) {
                    resources.allMeshes[key] = new Mesh(
                        { context: context },
                        { source: source }
                    );
                }, this);

                _.each(sources.meshNames, function (path, name) {
                    resources.meshes[name] = resources.allMeshes[path];
                });

                // Textures.
                _.each(sources.textureOptions, function (options, index) {
                    options.source = sources.textureSources[options.path];

                    resources.allTextures.push(new Texture({ context: context },
                        options));

                    if (!_.isUndefined(options.name)) {
                        resources.textures[options.name] =
                            resources.allTextures[index];
                    }
                }, this);

                resources.tree = this.initializeNode(sources.tree, resources);

                this.get('scenes')[scene.uid].resources = resources;

                this.trigger('finishLoading');

            } else {
                this.listenTo(scene, 'loaded', this.initializeScene);
            }

        },

        initializeNode: function (source, resources) {
            var node = source.object;

            node.mesh = source.mesh;
            node.texture = source.texture;
            node.textures = source.textures;
            node.alphaTexture = source.alphaTexture;

            if (!_.isUndefined(source.name)) {
                resources.nodes[source.name] = node;
            }

            if (!_.isUndefined(source.children)) {
                _.each(source.children, function (source) {
                    var child = this.initializeNode(source, resources);

                    node.addChild(child);
                }, this);
            }

            return node;
        }
    };
}) (modules['gl/program'],modules['gl/texture'],modules['geometry/mesh'],modules['interaction/camera']);


modules['shading/render'] = (function () {

    return function (context, lights) {
        var types = [], radii = [], positions = [], directions = [],
            colors = [], anglesInner = [], anglesOuter = [],
            program = context._currentProgram;

        _.each(lights, function (light) {
            var data = light.output();

            types.push(data.type);
            radii.push(data.radius);
            positions.push(data.position[0], data.position[1],
                data.position[2]);
            colors.push(data.color.r, data.color.g, data.color.b);

            if (_.isUndefined(data.direction)) {
                directions.push(0, 0, 0);
            } else {
                directions.push(data.direction[0], data.direction[1],
                    data.direction[2]);
            }

            anglesInner.push(data.angleInner || 0);
            anglesOuter.push(data.angleOuter || 0);
        });

        context.uniform1i('lightCount', _.size(lights));
        context.uniform1iv('lightType', new Int32Array(types));
        context.uniform1fv('lightRadius', new Float32Array(radii));
        context.uniform3fv('lightPosition', new Float32Array(positions));
        context.uniform3fv('lightColor', new Float32Array(colors));
        context.uniform3fv('lightDirection', new Float32Array(directions));
        context.uniform1fv('lightAngleInner', new Float32Array(anglesInner));
        context.uniform1fv('lightAngleOuter', new Float32Array(anglesOuter));
    };

}) ();

modules['gl/canvas/constants'] = (function () {

    return  {
        EXTENSIONS: [
            'WEBGL_depth_texture'
        ],
        MAX_TEXTURE_UNITS: 16,
        LOADER: {
            STYLE: {
                WRAPPER: {
                    position: 'absolute',
                    zIndex: '2000',
                    backgroundColor: '#222'
                },
                INNER: {
                    width: '30px',
                    height: '30px',
                    backgroundColor: '#eee',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-15px',
                    marginLeft: '-15px'
                }
            },
            INTERVAL: 10,
            SPEED: 1,
            ROTATION_PROPERTIES: ['webkitTransform', 'mozTransform',
                'msTransform', 'oTransform', 'transform'],
        },
        FPS_COUNTER: {
            STYLE: {
                WRAPPER: {
                    position: 'absolute',
                    zIndex: '1000',
                    backgroundColor: 'rgba(210, 30, 30, 0.4)',
                    width: '60px',
                    height: '70px'
                },
                INFO: {
                    float: 'left',
                    margin: '1px',
                    width: '28px',
                    height: '18px',
                    lineHeight: '18px',
                    fontSize: '14px',
                    color: '#eadada',
                    fontFamily: '"System"',
                    overflow: 'hidden',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
                INFO_HEADER: {
                    fontSize: '10px',
                    fontFamily: '"Arial"'
                },
                GRAPH: {
                    margin: '1px',
                    width: '58px',
                    height: '28px'
                }
            },
            GRAPH: {
                MAX_FPS: 70,
                LINE_WIDTH: 2,
                HIGHLIGHT_WIDTH: 1,
                COLOR: '#1d0101',
                HIGHLIGHT: '#dba3a3'
            },
            POSITION_OFFSET: 5,
            FRAME_COUNT: 29,
            FRAME_GROUP_COUNT: 60
        },
        RTT: {
            TEXTURE: {
                filter: 'LINEAR',
                wrap: 'CLAMP_TO_EDGE'
            },
            MESH: {
                vertices: [
                    {
                        position: [-1, -1, 0],
                        normal: [0, 0, 1],
                        texCoords: [0, 0]
                    },
                    {
                        position: [-1, 1, 0],
                        normal: [0, 0, 1],
                        texCoords: [0, 1]
                    },
                    {
                        position: [1, 1, 0],
                        normal: [0, 0, 1],
                        texCoords: [1, 1]
                    },
                    {
                        position: [1, -1, 0],
                        normal: [0, 0, 1],
                        texCoords: [1, 0]
                    }
                ],
                indices: [[0, 1, 2], [0, 2, 3]]
            },
            PROGRAM: {
                shaders: {
                    vertex:
                        'attribute vec3 vPosition;' +
                        'attribute vec2 vTexCoords;' +
                        'varying vec2 texCoords;' +

                        'void main(void) {' +
                            'texCoords = vTexCoords;' +
                            'gl_Position = vec4(vPosition, 1);' +
                        '}',
                    fragment:
                        'precision mediump float;' +
                        'varying vec2 texCoords;' +

                        'uniform sampler2D colorTexture;' +

                        'void main() {' +
                            'gl_FragColor = vec4(' +
                                'texture2D(colorTexture, texCoords).xyz, 1);' +
                        '}'
                }
            }
        },
        CONTEXT_METHODS: {
            UNIFORMS: [
                'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv',
                'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv',
                'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv',
                'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv',
                'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
            ],
            ATTRIBUTES: ['vertexAttribPointer']
        }
    };

}) ();

modules['gl/canvas/render'] = (function (lightingRender,constants) {

    return {
        render: function (ev) {
            var color,
                context = this.get('context'),
                canvas = this.get('canvas'),
                currentScene = this.get('currentScene'),
                scenes = this.get('scenes'),
                rtt, postprocessing, resources, scene, source, target, aux,
                texelSize = {}, first, fps;

            this.resize();

            if (!_.isUndefined(currentScene) &&
                    !_.isUndefined(scenes[currentScene.uid]) &&
                    !_.isUndefined(scenes[currentScene.uid].resources)) {

                scene = scenes[currentScene.uid];
                resources = scene.resources;

                if (!_.isUndefined(resources.postprocessing)) {
                    this.initializePostprocessing();

                    if (!this.get('rtt.enabled')) {
                        this.initializeRTT();
                    }
                } else {
                    this.set('postprocessing.enabled', false);
                }

                rtt = this.get('rtt');

                if (rtt.enabled) {
                    rtt.fbo.bind();
                    context.viewport(0, 0, rtt.colorTexture.get('width'),
                        rtt.colorTexture.get('height'));
                } else {
                    context.viewport(0, 0, canvas.width, canvas.height);
                }

                this.clear();

                this.useProgram(resources.defaultProgram);
                this.useCamera(resources.defaultCamera);

                if (_.isFunction(scene.beforeFrame)) {
                    scene.beforeFrame.call(this, resources);
                }

                color = resources.backgroundColor ||
                    this.get('config.backgroundColor');
                context.clearColor(color.r, color.g, color.b, 1);

                context.uniform3f('ambientLight', false,
                    resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                context._currentCamera.render(canvas.width, canvas.height,
                    context);

                lightingRender(context, resources.lights);

                resources.tree.render(context, resources);

                if (rtt.enabled) {
                    rtt.fbo.unbind();
                }

                postprocessing = this.get('postprocessing');

                // Postprocessing.
                if (postprocessing.enabled) {
                    source = postprocessing.primary;
                    target = postprocessing.secondary;
                    first = true;

                    texelSize.x = 1.0 / canvas.width;
                    texelSize.y = 1.0 / canvas.height;

                    fps = 1.0 / ev.data.interval;

                    _.each(resources.postprocessing, function (program) {
                        aux = source;
                        source = target;
                        target = aux;

                        target.fbo.bind();

                        this.clear();

                        this.useProgram(program);

                        context.uniform2f('texelSize', texelSize.x, texelSize.y);

                        context.uniform1f('fps', fps);

                        context._currentCamera.sendUniforms(context);

                        if (first) {
                            rtt.colorTexture.render(0);
                            first = false;
                        } else {
                            source.colorTexture.render(0);
                        }
                        rtt.depthTexture.render(1, 'depthTexture');

                        rtt.mesh.render();

                        target.fbo.unbind();
                    }, this);
                }

                // Render the RTT texture to the quad.
                if (rtt.enabled) {
                    context.viewport(0, 0, canvas.width, canvas.height);

                    this.clear();

                    rtt.program.use();

                    if (postprocessing.enabled) {
                        target.colorTexture.render(0);
                    } else {
                        rtt.colorTexture.render(0);
                    }

                    rtt.mesh.render();
                }
            }

            this.trigger('finishRendering');
        },

        clear: function () {
            var context = this.get('context');

            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        },

        resize: function () {
            var canvas = this.get('canvas');

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                this.trigger('resize');
            }
        }
    };

}) (modules['shading/render'],modules['gl/canvas/constants']);

modules['gl/framebuffer'] = (function (Class) {

    return Class.extend({

        initialize: function () {
            this.set('fbo', this.get('context').createFramebuffer());
        },

        bind: function () {
            var context = this.get('context');

            context.bindFramebuffer(context.FRAMEBUFFER, this.get('fbo'));
        },

        unbind: function () {
            var context = this.get('context');

            context.bindFramebuffer(context.FRAMEBUFFER, null);
        },

        attachTexture: function (texture, attachment) {
            var context = this.get('context');

            this.bind();

            context.framebufferTexture2D(context.FRAMEBUFFER,
                attachment, context.TEXTURE_2D, texture, 0);

            this.unbind();
        },

        attachColorTexture: function (texture) {
            this.attachTexture(texture.get('texture'),
                this.get('context').COLOR_ATTACHMENT0);
        },

        attachDepthTexture: function (texture) {
            this.attachTexture(texture.get('texture'),
                this.get('context').DEPTH_ATTACHMENT);
        },

        attachDepthBuffer: function (buffer) {
            var context = this.get('context');

            context.framebufferRenderbuffer(context.FRAMEBUFFER,
                context.DEPTH_ATTACHMENT, context.RENDERBUFFER, buffer);
        }

    });


}) (modules['scaffolding/class']);


modules['gl/canvas/rtt'] = (function (Framebuffer,Program,constants,Texture,Mesh) {

    return {
        initializeRTT: function () {
            if (!this.get('rtt.initialized')) {
                _.bindAll(this, 'resizeRTT');

                var context = this.get('context'),
                    rtt = {
                        fbo: new Framebuffer({ context: context }),
                        program: new Program(
                            { context: context },
                            { sources: constants.RTT.PROGRAM.shaders }
                        ),
                        mesh: new Mesh(
                            { context: context },
                            { source: constants.RTT.MESH }
                        ),
                        initialized: true,
                        enabled: true
                    };

                this.set('rtt', rtt);
                this.listenTo(this, 'resize', this.resizeRTT);
                this.resizeRTT();
            } else {
                this.set('rtt.enabled', true);
            }
        },

        resizeRTT: function () {
            var rtt = this.get('rtt');

            if (rtt.initialized && rtt.enabled) {
                var context = this.get('context'),
                    canvas = this.get('canvas'),
                    width = canvas.width,
                    height = canvas.height;

                if (!_.isUndefined(rtt.colorTexture)) {
                    delete rtt.colorTexture;
                }

                rtt.colorTexture = new Texture(
                    { context: context },
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE)
                );

                rtt.fbo.attachColorTexture(rtt.colorTexture);

                if (this.extensionAvailable('WEBGL_depth_texture')) {
                    if (!_.isUndefined(rtt.depthTexture)) {
                        delete rtt.depthTexture;
                    }

                    rtt.depthTexture = new Texture(
                        { context: context },
                        _.extend({
                            source: null,
                            width: width,
                            height: height,
                            format: 'DEPTH_COMPONENT',
                            type: 'UNSIGNED_SHORT'
                        }, constants.RTT.TEXTURE)
                    );

                    rtt.fbo.attachDepthTexture(rtt.depthTexture);
                } else {
                    if (!_.isUndefined(rtt.depthbuffer)) {
                        delete rtt.depthbuffer;
                    }

                    rtt.depthbuffer = context.createRenderbuffer();

                    context.bindRenderbuffer(context.RENDERBUFFER,
                        rtt.depthbuffer);
                    context.renderbufferStorage(
                        context.RENDERBUFFER,
                        context.DEPTH_COMPONENT16,
                        width,
                        height
                    );

                    rtt.fbo.attachDepthBuffer(rtt.depthbuffer);
                }
            }
        }
    };

}) (modules['gl/framebuffer'],modules['gl/program'],modules['gl/canvas/constants'],modules['gl/texture'],modules['geometry/mesh']);


modules['gl/canvas/postprocessing'] = (function (Framebuffer,constants,Texture) {

    return {
        initializePostprocessing: function () {
            if (!this.get('postprocessing.initialized')) {
                _.bindAll(this, 'resizePostprocessing');

                var context = this.get('context'),
                    postprocessing = {
                        primary: {
                            fbo: new Framebuffer({ context: context })
                        },
                        secondary: {
                            fbo: new Framebuffer({ context: context })
                        },
                        initialized: true,
                        enabled: true
                    };

                this.set('postprocessing', postprocessing);
                this.listenTo(this, 'resize', this.resizePostprocessing);
                this.resizePostprocessing();
            } else {
                this.set('postprocessing.enabled', true);
            }
        },

        resizePostprocessing: function() {
            var postprocessing = this.get('postprocessing');

            if (postprocessing.initialized && postprocessing.enabled) {
                this.resizePostprocessingComponent(postprocessing.primary);
                this.resizePostprocessingComponent(postprocessing.secondary);
            }
        },

        resizePostprocessingComponent: function (component) {
            var context = this.get('context'),
                canvas = this.get('canvas'),
                width = canvas.width,
                height = canvas.height;

            if (!_.isUndefined(component.colorTexture)) {
                delete component.colorTexture;
            }

            component.colorTexture = new Texture(
                { context: context },
                _.extend({
                    source: null,
                    width: width,
                    height: height
                }, constants.RTT.TEXTURE)
            );

            component.fbo.attachColorTexture(component.colorTexture);
        }
    };

}) (modules['gl/framebuffer'],modules['gl/canvas/constants'],modules['gl/texture']);


modules['gl/canvas/extensions'] = (function (constants) {

    var prefixes = ['', 'WEBKIT_', 'MOZ_'];

    return {

        initializeExtensions: function () {
            var requiredExtensions = constants.EXTENSIONS,
                context = this.get('context'),
                availableExtensions = {},
                extensions = {};

            _.each(requiredExtensions, function (extensionName) {
                _.each(prefixes, function (prefix) {
                    var name = prefix + extensionName,
                        extension = context.getExtension(name);

                    if (!_.isNull(extension)) {
                        availableExtensions[extensionName] = true;
                        extensions[extensionName] = extension;
                        return false;
                    }
                }, this);
            }, this);

            this.set('availableExtensions', availableExtensions);
            this.set('extensions', extensions);
        },

        extensionAvailable: function (name) {
            return this.get('availableExtensions.' + name);
        },

        getExtension: function (name) {
            if (this.extensionAvailable(name)) {
                return this.get('extensions.' + name);
            }
        }

    };

}) (modules['gl/canvas/constants']);

modules['gl/canvas/extend-context'] = (function (constants) {

    function extendContext(context, methodName, getter) {
        var originalMethod = context[methodName];

        context['_' + methodName] = originalMethod;

        context[methodName] = (function (locationName) {
            var program = this._currentProgram,
                location, actualArguments;

            if (!_.isUndefined(program)) {
                location = program[getter].call(program, locationName);

                if (!_.isNull(location) && location !== -1) {
                    actualArguments = Array.prototype.slice.call(arguments, 1);
                    actualArguments.unshift(location);

                    originalMethod.apply(context, actualArguments);
                }
            }
        }).bind(context);
    }

    return function (context) {
        _.each(constants.CONTEXT_METHODS.UNIFORMS, function (methodName) {
            extendContext(this, methodName, 'getUniformLoc');
        }, context);

        _.each(constants.CONTEXT_METHODS.ATTRIBUTES, function (methodName) {
            extendContext(this, methodName, 'getAttribLoc');
        }, context);
    };

}) (modules['gl/canvas/constants']);

modules['gl/canvas/loader'] = (function (constants) {

    return {

        initializeLoader: function () {
            if (_.isUndefined(this.get('loader'))) {
                _.bindAll(this, 'resizeLoader', 'startLoader', 'stopLoader');

                var canvas = this.get('canvas'),
                    wrapper = document.createElement('div'),
                    inner = document.createElement('div'),
                    style = constants.LOADER.STYLE;

                wrapper.style.display = 'none';

                _.each(style.WRAPPER, function (value, property) {
                    wrapper.style[property] = value;
                });

                _.each(style.INNER, function (value, property) {
                    inner.style[property] = value;
                });

                wrapper.appendChild(inner);
                document.body.appendChild(wrapper);

                this.set('loader', wrapper);
                this.set('loaderInner', inner);
                this.set('loaderRotation', 0);

                this.listenTo(this, 'resize', this.resizeLoader);
                this.listenTo(this, 'startLoading', this.startLoader);
                this.listenTo(this, 'finishLoading', this.stopLoader);
                this.resizeLoader();
            }
        },

        resizeLoader: function () {
            var loader = this.get('loader');

            if (!_.isUndefined(loader)) {
                var rect = this.get('canvas').getBoundingClientRect();

                _.each(rect, function (value, property) {
                    loader.style[property] = value + 'px';
                });
            }
        },

        startLoader: function () {
            var loader = this.get('loader'),
                loaderInterval = this.get('loaderInterval');

            if (!_.isUndefined(loader) && _.isUndefined(loaderInterval)) {
                var loaderInner = this.get('loaderInner');

                loader.style.display = 'block';

                loaderInterval = root.setInterval((function () {
                    var loaderRotation = this.get('loaderRotation') +
                        constants.LOADER.SPEED;

                    this.set('loaderRotation', loaderRotation);

                    _.each(
                        constants.LOADER.ROTATION_PROPERTIES,
                        function (property) {
                            loaderInner.style[property] = 'rotate(' +
                                loaderRotation + 'deg)';
                        },
                        this
                    );

                }).bind(this), constants.LOADER.INTERVAL);

                this.set('loaderInterval', loaderInterval);
            }
        },

        stopLoader: function () {
            var loader = this.get('loader'),
                loaderInterval = this.get('loaderInterval');

            if (!_.isUndefined(loader) && !_.isUndefined(loaderInterval)) {
                loader.style.display = 'none';
                root.clearInterval(loaderInterval);
                this.set('loaderInterval');
            }
        }

    };

}) (modules['gl/canvas/constants']);

modules['gl/canvas/fps-counter'] = (function (constants) {

    return {

        initializeFpsCounter: function () {
            if (_.isUndefined(this.get('fpsCounter'))) {

                _.bindAll(this, 'positionFpsCounter', 'updateFpsCounter');

                var canvas = this.get('canvas'),
                    wrapper = document.createElement('div'),
                    leftTop = document.createElement('div'),
                    rightTop = document.createElement('div'),
                    leftBottom = document.createElement('div'),
                    rightBottom = document.createElement('div'),
                    graph = document.createElement('canvas'),
                    graphContext = graph.getContext('2d'),
                    style = constants.FPS_COUNTER.STYLE;

                _.each(style.WRAPPER, function (value, property) {
                    wrapper.style[property] = value;
                });

                _.each(style.GRAPH, function (value, property) {
                    graph.style[property] = value;
                });

                _.each(style.INFO, function (value, property) {
                    leftTop.style[property] = value;
                    rightTop.style[property] = value;
                    leftBottom.style[property] = value;
                    rightBottom.style[property] = value;
                });

                _.each(style.INFO_HEADER, function (value, property) {
                    leftTop.style[property] = value;
                    rightTop.style[property] = value;
                });

                leftTop.innerHTML = 'INST';
                rightTop.innerHTML = 'AVG';

                wrapper.appendChild(leftTop);
                wrapper.appendChild(rightTop);
                wrapper.appendChild(leftBottom);
                wrapper.appendChild(rightBottom);
                wrapper.appendChild(graph);
                document.body.appendChild(wrapper);

                graph.width = graph.offsetWidth;
                graph.height = graph.offsetHeight;

                this.set('fpsCounter', {
                    wrapper: wrapper,
                    instant: leftBottom,
                    average: rightBottom,
                    frames: [],
                    graph: graph,
                    graphContext: graphContext,
                    time: _.now(),
                    sum: 0,
                    count: 0
                });

                this.listenTo(this, 'resize', this.positionFpsCounter);
                this.listenTo(this, 'finishRendering', this.updateFpsCounter);
                this.positionFpsCounter();
            }
        },

        positionFpsCounter: function () {
            var wrapper = this.get('fpsCounter.wrapper');

            if (!_.isUndefined(wrapper)) {
                var rect = this.get('canvas').getBoundingClientRect();

                wrapper.style.top = rect.top +
                    constants.FPS_COUNTER.POSITION_OFFSET + 'px';
                wrapper.style.left = (rect.left + rect.width -
                    wrapper.offsetWidth -
                    constants.FPS_COUNTER.POSITION_OFFSET)  + 'px';
            }
        },

        updateFpsCounter: function () {
            var data = this.get('fpsCounter'),
                time = _.now(),
                interval = time - data.time,
                instantFps = 1000 / interval,
                averageFps,
                sum = 0,
                context = data.graphContext,
                i, x, height;

            data.sum += instantFps;
            data.count++;
            data.time = time;

            data.instant.innerHTML = Math.ceil(instantFps);

            if (data.count === constants.FPS_COUNTER.FRAME_GROUP_COUNT) {
                instantFps = data.sum / data.count;
                data.sum = 0;
                data.count = 0;

                data.frames.push(instantFps);

                if (data.frames.length > constants.FPS_COUNTER.FRAME_COUNT) {
                    data.frames.shift();
                }

                // Drawing the graph.
                context.clearRect(0, 0, data.graph.width, data.graph.height);

                i = data.frames.length;
                x = data.graph.width;
                while (i--) {
                    sum += data.frames[i];

                    if (x > 0) {
                        height = data.frames[i] * data.graph.height /
                            constants.FPS_COUNTER.GRAPH.MAX_FPS;

                        context.fillStyle = constants.FPS_COUNTER.GRAPH.COLOR;
                        context.fillRect(
                            x - constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            data.graph.height - height +
                                constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH,
                            constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            height - constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH
                        );

                        context.fillStyle =
                            constants.FPS_COUNTER.GRAPH.HIGHLIGHT;
                        context.fillRect(
                            x - constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            data.graph.height - height,
                            constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH
                        );

                        x -= constants.FPS_COUNTER.GRAPH.LINE_WIDTH;
                    }
                }

                averageFps = sum / data.frames.length;

                data.average.innerHTML = Math.ceil(averageFps);
            }
        },

    };

}) (modules['gl/canvas/constants']);


modules['utility/debug-output'] = (function () {

    return function (functionName, args) {
        console.info(
            'gl.' + functionName + '(' +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
            ')'
        );

        _.each(args, function (arg) {
            if (_.isUndefined(arg)) {
                console.warn(
                    "Undefined passed to gl." + functionName + "(" +
                    WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
                    ")"
                );
            }
        });
    };

}) ();


modules['gl/canvas'] = (function (namespace,Class,initialize,render,constants,rtt,postprocessing,extensions,extendContext,loader,fpsCounter,debugOutput,cursor) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');

            var canvas = this.get('canvas'),
                context,
                config = _.merge({}, namespace.config.CANVAS, options);

            this.set('config', config)
                .set('scenes', {})
                .set('rtt', { initialize: false, enabled: false })
                .set('postprocessing', { initialize: false, enabled: false });

            context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (config.debug) {
                context = WebGLDebugUtils.makeDebugContext(context, undefined,
                    debugOutput);
            }

            context.enable(context.DEPTH_TEST);

            extendContext(context);

            this.set('context', context);

            this.initializeExtensions();

            if (config.preloadAnimation) {
                this.initializeLoader();
            }

            if (config.fpsCounter) {
                this.initializeFpsCounter();
            }

            canvas.addEventListener('click', cursor.requestLock);
        },

        setScene: function (scene, callbacks) {

            var scenes = this.get('scenes');

            this.set('currentScene', scene);

            if (_.isUndefined(scenes[scene.uid])) {
                scenes[scene.uid] = { callbacks: {} };
                this.initializeScene(scene);
            }

            _.extend(scenes[scene.uid].callbacks, callbacks);

            this.listenTo(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.get('context'));
        },

        useProgram: function (program) {
            program.use(this.get('context'));
        }

    },
        initialize,
        render,
        rtt,
        postprocessing,
        extensions,
        loader,
        fpsCounter
    ), {

        setConfig: function (config) {
            _.extend(namespace.config.CANVAS, config);
        }

    });

}) (modules['scaffolding/namespace'],modules['scaffolding/class'],modules['gl/canvas/initialize'],modules['gl/canvas/render'],modules['gl/canvas/constants'],modules['gl/canvas/rtt'],modules['gl/canvas/postprocessing'],modules['gl/canvas/extensions'],modules['gl/canvas/extend-context'],modules['gl/canvas/loader'],modules['gl/canvas/fps-counter'],modules['utility/debug-output'],modules['interaction/cursor']);


modules['utility/load-file'] = (function () {

    var factories = [
            function () { return new XMLHttpRequest(); },
            function () { return new ActiveXObject('Msxml2.XMLHTTP'); },
            function () { return new ActiveXObject('Msxml3.XMLHTTP'); },
            function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
        ],
        create = function () {
            var obj = void 0;

            _.each(factories, function (factory) {
                if (_.isUndefined(obj)) {
                    try {
                        obj = factory();
                    } catch (e) { }
                }
            });

            return obj;
        };

    return function (url, callback) {
        var request = create();

        if (_.isUndefined(request)) {
            throw('AJAX request could not be instiantiated.');
        }

        request.open('GET', url, true);

        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;

            if (request.status !== 200 && request.status !== 304) {
                console.error('Error loading file: ' + url);
                return;
            }

            callback(request.responseText, request);
        };

        if (request.readyState == 4) return;
        request.send();
    };

}) ();

modules['shading/constants'] = {
    TYPE: {
        POINT: 'point',
        SPOT: 'spot'
    },
    TYPE_RAW: {
        POINT: 0,
        SPOT: 1
    }
};


modules['scaffolding/node'] = (function (Class) {

    return Class.extend({

        defaults: {
            children: {},

            position: { x: 0, y: 0, z: 0 },
            worldPosition: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 }
        },

        attributeTypes: {
            position: 'vec3',
            scale: 'vec3',
            rotation: 'vec3',
            worldPosition: 'vec3'
        },

        set: function (key, value) {
            switch (key) {
                case 'camera':
                case 'actor':
                    if (!_.isUndefined(value)) {
                        value.set('node', this);
                    }
                    break;
            }

            return Class.prototype.set.call(this, key, value);
        },

        initialize: function () {
            this.set('localModelMatrix', glm.mat4.create())
                .set('modelMatrix', glm.mat4.create());
        },

        addChild: function (child) {
            this.get('children')[child.uid] = child;
        },

        render: function (context, resources) {
            var textureUnits = [],
                camera = this.get('camera'),
                mesh, material, modelMatrix, texture, textures, alphaTexture;

            if (context._currentCamera !== camera) {
                mesh = this.get('mesh');
                material = this.get('material');
                modelMatrix = this.get('modelMatrix');
                texture = this.get('texture');
                textures = this.get('textures');
                alphaTexture = this.get('alphaTexture');

                if (!_.isUndefined(mesh)) {
                    context.uniformMatrix4fv('modelMat', false, modelMatrix);

                    if (!_.isUndefined(material)) {
                        material.render(context);
                    }

                    if (!_.isUndefined(texture)) {
                        resources.allTextures[texture].render(
                            textureUnits.length);
                        textureUnits.push(textureUnits.length);
                    } else if (!_.isUndefined(textures)) {
                        _.each(textures, function (texture) {
                            resources.allTextures[texture].render(
                                textureUnits.length);
                            textureUnits.push(textureUnits.length);
                        });
                    }

                    if (textureUnits.length > 0) {
                        context.uniform1i('textured', 1);

                        context.uniform1iv('colorTexture', textureUnits);

                        context.uniform1i('textureCount', textureUnits.length);
                    } else {
                        context.uniform1i('textured', 0);
                    }

                    if (!_.isUndefined(alphaTexture)) {
                        context.uniform1i('alphaTextured', 1);

                        resources.allTextures[alphaTexture]
                            .render(textureUnits.length, 'alphaTexture');
                    } else {
                        context.uniform1i('alphaTextured', 0);
                    }

                    resources.allMeshes[mesh].render();
                }
            }

            _.each(this.get('children'), function (child) {
                child.render(context, resources);
            }, this);
        },

        prepareRender: function (parentModelMatrix) {
            var localModelMatrix = this.updateModelMatrix(),
                modelMatrix = this.get('modelMatrix'),
                position = this.get('position'),
                camera = this.get('camera');

            if (_.isUndefined(parentModelMatrix)) {
                glm.mat4.copy(modelMatrix, localModelMatrix);
            } else {
                glm.mat4.multiply(modelMatrix, parentModelMatrix,
                    localModelMatrix);
            }

            if (!_.isUndefined(camera)) {
                camera.prepareRender(parentModelMatrix);
            }

            glm.vec3.transformMat4(this.get('worldPosition'), position,
                modelMatrix);

            _.each(this.get('children'), function (child) {
                child.prepareRender(modelMatrix);
            }, this);

            // if (!_.isUndefined(this.billboard)) {
            //     this.billboard.prepareRender();
            // }
        },

        updateModelMatrix: function () {
            var localModelMatrix = this.get('localModelMatrix'),
                rotation = this.get('rotation');

            glm.mat4.identity(localModelMatrix);

            glm.mat4.translate(localModelMatrix, localModelMatrix,
                this.get('position'));

            glm.mat4.rotateX(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[0]));
            glm.mat4.rotateY(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[1]));
            glm.mat4.rotateZ(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[2]));

            glm.mat4.scale(localModelMatrix, localModelMatrix,
                this.get('scale'));

            return localModelMatrix;
        }
    });

}) (modules['scaffolding/class']);


modules['shading/point'] = (function (constants,Class,Color) {

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

}) (modules['shading/constants'],modules['scaffolding/class'],modules['utility/color']);


modules['shading/spot'] = (function (constants,Point) {

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

}) (modules['shading/constants'],modules['shading/point']);


modules['shading/material'] = (function (Class) {

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

}) (modules['scaffolding/class']);
modules['scaffolding/scene/load'] = (function (loadFile,programConstants,geometryConstants,lightingConstants,Node,Actor,Camera,LightPoint,LightSpot,Color,Material) {

    return {

        load: function (schema) {
            var parsedSchema, sources,
                resourceCount = 0,
                config = this.get('config');

            sources = {
                meshNames: schema.meshes,
                meshSources: {},

                textureNames: {},
                textureOptions: [],
                textureSources: {},

                programs: schema.programs,
                shaders: {},
                defaultProgram: schema.defaultProgram,

                actorOptions: schema.actors,

                cameraOptions: schema.cameras,

                lightOptions: schema.lights,

                cameras: [],

                actors: [],

                lights: [],

                materials: {},

                tree: []
            };
            this.set('sources', sources);

            // Grab resource information.
            parsedSchema = {
                meshPaths: [],
                texturePaths: [],
                shaderPaths: []
            };
            this.set('parsedSchema', parsedSchema);

            // Postprocessing.
            if (!_.isUndefined(schema.postprocessing)) {
                sources.postprocessing = [];

                _.each(schema.postprocessing, function (name) {
                    if (name.indexOf('SHADER') === 0) {
                        var originalName = name;

                        name = name.replace('SHADER', 'PREDEFINED');
                        options = this.getDotChain(name, programConstants);

                        if ('vertex' in options && 'fragment' in options) {
                            sources.postprocessing.push(originalName);
                        } else {
                            _.each(options, function (subProgram, name) {
                                sources.postprocessing.push(
                                    originalName + '.' + name);
                            });
                        }
                    }
                }, this);

                _.each(sources.postprocessing, function (name) {
                    if (name.indexOf('SHADER') === 0) {
                        schema.programs[name] = name;
                    }
                }, this);
            }

            // Shaders.
            _.each(schema.programs, function (options, name) {
                if (_.isString(options) && options.indexOf('SHADER') === 0) {
                    options = options.replace('SHADER', 'PREDEFINED');
                    options = this.getDotChain(options, programConstants);

                    if (_.isPlainObject(options)) {
                        _.each(options, function (path, key) {
                            options[key] = config.paths.shaders + path;
                        }, this);

                        schema.programs[name] = options;
                    }
                }

                if (_.isPlainObject(options)) {
                    _.each(options, function (path) {
                        if (_.indexOf(parsedSchema.shaderPaths, path) === -1) {
                            parsedSchema.shaderPaths.push(path);
                        }
                    });
                }
            }, this);

            // Meshes.
            _.each(schema.meshes, function (path) {
                if (_.indexOf(parsedSchema.meshPaths, path) === -1) {
                    parsedSchema.meshPaths.push(path);
                }
            });

            // Textures.
            _.each(schema.textures, function (options, name) {
                sources.textureOptions.push(options);
                sources.textureNames[name] = sources.textureOptions.length - 1;

                if (_.indexOf(parsedSchema.texturePaths, options.path) === -1) {
                    parsedSchema.texturePaths.push(options.path);
                }
            });

            // Materials.
            _.each(schema.materials, function(options, name) {
                sources.materials[name] = new Material(options);
            });

            // Grab inline resource information.
            _.each(schema.tree, this.parseNode, this);

            // Instantiate async resources.
            resourceCount += parsedSchema.shaderPaths.length;
            resourceCount += parsedSchema.meshPaths.length;
            resourceCount += parsedSchema.texturePaths.length;
            this.set('resourceCount', resourceCount);

            this.loadAsyncResources(parsedSchema.shaderPaths, this.loadShader);
            this.loadAsyncResources(parsedSchema.meshPaths, this.loadMesh);
            this.loadAsyncResources(parsedSchema.texturePaths,
                this.loadTexture);

            // Global material constants.
            sources.ambientLight = new Color(schema.ambientLight);

            if (!_.isUndefined(schema.backgroundColor)) {
                sources.backgroundColor = new Color(schema.backgroundColor);
            }

            // Instantiate tree.
            sources.tree = {
                object: new Node(),
                children: []
            };

            _.each(schema.tree, function (node) {
                this.instantiateNode(sources.tree, node);
            }, this);
        },

        getDotChain: function (path, source) {
            if (_.isString(path)) {
                path = path.split('.');
            }

            var property = _.first(path);

            if (path.length === 1) {
                return source[property];
            } else if (property in source) {
                return this.getDotChain(_.rest(path), source[property]);
            }
        },

        parseNode: function (node) {
            var sources = this.get('sources'),
                parsedSchema = this.get('parsedSchema');

            if (!_.isUndefined(node.mesh) && _.isString(node.mesh)) {
                if (node.mesh in sources.meshNames) {
                    node.mesh = sources.meshNames[node.mesh];
                } else {
                    if (_.indexOf(parsedSchema.meshPaths,
                            node.mesh) === -1) {
                        parsedSchema.meshPaths.push(node.mesh);
                    }
                }
            }

            if (!_.isUndefined(node.texture)) {
                node.texture = this.parseTexture(node.texture);
            } else if (!_.isUndefined(node.textures) &&
                    _.isArray(node.textures)) {
                var textures = [];

                _.each(node.textures, function (texture) {
                    textures.push(this.parseTexture(texture));
                }, this);

                node.textures = textures;
            }

            if (!_.isUndefined(node.alphaTexture)) {
                node.alphaTexture = this.parseTexture(node.alphaTexture);
            }

            if (!_.isUndefined(node.children) && _.isArray(node.children)) {
                _.each(node.children, this.parseNode, this);
            }
        },

        parseTexture: function (options) {
            var sources = this.get('sources'),
                parsedSchema = this.get('parsedSchema');

            if (_.isString(options) && options in sources.textureNames) {
                return sources.textureNames[options];
            } else if (_.isPlainObject(options)) {
                sources.textureOptions.push(options);

                if (_.indexOf(parsedSchema.texturePaths, options.path) === -1) {
                    parsedSchema.texturePaths.push(options.path);
                }

                return parsedSchema.texturePaths.length - 1;
            }
        },

        instantiateLight: function (options) {
            var light;

            switch (options.type) {
                case lightingConstants.TYPE.POINT:
                    light = new LightPoint(options);
                    break;
                case lightingConstants.TYPE.SPOT:
                    light = new LightSpot(options);
                    break;
            }

            this.get('sources.lights').push(light);

            return light;
        },

        instantiateNode: function (parent, options) {
            var node = {
                    name: options.name,
                    children: []
                },
                light,
                sources = this.get('sources'),
                children = options.children;

            // Set mesh.
            if (!_.isUndefined(options.mesh)) {
                node.mesh = options.mesh;

                // Instantiate material.
                if (!_.isUndefined(options.material)) {
                    options.material = this.instantiateNodeProperty(
                        options.material,
                        sources.materials,
                        function (options) { return options; },
                        function (options) {
                            return new Material(options);
                        }
                    );
                }

                node.texture = options.texture;
                node.textures = options.textures;
                node.alphaTexture = options.alphaTexture;
            }

            // Instantiate actor.
            options.actor = this.instantiateNodeProperty(options.actor,
                sources.actorOptions, function (options) {
                    var actor = new Actor(options);

                    sources.actors.push(actor);

                    return actor;
                });

            // Instantiate camera.
            options.camera = this.instantiateNodeProperty(options.camera,
                sources.cameraOptions, function (options) {
                    var camera = new Camera(options);

                    sources.cameras.push(camera);
                    if (options.default) {
                        sources.defaultCamera = camera;
                    }

                    return camera;
                });

            delete options.children;

            // Instantiate node.
            node.object = new Node(options);

            // Instantiate light.
            light = this.instantiateNodeProperty(options.light,
                sources.lightOptions, this.instantiateLight);

            if (!_.isUndefined(light)) {
                light.set('node', node.object);
            }

            if (!_.isUndefined(children) && _.isArray(children)) {
                _.each(children, function (child) {
                    this.instantiateNode(node, child);
                }, this);
            }

            parent.children.push(node);
        },

        instantiateNodeProperty: function (prop, sources, constructor,
                constructorNew) {
            var instance;

            if (!_.isUndefined(prop)) {
                if (_.isString(prop) && prop in sources) {
                    instance = constructor.call(this, sources[prop]);
                } else if (_.isPlainObject(prop)) {
                    instance = (_.isUndefined(constructorNew) ? constructor :
                        constructorNew).call(this, prop);
                }
            }

            return instance;
        },

        resourceLoaded: function () {
            var resourceCount = this.get('resourceCount');

            resourceCount--;

            if (resourceCount <= 0) {
                this.set('loading', false);
                this.trigger('loaded');
            } else {
                this.set('resourceCount', resourceCount);
            }
        },

        loadAsyncResources: function (resources, callback) {
            if (!_.isUndefined(resources) && (_.isArray(resources) ||
                    _.isPlainObject(resources))) {
                _.each(resources, callback, this);
            }
        },

        loadShader: function (path) {
            loadFile(path, (function (source) {
                this.get('sources.shaders')[path] = source;
                this.resourceLoaded();
            }).bind(this));
        },

        loadMesh: function (path) {
            var originalPath = path;

            if (path.indexOf('MESH') !== -1) {
                var splitPath = options.source.split('.');

                if (splitPath[1] in geometryConstants.MESHES) {
                    path = this.get('config.paths.meshes') +
                        geometryConstants.MESHES[splitPath[1]];
                }
            }

            loadFile(path, (function (source) {
                this.get('sources.meshSources')[originalPath] = source;
                this.resourceLoaded();
            }).bind(this));
        },

        loadTexture: function (path) {
            var image = new Image();

            image.addEventListener('load', (function () {
                this.get('sources.textureSources')[path] = image;
                this.resourceLoaded();
            }).bind(this));

            image.src = path;
        }

    };
}) (modules['utility/load-file'],modules['gl/program/constants'],modules['geometry/constants'],modules['shading/constants'],modules['scaffolding/node'],modules['interaction/actor'],modules['interaction/camera'],modules['shading/point'],modules['shading/spot'],modules['utility/color'],modules['shading/material']);

modules['utility/animation-frame'] = (function () {

    var lastTime = 0,
        vendors = ['webkit', 'moz'],
        requestAnimationFrame = root.requestAnimationFrame,
        cancelAnimationFrame = root.cancelAnimationFrame;

    _.each(vendors, function (vendor) {
        if (_.isUndefined(requestAnimationFrame)) {
            requestAnimationFrame = root[vendor + 'RequestAnimationFrame'];

            cancelAnimationFrame = root[vendor + 'CancelAnimationFrame'];
        }
    });

    if (_.isUndefined(requestAnimationFrame)) {
        requestAnimationFrame = function(callback, element) {
            var currentTime = new Date().getTime(),
                timeToCall = Math.max(0, 16 - (currentTime - lastTime)),
                id;

            id = setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);

            lastTime = currentTime + timeToCall;

            return id;
        };
    }

    if (_.isUndefined(cancelAnimationFrame)) {
        cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }

    return {
        request: requestAnimationFrame.bind(root),
        cancel: cancelAnimationFrame.bind(root)
    };

}) ();


modules['scaffolding/scene'] = (function (Class,namespace,load,loadFile,animationFrame) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'resourceLoaded', 'render');

            var path = this.get('source'),
                config = _.merge({}, namespace.config.SCENE, options);

            this.set('config', config)
                .set('loading', true);

            loadFile(path, (function (raw) {
                this.load(JSON.parse(raw));
            }).bind(this));
        },

        startRendering: function () {
            var request = this.get('request');

            if (!_.isUndefined(request)) {
                animationFrame.cancel(request);
            }

            this.set('previousTime', 0)
                .set('request', animationFrame.request(this.render));

            return this;
        },

        render: function (currentTime) {
            var interval = (currentTime - this.get('previousTime')) / 1000;

            if (this.isLoaded()) {
                var sources = this.get('sources');

                _.each(sources.actors, function (actor) {
                    actor.update(interval);
                });

                _.each(sources.cameras, function (camera) {
                    camera.update(interval);
                });

                sources.tree.object.prepareRender();
            }

            this.trigger('render', { interval: interval })
                .set('previousTime', currentTime)
                .set('request', animationFrame.request(this.render));
        },

        isLoaded: function () {
            return !this.get('loading');
        }

    }, load), {

        setConfig: function (config) {
            _.extend(namespace.config.SCENE, config);
        }

    });

}) (modules['scaffolding/class'],modules['scaffolding/namespace'],modules['scaffolding/scene/load'],modules['utility/load-file'],modules['utility/animation-frame']);


modules['main'] = (function (Canvas,Scene) {

    return {

        Canvas: Canvas,

        Scene: Scene

    };

}) (modules['gl/canvas'],modules['scaffolding/scene']);

    return modules['main'];
});