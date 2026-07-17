import { uid } from 'uid'
import {
  CanvasNode,
  FrameNode,
  framer,
  isComponentInstanceNode,
  isComponentNode,
  isFrameNode,
} from 'framer-plugin'
import chroma from 'chroma-js'
import {
  HexModel,
  SourceColorConfiguration,
} from '@yelbolt/engine-ui-color-palette'
import { imageUrlToArrayBuffer } from '../../utils/imageUrlToArrayBuffer'
import { tolgee } from '../../ui'

export let currentSelection: Array<CanvasNode> = []
export let previousSelection: Array<CanvasNode> = []
export let isSelectionChanged = false

const processSelection = async () => {
  previousSelection = currentSelection.length === 0 ? [] : currentSelection
  isSelectionChanged = true

  const selection: Array<CanvasNode> = await framer.getSelection()
  currentSelection = await framer.getSelection()

  const viableSelection: Array<SourceColorConfiguration> = []

  const document = selection[0] as FrameNode

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectionHandler = async (state: string, data?: any) => {
    const actions: { [key: string]: () => Promise<void> } = {
      DOCUMENT_SELECTED: async () => {
        const view = await document.getPluginData('view')
        const id = await document.getPluginData('id')
        const updatedAt = await document.getPluginData('updatedAt')

        window.postMessage({
          type: 'DOCUMENT_SELECTED',
          data: {
            view,
            id,
            updatedAt,
            isLinkedToPalette:
              window.localStorage.getItem(`palette_${id}`) !== null,
          },
        })
      },
      EMPTY_SELECTION: async () =>
        window.postMessage({
          type: 'EMPTY_SELECTION',
          data: {},
        }),
      COLOR_SELECTED: async () => {
        window.postMessage({
          type: 'COLOR_SELECTED',
          data: {
            selection: viableSelection,
          },
        })
      },
      IMAGE_SELECTED: async () => {
        try {
          const imageUrl = data.element.backgroundImage?.url
          if (imageUrl) {
            const arrayBuffer = await imageUrlToArrayBuffer(imageUrl)
            window.postMessage({
              type: 'GET_IMAGE_HASH',
              data: {
                arrayBuffer: arrayBuffer,
                imageTitle: data.element.name,
              },
            })
          }
        } catch (error) {
          window.postMessage({
            type: 'REPORT_ERROR',
            data: error,
          })
        }
      },
    }

    return actions[state] ? await actions[state]() : undefined
  }

  if (
    selection.length === 1 &&
    (await document.getPluginData('type')) === 'UI_COLOR_PALETTE' &&
    !(isComponentNode(document) || isComponentInstanceNode(document))
  )
    await selectionHandler('DOCUMENT_SELECTED')
  else if (
    selection.length === 1 &&
    (await document.getPluginDataKeys()).length > 0 &&
    !(isComponentInstanceNode(document) || isComponentNode(document))
  )
    await selectionHandler('DOCUMENT_SELECTED')
  else if (selection.length === 0) await selectionHandler('EMPTY_SELECTION')
  else if (
    selection.length > 1 &&
    (await document.getPluginDataKeys()).length !== 0
  )
    await selectionHandler('EMPTY_SELECTION')
  else if (
    isComponentInstanceNode(selection[0]) ||
    isComponentNode(selection[0])
  )
    await selectionHandler('EMPTY_SELECTION')
  else if ((selection[0] as FrameNode) === null)
    await selectionHandler('EMPTY_SELECTION')

  selection.forEach(async (element: CanvasNode) => {
    const hasColor = (element as FrameNode).backgroundColor !== null
    const hasImage = (element as FrameNode).backgroundImage !== null

    if (isFrameNode(element))
      if (hasColor && (await element.getPluginDataKeys()).length === 0) {
        const hexToGl = chroma(element.backgroundColor as HexModel).gl()
        viableSelection.push({
          name: element.name || tolgee.t('colors.defaultName'),
          rgb: {
            r: hexToGl[0],
            g: hexToGl[1],
            b: hexToGl[2],
          },
          source: 'CANVAS',
          id: uid(),
          isRemovable: true,
          hue: {
            shift: 0,
            isLocked: false,
          },
          chroma: {
            shift: 100,
            isLocked: false,
          },
        })
        await selectionHandler('COLOR_SELECTED')
      }

    if (hasImage) await selectionHandler('IMAGE_SELECTED', { element })
  })

  setTimeout(() => (isSelectionChanged = false), 1000)
}

export default processSelection
