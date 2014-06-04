
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
            'roll': 'x'
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