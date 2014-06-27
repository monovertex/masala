

define([
    'gl/canvas/constants'
], function (constants) {

    var prefixes = ['', 'WEBKIT_', 'MOZ_'];

    return {

        initializeExtensions: function () {
            var requiredExtensions = constants.EXTENSIONS,
                context = this.get('context'),
                availableExtensions = {},
                extensions = {};

            _.each(requiredExtensions, function (extensionName) {
                _.each(prefixes, function (prefix) {
                    var name = prefix + extensionName,
                        extension = context.getExtension(name);

                    if (!_.isNull(extension)) {
                        availableExtensions[extensionName] = true;
                        extensions[extensionName] = extension;
                        return false;
                    }
                }, this);
            }, this);

            this.set('availableExtensions', availableExtensions);
            this.set('extensions', extensions);
        },

        extensionAvailable: function (name) {
            return this.get('availableExtensions.' + name);
        },

        getExtension: function (name) {
            if (this.extensionAvailable(name)) {
                return this.get('extensions.' + name);
            }
        }

    };

});