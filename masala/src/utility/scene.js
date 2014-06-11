

define([
    'utility/class',
    'utility/namespace',
    'utility/scene/load',
    'utility/load-file'
],
function (Class, namespace, load, loadFile) {

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
            var interval = (currentTime - this.previousTime) / 1000;

            if (this.isLoaded()) {

                _.each(this.sources.actors, function (actor) {
                    actor.update(interval);
                }, this);

                _.each(this.sources.cameras, function (camera) {
                    camera.update(interval);
                }, this);

                this.sources.tree.object.prepareRender();
            }

            this.trigger('render', { interval: interval });
            this.previousTime = currentTime;
            this.request = requestAnimationFrame(this.render);
        },

        isLoaded: function () {
            return !this.loading;
        }

    }, load));

});