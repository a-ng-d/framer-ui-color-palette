import {
  BaseConfiguration,
  MetaConfiguration,
  ThemeConfiguration,
  ViewConfiguration,
  PaletteDataThemeItem,
} from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../content/locales'
import Title from './Title'
import Signature from './Signature'
import Sample from './Sample'
import Header from './Header'
import { FrameNode, framer } from 'framer-plugin'

export default class Sheet {
  private base: BaseConfiguration
  private theme: ThemeConfiguration
  private data: PaletteDataThemeItem
  private meta: MetaConfiguration
  private view: ViewConfiguration
  private sampleScale: number
  private sampleRatio: number
  private sampleSize: number
  private gap: number
  private nodeRow: Promise<FrameNode | null> | null
  private nodeRowSource: Promise<FrameNode | null> | null
  private nodeRowShades: Promise<FrameNode | null> | null
  private nodeEmpty: Promise<FrameNode | null> | null
  private nodeShades: Promise<FrameNode | null> | null
  node: Promise<FrameNode | null> | null

  constructor({
    base,
    theme,
    data,
    meta,
    view,
  }: {
    base: BaseConfiguration
    theme: ThemeConfiguration
    data: PaletteDataThemeItem
    meta: MetaConfiguration
    view: ViewConfiguration
  }) {
    this.base = base
    this.theme = theme
    this.data = data
    this.meta = meta
    this.view = view
    this.sampleScale = 1.25
    this.sampleRatio = 2
    this.sampleSize = 312
    this.gap = 32
    this.nodeRow = null
    this.nodeRowSource = null
    this.nodeRowShades = null
    this.nodeEmpty = null
    this.nodeShades = null
    this.node = null
  }

  makeNodeEmptyCase = async () => {
    // Base
    this.nodeEmpty = framer.createFrameNode({
      name: '_message',
      width: '1fr',
      height: 'fit-content',
      stackDirection: 'vertical',
      stackDistribution: 'center',
      stackAlignment: 'center',
    })

    // Insert
    const nodeEmptyInstance = await this.nodeEmpty
    const nodeMessageInstance = await new Sample({
      name: locales.get().warning.emptySourceColors,
      rgb: [255, 255, 255],
      colorSpace: this.base.colorSpace,
      visionSimulationMode: this.theme.visionSimulationMode,
      view: this.view,
      textColorsTheme: this.theme.textColorsTheme,
    }).makeNodeName({
      mode: 'FILL',
      width: 48,
      height: 48,
    })

    if (nodeEmptyInstance && nodeMessageInstance)
      framer.setParent(nodeMessageInstance.id, nodeEmptyInstance.id)

    return this.nodeEmpty
  }

  makeNodeShades = async () => {
    // Base
    this.nodeShades = framer.createFrameNode({
      name: '_shades',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '0px',
      padding: '0px',
      backgroundColor: null,
    })

    // Insert
    const nodeShadesInstance = await this.nodeShades
    const nodeHeaderInstance = await new Header({
      base: this.base,
      theme: this.theme,
      view: this.view,
      size:
        this.sampleSize * this.sampleScale * 4 +
        this.sampleSize * this.sampleRatio +
        this.gap * 4,
    }).makeNode()

    if (!nodeShadesInstance || !nodeHeaderInstance) return null

    framer.setParent(nodeHeaderInstance.id, nodeShadesInstance.id)

    nodeHeaderInstance.setAttributes({
      width: '1fr',
    })

    const colors = this.data?.colors

    for (const color of colors) {
      const sourceColor = color.shades.find(
        (shade) => shade.name === 'source'
      ) ?? { hex: '#000000', rgb: [0, 0, 0] }

      // Base
      this.nodeRow = framer.createFrameNode({
        name: color.name,
        width: 'fit-content',
        height: 'fit-content',
        layout: 'stack',
        stackDirection: 'horizontal',
        stackAlignment: 'start',
        stackDistribution: 'start',
        gap: '32px',
        padding: '0px',
        backgroundColor: null,
      })
      this.nodeRowSource = framer.createFrameNode({
        name: '_source',
        width: 'fit-content',
        height: 'fit-content',
        layout: 'stack',
        stackDirection: 'horizontal',
        stackAlignment: 'start',
        stackDistribution: 'start',
        gap: '0px',
        padding: '0px',
        backgroundColor: null,
      })
      this.nodeRowShades = framer.createFrameNode({
        name: '_shades',
        width: `${this.sampleSize * this.sampleRatio * 3 + this.gap * 2}px`,
        height: 'fit-content',
        layout: 'stack',
        stackDirection: 'horizontal',
        stackAlignment: 'start',
        stackDistribution: 'start',
        stackWrapEnabled: true,
        gap: '32px',
        padding: '0px',
        backgroundColor: null,
      })

      // Instances
      const nodeRowInstance = await this.nodeRow
      const nodeRowSourceInstance = await this.nodeRowSource
      const nodeRowShadesInstance = await this.nodeRowShades
      const nodeSampleInstance = await new Sample({
        name: color.name,
        rgb: sourceColor.rgb,
        colorSpace: this.base.colorSpace,
        visionSimulationMode: this.theme.visionSimulationMode,
        view: this.view,
        textColorsTheme: this.theme.textColorsTheme,
      }).makeNodeRichShade({
        width: this.sampleSize * this.sampleRatio,
        height: this.sampleSize * this.sampleRatio * this.sampleScale,
        name: color.name,
        description: color.description,
        isColorName: true,
      })

      if (nodeRowSourceInstance && nodeSampleInstance)
        framer.setParent(nodeSampleInstance.id, nodeRowSourceInstance.id)

      const filteredShades = color.shades.filter(
        (shade) => shade.name !== 'source'
      )

      for (const filteredShade of filteredShades) {
        const nodeShadeInstance = await new Sample({
          name: color.name,
          source: {
            r: sourceColor.rgb[0] / 255,
            g: sourceColor.rgb[1] / 255,
            b: sourceColor.rgb[2] / 255,
          },
          scale: filteredShade.name,
          rgb: filteredShade.rgb,
          alpha: filteredShade.alpha,
          backgroundColor: filteredShade.backgroundColor,
          mixedColor: filteredShade.mixedColor,
          colorSpace: this.base.colorSpace,
          visionSimulationMode: this.theme.visionSimulationMode,
          view: this.view,
          textColorsTheme: this.theme.textColorsTheme,
          status: {
            isClosestToRef: filteredShade.isClosestToRef ?? false,
            isLocked: filteredShade.isSourceColorLocked ?? false,
            isTransparent: filteredShade.isTransparent ?? false,
          },
        }).makeNodeRichShade({
          width: this.sampleSize * this.sampleRatio,
          height: this.sampleSize * this.sampleRatio * this.sampleScale,
          name: filteredShade.name,
        })

        if (nodeRowShadesInstance && nodeShadeInstance)
          framer.setParent(nodeShadeInstance.id, nodeRowShadesInstance.id)
      }

      if (
        !nodeShadesInstance ||
        !nodeRowInstance ||
        !nodeRowSourceInstance ||
        !nodeRowShadesInstance
      )
        return null

      framer.setParent(nodeRowSourceInstance.id, nodeRowInstance.id)
      framer.setParent(nodeRowShadesInstance.id, nodeRowInstance.id)
      framer.setParent(nodeRowInstance.id, nodeShadesInstance.id)
    }

    if (this.base.colors.length === 0) {
      const nodeEmptyCaseInstance = await this.makeNodeEmptyCase()

      if (nodeShadesInstance && nodeEmptyCaseInstance) {
        framer.setParent(nodeEmptyCaseInstance.id, nodeShadesInstance.id)

        nodeEmptyCaseInstance.setAttributes({
          width: '1fr',
        })
      }
    }

    return this.nodeShades
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: `_colors${locales.get().separator}do not edit any layer`,
      locked: false,
      layout: 'stack',
      width: 'fit-content',
      height: 'fit-content',
      stackDirection: 'vertical',
      stackAlignment: 'start',
      stackDistribution: 'start',
      gap: '16px',
      backgroundColor: null,
    })

    // Instances
    const nodeInstance = await this.node
    const nodeTitleInstance = await new Title({
      base: this.base,
      theme: this.theme,
      data: this.data,
      meta: this.meta,
    }).makeNode()
    const nodeShadesInstance = await this.makeNodeShades()
    const nodeSignatureInstance = await new Signature().makeNode()

    // Insert
    if (
      !nodeInstance ||
      !nodeTitleInstance ||
      !nodeShadesInstance ||
      !nodeSignatureInstance
    )
      return null

    framer.setParent(nodeTitleInstance.id, nodeInstance.id)
    framer.setParent(nodeShadesInstance.id, nodeInstance.id)
    framer.setParent(nodeSignatureInstance.id, nodeInstance.id)

    nodeTitleInstance.setAttributes({
      width: '1fr',
    })
    nodeSignatureInstance.setAttributes({
      width: '1fr',
    })

    return this.node
  }
}
