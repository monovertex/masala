
(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(
            ['lodash', 'gl-matrix', 'keypress', 'webgl-debug'],
            function(_, glm, keypress) {
                factory(root, _, glm, keypress, root.WebGLDebugUtils);

                return root.Masala;
            }
        );
    } else {
        factory(root, root._, root, root.keypress, root.WebGLDebugUtils);
    }

}) (this, function(root, _, glm, keypress, WebGLDebugUtils) {

    var modules = {};

modules['utility/namespace'] = (function () {

    return root.Masala || (root.Masala = {});

}) ();


modules['utility/class'] = (function () {

    var uid = 0,
        Class = function () {
            this.uid = uid++;

            if (this.initialize) {
                this.initialize.apply(this, arguments);
            }
        };

    _.extend(Class.prototype, {
        listeners: {},

        listen: function (object, eventName, callback) {
            if (!_.isUndefined(object.listeners)) {
                if (_.isUndefined(object.listeners[eventName])) {
                    object.listeners[eventName] = {};
                }

                if (_.isUndefined(object.listeners[eventName][this._uid])) {
                    object.listeners[eventName][this.uid] = [];
                }

                object.listeners[eventName][this.uid].push(callback);
            }
        },

        trigger: function (eventName, data) {
            if (eventName in this.listeners) {
                _.each(this.listeners[eventName], function (listener) {
                    _.each(listener, function (callback) {
                        if (_.isFunction(callback)) {
                            callback(this, eventName, data);
                        }
                    }, this);
                }, this);
            }
        },

        delegate: function (model, functionName) {
            this[functionName] = function () {
                return model[functionName](arguments);
            };
        },

        delegateEvent: function (model, eventName) {
            this.listen(model, eventName, (function () {
                this.trigger(eventName);
            }).bind(this));
        },

        listenToKey: function (key, keyDownCallback, keyUpCallback) {
            if (_.isUndefined(this.keyListener)) {
                this.keyListener = new keypress.Listener();
            }

            this.keyListener.register_combo({
                keys: key,
                on_keyup: keyUpCallback,
                on_keydown: keyDownCallback,
                prevent_repeat: false
            });
        }
    });

    Class.extend = function (properties, staticProperties) {
        var parent = this,
            child,
            Surrogate;

        child = function () { return parent.apply(this, arguments); };

        _.extend(child, parent, staticProperties);

        Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (properties) {
            _.extend(child.prototype, properties);
        }

        child.__super__ = parent.prototype;

        return child;
    };

    return Class;

}) ();

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
                    X: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/motion/x.frag'
                    },
                    Y: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/motion/y.frag'
                    }
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

        initialize: function (context, sources) {
            var program = context.createProgram();

            _.each(sources, function(source, type) {
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
                    console.log(context.getShaderInfoLog(shader));
                    throw 'Shader compilation error ';
                }

                context.attachShader(program, shader);
            }, this);

            context.linkProgram(program);

            if (!context.getProgramParameter(program, context.LINK_STATUS)) {
                throw('Could not link shaders');
            }

            this.context = context;
            this.program = program;
            this.uniforms = {};
            this.attributes = {};

            _.bindAll(this, 'getUniformLoc', 'getAttribLoc', 'use');
        },

        getUniformLoc: function (uniform) {
            var context = this.context;

            if (_.isUndefined(this.uniforms[uniform])) {
                this.uniforms[uniform] = context.getUniformLocation(
                    this.program, uniform);
            }

            return this.uniforms[uniform];
        },

        getAttribLoc: function (attribute) {
            var context = this.context;

            if (_.isUndefined(this.attributes[attribute])) {
                this.attributes[attribute] = context.getAttribLocation(
                    this.program, attribute);

                if (this.attributes[attribute] > 0 ||
                        this.attributes[attribute] === 0) {
                    context.enableVertexAttribArray(this.attributes[attribute]);
                }
            }

            return this.attributes[attribute];
        },

        use: function (attribute) {
            this.context.useProgram(this.program);
            this.context._currentProgram = this;
        }

    });

}) (modules['utility/class'],modules['gl/program/constants']);


modules['gl/texture'] = (function (Class) {

    return Class.extend({

        initialize: function (options, context) {
            var texture = context.createTexture(),
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

                this.width = options.width;
                this.height = options.height;

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

            this.texture = texture;
            this.context = context;

            this.unbind();
        },

        bind: function () {
            this.context.bindTexture(this.context.TEXTURE_2D, this.texture);
        },

        unbind: function () {
            this.context.bindTexture(this.context.TEXTURE_2D, null);
        },

        render: function (unit, alpha) {
            var context = this.context,
                program = context._currentProgram,
                uniformName = (alpha ? 'alphaTexture' : 'colorTexture');

            context.activeTexture(context.TEXTURE0 + unit);
            this.bind();
            context.uniform1i(program.getUniformLoc(uniformName), unit);
        }

    });

}) (modules['utility/class']);

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

}) (modules['utility/class']);


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
                    vertexRaw = raw.vertices[parseInt(
                        faceItemData[0], 10) - 1],
                    normalRaw,
                    texcoordRaw;

                if (faceFormat === OBJ.FACE_FORMAT.VTN ||
                        faceFormat === OBJ.FACE_FORMAT.VN) {
                    normalRaw = raw.normals[parseInt(
                        faceItemData[2], 10) - 1];
                }



                if (faceFormat === OBJ.FACE_FORMAT.VT ||
                        faceFormat === OBJ.FACE_FORMAT.VTN) {
                    texcoordRaw = raw.texcoords[parseInt(
                        faceItemData[1], 10) - 1];
                }

                switch (faceFormat) {
                    case OBJ.FACE_FORMAT.V:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VN:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            normalRaw[0], normalRaw[1], normalRaw[2]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VTN:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            normalRaw[0], normalRaw[1], normalRaw[2],
                            texcoordRaw[0], texcoordRaw[1]
                        );
                        break;
                    case OBJ.FACE_FORMAT.VT:
                        vertex = new Vertex(
                            vertexRaw[0], vertexRaw[1], vertexRaw[2],
                            undefined, undefined, undefined,
                            texcoordRaw[0], texcoordRaw[1]
                        );
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
                    vertices: _.map(source.vertices, function (vertex) {
                        return new Vertex(vertex);
                    }),
                    indices: _.flatten(source.indices, true)
                };
            }
        }
    };
}) (modules['geometry/vertex'],modules['geometry/constants']);


modules['geometry/mesh'] = (function (geometryConstants,programConstants,Class,parse) {

    return Class.extend(_.extend({

        initialize: function (context, source) {
            this.context = context;

            var rawData = this.parse(source),
                vbo = context.createBuffer(),
                ibo = context.createBuffer(),
                coordsList, flat, i, maxCoord = 0;

            _.bindAll(this, 'linkAttributes');

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

            this.vbo = vbo;
            this.ibo = ibo;
            this.indexCount = rawData.indices.length;
        },

        render: function () {
            var context = this.context;

            context.bindBuffer(context.ARRAY_BUFFER, this.vbo);

            this.linkAttributes();

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.ibo);

            context.drawElements(context.TRIANGLES, this.indexCount,
                context.UNSIGNED_SHORT, 0);
        },

        linkAttributes: function () {
            var context = this.context,
                program = context._currentProgram,
                VERTEX = geometryConstants.VERTEX,
                attributePosition = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_POSITION),
                attributeNormal = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_NORMAL),
                attributeTexcoords = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_TEX_COORDS);

            if (attributePosition > 0 || attributePosition === 0) {
                context.vertexAttribPointer(
                    attributePosition,
                    VERTEX.ITEM_SIZE.POSITION,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.POSITION
                );
            }

            if (attributeNormal > 0 || attributeNormal === 0) {
                context.vertexAttribPointer(
                    attributeNormal,
                    VERTEX.ITEM_SIZE.NORMAL,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.NORMAL
                );
            }

            if (attributeTexcoords > 0 || attributeTexcoords === 0) {
                context.vertexAttribPointer(
                    attributeTexcoords,
                    VERTEX.ITEM_SIZE.TEX_COORD,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.TEX_COORD
                );
            }
        }

    }, parse));

}) (modules['geometry/constants'],modules['gl/program/constants'],modules['utility/class'],modules['geometry/mesh/parse']);

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
            'roll': 'x'
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

    return {

        initializeMovement: function (options) {
            var defaults = constants.DEFAULTS.MOVEMENT;

            this.movementSpeed = { x: 0, y: 0, z: 0 };
            this.movementControlToggle = {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };
            this.movementToggle =  {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };
            this.accelerationToggle =  { x: false, y: false, z: false };

            this.minimumSpeed = {
                x: defaults.MINIMUM_SPEED,
                y: defaults.MINIMUM_SPEED,
                z: defaults.MINIMUM_SPEED
            };

            this.maximumSpeed = {
                x: defaults.MAXIMUM_SPEED,
                y: defaults.MAXIMUM_SPEED,
                z: defaults.MAXIMUM_SPEED
            };

            this.acceleration = {
                x: defaults.ACCELERATION,
                y: defaults.ACCELERATION,
                z: defaults.ACCELERATION
            };

            this.deceleration = {
                x: defaults.ACCELERATION,
                y: defaults.ACCELERATION,
                z: defaults.ACCELERATION
            };

            if (!_.isUndefined(options.speed)) {
                this.setDefaultValues(options.speed.min, this.minimumSpeed);
                this.setDefaultValues(options.speed.max, this.maximumSpeed);
            }

            this.setDefaultValues(options.acceleration, this.acceleration);
            this.setDefaultValues(options.deceleration, this.deceleration);

            // Directional vectors.
            if (this.checkVector(options.forward)) {
                this.forward = glm.vec3.fromValues(options.forward.x,
                    options.forward.y, options.forward.z);
                glm.vec3.normalize(this.forward, this.forward);
            } else {
                this.forward = glm.vec3.fromValues(1, 0, 0);
            }

            if (this.checkVector(options.up)) {
                this.up = glm.vec3.fromValues(options.up.x,
                    options.up.y, options.up.z);
                glm.vec3.normalize(this.up, this.up);
            } else {
                this.up = glm.vec3.fromValues(0, 1, 0);
            }

            this.right = glm.vec3.create();
            glm.vec3.cross(this.right, this.forward, this.up);
            glm.vec3.normalize(this.right, this.right);

            glm.vec3.cross(this.up, this.right, this.forward);
            glm.vec3.normalize(this.up, this.up);
        },

        updateMovement: function (interval) {

            _.each(['x', 'y', 'z'], function (axis) {
                var distance;

                if (this.movementToggle[axis] !== constants.NO_MOVEMENT) {
                    if (this.accelerationToggle[axis]) {
                        if (this.movementSpeed[axis] <
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] = this.minimumSpeed[axis];
                        }

                        if (this.movementSpeed[axis] <
                                this.maximumSpeed[axis]) {
                            this.movementSpeed[axis] += (interval *
                                this.acceleration[axis]);
                        }

                        if (this.movementSpeed[axis] >
                                this.maximumSpeed[axis]) {
                            this.movementSpeed[axis] = this.maximumSpeed[axis];
                        }
                    } else {
                        if (this.movementSpeed[axis] >
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] -= (interval *
                                this.deceleration[axis]);

                            if (this.movementControlToggle[axis] !==
                                    constants.NO_MOVEMENT) {
                                this.movementSpeed[axis] -= (interval *
                                    this.acceleration[axis]);
                            }
                        }

                        if (this.movementSpeed[axis] <
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] = 0;
                        }
                    }

                    if (this.movementSpeed[axis] > this.minimumSpeed[axis]) {
                        distance = interval * this.movementSpeed[axis] *
                            this.movementToggle[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    } else {
                        this.movementToggle[axis] = constants.NO_MOVEMENT;
                    }
                }

                if (this.movementToggle[axis] === constants.NO_MOVEMENT &&
                        this.movementControlToggle[axis] !==
                        constants.NO_MOVEMENT) {
                    this.movementToggle[axis] =
                        this.movementControlToggle[axis];
                }

                if (this.movementToggle[axis] ===
                        this.movementControlToggle[axis]) {
                    this.accelerationToggle[axis] = true;
                }

                if (this.movementControlToggle[axis] ===
                        constants.NO_MOVEMENT) {
                    this.accelerationToggle[axis] = false;
                }

            }, this);
        },

        move: function (direction, distance) {
            glm.vec3.add(
                this.node.position,
                this.node.position,
                glm.vec3.multiply([], direction, [distance, distance, distance])
            );
        },

        moveForward: function (distance) {
            this.move(this.forward, distance);
        },

        moveUp: function (distance) {
            this.move(this.up, distance);
        },

        moveRight: function (distance) {
            this.move(this.right, distance);
        },
    };

}) (modules['interaction/actor/constants']);

modules['interaction/actor/rotation'] = (function (constants) {

    return {

        initializeRotation: function (options) {
            var defaults = constants.DEFAULTS.ROTATION;

            // Rotation variables.
            this.rotationToggle = {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };

            this.rotationMouseControl = {
                x: constants.ROTATIONS.NONE,
                y: constants.ROTATIONS.NONE
            };

            this.mouseDisplacement = { x: 0, y: 0 };

            this.rotationAngle = { x: 0, y: 0, z: 0 };

            this.gimbals = (_.isBoolean(options.gimbals) ?
                options.gimbals : true);

            this.rotationSensitivity = {
                x: defaults.SENSITIVITY,
                y: defaults.SENSITIVITY,
                z: defaults.SENSITIVITY
            };

            this.rotationSpeed = {
                x: defaults.SPEED,
                y: defaults.SPEED,
                z: defaults.SPEED
            };

            if (!_.isUndefined(options.controls) &&
                    !_.isUndefined(options.controls.mouse)) {
                this.setDefaultValues(options.controls.mouse.sensitivity,
                    this.rotationSensitivity);
            }

            this.setDefaultValues(options.rotationSpeed, this.rotationSpeed);

            if (_.isUndefined(options.gimbals)) {
                this.rotationWithGimbals = true;

                if (_.isArray(options.gimbals) &&
                        options.gimbals.length === 3) {
                    this.rotationAxes = options.gimbals;
                } else {
                    this.rotationAxes = defaults.ORDER;
                }
            } else {
                this.rotationWithGimbals = false;

                if (_.isArray(options.rotationOrder) &&
                        options.rotationOrder.length === 3) {
                    this.rotationAxes = options.rotationOrder;
                } else {
                    this.rotationAxes = defaults.ORDER;
                }
            }

            _.bindAll(this, 'cursorMove');
        },

        cursorMove: function (cursor, eventName, data) {
            var angles = {};

            angles[this.rotationMouseControl.x] = constants.MOUSE_FACTOR *
                this.rotationSensitivity[this.rotationMouseControl.x] * data.x;
            angles[this.rotationMouseControl.y] = constants.MOUSE_FACTOR *
                this.rotationSensitivity[this.rotationMouseControl.y] * data.y;

            this.mouseDisplacement.x += angles[this.rotationMouseControl.x];
            this.mouseDisplacement.y += angles[this.rotationMouseControl.y];

            this.rotate(angles, true);
        },

        updateRotation: function (interval) {
            this.rotate(interval);
        },

        resetMouseDisplacement: function () {
            this.mouseDisplacement.x = 0;
            this.mouseDisplacement.y = 0;
        },

        getAngleIncrease: function (axis, angleData, exact) {
            if (exact) {
                if (_.isPlainObject(angleData)) {
                    return angleData[axis] || 0;
                } else {
                    return angleData || 0;
                }
            } else {
                return this.rotationSpeed[axis] * angleData *
                    this.rotationToggle[axis];
            }
        },

        rotate: function (angleData, exact) {
            if (this.rotationWithGimbals) {
                this.rotateGimbals(this.rotationAxes, angleData, exact);
            } else {
                this.rotateDirect(this.rotationAxes, angleData, exact);
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
                angle = this.rotationAngle[axis],
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
                this.rotationAngle[axis] = angle;

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
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.forward, angle);

            glm.vec3.normalize(this.up,
                glm.vec3.transformQuat(this.up, this.up, rotation));
            glm.vec3.normalize(this.right,
                glm.vec3.transformQuat(this.right, this.right, rotation));
        },

        rotateY: function (angle) {
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.up, angle);

            glm.vec3.normalize(this.forward,
                glm.vec3.transformQuat(this.forward, this.forward, rotation));
            glm.vec3.normalize(this.right,
                glm.vec3.transformQuat(this.right, this.right, rotation));
        },

        rotateZ: function (angle) {
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.right, angle);

            glm.vec3.normalize(this.up,
                glm.vec3.transformQuat(this.up, this.up, rotation));
            glm.vec3.normalize(this.forward,
                glm.vec3.transformQuat(this.forward, this.forward, rotation));
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
            _.bindAll(this, 'mouseMove');

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

}) (modules['utility/namespace'],modules['utility/class'],modules['interaction/cursor/lock']);


modules['interaction/actor'] = (function (Class,constants,movement,rotation,cursor) {

    return Class.extend(_.extend({
        initialize: function (options) {

            this.initializeMovement(options);

            this.initializeRotation(options);

            this.setControls(options.controls);

        },

        checkVector: function (v) {
            return (!_.isUndefined(v) && _.isNumber(v.x) &&
                _.isNumber(v.y) && _.isNumber(v.z));
        },

        setNode: function (node) {
            this.node = node;
        },

        update: function (interval) {
            this.updateRotation(interval);
            this.updateMovement(interval);
        },

        toggleControl: function (toggle, rotation, axis, direction) {
            var value = (toggle ? direction : constants.NO_MOVEMENT);

            if (rotation) {
                this.rotationToggle[axis] = value;
            } else {
                this.movementControlToggle[axis] = value;
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
            var mouse = false;
            this.rotationMouseControl.x = constants.ROTATIONS.NONE;
            this.rotationMouseControl.y = constants.ROTATIONS.NONE;

            _.each(controls, function (key, control) {
                if (control === 'mouse') {
                    mouse = true;
                    this.rotationMouseControl.x = constants.ROTATIONS[key.x];
                    this.rotationMouseControl.y = constants.ROTATIONS[key.y];
                } else {
                    control = constants.CONTROLS[control];

                    this.listenToKey(
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
                this.listen(cursor, 'move', this.cursorMove);
            } else {
                cursor.removeLockRequest();
                // this.stopListening(cursor, 'move', this.cursorMove);
            }
        }
    }, movement, rotation));

}) (modules['utility/class'],modules['interaction/actor/constants'],modules['interaction/actor/movement'],modules['interaction/actor/rotation'],modules['interaction/cursor']);


modules['interaction/camera'] = (function (Actor) {

    return Actor.extend({

        initialize: function (options) {
            Actor.prototype.initialize.apply(this, arguments);

            this.fov = _.isNumber(options.fov) ? options.fov : 60;
            this.zNear = _.isNumber(options.zNear) ? options.zNear : 0.1;
            this.zFar = _.isNumber(options.zFar) ? options.zFar : 500;
        },

        use: function (context) {
            context._currentCamera = this;
        },

        render: function (canvas, context) {

            if (context._currentCamera === this) {
                var position = this.node.position,
                    viewMatrix = glm.mat4.create(),
                    modelMatrix = this.modelMatrix,
                    eyePosition = glm.vec3.transformMat4([], position,
                        modelMatrix),
                    projectionMatrix = glm.mat4.create();

                glm.mat4.lookAt(viewMatrix, position,
                    glm.vec3.add([], position, this.forward), this.up);

                glm.mat4.multiply(viewMatrix, modelMatrix, viewMatrix);

                context.uniformMatrix4fv(
                    context._currentProgram.getUniformLoc('viewMat'),
                    false,
                    viewMatrix
                );

                context.uniform3f(
                    context._currentProgram.getUniformLoc('eyePosition'),
                    eyePosition[0], eyePosition[1], eyePosition[2]
                );

                glm.mat4.perspective(projectionMatrix, this.fov * Math.PI / 180,
                    canvas.width / canvas.height, this.zNear, this.zFar);

                context.uniformMatrix4fv(
                    context._currentProgram.getUniformLoc('projectionMat'),
                    false, projectionMatrix);
            }

        },

        prepareRender: function (modelMatrix) {
            this.modelMatrix = modelMatrix;
        }

    });

}) (modules['interaction/actor']);

modules['gl/canvas/initialize'] = (function (Program,Texture,Mesh,Camera) {

    return {
        initializeScene: function (scene) {

            if (scene.isLoaded()) {
                var context = this.context,
                    sources = scene.sources,
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
                        context,
                        _.reduce(source, function (result, path, key) {
                            result[key] = sources.shaders[path];
                            return result;
                        }, {})
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
                    resources.allMeshes[key] = new Mesh(context, source);
                }, this);

                _.each(sources.meshNames, function (path, name) {
                    resources.meshes[name] = resources.allMeshes[path];
                });

                // Textures.
                _.each(sources.textureOptions, function (options, index) {
                    options.source = sources.textureSources[options.path];

                    resources.allTextures.push(new Texture(options, context));

                    if (!_.isUndefined(options.name)) {
                        resources.textures[options.name] =
                            resources.allTextures[index];
                    }
                }, this);

                resources.tree = this.initializeNode(sources.tree, resources);

                this.scenes[scene.uid].resources = resources;

            } else {
                this.listen(scene, 'loaded', this.initializeScene);
            }

        },

        initializeNode: function (source, resources) {
            var node = source.object;

            node.mesh = source.mesh;
            node.texture = source.texture;
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

        context.uniform1i(program.getUniformLoc('lightCount'),
            _.size(lights));
        context.uniform1iv(program.getUniformLoc('lightType'),
            new Int32Array(types));
        context.uniform1fv(program.getUniformLoc('lightRadius'),
            new Float32Array(radii));
        context.uniform3fv(program.getUniformLoc('lightPosition'),
            new Float32Array(positions));
        context.uniform3fv(program.getUniformLoc('lightColor'),
            new Float32Array(colors));
        context.uniform3fv(program.getUniformLoc('lightDirection'),
            new Float32Array(directions));
        context.uniform1fv(program.getUniformLoc('lightAngleInner'),
            new Float32Array(anglesInner));
        context.uniform1fv(program.getUniformLoc('lightAngleOuter'),
            new Float32Array(anglesOuter));
    };

}) ();

modules['gl/canvas/constants'] = (function (Vertex) {

    return  {
        MULTISAMPLING: {
            OPTIONS: [1, 2, 4, 8],
            NONE: 1
        },
        RTT: {
            TEXTURE: {
                filter: 'LINEAR',
                wrap: 'CLAMP_TO_EDGE'
            },
            MESH: {
                vertices: [
                    [-1, -1, 0, 0, 0, 1, 0, 0],
                    [-1, 1, 0, 0, 0, 1, 0, 1],
                    [1, 1, 0, 0, 0, 1, 1, 1],
                    [1, -1, 0, 0, 0, 1, 1, 0]
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
                            'gl_FragColor = vec4(texture2D(' +
                                'colorTexture, texCoords).xyz, 1);' +
                        '}'
                }
            }
        }
    };

}) (modules['geometry/vertex']);

modules['gl/canvas/render'] = (function (lightingRender,constants) {

    return {
        render: function () {
            var color,
                context = this.context,
                canvas = this.canvas,
                rtt,
                resources,
                scene,
                source,
                target,
                aux,
                xStep, yStep, xSpeed, ySpeed;

            this.resize();

            if (!_.isUndefined(this.scene) &&
                    !_.isUndefined(this.scenes[this.scene.uid]) &&
                    !_.isUndefined(this.scenes[this.scene.uid].resources)) {

                scene = this.scenes[this.scene.uid];
                resources = scene.resources;

                if (!_.isUndefined(resources.postprocessing)) {
                    this.initializePostprocessing();

                    if (!this.rttEnabled) {
                        this.initializeRTT();
                    }
                } else {
                    this.postprocessingEnabled = false;
                }

                rtt = this.rtt;

                if (this.rttEnabled) {
                    rtt.framebuffer.bind();
                    context.viewport(0, 0, rtt.texture.width,
                        rtt.texture.height);
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
                    this.config.backgroundColor;
                context.clearColor(color.r, color.g, color.b, 1);

                context.uniform3f(
                    context._currentProgram.getUniformLoc('ambientLight'),
                    false, resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                context._currentCamera.render(this.canvas, context);

                lightingRender(context, resources.lights);

                resources.tree.render(context, resources);

                // Postprocessing.
                if (this.postprocessingEnabled) {
                    source = this.postprocessing;
                    target = this.rtt;
                    xStep = 1.0 / canvas.width;
                    yStep = 1.0 / canvas.height;
                    xSpeed = Math.ceil(Math.abs(context._currentCamera
                        .mouseDisplacement.x) * 300);
                    ySpeed = Math.ceil(Math.abs(context._currentCamera
                        .mouseDisplacement.y) * 300);

                    context._currentCamera.resetMouseDisplacement();

                    _.each(resources.postprocessing, function (program) {
                        aux = source;
                        source = target;
                        target = aux;

                        target.framebuffer.bind();

                        this.clear();

                        this.useProgram(program);

                        context.uniform1f(program.getUniformLoc('xStep'),
                            xStep);
                        context.uniform1f(program.getUniformLoc('yStep'),
                            yStep);

                        context.uniform1i(program.getUniformLoc('xSpeed'),
                            xSpeed);
                        context.uniform1i(program.getUniformLoc('ySpeed'),
                            ySpeed);

                        source.texture.render(0);

                        rtt.mesh.render();
                    }, this);
                }

                // Render the RTT texture to the quad.
                if (this.rttEnabled) {
                    context.viewport(0, 0, canvas.width, canvas.height);

                    rtt.framebuffer.unbind();

                    this.clear();

                    rtt.program.use();

                    if (this.postprocessingEnabled) {
                        target.texture.render(0);
                    } else {
                        rtt.texture.render(0);
                    }

                    rtt.mesh.render();
                }
            } else {
                color = this.config.backgroundColor;
                context.clearColor(color.r, color.g, color.b, 1);

                console.log('loading');
            }
        },

        clear: function () {
            this.context.clear(this.context.COLOR_BUFFER_BIT |
                this.context.DEPTH_BUFFER_BIT);
        },

        resize: function () {
            var canvas = this.canvas, context = this.context;

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                this.resizeRTT();
                this.resizePostprocessing();
            }
        }
    };

}) (modules['shading/render'],modules['gl/canvas/constants']);

modules['gl/framebuffer'] = (function (Class) {

    return Class.extend({

        initialize: function (context) {
            var framebuffer = context.createFramebuffer();

            this.framebuffer = framebuffer;
            this.context = context;
        },

        bind: function () {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER,
                this.framebuffer);
        },

        unbind: function () {
            this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
        },

        attachColor: function (texture) {
            this.bind();

            this.context.framebufferTexture2D(
                this.context.FRAMEBUFFER,
                this.context.COLOR_ATTACHMENT0,
                this.context.TEXTURE_2D,
                texture.texture,
                0
            );

            this.unbind();
        },

        attachDepth: function (buffer) {
            this.bind();

            this.context.framebufferRenderbuffer(
                this.context.FRAMEBUFFER,
                this.context.DEPTH_ATTACHMENT,
                this.context.RENDERBUFFER,
                buffer
            );

            this.unbind();
        }

    });


}) (modules['utility/class']);


modules['gl/canvas/rtt'] = (function (Framebuffer,Program,constants,Texture,Mesh) {

    return {
        initializeRTT: function () {
            if (_.isUndefined(this.rtt)) {
                var context = this.context,
                    rtt = {
                        framebuffer: new Framebuffer(context),
                        program: new Program(context,
                            constants.RTT.PROGRAM.shaders)
                    };

                this.rtt = rtt;

                rtt.mesh = new Mesh(context, constants.RTT.MESH);
            }

            this.rttEnabled = true;
            this.resizeRTT();
        },

        resizeRTT: function () {
            if (!_.isUndefined(this.rtt) && this.rttEnabled) {
                var context = this.context,
                    rtt = this.rtt,
                    width = this.canvas.width * this.config.multisampling,
                    height = this.canvas.height * this.config.multisampling;

                if (!_.isUndefined(rtt.texture)) {
                    delete rtt.texture;
                }

                rtt.texture = new Texture(
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE),
                    context
                );

                rtt.framebuffer.attachColor(rtt.texture);

                if (!_.isUndefined(rtt.depthbuffer)) {
                    delete rtt.depthbuffer;
                }

                rtt.depthbuffer = context.createRenderbuffer();

                context.bindRenderbuffer(context.RENDERBUFFER, rtt.depthbuffer);
                context.renderbufferStorage(
                    context.RENDERBUFFER,
                    context.DEPTH_COMPONENT16,
                    width,
                    height
                );

                rtt.framebuffer.attachDepth(rtt.depthbuffer);
            }
        }
    };

}) (modules['gl/framebuffer'],modules['gl/program'],modules['gl/canvas/constants'],modules['gl/texture'],modules['geometry/mesh']);


modules['gl/canvas/postprocessing'] = (function (Framebuffer,constants,Texture) {

    return {
        initializePostprocessing: function () {
            if (_.isUndefined(this.postprocessing)) {
                var context = this.context,
                    postprocessing = {
                        framebuffer: new Framebuffer(context)
                    };

                this.postprocessing = postprocessing;
            }

            this.postprocessingEnabled = true;
            this.resizePostprocessing();
        },

        resizePostprocessing: function() {
            if (!_.isUndefined(this.postprocessing) &&
                    this.postprocessingEnabled) {
                var context = this.context,
                    postprocessing = this.postprocessing,
                    width = this.canvas.width * this.config.multisampling,
                    height = this.canvas.height * this.config.multisampling;

                if (!_.isUndefined(postprocessing.texture)) {
                    delete postprocessing.texture;
                }

                postprocessing.texture = new Texture(
                    _.extend({
                        source: null,
                        width: width,
                        height: height
                    }, constants.RTT.TEXTURE),
                    context
                );

                postprocessing.framebuffer.attachColor(postprocessing.texture);
            }
        }
    };

}) (modules['gl/framebuffer'],modules['gl/canvas/constants'],modules['gl/texture']);


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


modules['gl/canvas'] = (function (namespace,Class,initialize,render,constants,rtt,postprocessing,debugOutput,cursor) {

    return Class.extend(_.extend({

        initialize: function (canvas, config) {
            var context;

            this.config = _.extend({}, namespace.config.CANVAS, config);

            if (constants.MULTISAMPLING.OPTIONS
                    .indexOf(this.config.multisampling) === -1) {
                this.config.multisampling = constants.MULTISAMPLING.NONE;
            }

            this.scenes = {};

            this.canvas = canvas;
            context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (this.config.debug) {
                context = WebGLDebugUtils.makeDebugContext(context, undefined,
                    debugOutput);
            }

            context.enable(context.DEPTH_TEST);

            this.context = context;

            if (this.config.multisampling !== constants.MULTISAMPLING.NONE) {
                this.initializeRTT();
            }

            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');

            this.canvas.addEventListener('click', function () {
                cursor.requestLock();
            });
        },

        setScene: function (scene, beforeFrame) {

            this.scene = scene;

            if (_.isUndefined(this.scenes[scene.uid])) {
                this.scenes[scene.uid] = {};
                this.initializeScene(scene);
            }

            this.scenes[scene.uid].beforeFrame = beforeFrame;

            this.listen(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.context);
        },

        useProgram: function (program) {
            program.use(this.context);
        }

    }, initialize, render, rtt, postprocessing));

}) (modules['utility/namespace'],modules['utility/class'],modules['gl/canvas/initialize'],modules['gl/canvas/render'],modules['gl/canvas/constants'],modules['gl/canvas/rtt'],modules['gl/canvas/postprocessing'],modules['utility/debug-output'],modules['interaction/cursor']);


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


modules['utility/node'] = (function (Class) {

    return Class.extend({

        initialize: function (options) {
            this.children = {};
            this.scaleMatrix = glm.mat4.create();
            this.rotationMatrix = glm.mat4.create();
            this.position = glm.vec3.create();

            if (!_.isUndefined(options.camera)) {
                this.camera = options.camera;
                this.camera.setNode(this);
            }

            if (!_.isUndefined(options.actor)) {
                this.actor = options.actor;
                this.actor.setNode(this);
            }

            if (!_.isUndefined(options.material)) {
                this.material = options.material;
            }

            if (!_.isUndefined(options.position)) {
                this.setPosition(
                    _.isNumber(options.position.x) ? options.position.x : 0,
                    _.isNumber(options.position.y) ? options.position.y : 0,
                    _.isNumber(options.position.z) ? options.position.z : 0
                );
            }

            if (!_.isUndefined(options.scale)) {
                this.setScale(
                    _.isNumber(options.scale.x) ? options.scale.x : 1,
                    _.isNumber(options.scale.y) ? options.scale.y : 1,
                    _.isNumber(options.scale.z) ? options.scale.z : 1
                );
            }
        },

        render: function (context, resources) {

            if (context._currentCamera !== this.camera) {
                if (!_.isUndefined(this.mesh)) {
                    var program = context._currentProgram;

                    context.uniformMatrix4fv(program.getUniformLoc('modelMat'),
                        false, this.modelMatrix);

                    if (!_.isUndefined(this.material)) {
                        this.material.render(context);
                    }

                    if (!_.isUndefined(this.texture)) {
                        context.uniform1i(program.getUniformLoc('textured'), 1);

                        resources.allTextures[this.texture].render(0);
                    } else {
                        context.uniform1i(program.getUniformLoc('textured'), 0);
                    }

                    if (!_.isUndefined(this.alphaTexture)) {
                        context.uniform1i(
                            program.getUniformLoc('alphaTextured'), 1);

                        resources.allTextures[this.alphaTexture]
                            .render(1, true);
                    } else {
                        context.uniform1i(
                            program.getUniformLoc('alphaTextured'), 0);
                    }

                    resources.allMeshes[this.mesh].render();
                }
            }

            _.each(this.children, function (child) {
                child.render(context, resources);
            }, this);
        },

        prepareRender: function (parentModelMatrix) {
            var localModelMatrix = glm.mat4.create(),
                translationMatrix = glm.mat4.translate([], glm.mat4.create(),
                    this.position);

            parentModelMatrix = parentModelMatrix || glm.mat4.create();

            glm.mat4.multiply(localModelMatrix, this.rotationMatrix,
                this.scaleMatrix);

            glm.mat4.multiply(localModelMatrix, translationMatrix,
                localModelMatrix);

            glm.mat4.multiply(localModelMatrix, parentModelMatrix,
                localModelMatrix);

            if (!_.isUndefined(this.camera)) {
                this.camera.prepareRender(parentModelMatrix);
            }

            this.modelMatrix = localModelMatrix;

            _.each(this.children, function (child) {
                child.prepareRender(localModelMatrix);
            }, this);
        },

        addChild: function (child) {
            this.children[child.uid] = child;
        },

        move: function () {
            var displacement;

            if (arguments.length === 1) {
                displacement = arguments[0];
            } else {
                displacement = [
                    arguments[0] || 0,
                    arguments[1] || 0,
                    arguments[2] || 0,
                ];
            }

            glm.vec3.add(this.position, this.position, displacement);
            this.trigger('change:position');
        },
        moveX: function (x) { this.move(x, 0, 0); },
        moveY: function (y) { this.move(0, y, 0); },
        moveZ: function (z) { this.move(0, 0, z); },

        setPosition: function () {
            glm.vec3.set(this.position, 0, 0, 0);
            this.move.apply(this, arguments);
        },
        setPositionX: function (x) { this.setPosition(x, 0, 0); },
        setPositionY: function (y) { this.setPosition(0, y, 0); },
        setPositionZ: function (z) { this.setPosition(0, 0, z); },


        scale: function (x, y, z) {
            glm.mat4.scale(this.scaleMatrix, this.scaleMatrix, [x || 1,
                y || 1, z || 1]);
            this.trigger('change:scale');
        },
        scaleX: function (x) { this.scale(x, 1, 1); },
        scaleY: function (y) { this.scale(1, y, 1); },
        scaleZ: function (z) { this.scale(1, 1, z); },

        setScale: function (x, y, z) {
            glm.mat4.identity(this.scaleMatrix);
            this.scale(x, y, z);
        },
        setScaleX: function (x) { this.setScale(x, 1, 1); },
        setScaleY: function (y) { this.setScale(1, y, 1); },
        setScaleZ: function (z) { this.setScale(1, 1, z); },


        rotate: function (rad, axis) {
            glm.mat4.rotate(this.rotationMatrix, this.rotationMatrix,
                rad || 0, axis);
            this.trigger('change:rotation');
        },
        rotateX: function (rad) {
            glm.mat4.rotateX(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },
        rotateY: function (rad) {
            glm.mat4.rotateY(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },
        rotateZ: function (rad) {
            glm.mat4.rotateZ(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },

        setRotation: function (rad, axis) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotate(rad, axis);
        },
        setRotationX: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateX(rad);
        },
        setRotationY: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateY(rad);
        },
        setRotationZ: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateZ(rad);
        },
    });

}) (modules['utility/class']);


modules['utility/color'] = (function (Class) {

    return Class.extend({
        initialize: function() {
            if (arguments.length == 1) {
                this.r = arguments[0].r || 0;
                this.g = arguments[0].g || 0;
                this.b = arguments[0].b || 0;
            } else {
                this.r = arguments[0] || 0;
                this.g = arguments[1] || 0;
                this.b = arguments[2] || 0;
            }
        },

        flat: function () {
            return [this.r, this.g, this.b];
        }
    });

}) (modules['utility/class']);


modules['shading/point'] = (function (constants,Class,Color) {

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

}) (modules['shading/constants'],modules['utility/class'],modules['utility/color']);


modules['shading/spot'] = (function (constants,Point) {

    return Point.extend({

        initialize: function (options) {
            Point.prototype.initialize.apply(this, arguments);

            this.angleInner = options.angleInner;
            this.angleOuter = options.angleOuter;

            if (_.isUndefined(options.direction)) {
                this.direction = glm.vec3.fromValues(0, -1, 0);
            } else {
                this.direction = glm.vec3.fromValues(options.direction. x || 0,
                    options.direction.y || -1, options.direction.z || 0);
            }
        },

        output: function () {
            return _.extend({
                type: constants.TYPE_RAW.SPOT,
                angleInner: this.angleInner,
                angleOuter: this.angleOuter,
                direction: this.direction
            }, Point.prototype.output.apply(this, arguments));
        }

    });

}) (modules['shading/constants'],modules['shading/point']);


modules['shading/material'] = (function (Class,Color) {

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

}) (modules['utility/class'],modules['utility/color']);
modules['utility/scene/load'] = (function (loadFile,programConstants,geometryConstants,lightingConstants,Node,Actor,Camera,LightPoint,LightSpot,Color,Material) {

    return {

        load: function (schema) {
            var parsedSchema, sources;

            sources = {
                meshNames: schema.meshes,
                meshSources: {},

                textureNames: {},
                textureOptions: [],
                textureSources: {},

                programs: schema.programs,
                shaders: {},
                defaultProgram: schema.defaultProgram,
                postprocessing: schema.postprocessing,

                actorOptions: schema.actors,

                cameraOptions: schema.cameras,

                lightOptions: schema.lights,

                cameras: [],

                actors: [],

                lights: [],

                materials: {},

                tree: []
            };
            this.sources = sources;

            // Grab resource information.
            parsedSchema = {
                meshPaths: [],
                texturePaths: [],
                shaderPaths: []
            };
            this.parsedSchema = parsedSchema;

            // Postprocessing.
            _.each(schema.postprocessing, function (name) {
                if (name.indexOf('SHADER') === 0) {
                    schema.programs[name] = name;
                }
            });

            // Shaders.
            _.each(schema.programs, function (options, name) {
                if (_.isString(options) && options.indexOf('SHADER') === 0) {
                    options = options.replace('SHADER', 'PREDEFINED');
                    options = this.getDotChain(options, programConstants);

                    if (_.isPlainObject(options)) {
                        _.each(options, function (path, key) {
                            options[key] = this.config.paths.shaders + path;
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
            this.resourceCount = 0;

            this.resourceCount += parsedSchema.shaderPaths.length;
            this.resourceCount += parsedSchema.meshPaths.length;
            this.resourceCount += parsedSchema.texturePaths.length;

            this.loadAsyncResources(parsedSchema.shaderPaths, this.loadShader);
            this.loadAsyncResources(parsedSchema.meshPaths, this.loadMesh);
            this.loadAsyncResources(parsedSchema.texturePaths,
                this.loadTexture);

            // Global material constants.
            this.sources.ambientLight = new Color(schema.ambientLight);

            if (!_.isUndefined(schema.backgroundColor))
                this.sources.backgroundColor =
                    new Color(schema.backgroundColor);

            // Instantiate tree.
            this.sources.tree = {
                object: new Node({}),
                children: []
            };

            _.each(schema.tree, function (node) {
                this.instantiateNode(this.sources.tree, node);
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
            if (!_.isUndefined(node.mesh) && _.isString(node.mesh)) {
                if (node.mesh in this.sources.meshNames) {
                    node.mesh = this.sources.meshNames[node.mesh];
                } else {
                    if (_.indexOf(this.parsedSchema.meshPaths,
                            node.mesh) === -1) {
                        this.parsedSchema.meshPaths.push(node.mesh);
                    }
                }
            }

            this.parseNodeTexture(node, 'texture');
            this.parseNodeTexture(node, 'alphaTexture');

            if (!_.isUndefined(node.children) && _.isArray(node.children)) {
                _.each(node.children, this.parseNode, this);
            }
        },

        parseNodeTexture: function (node, prop) {
            if (!_.isUndefined(node[prop])) {
                if (_.isString(node[prop]) &&
                        node[prop] in this.sources.textureNames) {
                    node[prop] = this.sources.textureNames[node[prop]];
                } else if (_.isPlainObject(node[prop])) {
                    this.sources.textureOptions.push(node[prop]);

                    if (_.indexOf(this.parsedSchema.texturePaths,
                            node[prop].path) === -1) {
                        this.parsedSchema.texturePaths.push(node[prop].path);
                    }

                    node[prop] = this.parsedSchema.texturePaths.length - 1;
                }
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

            this.sources.lights.push(light);

            return light;
        },

        instantiateNode: function (parent, options) {
            var node = {
                    name: options.name,
                    children: []
                },
                light;

            // Set mesh.
            if (!_.isUndefined(options.mesh)) {
                node.mesh = options.mesh;

                // Instantiate material.
                if (!_.isUndefined(options.material)) {
                    options.material = this.instantiateNodeProperty(
                        options.material,
                        this.sources.materials,
                        function (options) { return options; },
                        function (options) {
                            return new Material(options);
                        }
                    );
                }

                // Set texture.
                if (!_.isUndefined(options.texture)) {
                    node.texture = options.texture;
                }

                // Set alpha texture.
                if (!_.isUndefined(options.alphaTexture)) {
                    node.alphaTexture = options.alphaTexture;
                }
            }

            // Instantiate actor.
            options.actor = this.instantiateNodeProperty(options.actor,
                this.sources.actorOptions, function (options) {
                    var actor = new Actor(options);

                    this.sources.actors.push(actor);

                    return actor;
                });

            // Instantiate camera.
            options.camera = this.instantiateNodeProperty(options.camera,
                this.sources.cameraOptions, function (options) {
                    var camera = new Camera(options);

                    this.sources.cameras.push(camera);
                    if (options.default) {
                        this.sources.defaultCamera = camera;
                    }

                    return camera;
                });

            // Instantiate node.
            node.object = new Node(options);

            // Instantiate light.
            light = this.instantiateNodeProperty(options.light,
                this.sources.lightOptions, this.instantiateLight);

            if (!_.isUndefined(light)) {
                light.setNode(node.object);
            }

            if (!_.isUndefined(options.children) && _.isArray(options.children)) {
                _.each(options.children, function (child) {
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
            this.resourceCount--;

            if (this.resourceCount <= 0) {
                this.loading = false;
                this.trigger('loaded');
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
                this.sources.shaders[path] = source;
                this.resourceLoaded();
            }).bind(this));
        },

        loadMesh: function (path) {
            var originalPath = path;

            if (path.indexOf('MESH') !== -1) {
                var splitPath = options.source.split('.');

                if (splitPath[1] in geometryConstants.MESHES) {
                    path = this.config.paths.meshes +
                        geometryConstants.MESHES[splitPath[1]];
                }
            }

            loadFile(path, (function (source) {
                this.sources.meshSources[originalPath] = source;
                this.resourceLoaded();
            }).bind(this));
        },

        loadTexture: function (path) {
            var image = new Image();

            image.addEventListener('load', (function () {
                this.sources.textureSources[path] = image;
                this.resourceLoaded();
            }).bind(this));

            image.src = path;
        }

    };
}) (modules['utility/load-file'],modules['gl/program/constants'],modules['geometry/constants'],modules['shading/constants'],modules['utility/node'],modules['interaction/actor'],modules['interaction/camera'],modules['shading/point'],modules['shading/spot'],modules['utility/color'],modules['shading/material']);


modules['utility/scene'] = (function (Class,namespace,load,loadFile) {

    return Class.extend(_.extend({

        initialize: function (path, config) {
            this.config = _.merge({}, namespace.config.SCENE, config);

            loadFile(path, (function (raw) {
                this.load(JSON.parse(raw));
            }).bind(this));

            this.loading = true;

            _.bindAll(this, 'resourceLoaded', 'render');

            return this;
        },

        startRendering: function () {
            if (_.isUndefined(this.request)) {
                root.cancelAnimationFrame(this.request);
            }

            this.previousTime = 0;
            this.request = root.requestAnimationFrame(this.render);

            return this;
        },

        render: function (currentTime) {
            if (this.isLoaded()) {
                var interval = (currentTime - this.previousTime) / 1000;

                _.each(this.sources.actors, function (actor) {
                    actor.update(interval);
                }, this);

                _.each(this.sources.cameras, function (camera) {
                    camera.update(interval);
                }, this);

                this.sources.tree.object.prepareRender();
            }

            this.trigger('render');
            this.previousTime = currentTime;
            this.request = requestAnimationFrame(this.render);
        },

        isLoaded: function () {
            return !this.loading;
        }

    }, load));

}) (modules['utility/class'],modules['utility/namespace'],modules['utility/scene/load'],modules['utility/load-file']);

modules['utility/config'] = (function (Color) {
    var config = {
        CANVAS: {
            debug: false,
            backgroundColor: new Color(0, 0, 0),
            multisampling: 1
        },

        SCENE: {
            paths: {
                meshes: '/masala/meshes/',
                shaders: '/masala/shaders/'
            }
        }
    };

    return config;
}) (modules['utility/color']);


modules['main'] = (function (namespace,Canvas,Scene,config) {

    _.extend(namespace, {

        Canvas: Canvas,

        Scene: Scene,

        config: config,

        setCanvasConfig: function (newConfig) {
            _.merge(namespace.config.CANVAS, newConfig);
        },

        setSceneConfig: function (newConfig) {
            _.merge(namespace.config.SCENE, newConfig);
        }

    });

}) (modules['utility/namespace'],modules['gl/canvas'],modules['utility/scene'],modules['utility/config']);

});