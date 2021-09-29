/* global __dirname */

const CircularDependencyPlugin = require('circular-dependency-plugin');
const dotenv = require('dotenv');
const process = require('process');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/**
 * The URL of the Jitsi Meet deployment to be proxy to in the context of
 * development with webpack-dev-server.
 */
const devServerProxyTarget
    = process.env.WEBPACK_DEV_SERVER_PROXY_TARGET || 'https://alpha.jitsi.net';

const analyzeBundle = process.argv.indexOf('--analyze-bundle') !== -1;
const detectCircularDeps = process.argv.indexOf('--detect-circular-deps') !== -1;

const minimize
    = process.argv.indexOf('-p') !== -1
        || process.argv.indexOf('--optimize-minimize') !== -1;

const reStyle = /\.(css|less|styl|scss|sass|sss)$/;

const env = Object.assign({}, dotenv.config().parsed, process.env);

const minimizeCssOptions = {
    discardComments: { removeAll: true },
};
const isDebug = env.NODE_ENV === 'development';

// reduce it to a nice object, the same as before
const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);

    return prev;
}, {});

/**
 * Build a Performance configuration object for the given size.
 * See: https://webpack.js.org/configuration/performance/
 */
function getPerformanceHints(size) {
    return {
        hints: minimize ? 'error' : false,
        maxAssetSize: size,
        maxEntrypointSize: size
    };
}

// The base Webpack configuration to bundle the JavaScript artifacts of
// jitsi-meet such as app.bundle.js and external_api.js.
const config = {
    devServer: {
        compress: true,
        disableHostCheck: true,
        hot: true,
        https: true,
        inline: true,
        watchContentBase: true,
        host: '0.0.0.0',
        sockPath: '/sockjs-web',
        proxy: {
            '/': {
                bypass: devServerProxyBypass,
                secure: false,
                target: devServerProxyTarget,
                headers: {
                    'Host': new URL(devServerProxyTarget).host
                }
            }
        }
    },
    devtool: 'source-map',
    mode: minimize ? 'production' : 'development',
    module: {
        rules: [ {
            // Transpile ES2015 (aka ES6) to ES5. Accept the JSX syntax by React
            // as well.

            exclude: [
                new RegExp(`${__dirname}/node_modules/(?!@jitsi/js-utils)`)
            ],
            loader: 'babel-loader',
            options: {
                // XXX The require.resolve bellow solves failures to locate the
                // presets when lib-jitsi-meet, for example, is npm linked in
                // jitsi-meet.
                plugins: [
                    require.resolve('@babel/plugin-transform-flow-strip-types'),
                    require.resolve('@babel/plugin-proposal-class-properties'),
                    require.resolve('@babel/plugin-proposal-export-default-from'),
                    require.resolve('@babel/plugin-proposal-export-namespace-from'),
                    require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
                    require.resolve('@babel/plugin-proposal-optional-chaining'),
                    require.resolve('@babel/plugin-syntax-dynamic-import')
                ],
                presets: [
                    [
                        require.resolve('@babel/preset-env'),

                        // Tell babel to avoid compiling imports into CommonJS
                        // so that webpack may do tree shaking.
                        {
                            modules: false,

                            // Specify our target browsers so no transpiling is
                            // done unnecessarily. For browsers not specified
                            // here, the ES2015+ profile will be used.
                            targets: {
                                chrome: 58,
                                electron: 2,
                                firefox: 54,
                                safari: 11
                            }

                        }
                    ],
                    require.resolve('@babel/preset-flow'),
                    require.resolve('@babel/preset-react')
                ]
            },
            test: /\.jsx?$/
        }, {
            // Expose jquery as the globals $ and jQuery because it is expected
            // to be available in such a form by multiple jitsi-meet
            // dependencies including lib-jitsi-meet.

            loader: 'expose-loader?$!expose-loader?jQuery',
            test: /\/node_modules\/jquery\/.*\.js$/
        }, {
            test: reStyle,
            rules: [
                {
                    loader: 'style-loader',
                },
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: isDebug,
                        importLoaders: 2,
                        modules: {
                            localIdentName: isDebug ? '[name]-[local]-[hash:base64:5]' : '[hash:base64:5]',
                        },
                    }
                },
                {
                    test: /\.(scss|sass)$/,
                    loader: 'sass-loader',
                }, {
                    test: /\.less$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        {
                            loader: 'less-loader',
                            options: {
                                javascriptEnabled: true,
                            }
                        }
                    ]
                },
            ]
        }, {
            test: /\/node_modules\/@atlaskit\/modal-dialog\/.*\.js$/,
            resolve: {
                alias: {
                    'react-focus-lock': `${__dirname}/react/features/base/util/react-focus-lock-wrapper.js`
                }
            }
        }, {
            test: /\/react\/features\/base\/util\/react-focus-lock-wrapper.js$/,
            resolve: {
                alias: {
                    'react-focus-lock': `${__dirname}/node_modules/react-focus-lock`
                }
            }
        }, {
            test: /\.svg$/,
            exclude: /node_modules/,
            use: [ {
                loader: '@svgr/webpack',
                options: {
                    dimensions: false,
                    expandProps: 'start'
                }
            } ]
        } ]
    },
    node: {
        // Allow the use of the real filename of the module being executed. By
        // default Webpack does not leak path-related information and provides a
        // value that is a mock (/index.js).
        __filename: true,

        // Provide some empty Node modules (required by olm).
        crypto: 'empty',
        fs: 'empty'
    },
    optimization: {
        concatenateModules: minimize,
        minimize
    },
    output: {
        filename: `[name]${minimize ? '.min' : ''}.js`,
        path: `${__dirname}/build`,
        publicPath: '/libs/',
        sourceMapFilename: `[name].${minimize ? 'min' : 'js'}.map`
    },
    plugins: [
        analyzeBundle
            && new BundleAnalyzerPlugin({
                analyzerMode: 'disabled',
                generateStatsFile: true
            }),
        new webpack.DefinePlugin(envKeys),
        detectCircularDeps
            && new CircularDependencyPlugin({
                allowAsyncCycles: false,
                exclude: /node_modules/,
                failOnError: false
            })
    ].filter(Boolean),
    resolve: {
        alias: {
            jquery: `jquery/dist/jquery${minimize ? '.min' : ''}.js`
        },
        aliasFields: [
            'browser'
        ],
        extensions: [
            '.web.js',

            // Webpack defaults:
            '.js',
            '.json'
        ],
        symlinks: true,
    }
};

module.exports = [
    Object.assign({}, config, {
        entry: {
            'app.bundle': './app.js'
        },
        performance: getPerformanceHints(5 * 1024 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'device_selection_popup_bundle': './react/features/settings/popup.js'
        },
        performance: getPerformanceHints(750 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'alwaysontop': './react/features/always-on-top/index.js'
        },
        performance: getPerformanceHints(400 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'dial_in_info_bundle': './react/features/invite/components/dial-in-info-page'
        },
        performance: getPerformanceHints(500 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'do_external_connect': './connection_optimization/do_external_connect.js'
        },
        performance: getPerformanceHints(5 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'flacEncodeWorker': './react/features/local-recording/recording/flac/flacEncodeWorker.js'
        },
        performance: getPerformanceHints(5 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'analytics-ga': './react/features/analytics/handlers/GoogleAnalyticsHandler.js'
        },
        performance: getPerformanceHints(5 * 1024)
    }),
    Object.assign({}, config, {
        entry: {
            'close3': './static/close3.js'
        },
        performance: getPerformanceHints(128 * 1024)
    }),

    Object.assign({}, config, {
        entry: {
            'external_api': './modules/API/external/index.js'
        },
        output: Object.assign({}, config.output, {
            library: 'JitsiMeetExternalAPI',
            libraryTarget: 'umd'
        }),
        performance: getPerformanceHints(30 * 1024)
    })
];

if (process.env.NODE_ENV === 'development') {
    module.exports.push(
        Object.assign({}, config, {
            entry: {
                'lib-jitsi-meet': './lib-jitsi-meet/index.js'
            },
            output: Object.assign({}, config.output, {
                library: 'JitsiMeetJS',
                libraryTarget: 'umd'
            })
        }),
    );
}

/**
 * Determines whether a specific (HTTP) request is to bypass the proxy of
 * webpack-dev-server (i.e. is to be handled by the proxy target) and, if not,
 * which local file is to be served in response to the request.
 *
 * @param {Object} request - The (HTTP) request received by the proxy.
 * @returns {string|undefined} If the request is to be served by the proxy
 * target, undefined; otherwise, the path to the local file to be served.
 */
function devServerProxyBypass({ path }) {
    console.log('devServerProxyBypass:', path);

    if (path.startsWith('/css/') || path.startsWith('/doc/')
            || path.startsWith('/fonts/')
            || path.startsWith('/images/')
            || path.startsWith('/lang/')
            || path.startsWith('/sounds/')
            || path.startsWith('/static/')
            || path.endsWith('.wasm')) {

        return path;
    }

    const configs = module.exports;

    /* eslint-disable array-callback-return, indent */

    if ((Array.isArray(configs) ? configs : Array(configs)).some(c => {
            if (path.startsWith(c.output.publicPath)) {
                    if (!minimize) {
                        // Since webpack-dev-server is serving non-minimized
                        // artifacts, serve them even if the minimized ones are
                        // requested.
                        return Object.keys(c.entry).some(e => {
                            const name = `${e}.min.js`;

                            if (path.indexOf(name) !== -1) {
                                // eslint-disable-next-line no-param-reassign
                                path = path.replace(name, `${e}.js`);

                                return true;
                            }
                        });
                    }
                }
            })) {
        return path;
    }

    if (path.startsWith('/libs/')) {
        return path;
    }
}
