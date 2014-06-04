
define([
    'interaction/actor/constants'
], function (constants) {

    return {

        initializeRotation: function (options) {
            // Rotation variables.
            this.rotationToggle = {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };

            this.rotationMouseControl = {
                'x': constants.ROTATIONS.NONE,
                'y': constants.ROTATIONS.NONE
            };

            this.rotationAngle = { x: 0, y: 0, z: 0 };

            this.gimbals = (_.isBoolean(options.gimbals) ?
                options.gimbals : true);

            _.bindAll(this, 'cursorMove');
        },

        cursorMove: function (cursor, eventName, data) {
            var angles = {};

            angles[this.rotationMouseControl.x] = -0.001 * data.x;
            angles[this.rotationMouseControl.y] = -0.001 * data.y;

            this.rotate(['x', 'z', 'y'], angles, true);
        },

        updateRotation: function (interval) {
            this.rotate(['x', 'z', 'y'], interval);
        },

        getAngleIncrease: function (axis, angleData, exact) {
            if (exact) {
                if (_.isPlainObject(angleData)) {
                    return angleData[axis] || 0;
                } else {
                    return angleData || 0;
                }
            } else {
                return 0.2 * angleData * this.rotationToggle[axis];
            }
        },

        rotate: function (axes, angleData, exact) {

            var axis = _.first(axes),
                angle = this.rotationAngle[axis],
                angleIncrease = this.getAngleIncrease(axis, angleData, exact);

            if (axes.length > 1) {
                switch (axis) {
                    case 'x': this.rotateX(-angle); break;
                    case 'y': this.rotateY(-angle); break;
                    case 'z': this.rotateZ(-angle); break;
                }

                this.rotate(_.rest(axes), angleData, exact);
            }

            if (angleIncrease !== 0) {
                angle += angleIncrease;
                this.rotationAngle[axis] = angle;

                if (axes.length === 1) {
                    switch (axis) {
                        case 'x': this.rotateX(angleIncrease); break;
                        case 'y': this.rotateY(angleIncrease); break;
                        case 'z': this.rotateZ(angleIncrease); break;
                    }
                }
            }

            if (axes.length > 1) {
                switch (axis) {
                    case 'x': this.rotateX(angle); break;
                    case 'y': this.rotateY(angle); break;
                    case 'z': this.rotateZ(angle); break;
                }
            }
        },

        rotateX: function (angle) {
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.forward, angle);

            glm.vec3.normalize(this.up,
                glm.vec3.transformQuat(this.up, this.up, rotation));
            glm.vec3.normalize(this.right,
                glm.vec3.transformQuat(this.right, this.right, rotation));
        },

        rotateY: function (angle) {
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.up, angle);

            glm.vec3.normalize(this.forward,
                glm.vec3.transformQuat(this.forward, this.forward, rotation));
            glm.vec3.normalize(this.right,
                glm.vec3.transformQuat(this.right, this.right, rotation));
        },

        rotateZ: function (angle) {
            var rotation = glm.quat.setAxisAngle(glm.quat.create(),
                this.right, angle);

            glm.vec3.normalize(this.up,
                glm.vec3.transformQuat(this.up, this.up, rotation));
            glm.vec3.normalize(this.forward,
                glm.vec3.transformQuat(this.forward, this.forward, rotation));
        }
    };

});