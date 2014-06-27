
define([
    'gl/canvas/constants'
], function (constants) {

    return {

        initializeLoader: function () {
            if (_.isUndefined(this.get('loader'))) {
                _.bindAll(this, 'resizeLoader', 'startLoader', 'stopLoader');

                var canvas = this.get('canvas'),
                    wrapper = document.createElement('div'),
                    inner = document.createElement('div'),
                    style = constants.LOADER.STYLE;

                wrapper.style.display = 'none';

                _.each(style.WRAPPER, function (value, property) {
                    wrapper.style[property] = value;
                });

                _.each(style.INNER, function (value, property) {
                    inner.style[property] = value;
                });

                wrapper.appendChild(inner);
                document.body.appendChild(wrapper);

                this.set('loader', wrapper);
                this.set('loaderInner', inner);
                this.set('loaderRotation', 0);

                this.listenTo(this, 'resize', this.resizeLoader);
                this.listenTo(this, 'startLoading', this.startLoader);
                this.listenTo(this, 'finishLoading', this.stopLoader);
                this.resizeLoader();
            }
        },

        resizeLoader: function () {
            var loader = this.get('loader');

            if (!_.isUndefined(loader)) {
                var rect = this.get('canvas').getBoundingClientRect();

                _.each(rect, function (value, property) {
                    loader.style[property] = value + 'px';
                });
            }
        },

        startLoader: function () {
            var loader = this.get('loader'),
                loaderInterval = this.get('loaderInterval');

            if (!_.isUndefined(loader) && _.isUndefined(loaderInterval)) {
                var loaderInner = this.get('loaderInner');

                loader.style.display = 'block';

                loaderInterval = root.setInterval((function () {
                    var loaderRotation = this.get('loaderRotation') +
                        constants.LOADER.SPEED;

                    this.set('loaderRotation', loaderRotation);

                    _.each(
                        constants.LOADER.ROTATION_PROPERTIES,
                        function (property) {
                            loaderInner.style[property] = 'rotate(' +
                                loaderRotation + 'deg)';
                        },
                        this
                    );

                }).bind(this), constants.LOADER.INTERVAL);

                this.set('loaderInterval', loaderInterval);
            }
        },

        stopLoader: function () {
            var loader = this.get('loader'),
                loaderInterval = this.get('loaderInterval');

            if (!_.isUndefined(loader) && !_.isUndefined(loaderInterval)) {
                loader.style.display = 'none';
                root.clearInterval(loaderInterval);
                this.set('loaderInterval');
            }
        }

    };

});