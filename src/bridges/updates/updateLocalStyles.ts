import { framer } from 'framer-plugin'
import { locales } from '@ui-lib/content/locales'
import { Data, FullConfiguration } from '@a_ng_d/utils-ui-color-palette'

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

          let darkRgba = lightRgba
          const sameColorItems = filteredItems.filter(
            (colorItem) =>
              colorItem.themeName === item.themeName &&
              colorItem.colorName === item.colorName &&
              colorItem.shadeName !== 'source'
          )

          if (sameColorItems.length > 1) {
            const currentIndex = sameColorItems.findIndex(
              (colorItem) => colorItem.id === item.id
            )

            if (currentIndex !== -1) {
              const totalShades = sameColorItems.length
              const oppositeIndex = totalShades - 1 - currentIndex

              if (
                oppositeIndex >= 0 &&
                oppositeIndex < totalShades &&
                oppositeIndex !== currentIndex
              ) {
                const oppositeItem = sameColorItems[oppositeIndex]

                if (oppositeItem.gl !== undefined)
                  if (oppositeItem.alpha !== 1)
                    darkRgba = `rgba(${Math.floor(oppositeItem.gl[0] * 255)}, ${Math.floor(
                      oppositeItem.gl[1] * 255
                    )}, ${Math.floor(oppositeItem.gl[2] * 255)}, ${oppositeItem.alpha})`
                  else
                    darkRgba = `rgb(${Math.floor(oppositeItem.gl[0] * 255)}, ${Math.floor(
                      oppositeItem.gl[1] * 255
                    )}, ${Math.floor(oppositeItem.gl[2] * 255)})`
              }
            }
          }

          if (styleMatch !== undefined && isAllowedToSet) {
            let j = 0

            if (styleMatch.name !== item.shadeName) {
              await styleMatch.setAttributes({ name: item.shadeName })
              j++
            }

            if (styleMatch.path !== `/${path}`) {
              await styleMatch.setAttributes({ path: `/${path}` })
              j++
            }

            if (styleMatch.light !== lightRgba) {
              await styleMatch.setAttributes({
                light: lightRgba,
              })
              j++
            }

            const finalDarkColor =
              item.shadeName !== 'source' ? darkRgba : lightRgba

            if (styleMatch.dark !== finalDarkColor) {
              await styleMatch.setAttributes({
                dark: finalDarkColor,
              })
              j++
            }

            if (j > 0) i++
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
