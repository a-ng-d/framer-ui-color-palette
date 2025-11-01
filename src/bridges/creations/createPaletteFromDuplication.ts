import { uid } from 'uid'
import { locales } from '@ui-lib/content/locales'
import { FullConfiguration } from '@a_ng_d/utils-ui-color-palette'

const createPaletteFromDuplication = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)
  const now = new Date().toISOString()

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(locales.get().error.unfoundPalette)

  const palette = JSON.parse(rawPalette) as FullConfiguration

  palette.base.name = locales
    .get()
    .browse.copy.replace('{name}', palette.base.name)
  palette.meta.id = uid()
  palette.meta.publicationStatus.isPublished = false
  palette.meta.publicationStatus.isShared = false
  palette.meta.dates.updatedAt = now
  palette.meta.dates.createdAt = now
  palette.meta.dates.publishedAt = ''
  palette.meta.dates.openedAt = now
  palette.meta.creatorIdentity.creatorId = ''
  palette.meta.creatorIdentity.creatorFullName = ''
  palette.meta.creatorIdentity.creatorAvatar = ''

  return window.localStorage.setItem(
    `palette_${palette.meta.id}`,
    JSON.stringify(palette)
  )
}

export default createPaletteFromDuplication
