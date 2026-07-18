import { framer } from 'framer-plugin'
import { Data, FullConfiguration } from '@yelbolt/engine-ui-color-palette'
import { tolgee } from '../../ui'
import LocalStyle from '../../canvas/LocalStyle'

const createLocalStyles = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(tolgee.t('error.unfoundPalette'))

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
            ...(item.id.includes('00000000000')
              ? []
              : [
                  item.themeName === ''
                    ? tolgee.t('themes.defaultName')
                    : item.themeName,
                ]),
            item.colorName === ''
              ? tolgee.t('colors.defaultName')
              : item.colorName,
            item.shadeName,
          ]
            .filter((item) => item !== '')
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

            const style = new LocalStyle({
              name: path,
              light: lightRgba,
              dark: item.shadeName !== 'source' ? darkRgba : lightRgba,
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

      return tolgee.t('info.createdLocalStyles', {
        count: i.toString(),
      })
    })

  return createdLocalStylesStatusMessage
}

export default createLocalStyles
