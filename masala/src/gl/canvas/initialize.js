
define([
    'gl/program',
    'gl/texture',
    'geometry/mesh',
    'interaction/camera'
], function (Program, Texture, Mesh, Camera) {

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
                    };


                // Programs.
                _.each(sources.programs, function (source, key) {
                    resources.programs[key] = new Program(context,
                        source.shaders);

                    if (source.default) {
                        resources.programs[key].use();
                    }
                }, this);


                // Meshes.
                _.each(sources.meshSources, function (source, key) {
                    resources.allMeshes[key] = new Mesh(context, source,
                        resources.programs);
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

                sources.defaultCamera.use(context);

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
});