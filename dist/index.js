'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var fs = _interopDefault(require('fs'));

const tailwindcssContent = `/* purgecss start ignore */

@tailwind components;
/* purgecss end ignore */

@tailwind utilities;
`;
const tailwindConfigJS = `module.exports = {
    purge: ['./src/**/*.html', './src/**/*.tsx', './src/**/*.ts'],
    darkMode: false, // or 'media' or 'class'
    theme: {},
    variants: {
      extend: {},
    },
    plugins: [],
};
`;

var tailwindcssPlugin = require('tailwindcss');

function getTailwindConfigFilePath(api) {
    const { tailwindConfigFilePath } = api.userConfig.tailwindcss || {};
    const configFile = tailwindConfigFilePath ||
        path.join(process.env.APP_ROOT || api.cwd, 'tailwind.config.js');
    return configFile;
}
var index = (api) => {
    api.describe({
        key: 'tailwindcss',
        config: {
            schema(joi) {
                return joi.object({
                    tailwindCssFilePath: joi.string(),
                    tailwindConfigFilePath: joi.string(),
                });
            },
        },
    });
    // 添加postcss-plugin配置
    api.modifyConfig((config) => {
        const configPath = getTailwindConfigFilePath(api);
        // fix #8
        if (!fs.existsSync(configPath)) {
            console.log('generate tailwind.config.js.');
            fs.writeFileSync(configPath, tailwindConfigJS, 'utf8');
        }
        config.extraPostCSSPlugins = [
            ...(config.extraPostCSSPlugins || []),
            tailwindcssPlugin({ config: configPath }),
        ];
        return config;
    });
    // 添加依赖
    api.addProjectFirstLibraries(() => [
        {
            name: 'tailwindcss',
            path: path.dirname(require.resolve('tailwindcss/package.json')),
        },
    ]);
    // 添加文件
    api.onGenerateFiles(() => {
        const { tailwindCssFilePath } = api.userConfig.tailwindcss || {};
        if (!tailwindCssFilePath) {
            api.writeTmpFile({
                path: `tailwind.css`,
                content: tailwindcssContent,
            });
        }
        // 添加tailwind.config.js
        const ConfigFile = getTailwindConfigFilePath(api);
        if (!fs.existsSync(ConfigFile)) {
            console.log('generate tailwind.config.js.');
            fs.writeFileSync(ConfigFile, tailwindConfigJS, 'utf8');
        }
    });
    api.addEntryImportsAhead(() => {
        const { tailwindCssFilePath } = api.userConfig.tailwindcss || {};
        return {
            source: tailwindCssFilePath || './tailwind.css',
        };
    });
};

module.exports = index;
