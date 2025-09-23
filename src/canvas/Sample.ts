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
    const nodeInstance = await this.node
    const childrenInstance = await this.children

    // Insert
    if (nodeInstance && childrenInstance) {
      framer.setParent(childrenInstance.id, nodeInstance.id)
      childrenInstance.setAttributes({
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
    const nodeInstance = await this.node

    // Insert
    if (this.view === 'PALETTE_WITH_PROPERTIES' && !isColorName) {
      const propertiesNodeInstance = await new Properties({
        name: this.scale ?? '0',
        rgb: this.rgb,
        alpha: this.alpha,
        mixedColor: this.mixedColor,
        colorSpace: this.colorSpace,
        visionSimulationMode: this.visionSimulationMode,
        textColorsTheme: this.textColorsTheme,
      }).makeNode()

      if (nodeInstance && propertiesNodeInstance) {
        framer.setParent(propertiesNodeInstance.id, nodeInstance.id)
        propertiesNodeInstance.setAttributes({
          width: '1fr',
          height: '1fr',
        })
      }
    } else if (isColorName) {
      const propertyNodeInstance = await new Property({
        name: '_label',
        content: this.name,
        size: 10,
      }).makeNode()

      if (nodeInstance && propertyNodeInstance) {
        framer.setParent(propertyNodeInstance.id, nodeInstance.id)
        propertyNodeInstance.setAttributes({
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
      const statusNodeInstance = await new Status({
        status: this.status,
        source: this.source
          ? { r: this.source.r, g: this.source.g, b: this.source.b }
          : {},
      }).makeNode()

      if (nodeInstance && statusNodeInstance) {
        framer.setParent(statusNodeInstance.id, nodeInstance.id)
        statusNodeInstance.setAttributes({
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
    const nodeInstance = await this.node
    const nodeColorInstance = await this.nodeColor
    const propertyNodeInstance = await new Property({
      name: '_label',
      content: name,
      size: 10,
    }).makeNode()

    if (!nodeColorInstance || !propertyNodeInstance) return null

    framer.setParent(propertyNodeInstance.id, nodeColorInstance.id)

    propertyNodeInstance.setAttributes({
      width: '1fr',
      height: '1fr',
    })

    if (
      this.status.isClosestToRef ||
      this.status.isLocked ||
      this.status.isTransparent
    ) {
      const statusNodeInstance = await new Status({
        status: this.status,
        source: this.source
          ? { r: this.source.r, g: this.source.g, b: this.source.b }
          : {},
      }).makeNode()

      if (!nodeColorInstance || !statusNodeInstance) return null

      framer.setParent(statusNodeInstance.id, nodeColorInstance.id)

      statusNodeInstance.setAttributes({
        width: '1fr',
      })
    }

    if (!nodeInstance || !nodeColorInstance) return null

    framer.setParent(nodeColorInstance.id, nodeInstance.id)

    nodeColorInstance.setAttributes({
      width: '1fr',
    })
    if (isColorName && description !== '') {
      const paragraphNodeInstance = await new Paragraph({
        name: '_description',
        content: description,
        type: 'FILL',
        fontSize: 8,
        fontFamily: 'Lexend',
      }).makeNode()

      if (!nodeInstance || !paragraphNodeInstance) return null

      framer.setParent(paragraphNodeInstance.id, nodeInstance.id)

      paragraphNodeInstance.setAttributes({
        width: '1fr',
      })
    } else if (!isColorName) {
      const propertiesNodeInstance = await new Properties({
        name: this.scale ?? '0',
        rgb: this.rgb,
        alpha: this.alpha,
        mixedColor: this.mixedColor,
        colorSpace: this.colorSpace,
        visionSimulationMode: this.visionSimulationMode,
        textColorsTheme: this.textColorsTheme,
      }).makeNodeDetailed()

      if (!nodeInstance || !propertiesNodeInstance) return null

      framer.setParent(propertiesNodeInstance.id, nodeInstance.id)

      propertiesNodeInstance.setAttributes({
        width: '1fr',
        height: '1fr',
      })
    }

    return this.node
  }
}
