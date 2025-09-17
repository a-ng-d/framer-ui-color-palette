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
    .then(async (localStyles) => {
      let i = 0,
        k = 0
      const messages: Array<string> = []

      const isAllowedToRemove = framer.isAllowedTo('ColorStyle.remove')
      const isAllowedToSet = framer.isAllowedTo('ColorStyle.setAttributes')

      if ((canDeepSyncStyles ?? false) && isAllowedToRemove) {
        const stylesToRemove = localStyles.filter((localStyle) => {
          const hasStyleMatch = palette.libraryData
            .filter((item) => {
              return hasThemes
                ? !item.id.includes('00000000000')
                : item.id.includes('00000000000')
            })
            .some((libraryItem) => libraryItem.styleId === localStyle.id)

          return !hasStyleMatch
        })

        await Promise.all(
          stylesToRemove.map(async (localStyle) => {
            await localStyle.remove()
            k++
          })
        )
      }

      const filteredItems = palette.libraryData.filter((item) => {
        return hasThemes
          ? !item.id.includes('00000000000')
          : item.id.includes('00000000000')
      })

      await Promise.all(
        filteredItems.map(async (item) => {
          const styleMatch = localStyles.find(
            (localStyle) => localStyle.id === item.styleId
          )
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

          if (styleMatch !== undefined && isAllowedToSet) {
            let j = 0

            console.log(
              styleMatch.name,
              item.shadeName,
              styleMatch.path,
              path,
              styleMatch.light,
              lightRgba
            )

            if (styleMatch.name !== item.shadeName) {
              await styleMatch.setAttributes({ name: item.shadeName })
              j++
            }

            if (styleMatch.path !== `/${path}`) {
              await styleMatch.setAttributes({ path: `/${path}` })
              j++
            }

            if (styleMatch.light !== lightRgba) {
              await styleMatch.setAttributes({ light: lightRgba })
              j++
            }

            if (styleMatch.dark !== lightRgba) {
              await styleMatch.setAttributes({ dark: lightRgba })
              j++
            }

            if (j > 0) {
              i++
            }
          }
        })
      )

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
