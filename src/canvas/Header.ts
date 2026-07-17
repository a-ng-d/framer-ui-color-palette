import { FrameNode, framer } from 'framer-plugin'
import {
  BaseConfiguration,
  ThemeConfiguration,
  ViewConfiguration,
} from '@yelbolt/engine-ui-color-palette'
import { tolgee } from '../ui'
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
    const nodeHeaderInstance = await this.node
    const nodeSampleInstance = await new Sample({
      name: tolgee.t('paletteProperties.sourceColors'),
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
    if (nodeHeaderInstance && nodeSampleInstance)
      await framer.setParent(nodeSampleInstance.id, nodeHeaderInstance.id)

    if (this.view === 'PALETTE' || this.view === 'PALETTE_WITH_PROPERTIES') {
      const keys = Object.keys(this.theme.scale).reverse()

      for (const key of keys) {
        const nodeSampleShadeInstance = await new Sample({
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

        if (nodeHeaderInstance && nodeSampleShadeInstance)
          await framer.setParent(
            nodeSampleShadeInstance.id,
            nodeHeaderInstance.id
          )
      }
    }

    return this.node
  }
}
