import { FrameNode, framer } from 'framer-plugin'
import {
  BaseConfiguration,
  MetaConfiguration,
  ThemeConfiguration,
  PaletteDataThemeItem,
} from '@a_ng_d/utils-ui-color-palette'
import { locales } from '../content/locales'
import Tag from './Tag'
import Paragraph from './Paragraph'

export default class Title {
  private base: BaseConfiguration
  private theme: ThemeConfiguration
  private data: PaletteDataThemeItem
  private meta: MetaConfiguration
  private nodeGlobalInfo: Promise<FrameNode | null> | null
  private nodeDescriptions: Promise<FrameNode | null> | null
  private nodeProps: Promise<FrameNode | null> | null
  node: Promise<FrameNode | null> | null

  constructor({
    base,
    theme,
    data,
    meta,
  }: {
    base: BaseConfiguration
    theme: ThemeConfiguration
    data: PaletteDataThemeItem
    meta: MetaConfiguration
  }) {
    this.base = base
    this.theme = theme
    this.data = data
    this.meta = meta
    this.nodeGlobalInfo = null
    this.nodeDescriptions = null
    this.nodeProps = null
    this.node = null
  }

  makeNodeGlobalInfo = async () => {
    // Base
    this.nodeGlobalInfo = framer.createFrameNode({
      name: '_palette-global',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'start',
      gap: '8px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodeGlobalInfoInstance = await this.nodeGlobalInfo
    const nodeNameInstance = await new Tag({
      name: '_name',
      content: this.base.name === '' ? locales.get().name : this.base.name,
      fontSize: 20,
    }).makeNodeTag()

    // Insert
    if (nodeGlobalInfoInstance && nodeNameInstance)
      framer.setParent(nodeNameInstance.id, nodeGlobalInfoInstance.id)

    if (this.base.description !== '' || this.theme.description !== '') {
      const nodeDescriptionsInstance = await this.makeNodeDescriptions()

      if (nodeGlobalInfoInstance && nodeDescriptionsInstance)
        framer.setParent(nodeDescriptionsInstance.id, nodeGlobalInfoInstance.id)
    }

    return this.nodeGlobalInfo
  }

  makeNodeDescriptions = async () => {
    // Base
    this.nodeDescriptions = framer.createFrameNode({
      name: '_palette-description(s)',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackAlignment: 'start',
      stackDistribution: 'start',
      gap: '8px',
      padding: '0px',
      backgroundColor: null,
    })

    // Insert
    const nodeDescriptionsInstance = await this.nodeDescriptions

    if (this.base.description !== '') {
      const nodePaletteDescriptionInstance = await new Paragraph({
        name: '_palette-description',
        content: this.base.description,
        type: 'FIXED',
        width: 644,
        fontSize: 12,
        fontFamily: 'Lexend',
      }).makeNode()

      if (nodeDescriptionsInstance && nodePaletteDescriptionInstance)
        framer.setParent(
          nodePaletteDescriptionInstance.id,
          nodeDescriptionsInstance.id
        )
    }

    if (this.theme.description !== '') {
      const nodeThemeDescriptionInstance = await new Paragraph({
        name: '_theme-description',
        content: locales
          .get()
          .paletteProperties.themeDescription.replace(
            '{description}',
            this.theme.description
          ),
        type: 'FIXED',
        width: 644,
        fontSize: 12,
        fontFamily: 'Lexend',
      }).makeNode()

      if (nodeDescriptionsInstance && nodeThemeDescriptionInstance)
        framer.setParent(
          nodeThemeDescriptionInstance.id,
          nodeDescriptionsInstance.id
        )
    }

    return this.nodeDescriptions
  }

  makeNodeProps = async () => {
    // Base
    this.nodeProps = framer.createFrameNode({
      name: '_palette-props',
      width: 'fit-content',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'vertical',
      stackDistribution: 'start',
      stackAlignment: 'end',
      gap: '8px',
      padding: '0px',
      backgroundColor: null,
    })

    // Instances
    const nodePropsInstance = await this.nodeProps

    // Insert
    if (
      this.meta.publicationStatus.isPublished &&
      this.meta.creatorIdentity.creatorAvatar !== ''
    )
      framer
        .uploadImage({
          image: this.meta.creatorIdentity.creatorAvatar,
          name: 'Creator avatar',
        })
        .then(async (image) => {
          const nodeProviderInstance = await new Tag({
            name: '_provider',
            content: locales
              .get()
              .paletteProperties.provider.replace(
                '{name}',
                this.meta.creatorIdentity.creatorFullName
              ),
            fontSize: 12,
          }).makeNodeTagWithAvatar(image)

          if (nodePropsInstance && nodeProviderInstance)
            framer.setParent(nodeProviderInstance.id, nodePropsInstance.id, 0)
        })
    if (this.data.type !== 'default theme') {
      const nodeThemeInstance = await new Tag({
        name: '_theme',
        content: locales
          .get()
          .paletteProperties.theme.replace('{name}', this.data.name),
        fontSize: 12,
      }).makeNodeTag()

      if (nodePropsInstance && nodeThemeInstance)
        framer.setParent(nodeThemeInstance.id, nodePropsInstance.id)
    }
    const nodePresetInstance = await new Tag({
      name: '_preset',
      content: locales
        .get()
        .paletteProperties.preset.replace('{name}', this.base.preset.name),
      fontSize: 12,
    }).makeNodeTag()
    const colorSpaceInstance = await new Tag({
      name: '_color-space',
      content: locales
        .get()
        .paletteProperties.colorSpace.replace('{name}', this.base.colorSpace),
      fontSize: 12,
    }).makeNodeTag()

    if (nodePropsInstance && nodePresetInstance && colorSpaceInstance) {
      framer.setParent(nodePresetInstance.id, nodePropsInstance.id)
      framer.setParent(colorSpaceInstance.id, nodePropsInstance.id)
    }

    if (this.base.visionSimulationMode !== 'NONE') {
      const nodeVisionSimulation = await new Tag({
        name: '_vision-simulation',
        content: locales
          .get()
          .paletteProperties.visionSimulation.replace(
            '{mode}',
            this.theme.visionSimulationMode.charAt(0) +
              this.theme.visionSimulationMode.toLocaleLowerCase().slice(1)
          ),
        fontSize: 12,
      }).makeNodeTag()

      if (nodePropsInstance && nodeVisionSimulation)
        framer.setParent(nodeVisionSimulation.id, nodePropsInstance.id)
    }

    const nodeUpdateInstance = await new Tag({
      name: '_updated_at',
      content: locales
        .get()
        .paletteProperties.updatedAt.replace(
          '{date}',
          new Date(this.meta.dates.updatedAt).toDateString()
        ),
      fontSize: 12,
    }).makeNodeTag()

    if (nodePropsInstance && nodeUpdateInstance)
      framer.setParent(nodeUpdateInstance.id, nodePropsInstance.id)

    return this.nodeProps
  }

  makeNode = async () => {
    // Base
    this.node = framer.createFrameNode({
      name: '_title',
      height: 'fit-content',
      layout: 'stack',
      stackDirection: 'horizontal',
      stackDistribution: 'space-between',
      stackAlignment: 'start',
      backgroundColor: null,
    })

    // Insert
    const nodeInstance = await this.node
    const nodeGlobalInfoInstance = await this.makeNodeGlobalInfo()
    const nodePropsInstance = await this.makeNodeProps()

    if (!nodeInstance || !nodeGlobalInfoInstance || !nodePropsInstance)
      return null

    framer.setParent(nodeGlobalInfoInstance.id, nodeInstance.id)
    framer.setParent(nodePropsInstance.id, nodeInstance.id)

    return this.node
  }
}
