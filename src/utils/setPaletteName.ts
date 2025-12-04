import { tolgee } from '../ui'

const setPaletteName = (
  name: string,
  theme: string | undefined,
  preset: string,
  colorSpace: string,
  visionSimulationMode: string
): string => {
  const parameters: Array<string> = []

  if (name === '') parameters.push(tolgee.t('name'))
  else parameters.push(name)

  if (theme !== 'None' && theme !== undefined) parameters.push(theme)

  parameters.push(preset)
  parameters.push(colorSpace)

  if (visionSimulationMode !== 'NONE') {
    const mode = visionSimulationMode.toLowerCase()
    const translationKey = `settings.color.visionSimulationMode.${mode}`
    parameters.push(tolgee.t(translationKey))
  }

  return parameters.join(tolgee.t('separator'))
}

export default setPaletteName
