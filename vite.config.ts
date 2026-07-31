import path from 'path'
import mkcert from 'vite-plugin-mkcert'
import framer from 'vite-plugin-framer'
import { defineConfig, loadEnv } from 'vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import preact from '@preact/preset-vite'

const filterCssSelectorsPlugin = {
  postcssPlugin: 'filter-css-selectors',
  Rule(rule: { selector: string; remove(): void }) {
    const platformPattern = /\[data-(?:theme|mode)[*^~]?=[^\]]*\]/
    const whitelistPattern =
      /\[data-theme[*^~]?=["']?framer["']?\]|\[data-mode[*^~]?=["']?framer-(?:light|dark)["']?\]|\[data-mode\*=["']?(?:light|dark)["']?\]/

    if (
      platformPattern.test(rule.selector) &&
      !whitelistPattern.test(rule.selector)
    )
      rule.remove()
  },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [
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
        '@ui-lib': path.resolve(
          __dirname,
          './packages/ui-ui-color-palette/src'
        ),
      },
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    css: {
      postcss: {
        plugins: [filterCssSelectorsPlugin],
      },
    },

    build: {
      target: 'ES2022',
    },
  }
})
