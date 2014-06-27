

define([
    'scaffolding/namespace',
    'gl/texture'
], function (namespace, Texture) {

    namespace.textCanvas = document.createElement('canvas');
    namespace.textContext = namespace.textCanvas.getContext('2d');

    console.log(textContext);

});