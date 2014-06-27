
define([
    'utility/event'
], function (Event) {

    return {

        listenTo: function (object, eventName, callback) {
            if (_.isUndefined(object.eventListeners)) {
                object.eventListeners = {};
            }

            if (_.isUndefined(this.listeningTo)) {
                this.listeningTo = [];
            }

            if (_.isUndefined(object.eventListeners[eventName])) {
                object.eventListeners[eventName] = {};
            }

            if (_.isUndefined(object.eventListeners[eventName][this.uid])) {
                object.eventListeners[eventName][this.uid] = [];
                this.listeningTo.push(object.eventListeners[eventName]);
            }

            object.eventListeners[eventName][this.uid].push(callback);

            return this;
        },

        trigger: function (eventName, data) {
            if (!_.isUndefined(this.eventListeners)) {
                var event = new Event(this, eventName, data);

                if (eventName in this.eventListeners) {
                    _.each(
                        this.eventListeners[eventName],
                        function (listeners) {
                            _.each(listeners, function (callback) {
                                if (_.isFunction(callback)) {
                                    callback(event);
                                }
                            }, this);
                        },
                        this
                    );
                }
            }

            return this;
        },

        stopListeningTo: function (object, eventName, callback) {
            if (!_.isUndefined(object) &&
                    !_.isUndefined(object.eventListeners)) {
                if (_.isUndefined(eventName)) {
                    _.each(object.eventListeners, function (listeners) {
                        delete listeners[this.uid];
                    }, this);
                } else if (!_.isUndefined(object.eventListeners[eventName])) {
                    if (_.isUndefined(callback)) {
                        delete object.eventListeners[eventName][this.uid];
                    } else {
                        if (!_.isUndefined(
                                object.eventListeners[eventName][this.uid])) {
                            object.eventListeners[eventName][this.uid] =
                                _.without(
                                    object.eventListeners[eventName][this.uid],
                                    callback
                                );
                        }
                    }
                }
            }

            return this;
        },

        stopListening: function () {
            if (!_.isUndefined(this.listeningTo)) {
                _.each(this.listeningTo, function (listeners) {
                    delete listeners[this.uid];
                }, this);
            }
        }

    };

});