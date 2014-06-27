
define([], function () {

    return  {
        EXTENSIONS: [
            'WEBGL_depth_texture'
        ],
        MAX_TEXTURE_UNITS: 16,
        LOADER: {
            STYLE: {
                WRAPPER: {
                    position: 'absolute',
                    zIndex: '2000',
                    backgroundColor: '#222'
                },
                INNER: {
                    width: '30px',
                    height: '30px',
                    backgroundColor: '#eee',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-15px',
                    marginLeft: '-15px'
                }
            },
            INTERVAL: 10,
            SPEED: 1,
            ROTATION_PROPERTIES: ['webkitTransform', 'mozTransform',
                'msTransform', 'oTransform', 'transform'],
        },
        FPS_COUNTER: {
            STYLE: {
                WRAPPER: {
                    position: 'absolute',
                    zIndex: '1000',
                    backgroundColor: 'rgba(210, 30, 30, 0.4)',
                    width: '60px',
                    height: '70px'
                },
                INFO: {
                    float: 'left',
                    margin: '1px',
                    width: '28px',
                    height: '18px',
                    lineHeight: '18px',
                    fontSize: '14px',
                    color: '#eadada',
                    fontFamily: '"System"',
                    overflow: 'hidden',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
                INFO_HEADER: {
                    fontSize: '10px',
                    fontFamily: '"Arial"'
                },
                GRAPH: {
                    margin: '1px',
                    width: '58px',
                    height: '28px'
                }
            },
            GRAPH: {
                MAX_FPS: 70,
                LINE_WIDTH: 2,
                HIGHLIGHT_WIDTH: 1,
                COLOR: '#1d0101',
                HIGHLIGHT: '#dba3a3'
            },
            POSITION_OFFSET: 5,
            FRAME_COUNT: 29,
            FRAME_GROUP_COUNT: 60
        },
        RTT: {
            TEXTURE: {
                filter: 'LINEAR',
                wrap: 'CLAMP_TO_EDGE'
            },
            MESH: {
                vertices: [
                    {
                        position: [-1, -1, 0],
                        normal: [0, 0, 1],
                        texCoords: [0, 0]
                    },
                    {
                        position: [-1, 1, 0],
                        normal: [0, 0, 1],
                        texCoords: [0, 1]
                    },
                    {
                        position: [1, 1, 0],
                        normal: [0, 0, 1],
                        texCoords: [1, 1]
                    },
                    {
                        position: [1, -1, 0],
                        normal: [0, 0, 1],
                        texCoords: [1, 0]
                    }
                ],
                indices: [[0, 1, 2], [0, 2, 3]]
            },
            PROGRAM: {
                shaders: {
                    vertex:
                        'attribute vec3 vPosition;' +
                        'attribute vec2 vTexCoords;' +
                        'varying vec2 texCoords;' +

                        'void main(void) {' +
                            'texCoords = vTexCoords;' +
                            'gl_Position = vec4(vPosition, 1);' +
                        '}',
                    fragment:
                        'precision mediump float;' +
                        'varying vec2 texCoords;' +

                        'uniform sampler2D colorTexture;' +

                        'void main() {' +
                            'gl_FragColor = vec4(' +
                                'texture2D(colorTexture, texCoords).xyz, 1);' +
                        '}'
                }
            }
        },
        CONTEXT_METHODS: {
            UNIFORMS: [
                'uniform1f', 'uniform1fv', 'uniform1i', 'uniform1iv',
                'uniform2f', 'uniform2fv', 'uniform2i', 'uniform2iv',
                'uniform3f', 'uniform3fv', 'uniform3i', 'uniform3iv',
                'uniform4f', 'uniform4fv', 'uniform4i', 'uniform4iv',
                'uniformMatrix2fv', 'uniformMatrix3fv', 'uniformMatrix4fv'
            ],
            ATTRIBUTES: ['vertexAttribPointer']
        }
    };

});