

define([
    'gl/canvas/constants'
], function (constants) {

    var prefixes = ['', 'WEBKIT_', 'MOZ_'];

    return {

        initializeExtensions: function () {
            var extensions = constants.EXTENSIONS,
                context = this.context;

            this.availableExtensions = {};
            this.extensions = {};

            _.each(extensions, function (extensionName) {
                _.each(prefixes, function (prefix) {
                    var name = prefix + extensionName,
                        extension = context.getExtension(name);

                    if (!_.isNull(extension)) {
                        this.availableExtensions[extensionName] = true;
                        this.extensions[extensionName] = extension;
                        return false;
                    }
                }, this);
            }, this);
        },

        extensionAvailable: function (name) {
            return this.availableExtensions[name];
        },

        getExtension: function (name) {
            if (this.extensionAvailable(name)) {
                return this.extensions[name];
            }
        }

    };

});