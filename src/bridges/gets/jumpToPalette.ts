import { tolgee } from '../../ui'

const jumpToPalette = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (!rawPalette) throw new Error(tolgee.t('error.unfoundPalette'))

  const palette = JSON.parse(rawPalette)
  palette.meta.dates.openedAt = new Date().toISOString()
  window.localStorage.setItem(`palette_${id}`, JSON.stringify(palette))

  return window.postMessage({
    type: 'LOAD_PALETTE',
    data: palette,
  })
}

export default jumpToPalette
