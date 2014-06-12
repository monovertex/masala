
define([
    'gl/canvas/constants'
], function (constants) {

    function extendContext(context, methodName, getter) {
        var originalMethod = context[methodName];

        context['_' + methodName] = originalMethod;

        context[methodName] = (function (locationName) {
            var program = this._currentProgram,
                location, actualArguments;

            if (!_.isUndefined(program)) {
                location = program[getter].call(program, locationName);

                if (!_.isNull(location) && location !== -1) {
                    actualArguments = Array.prototype.slice.call(arguments, 1);
                    actualArguments.unshift(location);

                    originalMethod.apply(context, actualArguments);
                }
            }
        }).bind(context);
    }

    return function (context) {
        _.each(constants.CONTEXT_METHODS.UNIFORMS, function (methodName) {
            extendContext(this, methodName, 'getUniformLoc');
        }, context);

        _.each(constants.CONTEXT_METHODS.ATTRIBUTES, function (methodName) {
            extendContext(this, methodName, 'getAttribLoc');
        }, context);
    };

});