

define([
    'scaffolding/class/events',
    'scaffolding/class/attributes'
], function (events, attributes) {

    var Class = function (attributes) {
            this.uid = _.uniqueId();

            if (!_.isUndefined(this.defaults) &&
                    _.isPlainObject(this.defaults)) {
                _.each(this.defaults, function (attribute, key) {
                    this.set(key, _.cloneDeep(attribute));
                }, this);
            }

            _.each(attributes, function (attribute, key) {
                this.set(key, attribute);
            }, this);

            if (!_.isUndefined(this.initialize) &&
                    _.isFunction(this.initialize)) {
                this.initialize.apply(this, arguments);
            }
        };

    _.extend(Class.prototype, events, attributes);

    Class.extend = function (properties, staticProperties) {
        var parent = this,
            child,
            Surrogate;

        child = function () { return parent.apply(this, arguments); };

        _.merge(child, parent, staticProperties);

        Surrogate = function () { this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate();

        if (properties) {
            _.merge(child.prototype, properties);
        }

        return child;
    };

    return Class;

});