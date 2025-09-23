import { FrameNode, framer } from 'framer-plugin'
import {
  BaseConfiguration,
  MetaConfiguration,
  PaletteData,
  PaletteDataThemeItem,
  ThemeConfiguration,
  ViewConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import setPaletteName from '../utils/setPaletteName'
import { getJsonSize } from '../utils/getSize'
import globalConfig from '../global.config'
import Sheet from './Sheet'
import Palette from './Palette'

export default class Documents {
  private base: BaseConfiguration
  private themes: Array<ThemeConfiguration>
  private data: PaletteData
  private meta: MetaConfiguration
  private view: ViewConfiguration
  documents: Promise<FrameNode | null> | null

  constructor({
    base,
    themes,
    data,
    meta,
    view,
  }: {
    base: BaseConfiguration
    themes: Array<ThemeConfiguration>
    data: PaletteData
    meta: MetaConfiguration
    view: ViewConfiguration
  }) {
    this.base = base
    this.themes = themes
    this.data = data
    this.meta = meta
    this.view = view
    this.documents = null
  }

  makeDocuments = async () => {
    const documents = framer.createFrameNode({
      name: '_documents',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'start',
      stackAlignment: 'start',
      stackWrapEnabled: false,
      padding: '0px',
      gap: '32px',
      backgroundColor: null,
    })

    const workingThemesData =
      this.data.themes.filter((theme) => theme.type === 'custom theme')
        .length === 0
        ? this.data.themes.filter((theme) => theme.type === 'default theme')
        : this.data.themes.filter((theme) => theme.type === 'custom theme')
    const workingThemes =
      this.themes.filter((theme) => theme.type === 'custom theme').length === 0
        ? this.themes.filter((theme) => theme.type === 'default theme')
        : this.themes.filter((theme) => theme.type === 'custom theme')

    // Instances
    const documentsInstance = await documents
    const rootInstance = await framer.getCanvasRoot()

    for (const [index, theme] of workingThemesData.entries()) {
      const documentInstance = await this.makeDocument(
        workingThemes[index],
        theme
      )

      if (documentsInstance && documentInstance)
        framer.setParent(documentInstance.id, documentsInstance.id)
    }

    if (documentsInstance && rootInstance)
      framer.setParent(documentsInstance.id, rootInstance.id)

    return documents
  }

  makeDocument = async (
    theme: ThemeConfiguration,
    data: PaletteDataThemeItem
  ): Promise<FrameNode | null> => {
    // Base
    const document = framer.createFrameNode({
      name: setPaletteName(
        this.base.name,
        theme.name,
        this.base.preset.name,
        this.base.colorSpace,
        theme.visionSimulationMode
      ),
      width: 'fit-content',
      height: 'fit-content',
      backgroundColor: theme.paletteBackground,
      borderRadius: '16px',
      layout: 'stack',
      stackAlignment: 'center',
      stackDirection: 'vertical',
      stackDistribution: 'center',
      stackWrapEnabled: false,
      padding: '32px',
      gap: '0px',
    })
    const documentInstance = await document

    // Data
    if (documentInstance) {
      documentInstance.setPluginData('type', 'UI_COLOR_PALETTE')
      documentInstance.setPluginData(
        'version',
        globalConfig.versions.paletteVersion
      )
      documentInstance.setPluginData('view', this.view)
      documentInstance.setPluginData('id', this.meta.id)
      documentInstance.setPluginData('themeId', theme.id)
      documentInstance.setPluginData('createdAt', new Date().toISOString())
      documentInstance.setPluginData(
        'updatedAt',
        this.meta.dates.updatedAt as string
      )

      const backup = {
        base: this.base,
        themes: this.themes,
        meta: this.meta,
        type: 'UI_COLOR_PALETTE',
      }

      if (getJsonSize(backup) < 2)
        documentInstance.setPluginData('backup', JSON.stringify(backup))
    }

    //Insert
    if (this.view === 'PALETTE' || this.view === 'PALETTE_WITH_PROPERTIES') {
      const paletteInstance = await new Palette({
        base: this.base,
        theme: theme,
        data: data,
        meta: this.meta,
        view: this.view,
      }).makeNode()

      if (paletteInstance && documentInstance)
        framer.setParent(paletteInstance.id, documentInstance.id)
    } else {
      const sheetInstance = await new Sheet({
        base: this.base,
        theme: theme,
        data: data,
        meta: this.meta,
        view: this.view,
      }).makeNode()

      if (sheetInstance && documentInstance)
        framer.setParent(sheetInstance.id, documentInstance.id)
    }
    return document
  }
}
