import { FrameNode, framer } from 'framer-plugin'
import { locales } from '@ui-lib/content/locales'
import { FullConfiguration } from '@a_ng_d/utils-ui-color-palette'
import processSelection from '../gets/processSelection'

const createPaletteFromDocument = async () => {
  const document = (await framer.getSelection())[0] as FrameNode

  if (document === null) throw new Error(locales.get().error.unfoundPalette)

  const backupRaw = await document.getPluginData('backup')

  if (backupRaw === null) throw new Error(locales.get().error.palette)

  const backup = JSON.parse(backupRaw) as FullConfiguration

  window.localStorage.setItem(
    `palette_${backup.meta.id}`,
    JSON.stringify(backup)
  )
  window.postMessage({
    type: 'LOAD_PALETTE',
    data: backup,
  })
  processSelection()

  return backup
}

export default createPaletteFromDocument
