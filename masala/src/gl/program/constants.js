
define({
    TYPE: {
        VERTEX: 'vertex',
        FRAGMENT: 'fragment'
    },
    PREDEFINED: {
        BASIC: {
            vertex: 'basic.vert',
            fragment: 'basic.frag'
        },
        LIGHTING: {
            PHONG: {
                vertex: 'lighting/phong.vert',
                fragment: 'lighting/phong.frag'
            }
        },
        POSTPROCESSING: {
            BLUR: {
                GAUSSIAN: {
                    X: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/gaussian/x.frag'
                    },
                    Y: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/gaussian/y.frag'
                    }
                },
                MOTION: {
                    X: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/motion/x.frag'
                    },
                    Y: {
                        vertex: 'postprocessing/common.vert',
                        fragment: 'postprocessing/blur/motion/y.frag'
                    }
                }
            },
            INVERT: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/invert.frag'
            },
            GRAYSCALE: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/grayscale.frag'
            },
            BLOOM: {
                vertex: 'postprocessing/common.vert',
                fragment: 'postprocessing/bloom.frag'
            }
        }
    },
    ATTRIBUTES: {
        VERTEX_POSITION: 'vPosition',
        VERTEX_NORMAL: 'vNormal',
        VERTEX_TEX_COORDS: 'vTexCoords'
    }
});