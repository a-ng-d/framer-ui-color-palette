import { FrameNode, framer } from 'framer-plugin'
import {
  Data,
  FullConfiguration,
  PaletteDataThemeItem,
  ThemeConfiguration,
  ViewConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import setPaletteName from '../../utils/setPaletteName'
import { getJsonSize } from '../../utils/getSize'
import { tolgee } from '../../ui'
import Sheet from '../../canvas/Sheet'
import Palette from '../../canvas/Palette'

const updateDocument = async (view: ViewConfiguration) => {
  const document = (await framer.getSelection())[0] as FrameNode
  const id = await document.getPluginData('id')
  const themeId = await document.getPluginData('themeId')

  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === null) throw new Error(tolgee.t('error.unfoundPalette'))

  const palette = JSON.parse(rawPalette) as FullConfiguration

  const themeData = new Data(palette)
    .makePaletteData()
    .themes.find((theme: PaletteDataThemeItem) => theme.id === themeId)
  const currentTheme = palette.themes.find(
    (theme: ThemeConfiguration) => theme.id === themeId
  )

  if (themeData === undefined || currentTheme === undefined)
    throw new Error(tolgee.t('error.document'))

  const isAllowedToCreateFrame = framer.isAllowedTo('createFrameNode')
  const isAllowedToCreateText = framer.isAllowedTo('addText')
  const isAllowedToCreateTextStyle = framer.isAllowedTo('createTextStyle')
  const isAllowedToAddSVG = framer.isAllowedTo('addSVG')
  const isAllowedToSetData = framer.isAllowedTo('Node.setPluginData')
  const isAllowedToSetParent = framer.isAllowedTo('setParent')
  const isAllowedToRemoveTextStyle = framer.isAllowedTo('TextStyle.remove')
  const isAllowedToSetAttributes = framer.isAllowedTo('setAttributes')
  const isAllowedToRemoveChildren = framer.isAllowedTo('removeNodes')

  if (
    !isAllowedToCreateFrame ||
    !isAllowedToCreateText ||
    !isAllowedToAddSVG ||
    !isAllowedToCreateTextStyle ||
    !isAllowedToSetData ||
    !isAllowedToSetParent ||
    !isAllowedToRemoveTextStyle ||
    !isAllowedToSetAttributes ||
    !isAllowedToRemoveChildren
  )
    throw new Error(tolgee.t('error.document'))

  const children = await document.getChildren()

  children.forEach((child) => child.remove())
  document.setAttributes({
    backgroundColor: currentTheme.paletteBackground,
  })

  const newDocument =
    view === 'PALETTE_WITH_PROPERTIES' || view === 'PALETTE'
      ? await new Palette({
          base: palette.base,
          theme: currentTheme,
          data: themeData,
          meta: palette.meta,
          view: view,
        }).makeNode()
      : await new Sheet({
          base: palette.base,
          theme: currentTheme,
          data: themeData,
          meta: palette.meta,
          view: view,
        }).makeNode()

  if (!newDocument) return null

  document.setAttributes({
    name: setPaletteName(
      palette.base.name,
      currentTheme.name,
      palette.base.preset.name,
      palette.base.colorSpace,
      currentTheme.visionSimulationMode
    ),
  })

  framer.setParent(newDocument.id, document.id)
  framer.setSelection(document.id)

  // Update
  document.setPluginData('view', view)
  document.setPluginData('updatedAt', palette.meta.dates.updatedAt.toString())

  if (getJsonSize(palette) < 2)
    document.setPluginData('backup', JSON.stringify(palette))

  window.postMessage({
    type: 'DOCUMENT_SELECTED',
    data: {
      view: view,
      id: id,
      updatedAt: palette.meta.dates.updatedAt.toString(),
      isLinkedToPalette: true,
    },
  })

  return palette
}

export default updateDocument
