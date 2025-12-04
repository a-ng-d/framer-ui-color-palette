import { FrameNode, framer } from 'framer-plugin'
import chroma from 'chroma-js'
import {
  Channel,
  Color,
  ColorSpaceConfiguration,
  Contrast,
  HexModel,
  TextColorsThemeConfiguration,
  VisionSimulationModeConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import { tolgee } from '../ui'
import Tag from './Tag'

export default class Properties {
  private name: string
  private rgb: Channel
  private alpha?: number
  private mixedColor?: Channel
  private colorSpace: ColorSpaceConfiguration
  private visionSimulationMode: VisionSimulationModeConfiguration
  private textColorsTheme: TextColorsThemeConfiguration<'HEX'>
  private hex: HexModel
  private lch: Array<number>
  private oklch: Array<number>
  private lab: Array<number>
  private oklab: Array<number>
  private hsl: Array<number>
  private hsluv: Array<number>
  private lightTextColor: Channel
  private darkTextColor: Channel
  private lightTextColorContrast: Contrast
  private darkTextColorContrast: Contrast
  private nodeTopProps: Promise<FrameNode | null> | null
  private nodeBottomProps: Promise<FrameNode | null> | null
  private nodeBaseProps: Promise<FrameNode | null> | null
  private nodeContrastScoresProps: Promise<FrameNode | null> | null
  private nodeDetailedBaseProps: Promise<FrameNode | null> | null
  private nodeDetailedWCAGScoresProps: Promise<FrameNode | null> | null
  private nodeDetailedAPCAScoresProps: Promise<FrameNode | null> | null
  private nodeColumns: Promise<FrameNode | null> | null
  private nodeLeftColumn: Promise<FrameNode | null> | null
  private nodeRightColumn: Promise<FrameNode | null> | null
  private node: Promise<FrameNode | null> | null

  constructor({
    name,
    rgb,
    alpha,
    mixedColor,
    colorSpace,
    visionSimulationMode,
    textColorsTheme,
  }: {
    name: string
    rgb: Channel
    alpha?: number
    mixedColor?: Channel
    colorSpace: ColorSpaceConfiguration
    visionSimulationMode: VisionSimulationModeConfiguration
    textColorsTheme: TextColorsThemeConfiguration<'HEX'>
  }) {
    this.name = name
    this.rgb = rgb
    this.alpha = alpha
    this.mixedColor = mixedColor
    this.colorSpace = colorSpace
    this.visionSimulationMode = visionSimulationMode
    this.textColorsTheme = textColorsTheme
    this.hex = chroma(rgb).hex()
    this.lch = chroma(rgb).lch()
    this.oklch = chroma(rgb).oklch()
    this.lab = chroma(rgb).lab()
    this.oklab = chroma(rgb).oklab()
    this.hsl = chroma(rgb).hsl()
    this.hsluv = new Color({
      sourceColor: rgb,
      visionSimulationMode: this.visionSimulationMode,
    }).getHsluv()
    this.lightTextColor = new Color({
      sourceColor: chroma(this.textColorsTheme.lightColor).rgb(),
      visionSimulationMode: this.visionSimulationMode,
    }).setColor() as Channel
    this.darkTextColor = new Color({
      sourceColor: chroma(this.textColorsTheme.darkColor).rgb(),
      visionSimulationMode: this.visionSimulationMode,
    }).setColor() as Channel
    this.lightTextColorContrast = new Contrast({
      backgroundColor: this.alpha !== undefined ? this.mixedColor : this.rgb,
      textColor: chroma(this.lightTextColor).hex(),
    })
    this.darkTextColorContrast = new Contrast({
      backgroundColor: this.alpha !== undefined ? this.mixedColor : this.rgb,
      textColor: chroma(this.darkTextColor).hex(),
    })
    this.nodeTopProps = null
    this.nodeBottomProps = null
    this.nodeBaseProps = null
    this.nodeContrastScoresProps = null
    this.nodeDetailedBaseProps = null
    this.nodeDetailedWCAGScoresProps = null
    this.nodeDetailedAPCAScoresProps = null
    this.nodeColumns = null
    this.nodeLeftColumn = null
    this.nodeRightColumn = null
    this.node = null
  }

  transformRecommendedUsage = (
    recommendedUsage:
      | 'UNKNOWN'
      | 'AVOID'
      | 'NON_TEXT'
      | 'SPOT_TEXT'
      | 'HEADLINES'
      | 'BODY_TEXT'
      | 'CONTENT_TEXT'
      | 'FLUENT_TEXT'
  ) => {
    if (recommendedUsage === 'AVOID') return tolgee.t('paletteProperties.avoid')
    else if (recommendedUsage === 'NON_TEXT')
      return tolgee.t('paletteProperties.nonText')
    else if (recommendedUsage === 'SPOT_TEXT')
      return tolgee.t('paletteProperties.spotText')
    else if (recommendedUsage === 'HEADLINES')
      return tolgee.t('paletteProperties.headlines')
    else if (recommendedUsage === 'BODY_TEXT')
      return tolgee.t('paletteProperties.bodyText')
    else if (recommendedUsage === 'CONTENT_TEXT')
      return tolgee.t('paletteProperties.contentText')
    else if (recommendedUsage === 'FLUENT_TEXT')
      return tolgee.t('paletteProperties.fluentText')
    return tolgee.t('paletteProperties.unknown')
  }

  makeNodeTopProps = async () => {
    // Base
    this.nodeTopProps = framer.createFrameNode({
      name: '_top',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '0px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeTopPropsInstance = await this.nodeTopProps
    const nodeTitleInstance = await new Tag({
      name: '_scale',
      content: this.name,
      fontSize: 10,
    }).makeNodeTag()
    const nodeBasePropsInstance = await this.makeNodeBaseProps()

    // Insert
    if (!nodeTopPropsInstance || !nodeTitleInstance || !nodeBasePropsInstance)
      return null

    framer.setParent(nodeTitleInstance.id, nodeTopPropsInstance.id)
    framer.setParent(nodeBasePropsInstance.id, nodeTopPropsInstance.id)

    nodeBasePropsInstance.setAttributes({
      width: '1fr',
    })

    return this.nodeTopProps
  }

  makeNodeBottomProps = async () => {
    // Base
    this.nodeBottomProps = framer.createFrameNode({
      name: '_bottom',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '0px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeBottomPropsInstance = await this.nodeBottomProps
    const nodeContrastScoresPropsInstance =
      await this.makeNodeContrastScoresProps()

    // Insert
    if (!nodeBottomPropsInstance || !nodeContrastScoresPropsInstance)
      return null

    framer.setParent(
      nodeContrastScoresPropsInstance.id,
      nodeBottomPropsInstance.id
    )

    nodeContrastScoresPropsInstance.setAttributes({
      width: '1fr',
    })

    return this.nodeBottomProps
  }

  makeNodeBaseProps = async () => {
    // Base
    this.nodeBaseProps = framer.createFrameNode({
      name: '_base',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'end',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeBasePropsInstance = await this.nodeBaseProps
    const nodeHexPropInstance = await new Tag({
      name: '_hex',
      content: this.hex.toUpperCase(),
    }).makeNodeTag()
    let nodeColorSpacePropInstance

    if (this.colorSpace === 'LCH')
      nodeColorSpacePropInstance = await new Tag({
        name: '_lch',
        content: `L ${Math.floor(this.lch[0])} • C ${Math.floor(
          this.lch[1]
        )} • H ${Math.floor(this.lch[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'OKLCH')
      nodeColorSpacePropInstance = await new Tag({
        name: '_oklch',
        content: `L ${parseFloat(this.oklch[0].toFixed(2))} • C ${parseFloat(
          this.oklch[1].toFixed(2)
        )} • H ${Math.floor(this.oklch[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'LAB')
      nodeColorSpacePropInstance = await new Tag({
        name: '_lab',
        content: `L ${Math.floor(this.lab[0])} • A ${Math.floor(
          this.lab[1]
        )} • B ${Math.floor(this.lab[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'OKLAB')
      nodeColorSpacePropInstance = await new Tag({
        name: '_oklab',
        content: `L ${parseFloat(this.oklab[0].toFixed(2))} • A ${parseFloat(
          this.oklab[1].toFixed(2)
        )} • B ${parseFloat(this.oklab[2].toFixed(2))}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'HSL')
      nodeColorSpacePropInstance = await new Tag({
        name: '_hsl',
        content: `H ${Math.floor(this.hsl[0])} • S ${Math.floor(
          this.hsl[1] * 100
        )} • L ${Math.floor(this.hsl[2] * 100)}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'HSLUV')
      nodeColorSpacePropInstance = await new Tag({
        name: '_hsluv',
        content: `H ${Math.floor(this.hsluv[0])} • S ${Math.floor(
          this.hsluv[1]
        )} • L ${Math.floor(this.hsluv[2])}`,
      }).makeNodeTag()

    // Insert
    if (
      !nodeBasePropsInstance ||
      !nodeColorSpacePropInstance ||
      !nodeHexPropInstance
    )
      return null

    framer.setParent(nodeHexPropInstance.id, nodeBasePropsInstance.id)
    framer.setParent(nodeColorSpacePropInstance.id, nodeBasePropsInstance.id)

    if (this.alpha !== undefined) {
      const nodeAlphaPropInstance = await new Tag({
        name: '_alpha',
        content: `A ${this.alpha.toString()}`,
      }).makeNodeTag()

      if (nodeBasePropsInstance && nodeAlphaPropInstance)
        framer.setParent(nodeAlphaPropInstance.id, nodeBasePropsInstance.id)
    }

    return this.nodeBaseProps
  }

  makeNodeContrastScoresProps = async () => {
    // Base
    this.nodeContrastScoresProps = framer.createFrameNode({
      name: '_contrast-scores',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '4px',
      backgroundColor: null,
    })

    // Insert
    const nodeContrastScoresPropsInstance = await this.nodeContrastScoresProps

    // WCAG
    const wcagLightContrast = this.lightTextColorContrast
        .getWCAGContrast()
        .toFixed(2),
      wcagDarkContrast = this.darkTextColorContrast
        .getWCAGContrast()
        .toFixed(2),
      wcagLightScore = this.lightTextColorContrast.getWCAGScore(),
      wcagDarkScore = this.darkTextColorContrast.getWCAGScore()

    const nodeWCAGLightProp = await new Tag({
        name: '_wcag21-light',
        content: wcagLightContrast,
      }).makeNodeTagwithIndicator(chroma(this.lightTextColor).gl()),
      nodeWCAGLightScore = await new Tag({
        name: '_wcag21-light-score',
        content: wcagLightScore,
        backgroundColor: {
          rgb: this.lightTextColorContrast.getWCAGScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag(),
      nodeWCAGDarkProp = await new Tag({
        name: '_wcag21-dark',
        content: wcagDarkContrast,
      }).makeNodeTagwithIndicator(chroma(this.darkTextColor).gl()),
      nodeWCAGDarkScore = await new Tag({
        name: '_wcag21-dark-score',
        content: wcagDarkScore,
        backgroundColor: {
          rgb: this.darkTextColorContrast.getWCAGScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag()

    if (
      nodeWCAGLightProp &&
      nodeWCAGLightScore &&
      nodeWCAGDarkProp &&
      nodeWCAGDarkScore
    ) {
      framer.setParent(nodeWCAGLightScore.id, nodeWCAGLightProp.id)
      framer.setParent(nodeWCAGDarkScore.id, nodeWCAGDarkProp.id)
    }

    // APCA
    const apcaLightContrast = this.lightTextColorContrast
        .getAPCAContrast()
        .toFixed(1),
      apcaLightRecommendation = this.transformRecommendedUsage(
        this.lightTextColorContrast.getRecommendedUsage()
      ),
      apcaDarkContrast = this.darkTextColorContrast
        .getAPCAContrast()
        .toFixed(1),
      apcaDarkRecommendation = this.transformRecommendedUsage(
        this.darkTextColorContrast.getRecommendedUsage()
      )

    const nodeAPCALightProp = await new Tag({
        name: '_apca-light',
        content: `Lc ${apcaLightContrast}`,
      }).makeNodeTagwithIndicator(chroma(this.lightTextColor).gl()),
      nodeAPCALightScore = await new Tag({
        name: '_apca-light-score',
        content: apcaLightRecommendation,
        backgroundColor: {
          rgb: this.lightTextColorContrast.getAPCAScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag(),
      nodeAPCADarkProp = await new Tag({
        name: '_apca-dark',
        content: `Lc ${apcaDarkContrast}`,
      }).makeNodeTagwithIndicator(chroma(this.darkTextColor).gl()),
      nodeAPCADarkScore = await new Tag({
        name: '_apca-dark-score',
        content: apcaDarkRecommendation,
        backgroundColor: {
          rgb: this.darkTextColorContrast.getAPCAScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag()

    if (
      !nodeContrastScoresPropsInstance ||
      !nodeWCAGLightProp ||
      !nodeWCAGDarkProp ||
      !nodeAPCALightProp ||
      !nodeAPCALightScore ||
      !nodeAPCADarkProp ||
      !nodeAPCADarkScore
    )
      return null

    framer.setParent(nodeAPCALightScore.id, nodeAPCALightProp.id)
    framer.setParent(nodeAPCADarkScore.id, nodeAPCADarkProp.id)
    framer.setParent(nodeWCAGLightProp.id, nodeContrastScoresPropsInstance.id)
    framer.setParent(nodeAPCALightProp.id, nodeContrastScoresPropsInstance.id)
    framer.setParent(nodeWCAGDarkProp.id, nodeContrastScoresPropsInstance.id)
    framer.setParent(nodeAPCADarkProp.id, nodeContrastScoresPropsInstance.id)

    return this.nodeContrastScoresProps
  }

  makeNodeDetailedBaseProps = async () => {
    this.nodeDetailedBaseProps = framer.createFrameNode({
      name: '_base',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    const nodeDetailedBasePropsInstance = await this.nodeDetailedBaseProps
    const nodeTitleInstance = await new Tag({
      name: '_title',
      content: tolgee.t('paletteProperties.base'),
      fontSize: 10,
    }).makeNodeTag()
    const nodeHexPropInstance = await new Tag({
      name: '_hex',
      content: this.hex.toUpperCase(),
    }).makeNodeTag()
    let nodeColorSpacePropInstance

    if (this.colorSpace === 'LCH')
      nodeColorSpacePropInstance = await new Tag({
        name: '_lch',
        content: `L ${Math.floor(this.lch[0])} • C ${Math.floor(
          this.lch[1]
        )} • H ${Math.floor(this.lch[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'OKLCH')
      nodeColorSpacePropInstance = await new Tag({
        name: '_oklch',
        content: `L ${parseFloat(this.oklch[0].toFixed(2))} • C ${parseFloat(
          this.oklch[1].toFixed(2)
        )} • H ${Math.floor(this.oklch[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'LAB')
      nodeColorSpacePropInstance = await new Tag({
        name: '_lab',
        content: `L ${Math.floor(this.lab[0])} • A ${Math.floor(
          this.lab[1]
        )} • B ${Math.floor(this.lab[2])}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'OKLAB')
      nodeColorSpacePropInstance = await new Tag({
        name: '_oklab',
        content: `L ${parseFloat(this.oklab[0].toFixed(2))} • A ${parseFloat(
          this.oklab[1].toFixed(2)
        )} • B ${parseFloat(this.oklab[2].toFixed(2))}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'HSL')
      nodeColorSpacePropInstance = await new Tag({
        name: '_lab',
        content: `H ${Math.floor(this.hsl[0])} • S ${Math.floor(
          this.hsl[1] * 100
        )} • L ${Math.floor(this.hsl[2] * 100)}`,
      }).makeNodeTag()
    else if (this.colorSpace === 'HSLUV')
      nodeColorSpacePropInstance = await new Tag({
        name: '_hsluv',
        content: `H ${Math.floor(this.hsluv[0])} • S ${Math.floor(
          this.hsluv[1]
        )} • L ${Math.floor(this.hsluv[2])}`,
      }).makeNodeTag()

    // Insert
    if (
      !nodeDetailedBasePropsInstance ||
      !nodeTitleInstance ||
      !nodeHexPropInstance ||
      !nodeColorSpacePropInstance
    )
      return null

    framer.setParent(nodeTitleInstance.id, nodeDetailedBasePropsInstance.id)
    framer.setParent(nodeHexPropInstance.id, nodeDetailedBasePropsInstance.id)
    framer.setParent(
      nodeColorSpacePropInstance.id,
      nodeDetailedBasePropsInstance.id
    )

    if (this.alpha !== undefined) {
      const nodeAlphaPropInstance = await new Tag({
        name: '_alpha',
        content: `A ${this.alpha.toString()}`,
      }).makeNodeTag()

      if (nodeDetailedBasePropsInstance && nodeAlphaPropInstance)
        framer.setParent(
          nodeAlphaPropInstance.id,
          nodeDetailedBasePropsInstance.id
        )
    }

    return this.nodeDetailedBaseProps
  }

  makeDetailedWCAGScoresProps = async () => {
    this.nodeDetailedWCAGScoresProps = framer.createFrameNode({
      name: '_wcag-scores',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeDetailedWCAGScoresPropsInstance =
      await this.nodeDetailedWCAGScoresProps
    const nodeTitleInstance = await new Tag({
      name: '_title',
      content: tolgee.t('paletteProperties.wcag'),
      fontSize: 10,
    }).makeNodeTag()

    const wcagLightContrast = this.lightTextColorContrast
        .getWCAGContrast()
        .toFixed(2),
      wcagDarkContrast = this.darkTextColorContrast
        .getWCAGContrast()
        .toFixed(2),
      wcagLightScore = this.lightTextColorContrast.getWCAGScore(),
      wcagDarkScore = this.darkTextColorContrast.getWCAGScore()

    const nodeWCAGLightProp = await new Tag({
        name: '_wcag21-light',
        content: wcagLightContrast,
      }).makeNodeTagwithIndicator(chroma(this.lightTextColor).gl()),
      nodeWCAGLightScore = await new Tag({
        name: '_wcag21-light-score',
        content: wcagLightScore,
        backgroundColor: {
          rgb: this.lightTextColorContrast.getWCAGScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag(),
      nodeWCAGDarkProp = await new Tag({
        name: '_wcag21-dark',
        content: wcagDarkContrast,
      }).makeNodeTagwithIndicator(chroma(this.darkTextColor).gl()),
      nodeWCAGDarkScore = await new Tag({
        name: '_wcag21-dark-score',
        content: wcagDarkScore,
        backgroundColor: {
          rgb: this.darkTextColorContrast.getWCAGScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag()

    // Insert
    if (
      !nodeDetailedWCAGScoresPropsInstance ||
      !nodeTitleInstance ||
      !nodeWCAGLightProp ||
      !nodeWCAGLightScore ||
      !nodeWCAGDarkProp ||
      !nodeWCAGDarkScore
    )
      return null

    framer.setParent(nodeWCAGLightScore.id, nodeWCAGLightProp.id)
    framer.setParent(nodeWCAGDarkScore.id, nodeWCAGDarkProp.id)
    framer.setParent(
      nodeTitleInstance.id,
      nodeDetailedWCAGScoresPropsInstance.id
    )
    framer.setParent(
      nodeWCAGLightProp.id,
      nodeDetailedWCAGScoresPropsInstance.id
    )
    framer.setParent(
      nodeWCAGDarkProp.id,
      nodeDetailedWCAGScoresPropsInstance.id
    )

    nodeDetailedWCAGScoresPropsInstance.setAttributes({
      width: '1fr',
    })

    return this.nodeDetailedWCAGScoresProps
  }

  makeNodeDetailedAPCAScoresProps = async () => {
    this.nodeDetailedAPCAScoresProps = framer.createFrameNode({
      name: '_apca-scores',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    const minimumDarkFontSize: Array<string | number> =
        this.darkTextColorContrast.getMinFontSizes(),
      minimumLightFontSize: Array<string | number> =
        this.lightTextColorContrast.getMinFontSizes()

    // Instances
    const nodeDetailedAPCAScoresPropsInstance =
      await this.nodeDetailedAPCAScoresProps
    const nodeTitleInstance = await new Tag({
      name: '_title',
      content: tolgee.t('paletteProperties.apca'),
      fontSize: 10,
    }).makeNodeTag()

    const apcaLightContrast = this.lightTextColorContrast
        .getAPCAContrast()
        .toFixed(1),
      apcaLightRecommendation = this.transformRecommendedUsage(
        this.lightTextColorContrast.getRecommendedUsage()
      ),
      apcaDarkContrast = this.darkTextColorContrast
        .getAPCAContrast()
        .toFixed(1),
      apcaDarkRecommendation = this.transformRecommendedUsage(
        this.darkTextColorContrast.getRecommendedUsage()
      )

    const nodeAPCALightProp = await new Tag({
        name: '_apca-light',
        content: `Lc ${apcaLightContrast}`,
      }).makeNodeTagwithIndicator(chroma(this.lightTextColor).gl()),
      nodeAPCALightScore = await new Tag({
        name: '_apca-light-score',
        content: apcaLightRecommendation,
        backgroundColor: {
          rgb: this.lightTextColorContrast.getAPCAScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag(),
      nodeAPCADarkProp = await new Tag({
        name: '_apca-dark',
        content: `Lc ${apcaDarkContrast}`,
      }).makeNodeTagwithIndicator(chroma(this.darkTextColor).gl()),
      nodeAPCADarkScore = await new Tag({
        name: '_apca-dark-score',
        content: apcaDarkRecommendation,
        backgroundColor: {
          rgb: this.darkTextColorContrast.getAPCAScoreColor(),
          alpha: 1,
        },
      }).makeNodeTag()

    // Insert
    if (
      !nodeAPCALightProp ||
      !nodeAPCALightScore ||
      !nodeAPCADarkProp ||
      !nodeAPCADarkScore ||
      !nodeDetailedAPCAScoresPropsInstance ||
      !nodeTitleInstance
    )
      return null

    framer.setParent(nodeAPCALightScore.id, nodeAPCALightProp.id)
    framer.setParent(nodeAPCADarkScore.id, nodeAPCADarkProp.id)
    framer.setParent(
      nodeTitleInstance.id,
      nodeDetailedAPCAScoresPropsInstance.id
    )

    const nodeColumnsInstance = await this.makeNodeColumns(
      [
        nodeAPCALightProp,
        await new Tag({
          name: '_minimum-font-sizes',
          content: tolgee.t('paletteProperties.fontSize'),
        }).makeNodeTag(),
        await new Tag({
          name: '_200-light',
          content: `${minimumLightFontSize[2]}pt (Extra-Light 200)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_300-light',
          content: `${minimumLightFontSize[3]}pt (Light 300)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_400-light',
          content: `${minimumLightFontSize[4]}pt (Regular 400)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_500-light',
          content: `${minimumLightFontSize[5]}pt (Medium 500)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_500-light',
          content: `${minimumLightFontSize[6]}pt (Semi-Bold 600)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_700-light',
          content: `${minimumLightFontSize[7]}pt (Bold 700)`,
        }).makeNodeTag(),
      ],
      [
        nodeAPCADarkProp,
        await new Tag({
          name: '_minimum-font-sizes',
          content: tolgee.t('paletteProperties.fontSize'),
        }).makeNodeTag(),
        await new Tag({
          name: '_200-dark',
          content: `${minimumDarkFontSize[2]}pt (Extra-Light 200)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_300-dark',
          content: `${minimumDarkFontSize[3]}pt (Light 300)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_400-dark',
          content: `${minimumDarkFontSize[4]}pt (Regular 400)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_500-dark',
          content: `${minimumDarkFontSize[5]}pt (Medium 500)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_600-dark',
          content: `${minimumDarkFontSize[6]}pt (Semi-Bold 600)`,
        }).makeNodeTag(),
        await new Tag({
          name: '_700-dark',
          content: `${minimumDarkFontSize[7]}pt (Bold 700)`,
        }).makeNodeTag(),
      ]
    )

    if (!nodeDetailedAPCAScoresPropsInstance || !nodeColumnsInstance)
      return null

    framer.setParent(
      nodeColumnsInstance.id,
      nodeDetailedAPCAScoresPropsInstance.id
    )

    nodeColumnsInstance.setAttributes({
      width: '1fr',
    })

    return this.nodeDetailedAPCAScoresProps
  }

  makeNodeColumns = async (
    leftNodes: Array<FrameNode | null>,
    rightNodes: Array<FrameNode | null>
  ) => {
    this.nodeColumns = framer.createFrameNode({
      name: '_columns',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '8px',
      padding: '0px',
      backgroundColor: null,
    })
    this.nodeLeftColumn = framer.createFrameNode({
      name: '_left-column',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackAlignment: 'start',
      stackDistribution: 'start',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })
    this.nodeRightColumn = framer.createFrameNode({
      name: '_right-column',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackAlignment: 'start',
      stackDistribution: 'start',
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeColumnsInstance = await this.nodeColumns
    const nodeLeftColumnInstance = await this.nodeLeftColumn
    const nodeRightColumnInstance = await this.nodeRightColumn

    // Insert
    if (
      !nodeColumnsInstance ||
      !nodeRightColumnInstance ||
      !nodeLeftColumnInstance
    )
      return null

    leftNodes.forEach((node) => {
      if (node) framer.setParent(node.id, nodeLeftColumnInstance.id)
    })
    rightNodes.forEach((node) => {
      if (node) framer.setParent(node.id, nodeRightColumnInstance.id)
    })
    framer.setParent(nodeRightColumnInstance.id, nodeColumnsInstance.id)
    framer.setParent(nodeLeftColumnInstance.id, nodeColumnsInstance.id)

    nodeLeftColumnInstance.setAttributes({
      width: '1fr',
    })
    nodeRightColumnInstance.setAttributes({
      width: '1fr',
    })

    return this.nodeColumns
  }

  makeNodeDetailed = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_properties',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '16px',
      padding: '0px',
      backgroundColor: null,
    })

    // Insert
    const nodePropertiesDetailedInstance = await this.node
    const nodeDetailedBasePropsInstance = await this.makeNodeDetailedBaseProps()
    const nodeDetailedWCAGScoresPropsInstance =
      await this.makeDetailedWCAGScoresProps()
    const nodeDetailedAPCAScoresPropsInstance =
      await this.makeNodeDetailedAPCAScoresProps()

    if (
      !nodePropertiesDetailedInstance ||
      !nodeDetailedBasePropsInstance ||
      !nodeDetailedWCAGScoresPropsInstance ||
      !nodeDetailedAPCAScoresPropsInstance
    )
      return null

    const nodeColumnsInstance = await this.makeNodeColumns(
      [nodeDetailedBasePropsInstance],
      [nodeDetailedWCAGScoresPropsInstance]
    )

    if (!nodeColumnsInstance) return null

    framer.setParent(nodeColumnsInstance.id, nodePropertiesDetailedInstance.id)
    framer.setParent(
      nodeDetailedAPCAScoresPropsInstance.id,
      nodePropertiesDetailedInstance.id
    )

    nodeDetailedAPCAScoresPropsInstance.setAttributes({
      width: '1fr',
    })
    nodeColumnsInstance.setAttributes({
      width: '1fr',
    })

    return this.node
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_properties',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'space-between',
      stackAlignment: 'start',
      backgroundColor: null,
    })

    // Insert
    const nodeInstance = await this.node
    const nodeTopPropsInstance = await this.makeNodeTopProps()
    const nodeBottomPropsInstance = await this.makeNodeBottomProps()

    if (!nodeInstance || !nodeTopPropsInstance || !nodeBottomPropsInstance)
      return null

    framer.setParent(nodeTopPropsInstance.id, nodeInstance.id)
    framer.setParent(nodeBottomPropsInstance.id, nodeInstance.id)

    nodeTopPropsInstance.setAttributes({
      width: '1fr',
    })
    nodeBottomPropsInstance.setAttributes({
      width: '1fr',
    })

    return this.node
  }
}
