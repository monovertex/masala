

define([
    'scaffolding/class',
    'scaffolding/namespace',
    'scaffolding/scene/load',
    'utility/load-file',
    'utility/animation-frame'
],
function (Class, namespace, load, loadFile, animationFrame) {

    return Class.extend(_.extend({

        initialize: function (attributes, options) {
            _.bindAll(this, 'resourceLoaded', 'render');

            var path = this.get('source'),
                config = _.merge({}, namespace.config.SCENE, options);

            this.set('config', config)
                .set('loading', true);

            loadFile(path, (function (raw) {
                this.load(JSON.parse(raw));
            }).bind(this));
        },

        startRendering: function () {
            var request = this.get('request');

            if (!_.isUndefined(request)) {
                animationFrame.cancel(request);
            }

            this.set('previousTime', 0)
                .set('request', animationFrame.request(this.render));

            return this;
        },

        render: function (currentTime) {
            var interval = (currentTime - this.get('previousTime')) / 1000;

            if (this.isLoaded()) {
                var sources = this.get('sources');

                _.each(sources.actors, function (actor) {
                    actor.update(interval);
                });

                _.each(sources.cameras, function (camera) {
                    camera.update(interval);
                });

                sources.tree.object.prepareRender();
            }

            this.trigger('render', { interval: interval })
                .set('previousTime', currentTime)
                .set('request', animationFrame.request(this.render));
        },

        isLoaded: function () {
            return !this.get('loading');
        }

    }, load), {

        setConfig: function (config) {
            _.extend(namespace.config.SCENE, config);
        }

    });

});