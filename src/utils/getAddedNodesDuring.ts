import { CanvasNode, framer } from 'framer-plugin'

const getAddedNodesDuring = async (
  callback: () => Promise<void>
): Promise<CanvasNode[]> => {
  await framer.setSelection([])

  const canvasRoot = await framer.getCanvasRoot()
  const childrenBefore = await canvasRoot.getChildren()
  const idsBefore = new Set(childrenBefore.map((child) => child.id))

  await callback()

  const childrenAfter = await canvasRoot.getChildren()

  const newNodes = childrenAfter.filter((child) => !idsBefore.has(child.id))

  return newNodes
}

export default getAddedNodesDuring
