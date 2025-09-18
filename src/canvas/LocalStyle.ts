import { ColorStyle, framer } from 'framer-plugin'

export default class LocalStyle {
  private name: string
  private light: string
  private dark: string
  libraryColor: Promise<ColorStyle>

  constructor({
    name,
    light,
    dark,
  }: {
    name: string
    light: string
    dark: string
  }) {
    this.name = name
    this.light = light
    this.dark = dark
    this.libraryColor = this.makeLibraryColor()
  }

  makeLibraryColor = async () => {
    const libraryColor = await framer.createColorStyle({
      name: this.name,
      light: this.light,
      dark: this.dark,
    })

    return libraryColor
  }
}
