
define([
    'scaffolding/class',
    'geometry/mesh',
    'geometry/billboard/constants'
], function (Class, Mesh, constants) {

    return Class.extend({

        initialize: function () {
            this.modelMatrix = glm.mat4.create();
            this.forward = glm.vec3.create();
            this.up = glm.vec3.create();
            this.left = glm.vec3.create();
        },

        setNode: function (node) {
            this.node = node;
        },

        setTarget: function (node) {
            this.target = node;
        },

        prepareRender: function () {
            var position = this.node.worldPosition,
                targetPosition = this.target.worldPosition,
                modelMatrix = this.modelMatrix;

            glm.vec3.set(this.up, 0, 1, 0);
            glm.vec3.substract(this.forward, position, targetPosition);
            glm.vec3.cross(this.left, this.up, this.forward);
            glm.vec3.cross(this.up, this.forward, this.left);

            modelMatrix[0] = this.left[0];
            modelMatrix[1] = this.left[1];
            modelMatrix[2] = this.left[2];
            modelMatrix[3] = 0;

            modelMatrix[4] = this.up[0];
            modelMatrix[5] = this.up[1];
            modelMatrix[6] = this.up[2];
            modelMatrix[7] = 0;

            modelMatrix[8] = this.forward[0];
            modelMatrix[9] = this.forward[1];
            modelMatrix[10] = this.forward[2];
            modelMatrix[11] = 0;

            modelMatrix[12] = position[0];
            modelMatrix[13] = position[1];
            modelMatrix[14] = position[2];
            modelMatrix[15] = 1;
        }



    });

});