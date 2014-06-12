

define([
    'interaction/actor'
], function (Actor) {

    return Actor.extend({

        initialize: function (options) {
            Actor.prototype.initialize.apply(this, arguments);

            this.fov = _.isNumber(options.fov) ? options.fov : 60;
            this.zNear = _.isNumber(options.zNear) ? options.zNear : 0.1;
            this.zFar = _.isNumber(options.zFar) ? options.zFar : 500;

            this.viewMatrix = glm.mat4.create();
            this.projectionMatrix = glm.mat4.create();
            this.eyePosition = glm.vec3.create();
            this.currentViewProjectionMatrix = glm.mat4.create();
            this.inverseViewProjectionMatrix = glm.mat4.create();
        },

        use: function (context) {
            context._currentCamera = this;
        },

        render: function (canvas, context) {

            if (context._currentCamera === this) {
                var position = this.node.position;

                glm.vec3.transformMat4(this.eyePosition, position,
                    this.modelMatrix);

                glm.mat4.lookAt(this.viewMatrix, position,
                    glm.vec3.add([], position, this.forward), this.up);

                glm.mat4.multiply(this.viewMatrix, this.modelMatrix,
                    this.viewMatrix);

                glm.mat4.perspective(this.projectionMatrix,
                    this.fov * Math.PI / 180, canvas.width / canvas.height,
                    this.zNear, this.zFar);

                this.previousViewProjectionMatrix = glm.mat4.clone(
                    this.currentViewProjectionMatrix);

                glm.mat4.multiply(this.currentViewProjectionMatrix,
                    this.projectionMatrix, this.viewMatrix);
                glm.mat4.invert(this.inverseViewProjectionMatrix,
                    this.currentViewProjectionMatrix);

                this.sendUniforms(context);
            }

        },

        sendUniforms: function (context) {
            context.uniformMatrix4fv('viewMat', false, this.viewMatrix);

            context.uniform3f('eyePosition', this.eyePosition[0],
                this.eyePosition[1], this.eyePosition[2]);

            context.uniformMatrix4fv('projectionMat', false,
                this.projectionMatrix);

            context.uniformMatrix4fv('viewProjectionMat', false,
                this.currentViewProjectionMatrix);

            context.uniformMatrix4fv('viewProjectionInverseMat', false,
                this.inverseViewProjectionMatrix);

            context.uniformMatrix4fv('previousViewProjectionMat', false,
                this.previousViewProjectionMatrix);
        },

        prepareRender: function (modelMatrix) {
            this.modelMatrix = modelMatrix;
        }

    });

});