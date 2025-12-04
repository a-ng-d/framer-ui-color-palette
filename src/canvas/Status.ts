import { FrameNode, framer } from 'framer-plugin'
import { tolgee } from '../ui'
import Tag from './Tag'

export default class Status {
  private status: {
    isClosestToRef: boolean
    isLocked: boolean
    isTransparent: boolean
  }
  private source: { [key: string]: number }
  node: Promise<FrameNode | null> | null

  constructor({
    status = {
      isClosestToRef: false,
      isLocked: false,
      isTransparent: false,
    },
    source = {
      r: 0,
      g: 0,
      b: 0,
    },
  }: {
    status: {
      isClosestToRef: boolean
      isLocked: boolean
      isTransparent: boolean
    }
    source: { [key: string]: number }
  }) {
    this.status = status
    this.source = source
    this.node = null
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_status',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'start',
      stackAlignment: 'start',
      stackWrapEnabled: true,
      gap: '4px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeStatusInstance = await this.node

    // Insert
    if (this.status.isClosestToRef && !this.status.isTransparent) {
      const nodeTagInstance = await new Tag({
        name: '_close',
        content: tolgee.t('paletteProperties.closest'),
        fontSize: 10,
      }).makeNodeTag()

      if (nodeTagInstance && nodeStatusInstance)
        framer.setParent(nodeTagInstance.id, nodeStatusInstance.id)
    }

    if (this.status.isLocked && !this.status.isClosestToRef) {
      const nodeTagLockInstance = await new Tag({
        name: '_lock',
        content: tolgee.t('paletteProperties.locked'),
        fontSize: 10,
      }).makeNodeTag()

      if (nodeTagLockInstance && nodeStatusInstance)
        framer.setParent(nodeTagLockInstance.id, nodeStatusInstance.id)
    }

    if (this.status.isTransparent) {
      const nodeTagTransparentInstance = await new Tag({
        name: '_transparent',
        content: 'Transparent',
        fontSize: 10,
      }).makeNodeTag()

      if (nodeTagTransparentInstance && nodeStatusInstance)
        framer.setParent(nodeTagTransparentInstance.id, nodeStatusInstance.id)
    }

    return this.node
  }
}
