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

  const selectionHandler = (state: string) => {
    const actions: { [key: string]: () => void } = {
      DOCUMENT_SELECTED: async () => {
        window.postMessage({
          type: 'DOCUMENT_SELECTED',
          data: {
            view: document.getPluginData('view'),
            id: document.getPluginData('id'),
            updatedAt: document.getPluginData('updatedAt'),
            isLinkedToPalette:
              window.localStorage.getPluginData(
                `palette_${document.getPluginData('id')}`
              ) !== '',
          },
        })
      },
      EMPTY_SELECTION: () =>
        window.postMessage({
          type: 'EMPTY_SELECTION',
          data: {},
        }),
      COLOR_SELECTED: () => {
        window.postMessage({
          type: 'COLOR_SELECTED',
          data: {
            selection: viableSelection,
          },
        })
      },
    }

    return actions[state]?.()
  }

  if (
    selection.length === 1 &&
    (await document.getPluginData('type')) === 'UI_COLOR_PALETTE' &&
    !(isComponentNode(document) || isComponentInstanceNode(document))
  )
    selectionHandler('DOCUMENT_SELECTED')
  else if (
    selection.length === 1 &&
    (await document.getPluginDataKeys()).length > 0 &&
    !(isComponentInstanceNode(document) || isComponentNode(document))
  )
    selectionHandler('DOCUMENT_SELECTED')
  else if (selection.length === 0) selectionHandler('EMPTY_SELECTION')
  else if (
    selection.length > 1 &&
    (await document.getPluginDataKeys()).length !== 0
  )
    selectionHandler('EMPTY_SELECTION')
  else if (
    isComponentInstanceNode(selection[0]) ||
    isComponentNode(selection[0])
  )
    selectionHandler('EMPTY_SELECTION')
  else if ((selection[0] as FrameNode) === null)
    selectionHandler('EMPTY_SELECTION')

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
        selectionHandler('COLOR_SELECTED')
      }
  })

  setTimeout(() => (isSelectionChanged = false), 1000)
}

export default processSelection
