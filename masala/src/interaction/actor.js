

define([
    'scaffolding/class',
    'interaction/actor/constants',
    'interaction/actor/movement',
    'interaction/actor/rotation',
    'interaction/cursor',
    'utility/error',
    'interaction/keyboard'
], function (Class, constants, movement, rotation, cursor, error, Keyboard) {

    return Class.extend(_.merge({

        set: function (key, value) {

            switch (key) {
                case 'speed':
                    if (_.isPlainObject(value)) {
                        if ('max' in value) {
                            Class.prototype.set.call(this, 'speed.max',
                                value.max);
                        }

                        if ('min' in value) {
                            Class.prototype.set.call(this, 'speed.min',
                                value.min);
                        }

                        return this;
                    } else {
                        error('speed configuration must contain minimum or ' +
                            'maximum properties');
                    }
                    break;
                case 'rotationAxisOrder':
                    if (_.isArray(value) && value.length === 3 &&
                            _.indexOf(value, 'x') !== -1 &&
                            _.indexOf(value, 'y') !== -1 &&
                            _.indexOf(value, 'z') !== -1) {
                        return Class.prototype.set.call(this, key, value);
                    } else {
                        error('incorrect format for rotationAxisOrder');
                    }
                    break;
            }

            return Class.prototype.set.call(this, key, value);
        },

        defaults: {
            forward: { x: 1, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        },

        attributeTypes: {
            'up': 'vec3',
            'forward': 'vec3',
            'right': 'vec3'
        },

        initialize: function () {

            _.bindAll(this, 'cursorMove');

            var forward = this.get('forward'),
                up = this.get('up'),
                right = glm.vec3.create();

            glm.vec3.normalize(forward, forward);
            glm.vec3.normalize(up, up);

            glm.vec3.cross(right, forward, up);
            glm.vec3.normalize(right, right);
            this.set('right', right);

            glm.vec3.cross(up, right, forward);
            glm.vec3.normalize(up, up);

            this.setControls(this.get('controls'));

        },

        update: function (interval) {
            this.updateRotation(interval);
            this.updateMovement(interval);
        },

        toggleControl: function (toggle, rotation, axis, direction) {
            var value = (toggle ? direction : constants.NO_MOVEMENT);

            if (rotation) {
                this.get('rotationToggle')[axis] = value;
            } else {
                this.get('movementControlToggle')[axis] = value;
            }
        },

        setDefaultValues: function (configuration, target) {
            if (!_.isUndefined(configuration)) {
                if (_.isPlainObject(configuration)) {
                    _.each(configuration, function (configValue, axis) {
                        if (_.isNumber(configValue)) {
                            target[axis] = configValue;
                        }
                    });
                } else if (_.isNumber(configuration)) {
                    _.each(target, function (targetValue, axis) {
                        target[axis] = configuration;
                    });
                }
            }
        },

        setControls: function (controls) {
            var mouse = false,
                rotationMouseControl = this.get('rotationMouseControl');

            rotationMouseControl.x = constants.ROTATIONS.NONE;
            rotationMouseControl.y = constants.ROTATIONS.NONE;

            _.each(controls, function (key, control) {
                if (control === 'mouse') {
                    mouse = true;
                    rotationMouseControl.x = constants.ROTATIONS[key.x];
                    rotationMouseControl.y = constants.ROTATIONS[key.y];

                    if (!_.isUndefined(key.sensitivity)) {
                        this.set('rotationSensitivity', key.sensitivity);
                    }
                } else {
                    control = constants.CONTROLS[control];

                    Keyboard.listen(
                        key,

                        (function () {
                            this.toggleControl(true, control.rotation,
                                control.axis, control.direction);
                        }).bind(this),

                        (function () {
                            this.toggleControl(false, control.rotation,
                                control.axis);
                        }).bind(this)
                    );
                }
            }, this);

            if (mouse) {
                cursor.addLockRequest();
                this.listenTo(cursor, 'move', this.cursorMove);
            } else {
                cursor.removeLockRequest();
                this.stopListeningTo(cursor, 'move', this.cursorMove);
            }
        }
    }, movement, rotation));

});