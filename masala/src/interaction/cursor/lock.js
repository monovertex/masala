

define([], function () {

    var el = document.body,
        vendorUtilities = {
            'native': {
                detect: function () {
                    return 'pointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.pointerLockElement;
                },
                getEventName: _.constant('pointerlockchange'),
                getMovementX: _.constant('movementX'),
                getMovementY: _.constant('movementY'),
                lock: el.requestPointerLock,
                exitLock: document.exitPointerLock
            },
            'moz': {
                detect: function () {
                    return 'mozPointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.mozPointerLockElement;
                },
                getEventName: _.constant('mozpointerlockchange'),
                getMovementX: _.constant('mozMovementX'),
                getMovementY: _.constant('mozMovementY'),
                lock: el.mozRequestPointerLock,
                exitLock: document.mozExitPointerLock
            },
            'webkit': {
                detect: function () {
                    return 'webkitPointerLockElement' in document;
                },
                getLockElement: function () {
                    return document.webkitPointerLockElement;
                },
                getEventName: _.constant('webkitpointerlockchange'),
                getMovementX: _.constant('webkitMovementX'),
                getMovementY: _.constant('webkitMovementY'),
                lock: el.webkitRequestPointerLock,
                exitLock: document.webkitExitPointerLock
            }
        };

    var utility;

    _.each(vendorUtilities, function (vendorUtility) {
        if (vendorUtility.detect()) {
            utility = vendorUtility;
        }
    });

    utility.lock = utility.lock.bind(el);
    utility.exitLock = utility.exitLock.bind(document);

    return _.extend(utility, {

        requestLock: function () {
            if (this.lockRequests > 0) {
                this.lock();
            }
        },

        addLockRequest: function () {
            this.lockRequests = this.lockRequests || 0;
            this.lockRequests++;
        },

        removeLockRequest: function () {
            this.lockRequests = this.lockRequests || 1;
            this.lockRequests--;

            if (this.lockRequests === 0 && this.isLocked()) {
                this.exitLock();
            }
        },

        getElement: function () {
            return el;
        },

        isLocked: function () {
            return this.getLockElement() === this.getElement();
        }

    });

});