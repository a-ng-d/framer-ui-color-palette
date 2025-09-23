import {
  Data,
  FullConfiguration,
  ViewConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../../content/locales'
import Documents from '../../canvas/Documents'
import { framer } from 'framer-plugin'

const createDocument = async (id: string, view: ViewConfiguration) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(locales.get().error.unfoundPalette)

  const palette = JSON.parse(rawPalette) as FullConfiguration

  const isAllowedToCreateFrame = framer.isAllowedTo('createFrameNode')
  const isAllowedToCreateText = framer.isAllowedTo('addText')
  const isAllowedToCreateTextStyle = framer.isAllowedTo('createTextStyle')
  const isAllowedToAddSVG = framer.isAllowedTo('addSVG')
  const isAllowedToSetData = framer.isAllowedTo('Node.setPluginData')
  const isAllowedToSetParent = framer.isAllowedTo('setParent')
  const isAllowedToRemoveTextStyle = framer.isAllowedTo('TextStyle.remove')
  const isAllowedToSetAttributes = framer.isAllowedTo('setAttributes')

  if (
    !isAllowedToCreateFrame ||
    !isAllowedToCreateText ||
    !isAllowedToAddSVG ||
    !isAllowedToCreateTextStyle ||
    !isAllowedToSetData ||
    !isAllowedToSetParent ||
    !isAllowedToRemoveTextStyle ||
    !isAllowedToSetAttributes
  )
    throw new Error(locales.get().error.document)

  const documentsInstance = await new Documents({
    base: palette.base,
    themes: palette.themes,
    data: new Data(palette).makePaletteData(),
    meta: palette.meta,
    view: view,
  }).makeDocuments()

  if (!documentsInstance) throw new Error(locales.get().error.document)

  const children = await documentsInstance.getChildren()
  framer
    .setSelection(children.map((child) => child.id))
    .then(() => framer.zoomIntoView(children.map((child) => child.id)))

  return palette
}

export default createDocument
