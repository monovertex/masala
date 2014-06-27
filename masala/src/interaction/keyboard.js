

define([
    'scaffolding/class',
    'scaffolding/namespace'
], function (Class, namespace) {

    var Keyboard = Class.extend({

        initialize: function () {
            this.set('listener', new keypress.Listener());
        },

        listen: function (keys, downCallback, upCallback) {
            this.get('listener').register_combo({
                keys: keys,
                on_keydown: downCallback,
                on_keyup: upCallback
            });
        }

    });

    namespace.Keyboard = namespace.Keyboard || new Keyboard();

    return namespace.Keyboard;

});