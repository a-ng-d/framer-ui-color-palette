import { FrameNode, framer, ImageAsset, TextNode } from 'framer-plugin'
import chroma from 'chroma-js'
import { RgbModel } from '@a_ng_d/utils-ui-color-palette'
import getAddedNodesDuring from '../utils/getAddedNodesDuring'

export default class Tag {
  private name: string
  private content: string
  private fontSize: number
  private fontFamily: 'Martian Mono' | 'Lexend'
  private url: string | null
  private backgroundColor: {
    rgb: RgbModel
    alpha: number
  }
  private nodeTag: Promise<FrameNode | null> | null
  private nodeTagWithAvatar: Promise<FrameNode | null> | null
  private nodeTagwithIndicator: Promise<FrameNode | null> | null
  private nodeText: TextNode | null
  private nodeIndicator: Promise<FrameNode | null> | null
  private nodeAvatar: Promise<FrameNode | null> | null

  constructor({
    name,
    content,
    fontSize = 8,
    fontFamily = 'Martian Mono',
    backgroundColor = {
      rgb: {
        r: 1,
        g: 1,
        b: 1,
      },
      alpha: 0.5,
    },
    url = null,
  }: {
    name: string
    content: string
    fontSize?: number
    fontFamily?: 'Martian Mono' | 'Lexend'
    backgroundColor?: {
      rgb: RgbModel
      alpha: number
    }
    url?: string | null
  }) {
    this.name = name
    this.content = content
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.url = url
    this.backgroundColor = backgroundColor
    this.nodeTag = null
    this.nodeTagwithIndicator = null
    this.nodeTagWithAvatar = null
    this.nodeText = null
    this.nodeIndicator = null
    this.nodeAvatar = null
  }

  makeNodeTag = async () => {
    // Base
    this.nodeTag = framer.createFrameNode({
      name: this.name,
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackAlignment: 'center',
      gap: '4px',
      padding: '4px 8px 4px 8px',
      backgroundColor: chroma([
        this.backgroundColor.rgb.r * 255,
        this.backgroundColor.rgb.g * 255,
        this.backgroundColor.rgb.b * 255,
        this.backgroundColor.alpha,
      ]).hex(),
      border: {
        width: '1px',
        color: '#0000000d',
        style: 'solid',
      },
      borderRadius: '16px',
    })

    // Insert
    const nodeTagInstance = await this.nodeTag
    const textNodeInstance = await this.makeNodeText()

    if (textNodeInstance && nodeTagInstance)
      framer.setParent(textNodeInstance.id, nodeTagInstance.id)

    return this.nodeTag
  }

  makeNodeTagwithIndicator = async (gl: Array<number> = [0, 0, 0, 1]) => {
    // Base
    this.nodeTagwithIndicator = framer.createFrameNode({
      name: this.name,
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackAlignment: 'center',
      gap: '4px',
      padding: '2px 2px 2px 8px',
      backgroundColor: chroma([
        this.backgroundColor.rgb.r * 255,
        this.backgroundColor.rgb.g * 255,
        this.backgroundColor.rgb.b * 255,
        this.backgroundColor.alpha,
      ]).hex(),
      border: {
        color: '#0000000d',
        width: '1px',
        style: 'solid',
      },
      borderRadius: '16px',
    })

    // Insert
    const nodeTagwithIndicatorInstance = await this.nodeTagwithIndicator
    const nodeIndicatorInstance = await this.makeNodeIndicator([
      gl[0],
      gl[1],
      gl[2],
    ])
    const textNodeInstance = await this.makeNodeText()

    if (
      textNodeInstance &&
      nodeIndicatorInstance &&
      nodeTagwithIndicatorInstance
    ) {
      framer.setParent(
        nodeIndicatorInstance.id,
        nodeTagwithIndicatorInstance.id,
        0
      )
      framer.setParent(textNodeInstance.id, nodeTagwithIndicatorInstance.id, 1)
    }

    return this.nodeTagwithIndicator
  }

  makeNodeTagWithAvatar = async (image?: ImageAsset | null) => {
    // Base
    this.nodeTagWithAvatar = framer.createFrameNode({
      name: this.name,
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackAlignment: 'center',
      gap: '4px',
      padding: '4px 4px 4px 8px',
      backgroundColor: chroma([
        this.backgroundColor.rgb.r * 255,
        this.backgroundColor.rgb.g * 255,
        this.backgroundColor.rgb.b * 255,
        this.backgroundColor.alpha,
      ]).hex(),
      border: {
        color: '#0000000d',
        width: '1px',
        style: 'solid',
      },
      borderRadius: '16px',
    })

    // Insert
    const nodeTagWithAvatarInstance = await this.nodeTagWithAvatar
    const textNode = await this.makeNodeText()
    const avatarNode = await this.makeNodeAvatar(image)

    if (textNode && avatarNode && nodeTagWithAvatarInstance) {
      framer.setParent(textNode.id, nodeTagWithAvatarInstance.id, 0)
      framer.setParent(avatarNode.id, nodeTagWithAvatarInstance.id, 1)
    }

    return this.nodeTagWithAvatar
  }

  makeNodeText = async () => {
    // Base
    this.nodeText = (
      await getAddedNodesDuring(() =>
        framer.addText(this.content, {
          tag: 'p',
        })
      )
    )[0] as TextNode | null
    // const nodeStyleInstance = await framer.createTextStyle({
    //   name: '_uicp',
    //   color: '#000000',
    //   font: {
    //     family: this.fontFamily,
    //     weight: 500,
    //     style: 'normal',
    //     selector: `GF;${this.fontFamily}-500`,
    //   },
    //   fontSize: `${this.fontSize}px`,
    //   lineHeight: '100%',
    //   alignment: 'center',
    // })

    const nodeTextInstance = this.nodeText

    if (nodeTextInstance) 
      nodeTextInstance.setAttributes({
        name: '_text',
        color: '#000000',
        font: {
          family: this.fontFamily,
          weight: 500,
          style: 'normal',
          selector: `GF;${this.fontFamily}-500`,
        },
        fontSize: `${this.fontSize}px`,
        lineHeight: '100%',
        alignment: 'center',
        link: this.url ? this.url : undefined,
      })
    

    return this.nodeText
  }

  makeNodeIndicator = async (rgb: Array<number>) => {
    // Base
    this.nodeIndicator = framer.createFrameNode({
      name: '_indicator',
      width: '16px',
      height: '16px',
      backgroundColor: chroma([rgb[0] * 255, rgb[1] * 255, rgb[2] * 255]).hex(),
      border: {
        width: '1px',
        color: '#0000001a',
        style: 'solid',
      },
      borderRadius: '8px',
    })

    return this.nodeIndicator
  }

  makeNodeAvatar = async (image?: ImageAsset | null) => {
    // Base
    this.nodeAvatar = framer.createFrameNode({
      name: '_avatar',
      width: '24px',
      height: '24px',
      borderRadius: '12px',
      backgroundImage: image !== undefined ? image : undefined,
      backgroundColor: image === undefined ? '#000000' : undefined,
    })

    return this.nodeAvatar
  }
}
