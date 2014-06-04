

define([
    'utility/class',
    'interaction/actor/constants',
    'interaction/actor/movement',
    'interaction/actor/rotation',
    'interaction/cursor'
], function (Class, constants, movement, rotation, cursor) {

    return Class.extend(_.extend({
        initialize: function (options) {

            this.initializeMovement(options);

            this.initializeRotation(options);

            this.setControls(options.controls);

        },

        checkVector: function (v) {
            return (!_.isUndefined(v) && _.isNumber(v.x) &&
                _.isNumber(v.y) && _.isNumber(v.z));
        },

        setNode: function (node) {
            this.node = node;
        },

        update: function (interval) {
            this.updateRotation(interval);
            this.updateMovement(interval);
        },

        toggleControl: function (toggle, rotation, axis, direction) {
            var value = (toggle ? direction : constants.NO_MOVEMENT);

            if (rotation) {
                this.rotationToggle[axis] = value;
            } else {
                this.movementControlToggle[axis] = value;
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
            var mouse = false;
            this.rotationMouseControl.x = constants.ROTATIONS.NONE;
            this.rotationMouseControl.y = constants.ROTATIONS.NONE;

            _.each(controls, function (key, control) {
                if (control === 'mouse') {
                    mouse = true;
                    this.rotationMouseControl.x = constants.ROTATIONS[key.x];
                    this.rotationMouseControl.y = constants.ROTATIONS[key.y];
                } else {
                    control = constants.CONTROLS[control];

                    this.listenToKey(
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
                this.listen(cursor, 'move', this.cursorMove);
            } else {
                cursor.removeLockRequest();
                // this.stopListening(cursor, 'move', this.cursorMove);
            }
        }
    }, movement, rotation));

});