import { FrameNode, framer } from 'framer-plugin'
import Tag from './Tag'

export default class Property {
  private name: string
  private content: string
  private size: number
  private node: Promise<FrameNode | null> | null

  constructor({
    name,
    content,
    size,
  }: {
    name: string
    content: string
    size: number
  }) {
    this.name = name
    this.content = content
    this.size = size
    this.node = null
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_property',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '0px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeInstance = await this.node
    const propertyNodeInstance = await new Tag({
      name: this.name,
      content: this.content,
      fontSize: this.size,
    }).makeNodeTag()

    if (nodeInstance && propertyNodeInstance) {
      framer.setParent(propertyNodeInstance.id, nodeInstance.id)
    }

    return this.node
  }
}
