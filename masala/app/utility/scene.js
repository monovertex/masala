

define([
    'require',
    'underscore',
    'app/utility/class',
    'app/utility/config',
    'app/utility/scene/load'
],
function (require, _, Class, baseConfig, load) {

    return Class.extend(_.extend({

        initialize: function (path, config) {
            this.config = _.extend({}, baseConfig.SCENE, config);

            require(['text!' + path], (function (raw) {
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
                cancelAnimationFrame(this.request);
            }

            this.previousTime = 0;
            this.request = requestAnimationFrame(this.render);

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

});