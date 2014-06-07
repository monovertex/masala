

define([
    'utility/namespace',
    'gl/canvas',
    'utility/scene',
    'utility/config'
],
function (namespace, Canvas, Scene, config) {

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

});