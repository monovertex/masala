
define([
    'gl/canvas/constants'
], function (constants) {

    return {

        initializeFpsCounter: function () {
            if (_.isUndefined(this.get('fpsCounter'))) {

                _.bindAll(this, 'positionFpsCounter', 'updateFpsCounter');

                var canvas = this.get('canvas'),
                    wrapper = document.createElement('div'),
                    leftTop = document.createElement('div'),
                    rightTop = document.createElement('div'),
                    leftBottom = document.createElement('div'),
                    rightBottom = document.createElement('div'),
                    graph = document.createElement('canvas'),
                    graphContext = graph.getContext('2d'),
                    style = constants.FPS_COUNTER.STYLE;

                _.each(style.WRAPPER, function (value, property) {
                    wrapper.style[property] = value;
                });

                _.each(style.GRAPH, function (value, property) {
                    graph.style[property] = value;
                });

                _.each(style.INFO, function (value, property) {
                    leftTop.style[property] = value;
                    rightTop.style[property] = value;
                    leftBottom.style[property] = value;
                    rightBottom.style[property] = value;
                });

                _.each(style.INFO_HEADER, function (value, property) {
                    leftTop.style[property] = value;
                    rightTop.style[property] = value;
                });

                leftTop.innerHTML = 'INST';
                rightTop.innerHTML = 'AVG';

                wrapper.appendChild(leftTop);
                wrapper.appendChild(rightTop);
                wrapper.appendChild(leftBottom);
                wrapper.appendChild(rightBottom);
                wrapper.appendChild(graph);
                document.body.appendChild(wrapper);

                graph.width = graph.offsetWidth;
                graph.height = graph.offsetHeight;

                this.set('fpsCounter', {
                    wrapper: wrapper,
                    instant: leftBottom,
                    average: rightBottom,
                    frames: [],
                    graph: graph,
                    graphContext: graphContext,
                    time: _.now(),
                    sum: 0,
                    count: 0
                });

                this.listenTo(this, 'resize', this.positionFpsCounter);
                this.listenTo(this, 'finishRendering', this.updateFpsCounter);
                this.positionFpsCounter();
            }
        },

        positionFpsCounter: function () {
            var wrapper = this.get('fpsCounter.wrapper');

            if (!_.isUndefined(wrapper)) {
                var rect = this.get('canvas').getBoundingClientRect();

                wrapper.style.top = rect.top +
                    constants.FPS_COUNTER.POSITION_OFFSET + 'px';
                wrapper.style.left = (rect.left + rect.width -
                    wrapper.offsetWidth -
                    constants.FPS_COUNTER.POSITION_OFFSET)  + 'px';
            }
        },

        updateFpsCounter: function () {
            var data = this.get('fpsCounter'),
                time = _.now(),
                interval = time - data.time,
                instantFps = 1000 / interval,
                averageFps,
                sum = 0,
                context = data.graphContext,
                i, x, height;

            data.sum += instantFps;
            data.count++;
            data.time = time;

            data.instant.innerHTML = Math.ceil(instantFps);

            if (data.count === constants.FPS_COUNTER.FRAME_GROUP_COUNT) {
                instantFps = data.sum / data.count;
                data.sum = 0;
                data.count = 0;

                data.frames.push(instantFps);

                if (data.frames.length > constants.FPS_COUNTER.FRAME_COUNT) {
                    data.frames.shift();
                }

                // Drawing the graph.
                context.clearRect(0, 0, data.graph.width, data.graph.height);

                i = data.frames.length;
                x = data.graph.width;
                while (i--) {
                    sum += data.frames[i];

                    if (x > 0) {
                        height = data.frames[i] * data.graph.height /
                            constants.FPS_COUNTER.GRAPH.MAX_FPS;

                        context.fillStyle = constants.FPS_COUNTER.GRAPH.COLOR;
                        context.fillRect(
                            x - constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            data.graph.height - height +
                                constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH,
                            constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            height - constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH
                        );

                        context.fillStyle =
                            constants.FPS_COUNTER.GRAPH.HIGHLIGHT;
                        context.fillRect(
                            x - constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            data.graph.height - height,
                            constants.FPS_COUNTER.GRAPH.LINE_WIDTH,
                            constants.FPS_COUNTER.GRAPH.HIGHLIGHT_WIDTH
                        );

                        x -= constants.FPS_COUNTER.GRAPH.LINE_WIDTH;
                    }
                }

                averageFps = sum / data.frames.length;

                data.average.innerHTML = Math.ceil(averageFps);
            }
        },

    };

});