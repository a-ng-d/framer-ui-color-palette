import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import preact from '@preact/preset-vite'
import mkcert from 'vite-plugin-mkcert'
import framer from 'vite-plugin-framer'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [
      preact(),
      mkcert(),
      framer(),
      sentryVitePlugin({
        org: 'yelbolt',
        project: 'ui-color-palette',
        authToken: env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          //assets: plugin === 'fig' ? './fig/dist/**' : './one/dist/**',
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
