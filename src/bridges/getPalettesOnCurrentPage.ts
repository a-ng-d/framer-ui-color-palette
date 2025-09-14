import { FullConfiguration, PaletteData } from '@a_ng_d/utils-ui-color-palette'

const getPalettesOnCurrentPage = async () => {
  const dataKeys = Object.keys(window.localStorage)
  if (dataKeys === undefined)
    return window.postMessage({
      type: 'EXPOSE_PALETTES',
      data: [],
    })

  const dataList = dataKeys
    .filter((data: string) => data.includes('palette_'))
    .map((key: string) => {
      const data = window.localStorage.getItem(key)
      return data ? JSON.parse(data) : undefined
    })
  const palettesList: Array<PaletteData> = dataList.filter(
    (data: FullConfiguration) => {
      if (data !== undefined) return data.type === 'UI_COLOR_PALETTE'
    }
  )

  return window.postMessage({
    type: 'EXPOSE_PALETTES',
    data: palettesList,
  })
}

export default getPalettesOnCurrentPage
