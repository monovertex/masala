

define([], function () {

    var uid = 0,
        Class = function () {
            this.uid = uid++;

            if (this.initialize) {
                this.initialize.apply(this, arguments);
            }
        };

    _.extend(Class.prototype, {
        listeners: {},

        listen: function (object, eventName, callback) {
            if (!_.isUndefined(object.listeners)) {
                if (_.isUndefined(object.listeners[eventName])) {
                    object.listeners[eventName] = {};
                }

                if (_.isUndefined(object.listeners[eventName][this._uid])) {
                    object.listeners[eventName][this.uid] = [];
                }

                object.listeners[eventName][this.uid].push(callback);
            }
        },

        trigger: function (eventName) {
            if (eventName in this.listeners) {
                _.forEach(this.listeners[eventName], function (listener) {
                    _.forEach(listener, function (callback) {
                        if (_.isFunction(callback)) {
                            callback(this, eventName);
                        }
                    }, this);
                }, this);
            }
        },

        delegate: function (model, functionName) {
            this[functionName] = function () {
                return model[functionName](arguments);
            };
        },

        delegateEvent: function (model, eventName) {
            this.listen(model, eventName, (function () {
                this.trigger(eventName);
            }).bind(this));
        },

        listenToKey: function (key, keyDownCallback, keyUpCallback) {
            if (_.isUndefined(this.keyListener)) {
                this.keyListener = new keypress.Listener();
            }

            this.keyListener.register_combo({
                keys: key,
                on_keyup: keyUpCallback,
                on_keydown: keyDownCallback,
                prevent_repeat: false
            });
        }
    });

    Class.extend = function (properties, staticProperties) {
        var parent = this,
            child,
            Surrogate;

        child = function () { return parent.apply(this, arguments); };

        _.extend(child, parent, staticProperties);

        Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (properties) {
            _.extend(child.prototype, properties);
        }

        child.__super__ = parent.prototype;

        return child;
    };

    return Class;

});