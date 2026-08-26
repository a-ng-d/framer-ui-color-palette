import { FullConfiguration } from '@yelbolt/engine-ui-color-palette'
import isValidPaletteConfiguration from '../utils/isValidPaletteConfiguration'
import setPagePalettesMigration from '../../utils/setPagePalettesMigration'

const getPalettesOnCurrentPage = async () => {
  setPagePalettesMigration()

  const dataKeys = Object.keys(window.localStorage)
  if (dataKeys === undefined)
    return window.postMessage({
      type: 'EXPOSE_PALETTES',
      data: [],
    })

  const dataList = dataKeys
    .filter((data: string) => data.includes('palette_'))
    .map((key: string) => {
      const raw = window.localStorage.getItem(key)
      if (!raw) return undefined

      try {
        return JSON.parse(raw)
      } catch (error) {
        console.warn(
          `[getPalettesOnCurrentPage] Failed to parse stored palette data for key "${key}"`,
          error
        )
        return undefined
      }
    })
  const palettesList: Array<FullConfiguration> = dataList.filter(
    (data): data is FullConfiguration => isValidPaletteConfiguration(data)
  )

  return window.postMessage({
    type: 'EXPOSE_PALETTES',
    data: palettesList,
  })
}

export default getPalettesOnCurrentPage
