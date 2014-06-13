
define([
    'gl/canvas/constants'
], function (constants) {

    return {

        initializeLoader: function () {
            if (_.isUndefined(this.loader)) {
                _.bindAll(this, 'resizeLoader', 'startLoader', 'stopLoader');

                var canvas = this.canvas,
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

                this.loader = wrapper;
                this.loaderInner = inner;
                this.loaderRotation = 0;

                this.listen(this, 'resize', this.resizeLoader);
                this.listen(this, 'startLoading', this.startLoader);
                this.listen(this, 'finishLoading', this.stopLoader);
                this.resizeLoader();
            }
        },

        resizeLoader: function () {
            if (!_.isUndefined(this.loader)) {
                var loader = this.loader,
                    canvas = this.canvas,
                    rect = canvas.getBoundingClientRect();

                _.each(rect, function (value, property) {
                    loader.style[property] = value + 'px';
                });
            }
        },

        startLoader: function () {
            if (!_.isUndefined(this.loader) &&
                    _.isUndefined(this.loaderInterval)) {

                this.loader.style.display = 'block';

                this.loaderInterval = root.setInterval((function () {
                    this.loaderRotation += constants.LOADER.SPEED;

                    _.each(
                        constants.LOADER.ROTATION_PROPERTIES,
                        function (property) {
                            this.loaderInner.style[property] = 'rotate(' +
                                this.loaderRotation + 'deg)';
                        },
                        this
                    );

                }).bind(this), constants.LOADER.INTERVAL);

            }
        },

        stopLoader: function () {
            if (!_.isUndefined(this.loader) &&
                    !_.isUndefined(this.loaderInterval)) {
                this.loader.style.display = 'none';
                root.clearInterval(this.loaderInterval);
            }
        }

    };

});