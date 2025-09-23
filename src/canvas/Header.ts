import { FrameNode, framer } from 'framer-plugin'
import {
  BaseConfiguration,
  ThemeConfiguration,
  ViewConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../content/locales'
import Sample from './Sample'

export default class Header {
  private base: BaseConfiguration
  private theme: ThemeConfiguration
  private view: ViewConfiguration
  private sampleSize: number
  node: Promise<FrameNode | null> | null

  constructor({
    base,
    theme,
    view,
    size,
  }: {
    base: BaseConfiguration
    theme: ThemeConfiguration
    view: ViewConfiguration
    size: number
  }) {
    this.base = base
    this.theme = theme
    this.view = view
    this.sampleSize = size
    this.node = null
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_header',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeInstance = await this.node
    const nodeSourceColorInstance = await new Sample({
      name: locales.get().paletteProperties.sourceColors,
      rgb: [255, 255, 255],
      colorSpace: this.base.colorSpace,
      visionSimulationMode: this.theme.visionSimulationMode,
      view: this.view,
      textColorsTheme: this.theme.textColorsTheme,
    }).makeNodeName({
      mode: 'FIXED',
      width: this.sampleSize,
      height: 48,
    })

    // Insert
    if (nodeInstance && nodeSourceColorInstance)
      await framer.setParent(nodeSourceColorInstance.id, nodeInstance.id)

    if (this.view === 'PALETTE' || this.view === 'PALETTE_WITH_PROPERTIES') {
      const keys = Object.keys(this.theme.scale).reverse()

      for (const key of keys) {
        const nodeShadeInstance = await new Sample({
          name: key,
          rgb: [255, 255, 255],
          colorSpace: this.base.colorSpace,
          visionSimulationMode: this.theme.visionSimulationMode,
          view: this.view,
          textColorsTheme: this.theme.textColorsTheme,
        }).makeNodeName({
          mode: 'FIXED',
          width: this.sampleSize,
          height: 48,
        })

        if (nodeInstance && nodeShadeInstance) 
          await framer.setParent(nodeShadeInstance.id, nodeInstance.id)
        
      }
    }

    return this.node
  }
}
