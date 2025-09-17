import { Data, FullConfiguration } from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../../content/locales'
import LocalStyle from '../../canvas/LocalStyle'
import { framer } from 'framer-plugin'

const createLocalStyles = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(locales.get().error.unfoundPalette)

  const palette = JSON.parse(rawPalette) as FullConfiguration

  palette.libraryData = new Data(palette).makeLibraryData(
    ['style_id', 'alpha', 'gl'],
    palette.libraryData
  )

  const hasThemes = palette.libraryData.some(
    (item) => !item.id.includes('00000000000')
  )

  const createdLocalStylesStatusMessage = await framer
    .getColorStyles()
    .then((localStyles) => {
      let i = 0

      palette.libraryData
        .filter((item) => {
          return hasThemes
            ? !item.id.includes('00000000000')
            : item.id.includes('00000000000')
        })
        .forEach(async (item) => {
          const path = [
            item.paletteName,
            item.themeName === ''
              ? locales.get().themes.defaultName
              : item.themeName,
            item.colorName === ''
              ? locales.get().colors.defaultName
              : item.colorName,
            item.shadeName,
          ]
            .filter((item) => item !== '' && item !== 'None')
            .join('/')

          const lightRgba = `rgba(${(item.gl?.[0] ?? 0) * 255}, ${(item.gl?.[1] ?? 0) * 255}, ${(item.gl?.[2] ?? 0) * 255}, ${item.alpha || 1})`

          if (
            localStyles.find((localStyle) => localStyle.id === item.styleId) ===
              undefined &&
            item.hex !== undefined
          ) {
            const style = new LocalStyle({
              name: path,
              light: lightRgba,
              dark: lightRgba,
            })

            item.styleId = (await style.libraryColor).id
            i++
          }

          return item
        })

      palette.libraryData = new Data(palette).makeLibraryData(
        ['style_id'],
        palette.libraryData
      )

      window.localStorage.setItem(`palette_${id}`, JSON.stringify(palette))

      if (i > 1)
        return locales
          .get()
          .info.createdLocalStyles.plural.replace('{count}', i.toString())
      else if (i === 1) return locales.get().info.createdLocalStyles.single
      else return locales.get().info.createdLocalStyles.none
    })

  return createdLocalStylesStatusMessage
}

export default createLocalStyles
