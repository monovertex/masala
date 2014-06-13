
define([
    'utility/namespace',
    'utility/class',
    'interaction/cursor/lock'
], function (namespace, Class, lock) {

    var Cursor = Class.extend(_.extend({

        initialize: function () {
            _.bindAll(this, 'mouseMove', 'requestLock');

            document.addEventListener(this.getEventName(), (function () {
                if (this.isLocked()) {
                    document.addEventListener('mousemove', this.mouseMove);
                } else {
                    document.removeEventListener('mousemove', this.mouseMove);
                }
            }).bind(this));
        },

        mouseMove: function (ev) {
            var x = ev[this.getMovementX()],
                y = ev[this.getMovementY()];

            this.trigger('move', { x: x, y: y });
        }

    }, lock));

    namespace.cursor = namespace.cursor || new Cursor();

    return namespace.cursor;

});