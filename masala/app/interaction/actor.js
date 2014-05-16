

define(['gl-matrix', 'app/utility/class'],
function (glm, Class) {

    var NO_MOVEMENT = 0,
        MOVE_POSITIVE = 1,
        MOVE_NEGATIVE = -1,
        CONTROLS = {
            'forward': { axis: 'x', direction: MOVE_POSITIVE },
            'backward': { axis: 'x', direction: MOVE_NEGATIVE },
            'right': { axis: 'z', direction: MOVE_POSITIVE },
            'left': { axis: 'z', direction: MOVE_NEGATIVE },
            'up': { axis: 'y', direction: MOVE_POSITIVE },
            'down': { axis: 'y', direction: MOVE_NEGATIVE }
        };

    return Class.extend({
        initialize: function (options) {
            this.up = glm.vec3.fromValues(0, 1, 0);
            this.right = glm.vec3.create();

            this.speed = { x: 0, y: 0, z: 0 };
            this.toggle = { x: NO_MOVEMENT, y: NO_MOVEMENT, z: NO_MOVEMENT };
            this.movement = { x: NO_MOVEMENT, y: NO_MOVEMENT, z: NO_MOVEMENT };

            if (_.isUndefined(options.forward)) {
                this.forward = glm.vec3.fromValues(1, 0, 0);
            } else {
                this.forward = glm.vec3.fromValues(
                    _.isNumber(options.forward.x) ? options.forward.x : 1,
                    _.isNumber(options.forward.y) ? options.forward.y : 0,
                    _.isNumber(options.forward.z) ? options.forward.z : 0
                );
            }

            if (_.isUndefined(options.speed)) {
                this.minimumSpeed = 0;
                this.maximumSpeed = 10;
            } else {
                this.minimumSpeed = _.isNumber(options.speed.min) ?
                    options.speed.min : 0;
                this.maximumSpeed = _.isNumber(options.speed.max) ?
                    options.speed.max : _.isNumber(options.speed) ?
                    options.speed : 10;
            }

            this.acceleration = _.isNumber(options.acceleration) ?
                options.acceleration : 3;

            this.setControls(options.controls);

            glm.vec3.cross(this.right, this.forward, this.up);
        },

        setNode: function (node) {
            this.node = node;
        },

        update: function (interval) {
            _.forEach(this.toggle, function (axisToggle, axis) {
                var accelerate = axisToggle != NO_MOVEMENT,
                    distance;

                if (accelerate) {
                    this.movement[axis] = axisToggle;
                }

                if (accelerate) {
                    this.movement[axis]
                    if (this.speed[axis] < this.minimumSpeed) {
                        this.speed[axis] = this.minimumSpeed;
                    } else if (this.speed[axis] < this.maximumSpeed) {
                        this.speed[axis] += interval * this.acceleration;
                    } else if (this.speed[axis] > this.maximumSpeed) {
                        this.speed[axis] = this.maximumSpeed;
                    }
                } else {
                    if (this.speed[axis] > this.minimumSpeed) {
                        this.speed[axis] -= interval * this.acceleration;
                    } else if (this.speed[axis] < this.minimumSpeed) {
                        this.speed[axis] = 0;
                    }
                }

                if (this.speed[axis] > this.minimumSpeed) {
                    if (this.movement[axis] != NO_MOVEMENT) {
                        distance = interval * this.speed[axis] *
                            this.movement[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    }
                } else {
                    this.movement[axis] = NO_MOVEMENT;
                }

            }, this);

            return this;
        },

        toggleControl: function (toggle, axis, direction) {
            this.toggle[axis] = (toggle ? direction : NO_MOVEMENT);
        },

        setControls: function (controls) {
            _.forEach(controls, function (key, control) {
                control = CONTROLS[control];

                this.listenToKey(
                    key,

                    (function () {
                        this.toggleControl(true, control.axis,
                            control.direction);
                    }).bind(this),

                    (function () {
                        this.toggleControl(false, control.axis);
                    }).bind(this)
                );
            }, this);
        },

        move: function (direction, distance) {
            glm.vec3.add(
                this.node.position,
                this.node.position,
                glm.vec3.multiply([], direction, [distance, distance, distance])
            );
        },
        moveForward: function (distance) {
            this.move(this.forward, distance);
        },
        moveUp: function (distance) {
            this.move(this.up, distance);
        },
        moveRight: function (distance) {
            this.move(this.right, distance);
        }
    });

});