

define([
    'scaffolding/class'
],
function (Class) {

    return Class.extend({

        defaults: {
            children: {},

            position: { x: 0, y: 0, z: 0 },
            worldPosition: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            rotation: { x: 0, y: 0, z: 0 }
        },

        attributeTypes: {
            position: 'vec3',
            scale: 'vec3',
            rotation: 'vec3',
            worldPosition: 'vec3'
        },

        set: function (key, value) {
            switch (key) {
                case 'camera':
                case 'actor':
                    if (!_.isUndefined(value)) {
                        value.set('node', this);
                    }
                    break;
            }

            return Class.prototype.set.call(this, key, value);
        },

        initialize: function () {
            this.set('localModelMatrix', glm.mat4.create())
                .set('modelMatrix', glm.mat4.create());
        },

        addChild: function (child) {
            this.get('children')[child.uid] = child;
        },

        render: function (context, resources) {
            var textureUnits = [],
                camera = this.get('camera'),
                mesh, material, modelMatrix, texture, textures, alphaTexture;

            if (context._currentCamera !== camera) {
                mesh = this.get('mesh');
                material = this.get('material');
                modelMatrix = this.get('modelMatrix');
                texture = this.get('texture');
                textures = this.get('textures');
                alphaTexture = this.get('alphaTexture');

                if (!_.isUndefined(mesh)) {
                    context.uniformMatrix4fv('modelMat', false, modelMatrix);

                    if (!_.isUndefined(material)) {
                        material.render(context);
                    }

                    if (!_.isUndefined(texture)) {
                        resources.allTextures[texture].render(
                            textureUnits.length);
                        textureUnits.push(textureUnits.length);
                    } else if (!_.isUndefined(textures)) {
                        _.each(textures, function (texture) {
                            resources.allTextures[texture].render(
                                textureUnits.length);
                            textureUnits.push(textureUnits.length);
                        });
                    }

                    if (textureUnits.length > 0) {
                        context.uniform1i('textured', 1);

                        context.uniform1iv('colorTexture', textureUnits);

                        context.uniform1i('textureCount', textureUnits.length);
                    } else {
                        context.uniform1i('textured', 0);
                    }

                    if (!_.isUndefined(alphaTexture)) {
                        context.uniform1i('alphaTextured', 1);

                        resources.allTextures[alphaTexture]
                            .render(textureUnits.length, 'alphaTexture');
                    } else {
                        context.uniform1i('alphaTextured', 0);
                    }

                    resources.allMeshes[mesh].render();
                }
            }

            _.each(this.get('children'), function (child) {
                child.render(context, resources);
            }, this);
        },

        prepareRender: function (parentModelMatrix) {
            var localModelMatrix = this.updateModelMatrix(),
                modelMatrix = this.get('modelMatrix'),
                position = this.get('position'),
                camera = this.get('camera');

            if (_.isUndefined(parentModelMatrix)) {
                glm.mat4.copy(modelMatrix, localModelMatrix);
            } else {
                glm.mat4.multiply(modelMatrix, parentModelMatrix,
                    localModelMatrix);
            }

            if (!_.isUndefined(camera)) {
                camera.prepareRender(parentModelMatrix);
            }

            glm.vec3.transformMat4(this.get('worldPosition'), position,
                modelMatrix);

            _.each(this.get('children'), function (child) {
                child.prepareRender(modelMatrix);
            }, this);

            // if (!_.isUndefined(this.billboard)) {
            //     this.billboard.prepareRender();
            // }
        },

        updateModelMatrix: function () {
            var localModelMatrix = this.get('localModelMatrix'),
                rotation = this.get('rotation');

            glm.mat4.identity(localModelMatrix);

            glm.mat4.translate(localModelMatrix, localModelMatrix,
                this.get('position'));

            glm.mat4.rotateX(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[0]));
            glm.mat4.rotateY(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[1]));
            glm.mat4.rotateZ(localModelMatrix, localModelMatrix,
                glm.glMatrix.toRadian(rotation[2]));

            glm.mat4.scale(localModelMatrix, localModelMatrix,
                this.get('scale'));

            return localModelMatrix;
        }
    });

});