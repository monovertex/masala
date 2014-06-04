
define([
    'interaction/actor/constants'
], function (constants) {

    return {

        initializeMovement: function (options) {
            var defaults = constants.DEFAULTS.MOVEMENT;

            this.movementSpeed = { x: 0, y: 0, z: 0 };
            this.movementControlToggle = {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };
            this.movementToggle =  {
                x: constants.NO_MOVEMENT,
                y: constants.NO_MOVEMENT,
                z: constants.NO_MOVEMENT
            };
            this.accelerationToggle =  { x: false, y: false, z: false };

            this.minimumSpeed = {
                x: defaults.MINIMUM_SPEED,
                y: defaults.MINIMUM_SPEED,
                z: defaults.MINIMUM_SPEED
            };

            this.maximumSpeed = {
                x: defaults.MAXIMUM_SPEED,
                y: defaults.MAXIMUM_SPEED,
                z: defaults.MAXIMUM_SPEED
            };

            this.acceleration = {
                x: defaults.ACCELERATION,
                y: defaults.ACCELERATION,
                z: defaults.ACCELERATION
            };

            this.deceleration = {
                x: defaults.ACCELERATION,
                y: defaults.ACCELERATION,
                z: defaults.ACCELERATION
            };

            if (!_.isUndefined(options.speed)) {
                this.setDefaultValues(options.speed.min, this.minimumSpeed);
                this.setDefaultValues(options.speed.max, this.maximumSpeed);
            }

            this.setDefaultValues(options.acceleration, this.acceleration);
            this.setDefaultValues(options.deceleration, this.deceleration);

            // Directional vectors.
            if (this.checkVector(options.forward)) {
                this.forward = glm.vec3.fromValues(options.forward.x,
                    options.forward.y, options.forward.z);
                glm.vec3.normalize(this.forward, this.forward);
            } else {
                this.forward = glm.vec3.fromValues(1, 0, 0);
            }

            if (this.checkVector(options.up)) {
                this.up = glm.vec3.fromValues(options.up.x,
                    options.up.y, options.up.z);
                glm.vec3.normalize(this.up, this.up);
            } else {
                this.up = glm.vec3.fromValues(0, 1, 0);
            }

            this.right = glm.vec3.create();
            glm.vec3.cross(this.right, this.forward, this.up);
            glm.vec3.normalize(this.right, this.right);

            glm.vec3.cross(this.up, this.right, this.forward);
            glm.vec3.normalize(this.up, this.up);
        },

        updateMovement: function (interval) {

            _.each(['x', 'y', 'z'], function (axis) {
                var distance;

                if (this.movementToggle[axis] !== constants.NO_MOVEMENT) {
                    if (this.accelerationToggle[axis]) {
                        if (this.movementSpeed[axis] <
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] = this.minimumSpeed[axis];
                        }

                        if (this.movementSpeed[axis] <
                                this.maximumSpeed[axis]) {
                            this.movementSpeed[axis] += (interval *
                                this.acceleration[axis]);
                        }

                        if (this.movementSpeed[axis] >
                                this.maximumSpeed[axis]) {
                            this.movementSpeed[axis] = this.maximumSpeed[axis];
                        }
                    } else {
                        if (this.movementSpeed[axis] >
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] -= (interval *
                                this.deceleration[axis]);

                            if (this.movementControlToggle[axis] !==
                                    constants.NO_MOVEMENT) {
                                this.movementSpeed[axis] -= (interval *
                                    this.acceleration[axis]);
                            }
                        }

                        if (this.movementSpeed[axis] <
                                this.minimumSpeed[axis]) {
                            this.movementSpeed[axis] = 0;
                        }
                    }

                    if (this.movementSpeed[axis] > this.minimumSpeed[axis]) {
                        distance = interval * this.movementSpeed[axis] *
                            this.movementToggle[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    } else {
                        this.movementToggle[axis] = constants.NO_MOVEMENT;
                    }
                }

                if (this.movementToggle[axis] === constants.NO_MOVEMENT &&
                        this.movementControlToggle[axis] !==
                        constants.NO_MOVEMENT) {
                    this.movementToggle[axis] =
                        this.movementControlToggle[axis];
                }

                if (this.movementToggle[axis] ===
                        this.movementControlToggle[axis]) {
                    this.accelerationToggle[axis] = true;
                }

                if (this.movementControlToggle[axis] ===
                        constants.NO_MOVEMENT) {
                    this.accelerationToggle[axis] = false;
                }

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
        },
    };

});