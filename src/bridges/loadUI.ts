import { framer } from 'framer-plugin'
import observeAttribute from '../utils/observeAttribute'
import { tolgee } from '../ui'
import globalConfig from '../global.config'
import updateThemes from './updates/updateThemes'
import updateSettings from './updates/updateSettings'
import updateScale from './updates/updateScale'
import updatePalette from './updates/updatePalette'
import updateLocalStyles from './updates/updateLocalStyles'
import updateDocument from './updates/updateDocument'
import updateColors from './updates/updateColors'
import enableTrial from './plans/enableTrial'
import processSelection from './gets/processSelection'
import jumpToPalette from './gets/jumpToPalette'
import getPalettesOnCurrentPage from './gets/getPalettesOnCurrentPage'
import deletePalette from './deletions/deletePalette'
import createPaletteFromRemote from './creations/createPaletteFromRemote'
import createPaletteFromDuplication from './creations/createPaletteFromDuplication'
import createPaletteFromDocument from './creations/createPaletteFromDocument'
import createPalette from './creations/createPalette'
import createLocalStyles from './creations/createLocalStyles'
import createDocument from './creations/createDocument'
import checkUserPreferences from './checks/checkUserPreferences'
import checkUserLicense from './checks/checkUserLicense'
import checkUserConsent from './checks/checkUserConsent'
import checkTrialStatus from './checks/checkTrialStatus'
import checkCredits from './checks/checkCredits'
import checkAnnouncementsStatus from './checks/checkAnnouncementsStatus'

const loadUI = async () => {
  interface Window {
    width: number
    height: number
  }
  const windowSize: Window = {
    width: parseFloat(
      window.localStorage.getItem('plugin_window_width') ??
        globalConfig.limits.width.toString()
    ),
    height: parseFloat(
      window.localStorage.getItem('plugin_window_height') ??
        globalConfig.limits.height.toString()
    ),
  }

  framer.showUI({
    width: windowSize.width,
    height: windowSize.height,
    position: 'top right',
    resizable: true,
    minWidth: globalConfig.limits.width,
    minHeight: globalConfig.limits.height,
  })

  // UI > Canvas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.addEventListener('pluginMessage', async (msg: any) => {
    const path = msg.detail.message.pluginMessage

    const actions: { [action: string]: () => void } = {
      LOAD_DATA: async () => {
        const user = await framer.getCurrentUser()

        window.postMessage({
          type: 'CHECK_USER_AUTHENTICATION',
          data: {
            id: user.id,
            fullName: user.name,
            avatar: user.avatarUrl,
            accessToken: window.localStorage.getItem('supabase_access_token'),
            refreshToken: window.localStorage.getItem('supabase_refresh_token'),
          },
        })
        window.postMessage({
          type: 'SET_THEME',
          data: {
            theme:
              document.body.dataset.framerTheme === 'light'
                ? 'framer-light'
                : 'framer-dark',
          },
        })
        window.postMessage({
          type: 'CHECK_ANNOUNCEMENTS_VERSION',
        })
        window.postMessage({
          type: 'CHECK_EDITOR',
          data: {
            editor: globalConfig.env.editor,
          },
        })

        checkUserConsent(path.data.userConsent)
          .then(() => checkTrialStatus())
          .then(() => checkCredits())
          .then(() => checkUserPreferences())
          .then(() => checkUserLicense())
      },
      CHECK_ANNOUNCEMENTS_STATUS: () =>
        checkAnnouncementsStatus(path.data.version),
      //
      UPDATE_SCALE: () => updateScale(path),
      UPDATE_COLORS: () => updateColors(path),
      UPDATE_THEMES: () => updateThemes(path),
      UPDATE_SETTINGS: () => updateSettings(path),
      UPDATE_PALETTE: () =>
        updatePalette({
          msg: path,
          isAlreadyUpdated: path.isAlreadyUpdated,
          shouldLoadPalette: path.shouldLoadPalette,
        }),
      UPDATE_DOCUMENT: () => {
        updateDocument(path.view)
          .finally(() => window.postMessage({ type: 'STOP_LOADER' }))
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          })
      },
      UPDATE_LANGUAGE: () => {
        window.localStorage.setItem('user_language', path.data.lang)
        tolgee.changeLanguage(path.data.lang)
      },
      //
      CREATE_PALETTE: () =>
        createPalette(path).finally(() =>
          window.postMessage({ type: 'STOP_LOADER' })
        ),
      CREATE_PALETTE_FROM_DOCUMENT: () =>
        createPaletteFromDocument()
          .finally(() => window.postMessage({ type: 'STOP_LOADER' }))
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          }),
      CREATE_PALETTE_FROM_REMOTE: () =>
        createPaletteFromRemote(path)
          .finally(() => {
            window.postMessage({ type: 'STOP_LOADER' })
          })
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          }),
      SYNC_LOCAL_STYLES: async () =>
        createLocalStyles(path.id)
          .then(async (message) => [message, await updateLocalStyles(path.id)])
          .then((messages) =>
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'INFO',
                message: messages.join(tolgee.t('separator')),
                timer: 10000,
              },
            })
          )
          .finally(() => window.postMessage({ type: 'STOP_LOADER' }))
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          }),
      CREATE_DOCUMENT: () => {
        createDocument(path.id, path.view)
          .finally(() => window.postMessage({ type: 'STOP_LOADER' }))
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          })
      },
      //
      POST_MESSAGE: () => {
        window.postMessage({
          type: 'POST_MESSAGE',
          data: {
            type: path.data.type,
            message: path.data.message,
          },
        })
      },
      SET_ITEMS: () => {
        path.items.forEach((item: { key: string; value: unknown }) => {
          if (typeof item.value === 'object')
            window.localStorage.setItem(item.key, JSON.stringify(item.value))
          else if (
            typeof item.value === 'boolean' ||
            typeof item.value === 'number'
          )
            window.localStorage.setItem(item.key, String(item.value))
          else window.localStorage.setItem(item.key, item.value as string)
        })
      },
      GET_ITEMS: async () =>
        path.items.map(async (item: string) =>
          window.postMessage({
            type: `GET_ITEM_${item.toUpperCase()}`,
            data: {
              value: window.localStorage.getItem(item),
            },
          })
        ),
      DELETE_ITEMS: () =>
        path.items.forEach(async (item: string) =>
          window.localStorage.removeItem(item)
        ),
      //
      OPEN_IN_BROWSER: () => window.open(path.data.url, '_blank'),
      GET_PALETTES: async () => getPalettesOnCurrentPage(),
      JUMP_TO_PALETTE: async () =>
        jumpToPalette(path.id).catch((error) => {
          window.postMessage({
            type: 'POST_MESSAGE',
            data: {
              type: 'ERROR',
              message: error.message,
            },
          })
        }),
      DUPLICATE_PALETTE: async () =>
        createPaletteFromDuplication(path.id)
          .finally(async () => {
            getPalettesOnCurrentPage()
            window.postMessage({ type: 'STOP_LOADER' })
          })
          .catch((error) => {
            window.postMessage({
              type: 'REPORT_ERROR',
              data: error,
            })
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          }),
      DELETE_PALETTE: async () =>
        deletePalette(path.id).finally(async () => {
          getPalettesOnCurrentPage()
          window.postMessage({ type: 'STOP_LOADER' })
        }),
      //
      ENABLE_TRIAL: async () => {
        enableTrial(path.data.trialTime, path.data.trialVersion).then(() =>
          checkTrialStatus()
        )
      },
      GET_TRIAL: async () =>
        window.postMessage({
          type: 'GET_TRIAL',
        }),
      GET_PRO_PLAN: async () =>
        window.postMessage({
          type: 'GET_PRICING',
          data: {
            plans: ['ONE', 'ACTIVATE'],
          },
        }),
      GO_TO_ONE: async () =>
        window.open(
          path.data.context === 'REGULAR'
            ? globalConfig.urls.storeUrl
            : globalConfig.urls.storeWithDiscountUrl,
          '_blank'
        ),
      ENABLE_PRO_PLAN: async () =>
        window.postMessage({
          type: 'ENABLE_PRO_PLAN',
        }),
      LEAVE_PRO_PLAN: async () => {
        window.postMessage({
          type: 'LEAVE_PRO_PLAN',
        })
        checkTrialStatus()
      },
      WELCOME_TO_PRO: async () =>
        window.postMessage({
          type: 'WELCOME_TO_PRO',
        }),
      SIGN_OUT: () =>
        window.postMessage({
          type: 'SIGN_OUT',
          data: {
            connectionStatus: 'UNCONNECTED',
            userFullName: '',
            userAvatar: '',
            userId: '',
          },
        }),
      //
      DEFAULT: () => null,
    }

    try {
      return actions[path.type]?.()
    } catch {
      return actions['DEFAULT']?.()
    }
  })

  // Listeners
  framer.subscribeToSelection(() => processSelection())
  observeAttribute('body', 'data-framer-theme', (value) => {
    const theme = value === 'light' ? 'framer-light' : 'framer-dark'
    window.postMessage({ type: 'SET_THEME', data: { theme } })
  })
}

export default loadUI
