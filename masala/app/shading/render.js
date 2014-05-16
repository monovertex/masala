

define(['underscore'], function (_) {

    return function (context, lights) {
        var types = [], radii = [], positions = [], directions = [],
            colors = [], anglesInner = [], anglesOuter = [],
            program = context._currentProgram;

        _.forEach(lights, function (light) {
            var data = light.output();

            types.push(data.type);
            radii.push(data.radius);
            positions.push(data.position[0], data.position[1],
                data.position[2]);
            colors.push(data.color.r, data.color.g, data.color.b);

            if (_.isUndefined(data.direction)) {
                directions.push(0, 0, 0);
            } else {
                directions.push(data.direction[0], data.direction[1],
                    data.direction[2]);
            }

            anglesInner.push(data.angleInner || 0);
            anglesOuter.push(data.angleOuter || 0);
        });

        context.uniform1i(program.getUniformLoc('lightCount'),
            _.size(lights));
        context.uniform1iv(program.getUniformLoc('lightType'),
            new Int32Array(types));
        context.uniform1fv(program.getUniformLoc('lightRadius'),
            new Float32Array(radii));
        context.uniform3fv(program.getUniformLoc('lightPosition'),
            new Float32Array(positions));
        context.uniform3fv(program.getUniformLoc('lightColor'),
            new Float32Array(colors));
        context.uniform3fv(program.getUniformLoc('lightDirection'),
            new Float32Array(directions));
        context.uniform1fv(program.getUniformLoc('lightAngleInner'),
            new Float32Array(anglesInner));
        context.uniform1fv(program.getUniformLoc('lightAngleOuter'),
            new Float32Array(anglesOuter));
    }

});