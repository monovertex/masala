
define([], function () {

    var NO_MOVEMENT = 0,
        MOVE_POSITIVE = 1,
        MOVE_NEGATIVE = -1;

    return {
        NO_MOVEMENT: NO_MOVEMENT,
        MOVE_POSITIVE: MOVE_POSITIVE,
        MOVE_NEGATIVE: MOVE_NEGATIVE,
        ROTATIONS: {
            'yaw': 'y',
            'pitch': 'z',
            'roll': 'x',
            NONE: 0
        },
        MOUSE_FACTOR: -0.0005,
        DEFAULTS: {
            MOVEMENT: {
                MINIMUM_SPEED: 0.5,
                MAXIMUM_SPEED: 10,
                ACCELERATION: 3,
                DECCELERATION: 5
            },
            ROTATION: {
                SPEED: 0.35,
                SENSITIVITY: 1,
                ORDER: ['x', 'z', 'y']
            }
        },
        CONTROLS: {
            'forward': { axis: 'x', direction: MOVE_POSITIVE },
            'backward': { axis: 'x', direction: MOVE_NEGATIVE },
            'right': { axis: 'z', direction: MOVE_POSITIVE },
            'left': { axis: 'z', direction: MOVE_NEGATIVE },
            'up': { axis: 'y', direction: MOVE_POSITIVE },
            'down': { axis: 'y', direction: MOVE_NEGATIVE },

            'rollLeft': {
                axis: 'x',
                direction: MOVE_NEGATIVE,
                rotation: true
            },
            'rollRight': {
                axis: 'x',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'yawLeft': {
                axis: 'y',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'yawRight': {
                axis: 'y',
                direction: MOVE_NEGATIVE,
                rotation: true
            },
            'pitchUp': {
                axis: 'z',
                direction: MOVE_POSITIVE,
                rotation: true
            },
            'pitchDown': {
                axis: 'z',
                direction: MOVE_NEGATIVE,
                rotation: true
            }
        }
    };
});