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

        load: function (schema) {
            var parsedSchema, sources;

            sources = {
                meshNames: schema.meshes,
                meshSources: {},
                textureNames: {},
                textureOptions: [],
                textureSources: {},
                programs: {},
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
                texturePaths: []
            };
            this.parsedSchema = parsedSchema;

            // Meshes.
            _.each(schema.meshes, function (path, name) {
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

            this.resourceCount += _.reduce(
                schema.programs,
                function (memo, program) {
                    return memo + _.size(program.shaders);
                },
                0
            );
            this.resourceCount += parsedSchema.meshPaths.length;
            this.resourceCount += parsedSchema.texturePaths.length;

            this.loadAsyncResources(schema.programs, this.loadProgram);
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

        loadProgram: function (options, name) {
            this.sources.programs[name] = {
                default: options.default || false,
                shaders: {}
            };

            _.each(options.shaders, function (path, key) {

                if (path.indexOf('SHADER') !== -1) {
                    var splitPath = path.split('.');

                    if (splitPath[1] in programConstants.PREDEFINED &&
                            splitPath[2] in programConstants.PREDEFINED
                            [splitPath[1]]) {
                        path = this.config.paths.shaders + programConstants
                            .PREDEFINED[splitPath[1]][splitPath[2]];
                    }
                }

                loadFile(path, (function (source) {
                    this.sources.programs[name].shaders[key] = source;
                    this.resourceLoaded();
                }).bind(this));
            }, this);
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
});