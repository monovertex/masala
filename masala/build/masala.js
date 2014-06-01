
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

        trigger: function (eventName) {
            if (eventName in this.listeners) {
                _.forEach(this.listeners[eventName], function (listener) {
                    _.forEach(listener, function (callback) {
                        if (_.isFunction(callback)) {
                            callback(this, eventName);
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
        VERTEX: {
            BASIC: 'basic.vert',
            SHADING: 'shading.vert'
        },
        FRAGMENT: {
            BASIC: 'basic.frag',
            SHADING: 'shading.frag'
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

            _.forEach(sources, function(source, type) {
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
                    throw 'Shader compilation error ' +
                        context.getShaderInfoLog(shader);
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

                if (this.attributes[attribute] >= 0) {
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

        _.forEach(lines, function (line) {
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

        _.forEach(raw.faces, function (face) {

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

            _.forEach(face, function (faceItem) {
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

    return function (source) {
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
    };
}) (modules['geometry/vertex'],modules['geometry/constants']);


modules['geometry/mesh'] = (function (geometryConstants,programConstants,Class,parse) {

    return Class.extend({

        initialize: function (context, source, programs) {
            this.context = context;
            this.programs = programs;

            var rawData = this.parse(source),
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
            _.forEach(programs, this.linkAttributes, this);

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

            _.bindAll(this, 'linkAttributes');
        },

        render: function () {
            var context = this.context;

            context.bindBuffer(context.ARRAY_BUFFER, this.vbo);

            _.forEach(this.programs, this.linkAttributes, this);

            context.bindBuffer(context.ELEMENT_ARRAY_BUFFER, this.ibo);

            context.drawElements(context.TRIANGLES, this.indexCount,
                context.UNSIGNED_SHORT, 0);
        },

        parse: parse,

        linkAttributes: function (program) {
            var context = this.context,
                VERTEX = geometryConstants.VERTEX,
                attributePosition = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_POSITION),
                attributeNormal = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_NORMAL),
                attributeTexcoords = program.getAttribLoc(
                    programConstants.ATTRIBUTES.VERTEX_TEX_COORDS);

            if (attributePosition >= 0) {
                context.vertexAttribPointer(
                    attributePosition,
                    VERTEX.ITEM_SIZE.POSITION,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.POSITION
                );
            }

            if (attributeNormal >= 0) {
                context.vertexAttribPointer(
                    attributeNormal,
                    VERTEX.ITEM_SIZE.NORMAL,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.NORMAL
                );
            }

            if (attributeTexcoords >= 0) {
                context.vertexAttribPointer(
                    attributeTexcoords,
                    VERTEX.ITEM_SIZE.TEX_COORD,
                    context.FLOAT,
                    false, VERTEX.SIZE, VERTEX.ITEM_OFFSET.TEX_COORD
                );
            }
        }

    });

}) (modules['geometry/constants'],modules['gl/program/constants'],modules['utility/class'],modules['geometry/mesh/parse']);


modules['interaction/actor'] = (function (Class) {

    var NO_MOVEMENT = 0,
        MOVE_POSITIVE = 1,
        MOVE_NEGATIVE = -1,
        CONTROLS = {
            'forward': { axis: 'x', direction: MOVE_POSITIVE },
            'backward': { axis: 'x', direction: MOVE_NEGATIVE },
            'right': { axis: 'z', direction: MOVE_POSITIVE },
            'left': { axis: 'z', direction: MOVE_NEGATIVE },
            'up': { axis: 'y', direction: MOVE_POSITIVE },
            'down': { axis: 'y', direction: MOVE_NEGATIVE }
        };

    return Class.extend({
        initialize: function (options) {
            this.up = glm.vec3.fromValues(0, 1, 0);
            this.right = glm.vec3.create();

            this.speed = { x: 0, y: 0, z: 0 };
            this.toggle = { x: NO_MOVEMENT, y: NO_MOVEMENT, z: NO_MOVEMENT };
            this.movement = { x: NO_MOVEMENT, y: NO_MOVEMENT, z: NO_MOVEMENT };

            if (_.isUndefined(options.forward)) {
                this.forward = glm.vec3.fromValues(1, 0, 0);
            } else {
                this.forward = glm.vec3.fromValues(
                    _.isNumber(options.forward.x) ? options.forward.x : 1,
                    _.isNumber(options.forward.y) ? options.forward.y : 0,
                    _.isNumber(options.forward.z) ? options.forward.z : 0
                );
            }

            if (_.isUndefined(options.speed)) {
                this.minimumSpeed = 0;
                this.maximumSpeed = 10;
            } else {
                this.minimumSpeed = _.isNumber(options.speed.min) ?
                    options.speed.min : 0;
                this.maximumSpeed = _.isNumber(options.speed.max) ?
                    options.speed.max : _.isNumber(options.speed) ?
                    options.speed : 10;
            }

            this.acceleration = _.isNumber(options.acceleration) ?
                options.acceleration : 3;

            this.setControls(options.controls);

            glm.vec3.cross(this.right, this.forward, this.up);
        },

        setNode: function (node) {
            this.node = node;
        },

        update: function (interval) {
            _.forEach(this.toggle, function (axisToggle, axis) {
                var accelerate = axisToggle != NO_MOVEMENT,
                    distance;

                if (accelerate) {
                    this.movement[axis] = axisToggle;
                }

                if (accelerate) {
                    if (this.speed[axis] < this.minimumSpeed) {
                        this.speed[axis] = this.minimumSpeed;
                    } else if (this.speed[axis] < this.maximumSpeed) {
                        this.speed[axis] += interval * this.acceleration;
                    } else if (this.speed[axis] > this.maximumSpeed) {
                        this.speed[axis] = this.maximumSpeed;
                    }
                } else {
                    if (this.speed[axis] > this.minimumSpeed) {
                        this.speed[axis] -= interval * this.acceleration;
                    } else if (this.speed[axis] < this.minimumSpeed) {
                        this.speed[axis] = 0;
                    }
                }

                if (this.speed[axis] > this.minimumSpeed) {
                    if (this.movement[axis] != NO_MOVEMENT) {
                        distance = interval * this.speed[axis] *
                            this.movement[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    }
                } else {
                    this.movement[axis] = NO_MOVEMENT;
                }

            }, this);

            return this;
        },

        toggleControl: function (toggle, axis, direction) {
            this.toggle[axis] = (toggle ? direction : NO_MOVEMENT);
        },

        setControls: function (controls) {
            _.forEach(controls, function (key, control) {
                control = CONTROLS[control];

                this.listenToKey(
                    key,

                    (function () {
                        this.toggleControl(true, control.axis,
                            control.direction);
                    }).bind(this),

                    (function () {
                        this.toggleControl(false, control.axis);
                    }).bind(this)
                );
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
        }
    });

}) (modules['utility/class']);


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

modules['gl/canvas/initialize'] = (function (Program,Mesh,Camera) {

    return {
        initializeScene: function (scene) {

            if (scene.isLoaded()) {
                var sources = scene.sources,
                    resources = {
                        ambientLight: sources.ambientLight,
                        backgroundColor: sources.backgroundColor,
                        programs: {},
                        meshes: {},
                        nodes: {},
                        cameras: {},
                        actors: {},
                        lights: {},
                        materials: {}
                    };

                _.forEach(sources.programs, function (source, key) {
                    resources.programs[key] = new Program(this.context,
                        source.shaders);

                    if (source.default) {
                        resources.programs[key].use();
                    }
                }, this);

                _.forEach(sources.meshes, function (source, key) {
                    resources.meshes[key] = new Mesh(this.context, source,
                        resources.programs);
                }, this);

                _.forEach(sources.actors, function (source, key) {
                    resources.actors[key] = source.object;
                }, this);

                _.forEach(sources.lights, function (source, key) {
                    resources.lights[key] = source.object;
                }, this);

                _.forEach(sources.materials, function (source, key) {
                    resources.materials[key] = source.object;
                }, this);

                _.forEach(sources.cameras, function (source, key) {
                    resources.cameras[key] = source.object;

                    if (source.default) {
                        resources.cameras[key].use(this.context);
                    }
                }, this);

                resources.tree = this.initializeNode(sources.tree, resources);

                this.scenes[scene.uid].resources = resources;

                if (!_.isUndefined(this.sceneInitialize)) {
                    this.sceneInitialize.call(this, resources);
                }

            } else {
                this.listen(scene, 'loaded', this.initializeScene);
            }

        },

        initializeNode: function (source, resources) {
            var node = source.object;

            if (!_.isUndefined(source.mesh)) {
                node.setMesh(source.mesh);
            }

            if (!_.isUndefined(source.camera)) {
                node.setCamera(resources.cameras[source.camera]);
            }

            if (!_.isUndefined(source.actor)) {
                node.setActor(resources.actors[source.actor]);
            }

            if (!_.isUndefined(source.light)) {
                resources.lights[source.light].setNode(node);
            }

            if (!_.isUndefined(source.material)) {
                node.setMaterial(resources.materials[source.material]);
            }

            if (!_.isUndefined(source.name)) {
                resources.nodes[source.name] = node;
            }

            if (!_.isUndefined(source.children)) {
                _.forEach(source.children, function (source) {
                    var child = this.initializeNode(source, resources);

                    node.addChild(child);
                }, this);
            }

            return node;
        }
    };
}) (modules['gl/program'],modules['geometry/mesh'],modules['interaction/camera']);


modules['shading/render'] = (function () {

    return function (context, lights) {
        var types = [], radii = [], positions = [], directions = [],
            colors = [], anglesInner = [], anglesOuter = [],
            program = context._currentProgram;

        _.forEach(lights, function (light) {
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

modules['gl/canvas/render'] = (function (lightingRender) {

    return {
        render: function () {
            var color;

            this.resize();

            this.context.clear(this.context.COLOR_BUFFER_BIT |
                    this.context.DEPTH_BUFFER_BIT);

            if (!_.isUndefined(this.scene) &&
                    !_.isUndefined(this.scenes[this.scene.uid]) &&
                    !_.isUndefined(this.scenes[this.scene.uid].resources)) {

                var resources = this.scenes[this.scene.uid].resources;

                color = resources.backgroundColor ||
                    this.config.backgroundColor;
                this.context.clearColor(color.r, color.g, color.b, 1);

                this.context.uniform3f(
                    this.context._currentProgram.getUniformLoc('ambientLight'),
                    false, resources.ambientLight.r, resources.ambientLight.g,
                    resources.ambientLight.b);

                this.context._currentCamera.render(this.canvas, this.context);

                lightingRender(this.context, resources.lights);

                resources.tree.render(this.context, resources);

            } else {
                color = this.config.backgroundColor;
                this.context.clearColor(color.r, color.g, color.b, 1);

                console.log('loading');
            }
        },

        resize: function () {
            var canvas = this.canvas, context = this.context;

            if (canvas.width !== canvas.clientWidth ||
                canvas.height !== canvas.clientHeight) {

                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                context.viewport(0, 0, canvas.width, canvas.height);
            }
        }
    };

}) (modules['shading/render']);


modules['utility/debug-output'] = (function () {

    return function (functionName, args) {
        console.info(
            'gl.' + functionName + '(' +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
            ')'
        );

        _.forEach(args, function (arg) {
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


modules['gl/canvas'] = (function (namespace,Class,initialize,render,debugOutput) {

    return Class.extend(_.extend({

        initialize: function (canvas, config) {
            this.config = _.extend({}, namespace.config.CANVAS, config);

            this.scenes = {};

            this.canvas = canvas;
            this.context = canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl');

            if (this.config.debug) {
                this.context = WebGLDebugUtils.makeDebugContext(
                    this.context, undefined, debugOutput);
            }

            this.context.enable(this.context.DEPTH_TEST);

            _.bindAll(this, 'setScene', 'initializeScene', 'render', 'resize');
        },

        setScene: function (scene, initialize) {

            this.scene = scene;
            this.sceneInitialize = initialize;

            if (_.isUndefined(this.scenes[scene.uid])) {
                this.scenes[scene.uid] = {};
                this.initializeScene(scene);
            }

            this.listen(scene, 'render', this.render);

            return this;
        },

        useCamera: function (camera) {
            camera.use(this.context);
        },

        useProgram: function (program) {
            program.use(this.context);
        }

    }, initialize, render));

}) (modules['utility/namespace'],modules['utility/class'],modules['gl/canvas/initialize'],modules['gl/canvas/render'],modules['utility/debug-output']);


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

        setCamera: function (camera) {
            this.camera = camera;
            this.camera.setNode(this);
        },

        setActor: function (actor) {
            this.actor = actor;
            this.actor.setNode(this);
        },

        setMesh: function (mesh) {
            this.mesh = mesh;
        },

        setMaterial: function (material) {
            this.material = material;
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

                    resources.meshes[this.mesh].render();
                }
            }

            _.forEach(this.children, function (child) {
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

            _.forEach(this.children, function (child) {
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

            _.forEach(
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

        load: function () {
            var schema = this.schema;

            // Instantiate async resources.
            this.resourceCount = 0;

            this.resourceCount += _.reduce(
                schema.programs,
                function (memo, program) {
                    return memo + _.size(program.shaders);
                },
                0
            );
            this.resourceCount += schema.meshes.length;

            this.loadPrograms();
            this.loadMeshes();

            // Global material constants.
            this.sources.ambientLight = new Color(schema.ambientLight);

            if (!_.isUndefined(schema.backgroundColor))
                this.sources.backgroundColor =
                    new Color(schema.backgroundColor);

            // Instantiate materials.
            _.map(schema.materials, this.instantiateMaterial, this);

            // Instantiate tree.
            this.sources.tree = {
                object: new Node({}),
                children: []
            };

            _.forEach(schema.tree, function (node) {
                this.instantiateNode(this.sources.tree, node);
            }, this);
        },

        instantiateActor: function (options) {
            var object = new Actor(options),
                id = object.uid,
                source = { object: object };

            this.sources.actors[id] = source;

            return source;
        },

        instantiateCamera: function (options) {
            var object = new Camera(options),
                id = object.uid,
                source = {
                    default: options.default || false,
                    object: object
                };

            this.sources.cameras[id] = source;

            return source;
        },

        instantiateLight: function (options) {
            var object, source;

            switch (options.type) {
                case lightingConstants.TYPE.POINT:
                    object = new LightPoint(options);
                    break;
                case lightingConstants.TYPE.SPOT:
                    object = new LightSpot(options);
                    break;
            }

            source = {
                object: object
            };

            this.sources.lights[object.uid] = source;

            return source;
        },

        instantiateMaterial: function (options) {
            var object = new Material(options),
                id = options.name || object.uid,
                source = { object: object };

            this.sources.materials[id] = source;

            return source;
        },

        instantiateNode: function (parent, options) {
            var node = {
                    name: options.name,
                    object: new Node(options),
                    children: []
                };

            // Set mesh.
            if (!_.isUndefined(options.mesh)) {
                node.mesh = options.mesh;

                // Instantiate material.
                if (!_.isUndefined(options.material)) {
                    if (_.isString(options.material)) {
                        node.material = options.material;
                    } else {
                        node.material = this.instantiateMaterial(
                            options.material).object.uid;
                    }
                }
            }

            // Instantiate actor.
            if (!_.isUndefined(options.actor)) {
                node.actor = this.instantiateActor(options.actor).object.uid;
            }

            // Instantiate camera.
            if (!_.isUndefined(options.camera)) {
                node.camera = this.instantiateCamera(options.camera)
                    .object.uid;
            }

            // Instantiate light.
            if (!_.isUndefined(options.light)) {
                node.light = this.instantiateLight(options.light)
                    .object.uid;
            }

            if (!_.isUndefined(options.children) && _.isArray(options.children)) {
                _.forEach(options.children, function (child) {
                    this.instantiateNode(node, child);
                }, this);
            }

            parent.children.push(node);
        },

        resourceLoaded: function () {
            this.resourceCount--;

            if (this.resourceCount <= 0) {
                this.loading = false;
                this.trigger('loaded');
            }
        },

        loadPrograms: function () {
            var schema = this.schema;

            if (!_.isUndefined(schema.programs) &&
                    _.isArray(schema.programs)) {

                _.forEach(schema.programs, function (program) {
                    this.sources.programs[program.name] = {
                        default: program.default || false,
                        shaders: {}
                    };

                    _.forEach(program.shaders, function (shader, key) {

                        if (shader.indexOf('SHADER') !== -1) {
                            var path = shader.split('.');

                            if (path[1] in programConstants.PREDEFINED &&
                                    path[2] in programConstants
                                        .PREDEFINED[path[1]]) {
                                shader = this.config.paths.shaders +
                                    programConstants
                                        .PREDEFINED[path[1]][path[2]];
                            }
                        }

                        loadFile(shader, (function (source) {
                            this.sources.programs[program.name].shaders[key] =
                                source;
                            this.resourceLoaded();
                        }).bind(this));
                    }, this);
                }, this);
            }
        },

        loadMeshes: function () {
            var schema = this.schema;

            if (!_.isUndefined(schema.meshes) &&
                    _.isArray(schema.meshes)) {

                _.forEach(schema.meshes, function (mesh) {
                    var source = mesh.source;

                    if (mesh.source.indexOf('MESH') !== -1) {
                        var path = mesh.source.split('.');

                        if (path[1] in geometryConstants.MESHES) {
                            source = this.config.paths.meshes +
                                geometryConstants.MESHES[path[1]];
                        }
                    }

                    loadFile(source, (function (source) {
                        this.sources.meshes[mesh.name] = source;

                        this.resourceLoaded();
                    }).bind(this));
                }, this);
            }
        }

    };
}) (modules['utility/load-file'],modules['gl/program/constants'],modules['geometry/constants'],modules['shading/constants'],modules['utility/node'],modules['interaction/actor'],modules['interaction/camera'],modules['shading/point'],modules['shading/spot'],modules['utility/color'],modules['shading/material']);


modules['utility/scene'] = (function (Class,namespace,load,loadFile) {

    return Class.extend(_.extend({

        initialize: function (path, config) {
            this.config = _.merge({}, namespace.config.SCENE, config);

            loadFile(path, (function (raw) {
                this.schema = JSON.parse(raw);
                this.load();
            }).bind(this));

            this.loading = true;

            this.sources = {
                meshes: {},
                programs: {},
                tree: [],
                actors: {},
                cameras: {},
                lights: {},
                materials: {}
            };

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

                _.forEach(this.sources.actors, function (actor) {
                    actor.object.update(interval);
                }, this);

                _.forEach(this.sources.cameras, function (camera) {
                    camera.object.update(interval);
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
            backgroundColor: new Color(0, 0, 0)
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