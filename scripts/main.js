

var scene = new Masala.Scene('/masala/examples/1.json'),
    canvasLeft = new Masala.Canvas(
        document.getElementById('canvas-left'),
        { multisampling: 4 }
    ),
    canvasRight = new Masala.Canvas(
        document.getElementById('canvas-right'),
        { multisampling: 2 }
    );

canvasLeft.setScene(scene);
canvasRight.setScene(
    scene,
    function (resources) {
        this.useCamera(resources.nodes.secondaryCamera.camera);
        this.useProgram(resources.programs.basic);
    }
);

scene.startRendering();