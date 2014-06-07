

define([
    'utility/class'
],
function (Class) {

    return Class.extend({

        initialize: function (options) {
            this.children = {};
            this.scaleMatrix = glm.mat4.create();
            this.rotationMatrix = glm.mat4.create();
            this.position = glm.vec3.create();

            if (!_.isUndefined(options.camera)) {
                this.camera = options.camera;
                this.camera.setNode(this);
            }

            if (!_.isUndefined(options.actor)) {
                this.actor = options.actor;
                this.actor.setNode(this);
            }

            if (!_.isUndefined(options.material)) {
                this.material = options.material;
            }

            if (!_.isUndefined(options.position)) {
                this.setPosition(
                    _.isNumber(options.position.x) ? options.position.x : 0,
                    _.isNumber(options.position.y) ? options.position.y : 0,
                    _.isNumber(options.position.z) ? options.position.z : 0
                );
            }

            if (!_.isUndefined(options.scale)) {
                this.setScale(
                    _.isNumber(options.scale.x) ? options.scale.x : 1,
                    _.isNumber(options.scale.y) ? options.scale.y : 1,
                    _.isNumber(options.scale.z) ? options.scale.z : 1
                );
            }
        },

        render: function (context, resources) {

            if (context._currentCamera !== this.camera) {
                if (!_.isUndefined(this.mesh)) {
                    var program = context._currentProgram;

                    context.uniformMatrix4fv(program.getUniformLoc('modelMat'),
                        false, this.modelMatrix);

                    if (!_.isUndefined(this.material)) {
                        this.material.render(context);
                    }

                    if (!_.isUndefined(this.texture)) {
                        context.uniform1i(program.getUniformLoc('textured'), 1);

                        resources.allTextures[this.texture].render(0);
                    } else {
                        context.uniform1i(program.getUniformLoc('textured'), 0);
                    }

                    if (!_.isUndefined(this.alphaTexture)) {
                        context.uniform1i(
                            program.getUniformLoc('alphaTextured'), 1);

                        resources.allTextures[this.alphaTexture]
                            .render(1, true);
                    } else {
                        context.uniform1i(
                            program.getUniformLoc('alphaTextured'), 0);
                    }

                    resources.allMeshes[this.mesh].render();
                }
            }

            _.each(this.children, function (child) {
                child.render(context, resources);
            }, this);
        },

        prepareRender: function (parentModelMatrix) {
            var localModelMatrix = glm.mat4.create(),
                translationMatrix = glm.mat4.translate([], glm.mat4.create(),
                    this.position);

            parentModelMatrix = parentModelMatrix || glm.mat4.create();

            glm.mat4.multiply(localModelMatrix, this.rotationMatrix,
                this.scaleMatrix);

            glm.mat4.multiply(localModelMatrix, translationMatrix,
                localModelMatrix);

            glm.mat4.multiply(localModelMatrix, parentModelMatrix,
                localModelMatrix);

            if (!_.isUndefined(this.camera)) {
                this.camera.prepareRender(parentModelMatrix);
            }

            this.modelMatrix = localModelMatrix;

            _.each(this.children, function (child) {
                child.prepareRender(localModelMatrix);
            }, this);
        },

        addChild: function (child) {
            this.children[child.uid] = child;
        },

        move: function () {
            var displacement;

            if (arguments.length === 1) {
                displacement = arguments[0];
            } else {
                displacement = [
                    arguments[0] || 0,
                    arguments[1] || 0,
                    arguments[2] || 0,
                ];
            }

            glm.vec3.add(this.position, this.position, displacement);
            this.trigger('change:position');
        },
        moveX: function (x) { this.move(x, 0, 0); },
        moveY: function (y) { this.move(0, y, 0); },
        moveZ: function (z) { this.move(0, 0, z); },

        setPosition: function () {
            glm.vec3.set(this.position, 0, 0, 0);
            this.move.apply(this, arguments);
        },
        setPositionX: function (x) { this.setPosition(x, 0, 0); },
        setPositionY: function (y) { this.setPosition(0, y, 0); },
        setPositionZ: function (z) { this.setPosition(0, 0, z); },


        scale: function (x, y, z) {
            glm.mat4.scale(this.scaleMatrix, this.scaleMatrix, [x || 1,
                y || 1, z || 1]);
            this.trigger('change:scale');
        },
        scaleX: function (x) { this.scale(x, 1, 1); },
        scaleY: function (y) { this.scale(1, y, 1); },
        scaleZ: function (z) { this.scale(1, 1, z); },

        setScale: function (x, y, z) {
            glm.mat4.identity(this.scaleMatrix);
            this.scale(x, y, z);
        },
        setScaleX: function (x) { this.setScale(x, 1, 1); },
        setScaleY: function (y) { this.setScale(1, y, 1); },
        setScaleZ: function (z) { this.setScale(1, 1, z); },


        rotate: function (rad, axis) {
            glm.mat4.rotate(this.rotationMatrix, this.rotationMatrix,
                rad || 0, axis);
            this.trigger('change:rotation');
        },
        rotateX: function (rad) {
            glm.mat4.rotateX(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },
        rotateY: function (rad) {
            glm.mat4.rotateY(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },
        rotateZ: function (rad) {
            glm.mat4.rotateZ(this.rotationMatrix, this.rotationMatrix,
                rad || 0);
            this.trigger('change:rotation');
        },

        setRotation: function (rad, axis) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotate(rad, axis);
        },
        setRotationX: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateX(rad);
        },
        setRotationY: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateY(rad);
        },
        setRotationZ: function (rad) {
            glm.mat4.identity(this.rotationMatrix);
            this.rotateZ(rad);
        },
    });

});