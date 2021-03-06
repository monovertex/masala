

define([], function () {

    return function (functionName, args) {
        console.info(
            'gl.' + functionName + '(' +
            WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
            ')'
        );

        _.each(args, function (arg) {
            if (_.isUndefined(arg)) {
                console.warn(
                    "Undefined passed to gl." + functionName + "(" +
                    WebGLDebugUtils.glFunctionArgsToString(functionName, args) +
                    ")"
                );
            }
        });
    };

});