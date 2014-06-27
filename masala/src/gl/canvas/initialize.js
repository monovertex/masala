
define([
    'gl/program',
    'gl/texture',
    'geometry/mesh',
    'interaction/camera'
], function (Program, Texture, Mesh, Camera) {

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
});