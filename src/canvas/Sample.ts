import { FrameNode, framer } from 'framer-plugin'
import chroma from 'chroma-js'
import {
  Channel,
  Color,
  ColorSpaceConfiguration,
  RgbModel,
  TextColorsThemeConfiguration,
  ViewConfiguration,
  VisionSimulationModeConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import Status from './Status'
import Property from './Property'
import Properties from './Properties'
import Paragraph from './Paragraph'

export default class Sample {
  private name: string
  private source?: RgbModel
  private scale?: string
  private rgb: Channel
  private alpha?: number
  private backgroundColor?: Channel
  private mixedColor?: Channel
  private colorSpace: ColorSpaceConfiguration
  private visionSimulationMode: VisionSimulationModeConfiguration
  private view: ViewConfiguration
  private textColorsTheme: TextColorsThemeConfiguration<'HEX'>
  private status: {
    isClosestToRef: boolean
    isLocked: boolean
    isTransparent: boolean
  }
  private nodeColor: Promise<FrameNode | null> | null
  private node: Promise<FrameNode | null> | null
  private children: Promise<FrameNode | null> | null

  constructor({
    name,
    source,
    scale,
    rgb,
    alpha,
    backgroundColor,
    mixedColor,
    colorSpace,
    visionSimulationMode,
    view,
    textColorsTheme,
    status = {
      isClosestToRef: false,
      isLocked: false,
      isTransparent: false,
    },
  }: {
    name: string
    source?: RgbModel
    scale?: string
    rgb: Channel
    alpha?: number
    backgroundColor?: Channel
    mixedColor?: Channel
    colorSpace: ColorSpaceConfiguration
    visionSimulationMode: VisionSimulationModeConfiguration
    view: ViewConfiguration
    textColorsTheme: TextColorsThemeConfiguration<'HEX'>
    status?: {
      isClosestToRef: boolean
      isLocked: boolean
      isTransparent: boolean
    }
  }) {
    this.name = name
    this.source = source
    this.scale = scale
    this.rgb = rgb
    this.alpha = alpha
    this.backgroundColor = backgroundColor
    this.mixedColor = mixedColor
    this.colorSpace = colorSpace
    this.visionSimulationMode = visionSimulationMode
    this.view = view
    this.textColorsTheme = textColorsTheme
    this.status = status
    this.nodeColor = null
    this.node = null
    this.children = null
  }

  makeNodeName = async ({
    mode,
    width,
    height,
  }: {
    mode: string
    width: number
    height: number
  }) => {
    // Base
    this.node = framer.createFrameNode({
      name: this.name,
      width: `${width}px`,
      height: `${height}px`,
      layout: 'stack',
      stackDirection: 'vertical',
      stackAlignment: 'start',
      stackDistribution: 'start',
      gap: '0px',
      padding: '8px',
      backgroundColor: null,
    })

    if (mode === 'FILL')
      this.children = new Property({
        name: '_large-label',
        content: this.name,
        size: 16,
      }).makeNode()
    else if (mode === 'FIXED')
      this.children = new Property({
        name: '_label',
        content: this.name,
        size: 10,
      }).makeNode()

    // Instances
    const nodeSampleInstance = await this.node
    const nodeChildrenInstance = await this.children

    // Insert
    if (nodeSampleInstance && nodeChildrenInstance) {
      framer.setParent(nodeChildrenInstance.id, nodeSampleInstance.id)
      nodeChildrenInstance.setAttributes({
        width: '1fr',
        height: '1fr',
      })
    }

    return this.node
  }

  makeNodeShade = async ({
    width,
    height,
    name,
    isColorName = false,
  }: {
    width: number
    height: number
    name: string
    isColorName?: boolean
  }) => {
    // Base
    this.node = framer.createFrameNode({
      name: name,
      width: `${width}px`,
      height: `${height}px`,
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'end',
      stackAlignment: 'start',
      gap: '8px',
      padding: '8px',
      backgroundColor: new Color({ render: 'HEX' })
        .mixColorsHex(
          chroma(this.rgb)
            .alpha(this.alpha ?? 1)
            .hex(),
          chroma(this.backgroundColor ?? [255, 255, 255]).hex()
        )
        .toString(),
    })

    // Instances
    const nodeSampleInstance = await this.node

    // Insert
    if (this.view === 'PALETTE_WITH_PROPERTIES' && !isColorName) {
      const nodePropertiesInstance = await new Properties({
        name: this.scale ?? '0',
        rgb: this.rgb,
        alpha: this.alpha,
        mixedColor: this.mixedColor,
        colorSpace: this.colorSpace,
        visionSimulationMode: this.visionSimulationMode,
        textColorsTheme: this.textColorsTheme,
      }).makeNode()

      if (nodeSampleInstance && nodePropertiesInstance) {
        framer.setParent(nodePropertiesInstance.id, nodeSampleInstance.id)
        nodePropertiesInstance.setAttributes({
          width: '1fr',
          height: '1fr',
        })
      }
    } else if (isColorName) {
      const nodePropertyInstance = await new Property({
        name: '_label',
        content: this.name,
        size: 10,
      }).makeNode()

      if (nodeSampleInstance && nodePropertyInstance) {
        framer.setParent(nodePropertyInstance.id, nodeSampleInstance.id)
        nodePropertyInstance.setAttributes({
          width: '1fr',
          height: '1fr',
        })
      }
    }

    if (
      this.status.isClosestToRef ||
      this.status.isLocked ||
      this.status.isTransparent
    ) {
      const nodeStatusInstance = await new Status({
        status: this.status,
        source: this.source
          ? { r: this.source.r, g: this.source.g, b: this.source.b }
          : {},
      }).makeNode()

      if (nodeSampleInstance && nodeStatusInstance) {
        framer.setParent(nodeStatusInstance.id, nodeSampleInstance.id)
        nodeStatusInstance.setAttributes({
          width: '1fr',
        })
      }
    }

    return this.node
  }

  makeNodeRichShade = async ({
    width,
    height,
    name,
    description = '',
    isColorName = false,
  }: {
    width: number
    height: number
    name: string
    description?: string
    isColorName?: boolean
  }) => {
    // Base
    this.node = framer.createFrameNode({
      name: name,
      width: `${width}px`,
      height: `${height}px`,
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '8px',
      backgroundColor: null,
    })

    // Color
    this.nodeColor = framer.createFrameNode({
      name: '_color',
      height: '132px',
      layout: 'stack',
      stackDirection: 'vertical',
      padding: '8px',
      gap: '8px',
      backgroundColor: new Color({ render: 'HEX' })
        .mixColorsHex(
          chroma(this.rgb)
            .alpha(this.alpha ?? 1)
            .hex(),
          chroma(this.backgroundColor ?? [255, 255, 255]).hex()
        )
        .toString(),
      borderRadius: '16px',
    })

    // Insert
    const nodeSampleInstance = await this.node
    const nodeColorInstance = await this.nodeColor
    const nodePropertyInstance = await new Property({
      name: '_label',
      content: name,
      size: 10,
    }).makeNode()

    if (!nodeColorInstance || !nodePropertyInstance) return null

    framer.setParent(nodePropertyInstance.id, nodeColorInstance.id)

    nodePropertyInstance.setAttributes({
      width: '1fr',
      height: '1fr',
    })

    if (
      this.status.isClosestToRef ||
      this.status.isLocked ||
      this.status.isTransparent
    ) {
      const nodeStatusInstance = await new Status({
        status: this.status,
        source: this.source
          ? { r: this.source.r, g: this.source.g, b: this.source.b }
          : {},
      }).makeNode()

      if (!nodeColorInstance || !nodeStatusInstance) return null

      framer.setParent(nodeStatusInstance.id, nodeColorInstance.id)

      nodeStatusInstance.setAttributes({
        width: '1fr',
      })
    }

    if (!nodeSampleInstance || !nodeColorInstance) return null

    framer.setParent(nodeColorInstance.id, nodeSampleInstance.id)

    nodeColorInstance.setAttributes({
      width: '1fr',
    })
    if (isColorName && description !== '') {
      const nodeParagraphInstance = await new Paragraph({
        name: '_description',
        content: description,
        type: 'FILL',
        fontSize: 8,
        fontFamily: 'Lexend',
      }).makeNode()

      if (!nodeSampleInstance || !nodeParagraphInstance) return null

      framer.setParent(nodeParagraphInstance.id, nodeSampleInstance.id)

      nodeParagraphInstance.setAttributes({
        width: '1fr',
      })
    } else if (!isColorName) {
      const nodePropertiesInstance = await new Properties({
        name: this.scale ?? '0',
        rgb: this.rgb,
        alpha: this.alpha,
        mixedColor: this.mixedColor,
        colorSpace: this.colorSpace,
        visionSimulationMode: this.visionSimulationMode,
        textColorsTheme: this.textColorsTheme,
      }).makeNodeDetailed()

      if (!nodeSampleInstance || !nodePropertiesInstance) return null

      framer.setParent(nodePropertiesInstance.id, nodeSampleInstance.id)

      nodePropertiesInstance.setAttributes({
        width: '1fr',
        height: '1fr',
      })
    }

    return this.node
  }
}
