import path from 'path'
import mkcert from 'vite-plugin-mkcert'
import framer from 'vite-plugin-framer'
import { defineConfig, loadEnv, Plugin } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import preact from '@preact/preset-vite'

const excludeUnwantedCssPlugin = (): Plugin => {
  const excludePattern =
    /figma-colors|figma-types|penpot-colors|penpot-types|sketch-colors|sketch-types\.css$/

  return {
    name: 'exclude-unwanted-css',
    enforce: 'pre',

    resolveId(id, importer) {
      if (id.endsWith('.css')) {
        const testPath = importer
          ? path.resolve(path.dirname(importer), id)
          : id

        if (excludePattern.test(testPath))
          return { id: '\0empty-module', external: false }
      }
      return null
    },

    load(id) {
      if (id === '\0empty-module')
        return { code: 'export default ""', map: null }
      return null
    },

    transformIndexHtml(html) {
      return html.replace(/<style[^>]*>\s*<\/style>/g, '')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [
      excludeUnwantedCssPlugin(),
      preact(),
      mkcert(),
      framer(),
      ...(!isDev
        ? [
            sentryVitePlugin({
              org: 'yelbolt',
              project: 'ui-color-palette',
              authToken: env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                filesToDeleteAfterUpload: isDev ? undefined : '**/*.map',
              },
              release: {
                name: env.VITE_APP_VERSION,
                setCommits: {
                  auto: true,
                },
                finalize: true,
                deploy: {
                  env: 'production',
                },
              },
              telemetry: false,
            }),
          ]
        : []),
    ],

    resolve: {
      alias: {
        react: 'preact/compat',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
        '@ui-lib': path.resolve(
          __dirname,
          './packages/ui-ui-color-palette/src'
        ),
      },
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    build: {
      target: 'ES2022',
    },
  }
})
