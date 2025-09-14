import { FullConfiguration } from '@a_ng_d/utils-ui-color-palette'
import { ThemesMessage } from '../../types/messages'

const updateThemes = async (msg: ThemesMessage) => {
  const now = new Date().toISOString()
  const palette: FullConfiguration = JSON.parse(
    window.localStorage.getItem(`palette_${msg.id}`) ?? '{}'
  )

  palette.themes = msg.data

  palette.meta.dates.updatedAt = now
  window.postMessage({
    type: 'UPDATE_PALETTE_DATE',
    data: now,
  })

  return window.localStorage.setItem(
    `palette_${msg.id}`,
    JSON.stringify(palette)
  )
}

export default updateThemes
