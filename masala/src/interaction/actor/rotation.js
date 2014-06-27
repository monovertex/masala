
define([
    'interaction/actor/constants'
], function (constants) {

    var defaults = constants.DEFAULTS.ROTATION;

    return {

        defaults: {
            rotationToggle: constants.NO_MOVEMENT,
            rotationMouseControl: constants.ROTATIONS.NONE,
            rotationAngle: 0,
            rotationGimbals: true,
            rotationAxisOrder: defaults.ORDER,
            rotationSensitivity: defaults.SENSITIVITY,
            rotationSpeed: defaults.SPEED,
        },

        attributeTypes: {
            'rotationToggle': 'xyz',
            'rotationMouseControl': 'xy',
            'rotationAngle': 'xyz',
            'rotationSensitivity': 'xy',
            'rotationSpeed': 'xyz'
        },

        cursorMove: function (ev) {
            var angles = {},
                data = ev.data,
                rotationMouseControl = this.get('rotationMouseControl'),
                rotationSensitivity = this.get('rotationSensitivity');

            angles[rotationMouseControl.x] = constants.MOUSE_FACTOR *
                rotationSensitivity.x * data.x;
            angles[rotationMouseControl.y] = constants.MOUSE_FACTOR *
                rotationSensitivity.y * data.y;

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
                return this.get('rotationSpeed')[axis] * angleData *
                    this.get('rotationToggle')[axis];
            }
        },

        rotate: function (angleData, exact) {
            if (this.get('rotationGimbals')) {
                this.rotateGimbals(this.get('rotationAxisOrder'), angleData,
                    exact);
            } else {
                this.rotateDirect(this.get('rotationAxisOrder'), angleData,
                    exact);
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
                angle = this.get('rotationAngle')[axis],
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
                this.set('rotationAngle.' + axis, angle);

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
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), forward,
                    angle);

            glm.vec3.normalize(up, glm.vec3.transformQuat(up, up, rotation));
            glm.vec3.normalize(right, glm.vec3.transformQuat(right, right,
                rotation));
        },

        rotateY: function (angle) {
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), up, angle);

            glm.vec3.normalize(forward, glm.vec3.transformQuat(forward, forward,
                rotation));
            glm.vec3.normalize(right, glm.vec3.transformQuat(right, right,
                rotation));
        },

        rotateZ: function (angle) {
            var up = this.get('up'),
                right = this.get('right'),
                forward = this.get('forward'),
                rotation = glm.quat.setAxisAngle(glm.quat.create(), right,
                    angle);

            glm.vec3.normalize(up, glm.vec3.transformQuat(up, up, rotation));
            glm.vec3.normalize(forward, glm.vec3.transformQuat(forward, forward,
                rotation));
        }
    };

});