
define([
    'interaction/actor/constants'
], function (constants) {

    return {

        initializeRotation: function (options) {
            var defaults = constants.DEFAULTS.ROTATION;

            // Rotation variables.
            this.rotationToggle = {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };

            this.rotationMouseControl = {
                x: constants.ROTATIONS.NONE,
                y: constants.ROTATIONS.NONE
            };

            this.rotationAngle = { x: 0, y: 0, z: 0 };

            this.gimbals = (_.isBoolean(options.gimbals) ?
                options.gimbals : true);

            this.rotationSensitivity = {
                x: defaults.SENSITIVITY,
                y: defaults.SENSITIVITY,
                z: defaults.SENSITIVITY
            };

            this.rotationSpeed = {
                x: defaults.SPEED,
                y: defaults.SPEED,
                z: defaults.SPEED
            };

            if (!_.isUndefined(options.controls) &&
                    !_.isUndefined(options.controls.mouse)) {
                this.setDefaultValues(options.controls.mouse.sensitivity,
                    this.rotationSensitivity);
            }

            this.setDefaultValues(options.rotationSpeed, this.rotationSpeed);

            if (_.isUndefined(options.gimbals)) {
                this.rotationWithGimbals = true;

                if (_.isArray(options.gimbals) &&
                        options.gimbals.length === 3) {
                    this.rotationAxes = options.gimbals;
                } else {
                    this.rotationAxes = defaults.ORDER;
                }
            } else {
                this.rotationWithGimbals = false;

                if (_.isArray(options.rotationOrder) &&
                        options.rotationOrder.length === 3) {
                    this.rotationAxes = options.rotationOrder;
                } else {
                    this.rotationAxes = defaults.ORDER;
                }
            }

            _.bindAll(this, 'cursorMove');
        },

        cursorMove: function (cursor, eventName, data) {
            var angles = {};

            angles[this.rotationMouseControl.x] = constants.MOUSE_FACTOR *
                this.rotationSensitivity[this.rotationMouseControl.x] * data.x;
            angles[this.rotationMouseControl.y] = constants.MOUSE_FACTOR *
                this.rotationSensitivity[this.rotationMouseControl.y] * data.y;

            this.rotate(angles, true);
        },

        updateRotation: function (interval) {
            this.rotate(interval);
        },

        getAngleIncrease: function (axis, angleData, exact) {
            if (exact) {
                if (_.isPlainObject(angleData)) {
                    return angleData[axis] || 0;
                } else {
                    return angleData || 0;
                }
            } else {
                return this.rotationSpeed[axis] * angleData *
                    this.rotationToggle[axis];
            }
        },

        rotate: function (angleData, exact) {
            if (this.rotationWithGimbals) {
                this.rotateGimbals(this.rotationAxes, angleData, exact);
            } else {
                this.rotateDirect(this.rotationAxes, angleData, exact);
            }
        },

        rotateDirect: function (order, angleData, exact) {

            _.each(order, function (axis) {
                var angleIncrease = this.getAngleIncrease(axis, angleData,
                        exact);

                switch (axis) {
                    case 'x': this.rotateX(angleIncrease); break;
                    case 'y': this.rotateY(angleIncrease); break;
                    case 'z': this.rotateZ(angleIncrease); break;
                }
            }, this);

        },

        rotateGimbals: function (axes, angleData, exact) {

            var axis = _.first(axes),
                angle = this.rotationAngle[axis],
                angleIncrease = this.getAngleIncrease(axis, angleData, exact);

            if (axes.length > 1) {
                switch (axis) {
                    case 'x': this.rotateX(-angle); break;
                    case 'y': this.rotateY(-angle); break;
                    case 'z': this.rotateZ(-angle); break;
                }

                this.rotateGimbals(_.rest(axes), angleData, exact);
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