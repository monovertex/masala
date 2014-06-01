define([
    'utility/load-file',

    'gl/program/constants',
    'geometry/constants',
    'shading/constants',
    'utility/node',
    'interaction/actor',
    'interaction/camera',
    'shading/point',
    'shading/spot',
    'utility/color',
    'shading/material'
], function (loadFile, programConstants, geometryConstants, lightingConstants,
        Node, Actor, Camera, LightPoint, LightSpot, Color, Material) {

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
});