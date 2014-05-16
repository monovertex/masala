
require.config({

    baseUrl: '/masala/lib',

    paths: {
        app: '../app',
        shaders: '../shaders',
        meshes: '../meshes',
        scenes: '../scenes'
    },

    shim: {
        'webgl-debug': { exports: 'webgl-debug' },
        'keypress': { exports: 'keypress' }
    }

});

define(['gl-matrix', 'app/main'], function (glm, Masala) {

    var scene = new Masala.Scene('/masala/scenes/1.json'),
        canvasLeftEl = document.getElementById('canvas-left'),
        canvasRightEl = document.getElementById('canvas-right'),
        canvasLeft = new Masala.Canvas(canvasLeftEl),
        canvasRight = new Masala.Canvas(canvasRightEl);

    canvasLeft.setScene(scene);
    canvasRight.setScene(
        scene,
        function (resources) {
            this.useCamera(resources.nodes.secondaryCamera.camera);
            this.useProgram(resources.programs.basic);
        }
    );

    scene.startRendering();

});