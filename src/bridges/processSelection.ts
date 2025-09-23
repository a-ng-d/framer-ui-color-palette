import { uid } from 'uid'
import chroma from 'chroma-js'
import {
  HexModel,
  SourceColorConfiguration,
} from '@a_ng_d/utils-ui-color-palette'
import {
  CanvasNode,
  FrameNode,
  framer,
  isComponentInstanceNode,
  isComponentNode,
  isFrameNode,
} from 'framer-plugin'
import { locales } from '../content/locales'

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

  const selectionHandler = async (state: string) => {
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
              window.localStorage.getItem(`palette_${id}`) !== '',
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
    if (isFrameNode(element))
      if (hasColor && (await element.getPluginDataKeys()).length === 0) {
        const hexToGl = chroma(element.backgroundColor as HexModel).gl()
        viableSelection.push({
          name: element.name || locales.get().colors.defaultName,
          rgb: {
            r: hexToGl[0],
            g: hexToGl[1],
            b: hexToGl[2],
          },
          source: 'CANVAS',
          id: uid(),
          isRemovable: false,
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
  })

  setTimeout(() => (isSelectionChanged = false), 1000)
}

export default processSelection
