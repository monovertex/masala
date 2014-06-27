define([
    'utility/load-file',

    'gl/program/constants',
    'geometry/constants',
    'shading/constants',

    'scaffolding/node',
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
});