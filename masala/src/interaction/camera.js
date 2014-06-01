

define([
    'interaction/actor'
], function (Actor) {

    return Actor.extend({

        initialize: function (options) {
            Actor.prototype.initialize.apply(this, arguments);

            this.fov = _.isNumber(options.fov) ? options.fov : 60;
            this.zNear = _.isNumber(options.zNear) ? options.zNear : 0.1;
            this.zFar = _.isNumber(options.zFar) ? options.zFar : 500;
        },

        use: function (context) {
            context._currentCamera = this;
        },

        render: function (canvas, context) {

            if (context._currentCamera === this) {
                var position = this.node.position,
                    viewMatrix = glm.mat4.create(),
                    modelMatrix = this.modelMatrix,
                    eyePosition = glm.vec3.transformMat4([], position,
                        modelMatrix),
                    projectionMatrix = glm.mat4.create();

                glm.mat4.lookAt(viewMatrix, position,
                    glm.vec3.add([], position, this.forward), this.up);

                glm.mat4.multiply(viewMatrix, modelMatrix, viewMatrix);

                context.uniformMatrix4fv(
                    context._currentProgram.getUniformLoc('viewMat'),
                    false,
                    viewMatrix
                );

                context.uniform3f(
                    context._currentProgram.getUniformLoc('eyePosition'),
                    eyePosition[0], eyePosition[1], eyePosition[2]
                );

                glm.mat4.perspective(projectionMatrix, this.fov * Math.PI / 180,
                    canvas.width / canvas.height, this.zNear, this.zFar);

                context.uniformMatrix4fv(
                    context._currentProgram.getUniformLoc('projectionMat'),
                    false, projectionMatrix);
            }

        },

        prepareRender: function (modelMatrix) {
            this.modelMatrix = modelMatrix;
        }

    });

});