
define([
    'gl/program',
    'geometry/mesh',
    'interaction/camera'
], function (Program, Mesh, Camera) {

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

                _.each(sources.programs, function (source, key) {
                    resources.programs[key] = new Program(this.context,
                        source.shaders);

                    if (source.default) {
                        resources.programs[key].use();
                    }
                }, this);

                _.each(sources.meshes, function (source, key) {
                    resources.meshes[key] = new Mesh(this.context, source,
                        resources.programs);
                }, this);

                _.each(sources.actors, function (source, key) {
                    resources.actors[key] = source.object;
                }, this);

                _.each(sources.lights, function (source, key) {
                    resources.lights[key] = source.object;
                }, this);

                _.each(sources.materials, function (source, key) {
                    resources.materials[key] = source.object;
                }, this);

                _.each(sources.cameras, function (source, key) {
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
                _.each(source.children, function (source) {
                    var child = this.initializeNode(source, resources);

                    node.addChild(child);
                }, this);
            }

            return node;
        }
    };
});