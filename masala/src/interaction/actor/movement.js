
define([
    'interaction/actor/constants'
], function (constants) {

    var defaults = constants.DEFAULTS.MOVEMENT;

    return {

        defaults: {
            movementSpeed: 0,
            movementControlToggle:  constants.NO_MOVEMENT,
            movementToggle: constants.NO_MOVEMENT,
            accelerationToggle: false,
            acceleration: defaults.ACCELERATION,
            deceleration: defaults.ACCELERATION,
            speed: {
                max: defaults.MAXIMUM_SPEED,
                min: defaults.MINIMUM_SPEED
            }
        },

        attributeTypes: {
            'movementSpeed': 'xyz',
            'movementControlToggle': 'xyz',
            'movementToggle': 'xyz',
            'accelerationToggle': 'xyz',

            'speed.max': 'xyz',
            'speed.min': 'xyz',
            'acceleration': 'xyz',
            'deceleration': 'xyz'
        },

        updateMovement: function (interval) {
            var movementToggle = this.get('movementToggle'),
                accelerationToggle = this.get('accelerationToggle'),
                movementSpeed = this.get('movementSpeed'),
                minSpeed = this.get('speed.min'),
                maxSpeed = this.get('speed.max'),
                acceleration = this.get('acceleration'),
                deceleration = this.get('deceleration'),
                movementControlToggle = this.get('movementControlToggle');

            _.each(['x', 'y', 'z'], function (axis) {
                var distance;

                if (movementToggle[axis] !== constants.NO_MOVEMENT) {
                    if (accelerationToggle[axis]) {
                        if (movementSpeed[axis] < minSpeed[axis]) {
                            movementSpeed[axis] = minSpeed[axis];
                        }

                        if (movementSpeed[axis] < maxSpeed[axis]) {
                            movementSpeed[axis] += (interval *
                                acceleration[axis]);
                        }

                        if (movementSpeed[axis] > maxSpeed[axis]) {
                            movementSpeed[axis] = maxSpeed[axis];
                        }
                    } else {
                        if (movementSpeed[axis] > minSpeed[axis]) {
                            movementSpeed[axis] -= (interval *
                                deceleration[axis]);

                            if (movementControlToggle[axis] !==
                                    constants.NO_MOVEMENT) {
                                movementSpeed[axis] -= (interval *
                                    acceleration[axis]);
                            }
                        }

                        if (movementSpeed[axis] < minSpeed[axis]) {
                            movementSpeed[axis] = 0;
                        }
                    }

                    if (movementSpeed[axis] > minSpeed[axis]) {
                        distance = interval * movementSpeed[axis] *
                            movementToggle[axis];

                        switch (axis) {
                            case 'x': this.moveForward(distance); break;
                            case 'y': this.moveUp(distance); break;
                            case 'z': this.moveRight(distance); break;
                        }
                    } else {
                        movementToggle[axis] = constants.NO_MOVEMENT;
                    }
                }

                if (movementToggle[axis] === constants.NO_MOVEMENT &&
                        movementControlToggle[axis] !== constants.NO_MOVEMENT) {
                    movementToggle[axis] = movementControlToggle[axis];
                }

                if (movementToggle[axis] === movementControlToggle[axis]) {
                    accelerationToggle[axis] = true;
                }

                if (movementControlToggle[axis] === constants.NO_MOVEMENT) {
                    accelerationToggle[axis] = false;
                }

            }, this);
        },

        move: function (direction, distance) {
            var position = this.get('node').get('position');

            glm.vec3.add(position, position, glm.vec3.multiply(
                [], direction, [distance, distance, distance]));
        },

        moveForward: function (distance) {
            this.move(this.get('forward'), distance);
        },

        moveUp: function (distance) {
            this.move(this.get('up'), distance);
        },

        moveRight: function (distance) {
            this.move(this.get('right'), distance);
        },
    };

});