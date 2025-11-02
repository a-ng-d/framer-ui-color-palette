import { FrameNode, framer } from 'framer-plugin'
import { locales } from '@ui-lib/content/locales'
import {
  BaseConfiguration,
  MetaConfiguration,
  ThemeConfiguration,
  ViewConfiguration,
  PaletteDataThemeItem,
} from '@a_ng_d/utils-ui-color-palette'
import Title from './Title'
import Signature from './Signature'
import Sample from './Sample'
import Header from './Header'

export default class Palette {
  private base: BaseConfiguration
  private theme: ThemeConfiguration
  private data: PaletteDataThemeItem
  private meta: MetaConfiguration
  private view: ViewConfiguration
  private sampleRatio: number
  private sampleSize: number
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
    this.sampleRatio = 3 / 2
    this.sampleSize = 312
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
    const nodeSampleInstance = await new Sample({
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

    if (nodeEmptyInstance && nodeSampleInstance)
      framer.setParent(nodeSampleInstance.id, nodeEmptyInstance.id)

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
      gap: '0px',
      backgroundColor: null,
    })

    // Insert
    const nodeShadesInstance = await this.nodeShades
    const nodeHeaderInstance = await new Header({
      base: this.base,
      theme: this.theme,
      view: this.view,
      size: this.sampleSize,
    }).makeNode()

    if (nodeShadesInstance && nodeHeaderInstance)
      framer.setParent(nodeHeaderInstance.id, nodeShadesInstance.id)

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
        gap: '0px',
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
      }).makeNodeShade({
        width: this.sampleSize,
        height: this.sampleSize * this.sampleRatio,
        name: color.name,
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
        }).makeNodeShade({
          width: this.sampleSize,
          height: this.sampleSize * this.sampleRatio,
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
      locked: true,
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
    const nodePaletteInstance = await this.node
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
      !nodePaletteInstance ||
      !nodeTitleInstance ||
      !nodeShadesInstance ||
      !nodeSignatureInstance
    )
      return null

    framer.setParent(nodeTitleInstance.id, nodePaletteInstance.id)
    framer.setParent(nodeShadesInstance.id, nodePaletteInstance.id)
    framer.setParent(nodeSignatureInstance.id, nodePaletteInstance.id)

    nodeTitleInstance.setAttributes({
      width: '1fr',
    })
    nodeSignatureInstance.setAttributes({
      width: '1fr',
    })

    return this.node
  }
}
