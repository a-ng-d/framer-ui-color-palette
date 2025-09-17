import { Data, FullConfiguration } from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../../content/locales'
import { framer } from 'framer-plugin'

const updateLocalStyles = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(locales.get().error.unfoundPalette)

  const palette = JSON.parse(rawPalette) as FullConfiguration

  palette.libraryData = new Data(palette).makeLibraryData(
    ['style_id', 'alpha', 'gl'],
    palette.libraryData
  )

  const canDeepSyncStyles =
    window.localStorage.getItem('can_deep_sync_styles') === 'true'
  const hasThemes = palette.libraryData.some(
    (item) => !item.id.includes('00000000000')
  )

  const updatedLocalStylesStatusMessage = await framer
    .getColorStyles()
    .then((localStyles) => {
      let i = 0,
        j = 0,
        k = 0
      const messages: Array<string> = []

      if (canDeepSyncStyles ?? false)
        localStyles.forEach((localStyle) => {
          const hasStyleMatch = palette.libraryData
            .filter((item) => {
              return hasThemes
                ? !item.id.includes('00000000000')
                : item.id.includes('00000000000')
            })
            .some((libraryItem) => libraryItem.styleId === localStyle.id)

          if (!hasStyleMatch) {
            localStyle.remove()
            k++
          }
        })

      palette.libraryData
        .filter((item) => {
          return hasThemes
            ? !item.id.includes('00000000000')
            : item.id.includes('00000000000')
        })
        .forEach((item) => {
          const styleMatch = localStyles.find(
            (localStyle) => localStyle.id === item.styleId
          )
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

          if (styleMatch !== undefined) {
            if (styleMatch.name !== path) {
              styleMatch.setAttributes({ name: path })
              j++
            }

            if (styleMatch.light !== lightRgba) {
              styleMatch.setAttributes({ light: lightRgba })
              j++
            }

            if (styleMatch.dark !== lightRgba) {
              styleMatch.setAttributes({ dark: lightRgba })
              j++
            }

            i = j > 0 ? i + 1 : i
            j = 0
          }
        })

      if (i > 1)
        messages.push(
          locales
            .get()
            .info.updatedLocalStyles.plural.replace('{count}', i.toString())
        )
      else if (i === 1)
        messages.push(locales.get().info.updatedLocalStyles.single)
      else messages.push(locales.get().info.updatedLocalStyles.none)

      if (k > 1)
        messages.push(
          locales
            .get()
            .info.removedLocalStyles.plural.replace('{count}', k.toString())
        )
      else if (k === 1)
        messages.push(locales.get().info.removedLocalStyles.single)
      else messages.push(locales.get().info.removedLocalStyles.none)

      return messages.join(locales.get().separator)
    })

  return updatedLocalStylesStatusMessage
}

export default updateLocalStyles
