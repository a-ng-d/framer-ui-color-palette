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
    .then(async (localStyles) => {
      let i = 0
      const isAllowedToCreate = framer.isAllowedTo('createColorStyle')

      const filteredItems = palette.libraryData.filter((item) => {
        return hasThemes
          ? !item.id.includes('00000000000')
          : item.id.includes('00000000000')
      })

      await Promise.all(
        filteredItems.map(async (item) => {
          const path = [
            item.paletteName,
            item.colorName === ''
              ? locales.get().colors.defaultName
              : item.colorName,
            item.shadeName,
          ]
            .filter((item) => item !== '' && item !== 'None')
            .join('/')

          let lightRgba
          if (item.gl !== undefined && item.alpha !== 1)
            lightRgba = `rgba(${Math.floor(item.gl[0] * 255)}, ${Math.floor(
              item.gl[1] * 255
            )}, ${Math.floor(item.gl[2] * 255)}, ${item.alpha})`
          else if (item.gl !== undefined && item.alpha === 1)
            lightRgba = `rgb(${Math.floor(item.gl[0] * 255)}, ${Math.floor(
              item.gl[1] * 255
            )}, ${Math.floor(item.gl[2] * 255)})`
          else lightRgba = 'rgba(0, 0, 0, 1)'

          if (
            localStyles.find((localStyle) => localStyle.id === item.styleId) ===
              undefined &&
            item.gl !== undefined &&
            isAllowedToCreate
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
      )

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
