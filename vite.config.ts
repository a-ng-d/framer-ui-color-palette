import path from 'path'
import mkcert from 'vite-plugin-mkcert'
import framer from 'vite-plugin-framer'
import { defineConfig, loadEnv } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import preact from '@preact/preset-vite'

const onlyOwnPlatformTokens = () => {
  const otherTokens =
    /assets\/styles\/tokens\/modules\/(figma|penpot|sketch|yelbolt)-[a-z]+\.css$/
  const emptyModule = '\0only-framer-tokens:empty'

  return {
    name: 'only-framer-tokens',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (otherTokens.test(source.split('?')[0])) return emptyModule
    },
    load(id: string) {
      if (id === emptyModule) return 'export default ""'
      if (otherTokens.test(id.split('?')[0])) return ''
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [
      preact(),
      onlyOwnPlatformTokens(),
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

    optimizeDeps: {
      include: [
        'preact',
        'preact/hooks',
        'preact/compat',
        'preact/jsx-runtime',
        '@unoff/ui',
        '@unoff/utils',
      ],
    },

    resolve: {
      alias: {
        '@ui-lib': path.resolve(
          __dirname,
          './packages/ui-ui-color-palette/src'
        ),
      },
      preserveSymlinks: true,
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    css: {
      postcss: {
        plugins: [],
      },
    },

    build: {
      target: 'ES2022',
    },
  }
})
