module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: [
                'Gruntfile.js',
                'masala/src/*.js',
                'masala/src/**/*.js'
            ],
            options: {
                globals: {
                    console: true,
                    document: true
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: 'masala/src',

                    name: 'main',
                    out: 'masala/build/masala-intermediary.js',
                    optimize: 'none'
                }
            }
        },
        'regex-replace': {
            compile: {
                src: ['<%= requirejs.compile.options.out %>'],
                actions: [
                    {
                        name: 'requirejs-convert-function',
                        search: new RegExp(
                            /define\('(.+?)',\[([\s\S]*?)\],\s*function \(([\s\S]*?)\) \{([\s\S]*?[\r\n]+)\}\);/mg),
                        replace: function (match, name, requirements, args,
                                body) {
                            requirements = requirements
                                .replace(/\s+/g, '')
                                .replace(/'(.*?)'/g, 'modules[\'$1\']');

                            args = args.replace(/\s+/g, '');

                            return 'modules[\'' + name + '\'] = (function (' +
                                args + ') {' + body + '}) (' +
                                requirements + ');';
                        }
                    },
                    {
                        name: 'requirejs-convert-dictionary',
                        search: new RegExp(
                            /define\('(.+?)',\{([\s\S]*?)\}\);/mg),
                        replace: function (match, name, body) {
                            return 'modules[\'' + name + '\'] = {' + body + '};';
                        }
                    }
                ]
            }
        },
        concat: {
            options: {
                separator: '',
            },
            compile: {
                src: [
                    'masala/build/wrap-start.js',
                    '<%= requirejs.compile.options.out %>',
                    'masala/build/wrap-end.js'
                ],
                dest: 'masala/build/masala.js',
            },
        },
        less: {
            compile: {
                options: {
                    paths: ['styles/src']
                },
                files: {
                    'styles/build/app.css': 'styles/src/app.less'
                }
            }
        },
        clean: {
            intermediary: {
                src: ['<%= requirejs.compile.options.out %>']
            }
        },
        watch: {
            js: {
                files: ['<%= jshint.files %>', 'scripts/build/wrap-*.js'],
                tasks: ['scripts']
            },
            less: {
                files: ['styles/src/*.less', 'styles/src/**/*.less',
                    'styles/lib/*.less'],
                tasks: ['styles']
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('scripts', ['jshint', 'requirejs', 'regex-replace',
        'concat', 'clean:intermediary']);
    grunt.registerTask('styles', ['less']);
    grunt.registerTask('default', ['scripts', 'styles']);

};