
define([
    'geometry/vertex'
], function (Vertex) {

    return  {
        MULTISAMPLING: {
            OPTIONS: [1, 2, 4, 8],
            NONE: 1
        },
        EXTENSIONS: [
            'WEBGL_depth_texture'
        ],
        RTT: {
            TEXTURE: {
                filter: 'LINEAR',
                wrap: 'CLAMP_TO_EDGE'
            },
            MESH: {
                vertices: [
                    [-1, -1, 0, 0, 0, 1, 0, 0],
                    [-1, 1, 0, 0, 0, 1, 0, 1],
                    [1, 1, 0, 0, 0, 1, 1, 1],
                    [1, -1, 0, 0, 0, 1, 1, 0]
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