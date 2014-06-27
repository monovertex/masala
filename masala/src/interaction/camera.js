

define([
    'interaction/actor'
], function (Actor) {

    return Actor.extend({

        defaults: {
            fov: 60,
            zNear: 0.1,
            zFar: 500
        },

        attributeTypes: {
            fov: 'number',
            zNear: 'number',
            zFar: 'number'
        },

        initialize: function (attributes, options) {
            Actor.prototype.initialize.apply(this, arguments);

            this.set('viewMatrix', glm.mat4.create())
                .set('projectionMatrix', glm.mat4.create())
                .set('eyePosition', glm.vec3.create())
                .set('currentViewProjectionMatrix', glm.mat4.create())
                .set('inverseViewProjectionMatrix', glm.mat4.create());
        },

        use: function (context) {
            context._currentCamera = this;
        },

        render: function (width, height, context) {

            if (context._currentCamera === this) {
                var position = this.get('node').get('position'),
                    eyePosition = this.get('eyePosition'),
                    viewMatrix = this.get('viewMatrix'),
                    modelMatrix = this.get('modelMatrix'),
                    projectionMatrix = this.get('projectionMatrix'),
                    currentViewProjectionMatrix =
                        this.get('currentViewProjectionMatrix');

                glm.vec3.transformMat4(eyePosition, position, modelMatrix);

                glm.mat4.lookAt(viewMatrix, position,
                    glm.vec3.add([], position, this.get('forward')),
                    this.get('up'));

                glm.mat4.multiply(viewMatrix, modelMatrix, viewMatrix);

                glm.mat4.perspective(projectionMatrix,
                    this.get('fov') * Math.PI / 180, width / height,
                    this.get('zNear'), this.get('zFar'));

                this.set('previousViewProjectionMatrix',
                    glm.mat4.clone(currentViewProjectionMatrix));

                glm.mat4.multiply(currentViewProjectionMatrix,
                    projectionMatrix, viewMatrix);
                glm.mat4.invert(this.get('inverseViewProjectionMatrix'),
                    currentViewProjectionMatrix);

                this.sendUniforms(context);
            }

        },

        sendUniforms: function (context) {
            var eyePosition = this.get('eyePosition');

            context.uniformMatrix4fv('viewMat', false, this.get('viewMatrix'));

            context.uniform3f('eyePosition', eyePosition[0], eyePosition[1],
                eyePosition[2]);

            context.uniformMatrix4fv('projectionMat', false,
                this.get('projectionMatrix'));

            context.uniformMatrix4fv('viewProjectionMat', false,
                this.get('currentViewProjectionMatrix'));

            context.uniformMatrix4fv('viewProjectionInverseMat', false,
                this.get('inverseViewProjectionMatrix'));

            context.uniformMatrix4fv('previousViewProjectionMat', false,
                this.get('previousViewProjectionMatrix'));
        },

        prepareRender: function (modelMatrix) {
            this.set('modelMatrix', modelMatrix);
        }

    });

});