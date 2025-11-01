import { TextNode, FrameNode, framer } from 'framer-plugin'
import getAddedNodesDuring from '../utils/getAddedNodesDuring'
import {
  bodyFontFamily,
  darkColor,
  darkColorExtraDim,
  FontFamily,
} from './styles'

export default class Paragraph {
  private name: string
  private content: string
  private fontSize: number
  private fontFamily: FontFamily
  private type: 'FILL' | 'FIXED'
  private width?: number
  private nodeText: TextNode | null
  node: Promise<FrameNode | null> | null

  constructor({
    name,
    content,
    type,
    width,
    fontSize = 12,
    fontFamily = bodyFontFamily,
  }: {
    name: string
    content: string
    type: 'FILL' | 'FIXED'
    width?: number
    fontSize?: number
    fontFamily?: FontFamily
  }) {
    this.name = name
    this.content = content
    this.fontSize = fontSize
    this.fontFamily = fontFamily
    this.type = type
    this.width = width
    this.nodeText = null
    this.node = null
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
        color: darkColor,
        font: {
          family: this.fontFamily,
          weight: 500,
          style: 'normal',
          selector: `GF;${this.fontFamily}-500`,
        },
        fontSize: `${this.fontSize}px`,
        lineHeight: '130%',
        alignment: 'start',
      })

    return this.nodeText
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: this.name,
      width: this.type === 'FIXED' ? `${this.width ?? 100}px` : 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      gap: '0px',
      padding: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      border: {
        width: '1px',
        color: darkColorExtraDim,
        style: 'solid',
      },
      borderRadius: '16px',
    })

    // Insert
    const nodeParagraphInstance = await this.node
    const nodeTextInstance = await this.makeNodeText()

    if (nodeParagraphInstance && nodeTextInstance) {
      framer.setParent(nodeTextInstance.id, nodeParagraphInstance.id)
      nodeTextInstance.setAttributes({
        width: '1fr',
      })
    }

    return this.node
  }
}
