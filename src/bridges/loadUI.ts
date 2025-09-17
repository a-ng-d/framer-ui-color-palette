import { framer } from 'framer-plugin'
import globalConfig from '../global.config'
import checkUserConsent from './checks/checkUserConsent'
import checkTrialStatus from './checks/checkTrialStatus'
import checkUserPreferences from './checks/checkUserPreferences'
import checkUserLicense from './checks/checkUserLicense'
import checkAnnouncementsStatus from './checks/checkAnnouncementsStatus'
import updateScale from './updates/updateScale'
import updateColors from './updates/updateColors'
import updateThemes from './updates/updateThemes'
import updateSettings from './updates/updateSettings'
import updatePalette from './updates/updatePalette'
import { locales } from '../content/locales'
import createPalette from './creations/createPalette'
import createFromRemote from './creations/createFromRemote'
import getPalettesOnCurrentPage from './getPalettesOnCurrentPage'
import jumpToPalette from './jumpToPalette'
import createPaletteFromDuplication from './creations/createFromDuplication'
import deletePalette from './creations/deletePalette'
import enableTrial from './enableTrial'
import createLocalStyles from './creations/createLocalStyles'
import updateLocalStyles from './updates/updateLocalStyles'

const loadUI = async () => {
  interface Window {
    width: number
    height: number
  }
  const windowSize: Window = {
    width: parseFloat(
      window.localStorage.getItem('plugin_window_width') ?? '640'
    ),
    height: parseFloat(
      window.localStorage.getItem('plugin_window_height') ?? '400'
    ),
  }

  framer.showUI({
    width: windowSize.width,
    height: windowSize.height,
    position: 'top right',
    resizable: true,
    minWidth: 640,
    minHeight: 420,
  })

  setTimeout(async () => {
    const user = await framer.getCurrentUser()

    // Canvas > UI
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
      type: 'CHECK_ANNOUNCEMENTS_VERSION',
    })
    window.postMessage({
      type: 'CHECK_EDITOR',
      data: {
        editor: globalConfig.env.editor,
      },
    })

    // Checks
    checkUserConsent()
      .then(() => checkTrialStatus())
      .then(() => checkUserPreferences())
      .then(() => checkUserLicense())
  }, 1000)

  // UI > Canvas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.addEventListener('pluginMessage', async (msg: any) => {
    const path = msg.detail.message.pluginMessage

    const actions: { [action: string]: () => void } = {
      CHECK_USER_CONSENT: () => checkUserConsent(),
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
        window.postMessage({ type: 'STOP_LOADER' })
        console.log('Update document', path)
      },
      UPDATE_LANGUAGE: () => {
        window.localStorage.setItem('user_language', path.data.lang)
        locales.set(path.data.lang)
      },
      //
      CREATE_PALETTE: () =>
        createPalette(path).finally(() =>
          window.postMessage({ type: 'STOP_LOADER' })
        ),
      CREATE_PALETTE_FROM_DOCUMENT: () =>
        console.log('Create palette from document', path),
      CREATE_PALETTE_FROM_REMOTE: () =>
        createFromRemote(path)
          .catch((error) => {
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'INFO',
                message: error.message,
              },
            })
          })
          .finally(() => {
            window.postMessage({ type: 'STOP_LOADER' })
          }),
      SYNC_LOCAL_STYLES: async () =>
        createLocalStyles(path.id)
          .then(async (message) => [message, await updateLocalStyles(path.id)])
          .then((messages) =>
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'INFO',
                message: messages.join(locales.get().separator),
                timer: 10000,
              },
            })
          )
          .finally(() => window.postMessage({ type: 'STOP_LOADER' }))
          .catch((error) => {
            window.postMessage({
              type: 'POST_MESSAGE',
              data: {
                type: 'ERROR',
                message: error.message,
              },
            })
          }),
      CREATE_DOCUMENT: () => {
        window.postMessage({ type: 'STOP_LOADER' })
        console.log('Create document', path)
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
        jumpToPalette(path.id).catch((error) =>
          window.postMessage({
            type: 'POST_MESSAGE',
            data: {
              type: 'ERROR',
              message: error.message,
            },
          })
        ),
      DUPLICATE_PALETTE: async () =>
        createPaletteFromDuplication(path.id)
          .finally(async () => {
            getPalettesOnCurrentPage()
            window.postMessage({ type: 'STOP_LOADER' })
          })
          .catch((error) => {
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
            plans: ['ONE', 'ONE_FIGMA', 'FIGMA'],
          },
        }),
      GO_TO_ONE: async () => window.open(globalConfig.urls.storeUrl, '_blank'),
      GO_TO_ONE_FIGMA: async () =>
        window.open('https://uicp.ylb.lt/run-figma-plugin', '_blank'),
      GO_TO_CHECKOUT: async () => console.log('Pay Pro Plan', path),
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
}

export default loadUI
