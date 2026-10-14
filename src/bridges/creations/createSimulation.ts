import {
  CanvasNode,
  ColorStyle,
  framer,
  Gradient,
  isFrameNode,
  isSVGNode,
  isTextNode,
  TextStyle,
} from 'framer-plugin'
import { Data, FullConfiguration } from '@yelbolt/engine-ui-color-palette'
import { tolgee } from '../../ui'

type Rgb = { r: number; g: number; b: number }

interface PaletteMatcher {
  rgb: (color: Rgb) => Rgb
  color: (value: string) => string
}

type Lab = [number, number, number]
type Lch = { l: number; c: number; h: number }
type Shade = { rgb: Rgb; lch: Lch }
type Family = { shades: Array<Shade>; hue: number; chroma: number }

const NEUTRAL_SOURCE_CHROMA = 0.015
const NEUTRAL_FAMILY_CHROMA = 0.06

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

const toOklab = ({ r, g, b }: Rgb): Lab => {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

const toOklch = (color: Rgb): Lch => {
  const [l, a, b] = toOklab(color)
  return { l, c: Math.sqrt(a * a + b * b), h: Math.atan2(b, a) }
}

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % (2 * Math.PI)
  return d > Math.PI ? 2 * Math.PI - d : d
}

const toHexByte = (channel: number) =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, '0')

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const FUNCTIONAL =
  /^rgba?\(\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)\s*[, ]\s*([\d.]+)(%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i

const createFamilies = (palette: FullConfiguration): Array<Family> => {
  const libraryData = new Data(palette).makeLibraryData(['gl', 'alpha'])

  const hasThemes = libraryData.some((item) => !item.id.includes('00000000000'))
  const items = libraryData
    .filter((item) =>
      hasThemes
        ? !item.id.includes('00000000000')
        : item.id.includes('00000000000')
    )
    .filter((item) => item.gl !== undefined)
  const themeName = items[0]?.themeName

  const byName = new Map<string, Array<Shade>>()
  items
    .filter((item) => item.themeName === themeName)
    .forEach((item) => {
      const gl = item.gl ?? [0, 0, 0]
      const rgb = { r: gl[0], g: gl[1], b: gl[2] }
      const shades = byName.get(item.colorName) ?? []
      shades.push({ rgb, lch: toOklch(rgb) })
      byName.set(item.colorName, shades)
    })

  return Array.from(byName.values()).map((shades) => {
    const peak = shades.reduce((a, b) => (b.lch.c > a.lch.c ? b : a))
    return { shades, hue: peak.lch.h, chroma: peak.lch.c }
  })
}

const createPaletteMatcher = (
  palette: FullConfiguration
): PaletteMatcher | null => {
  const families = createFamilies(palette)
  if (families.length === 0) return null

  const chromatics = families.filter((f) => f.chroma >= NEUTRAL_FAMILY_CHROMA)
  const mostNeutral = families.reduce((a, b) => (b.chroma < a.chroma ? b : a))
  const cache = new Map<string, Rgb>()

  const rgb = (color: Rgb): Rgb => {
    const key = `${color.r},${color.g},${color.b}`
    const cached = cache.get(key)
    if (cached !== undefined) return cached

    const lch = toOklch(color)

    const family =
      lch.c < NEUTRAL_SOURCE_CHROMA || chromatics.length === 0
        ? mostNeutral
        : chromatics.reduce((a, b) =>
            hueGap(lch.h, b.hue) < hueGap(lch.h, a.hue) ? b : a
          )

    const shade = family.shades.reduce((a, b) => {
      const dA = Math.abs(a.lch.l - lch.l)
      const dB = Math.abs(b.lch.l - lch.l)
      if (dB !== dA) return dB < dA ? b : a
      return Math.abs(b.lch.c - lch.c) < Math.abs(a.lch.c - lch.c) ? b : a
    })

    cache.set(key, shade.rgb)
    return shade.rgb
  }

  const color = (value: string): string => {
    const input = value.trim()

    const hex = HEX.exec(input)
    if (hex !== null) {
      let digits = hex[1]
      if (digits.length <= 4)
        digits = digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      const match = rgb({
        r: parseInt(digits.slice(0, 2), 16) / 255,
        g: parseInt(digits.slice(2, 4), 16) / 255,
        b: parseInt(digits.slice(4, 6), 16) / 255,
      })
      return `#${toHexByte(match.r)}${toHexByte(match.g)}${toHexByte(match.b)}${digits.slice(6)}`
    }

    const functional = FUNCTIONAL.exec(input)
    if (functional !== null) {
      const channel = (raw: string, isPercent: string) =>
        isPercent === '%' ? parseFloat(raw) / 100 : parseFloat(raw) / 255
      const match = rgb({
        r: channel(functional[1], functional[2]),
        g: channel(functional[3], functional[4]),
        b: channel(functional[5], functional[6]),
      })
      const r = Math.round(match.r * 255)
      const g = Math.round(match.g * 255)
      const b = Math.round(match.b * 255)
      return functional[7] !== undefined
        ? `rgba(${r}, ${g}, ${b}, ${functional[7]})`
        : `rgb(${r}, ${g}, ${b})`
    }

    return value
  }

  return { rgb, color }
}

const resolveColor = (value: ColorStyle | string | null): string | null => {
  if (typeof value === 'string') return value
  if (value !== null && typeof value === 'object' && 'light' in value)
    return typeof value.light === 'string' ? value.light : null

  return null
}

type Match = (value: string) => string

interface SimulationContext {
  match: Match
  canCreateTextStyle: boolean
  textStyles: Map<string, TextStyle> | null
}

const SIMULATION_STYLE_FOLDER = 'UI Color Palette Simulation'

const COLOR_VALUE = /^(#[0-9a-f]{3,8}|rgba?\()/i
const CSS_VARIABLE = /^var\(\s*--[^,()]+,\s*(.+)\)$/i

const withVariables =
  (match: Match): Match =>
  (value) => {
    const unwrapped = CSS_VARIABLE.exec(value.trim())?.[1]?.trim()
    if (unwrapped === undefined) return match(value)

    return COLOR_VALUE.test(unwrapped) ? match(unwrapped) : value
  }

const SVG_COLOR_PROPERTIES = 'fill|stroke|stop-color|flood-color|lighting-color'

const remapSvg = (svg: string, match: Match) =>
  svg
    .replace(
      new RegExp(`\\b(${SVG_COLOR_PROPERTIES})=(["'])([^"']*)\\2`, 'g'),
      (_, property: string, quote: string, value: string) =>
        `${property}=${quote}${match(value.trim())}${quote}`
    )
    .replace(
      new RegExp(`\\b(${SVG_COLOR_PROPERTIES})\\s*:\\s*([^;"'}]+)`, 'g'),
      (_, property: string, value: string) =>
        `${property}:${match(value.trim())}`
    )

const remapGradient = (gradient: Gradient, match: Match): Gradient | null => {
  let hasChanged = false

  const stops = gradient.stops.map((stop) => {
    const current = resolveColor(stop.color)
    if (current === null) return stop

    const color = match(current)
    if (color === current) return stop

    hasChanged = true
    return { ...stop, color }
  })

  return hasChanged
    ? (gradient.cloneWithAttributes({ stops }) as unknown as Gradient)
    : null
}

const deriveTextStyle = async (
  style: TextStyle,
  color: string,
  context: SimulationContext
): Promise<TextStyle | null> => {
  const path = `${SIMULATION_STYLE_FOLDER}/${style.name} ${color.replace(/\s+/g, '')}`

  if (context.textStyles === null) {
    const existing = await framer.getTextStyles()
    context.textStyles = new Map(existing.map((item) => [item.path, item]))
  }

  const known = context.textStyles.get(path)
  if (known !== undefined) return known

  const decorationColor = resolveColor(style.decorationColor)

  const created = await framer.createTextStyle({
    path,
    tag: style.tag,
    font: style.font,
    boldFont: style.boldFont,
    italicFont: style.italicFont,
    boldItalicFont: style.boldItalicFont,
    color,
    transform: style.transform,
    alignment: style.alignment,
    decoration: style.decoration,
    decorationColor:
      decorationColor !== null ? context.match(decorationColor) : undefined,
    decorationThickness: style.decorationThickness,
    decorationStyle: style.decorationStyle,
    decorationSkipInk: style.decorationSkipInk,
    decorationOffset: style.decorationOffset,
    balance: style.balance,
    minWidth: style.minWidth,
    fontSize: style.fontSize,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
    paragraphSpacing: style.paragraphSpacing,
    breakpoints: style.breakpoints.map((breakpoint) => ({ ...breakpoint })),
  })

  context.textStyles.set(path, created)
  return created
}

const remapNode = async (node: CanvasNode, context: SimulationContext) => {
  const { match } = context

  if (isSVGNode(node)) {
    const svg = remapSvg(node.svg, match)
    if (svg !== node.svg) await node.setAttributes({ svg })
    return
  }

  if (isTextNode(node)) {
    const style = node.inlineTextStyle
    if (style === null || !context.canCreateTextStyle) return

    const current = resolveColor(style.color)
    if (current === null) return

    const color = match(current)
    if (color === current) return

    const derived = await deriveTextStyle(style, color, context)
    if (derived !== null) await node.setAttributes({ inlineTextStyle: derived })
    return
  }

  if (!isFrameNode(node)) return

  const attributes: {
    backgroundColor?: string
    backgroundGradient?: Gradient
    border?: NonNullable<typeof node.border>
  } = {}

  const background = resolveColor(node.backgroundColor)
  if (background !== null) {
    const backgroundColor = match(background)
    if (backgroundColor !== background)
      attributes.backgroundColor = backgroundColor
  }

  if (node.backgroundGradient !== null) {
    const gradient = remapGradient(node.backgroundGradient, match)
    if (gradient !== null) attributes.backgroundGradient = gradient
  }

  const borderColor =
    node.border !== null ? resolveColor(node.border.color) : null
  if (node.border !== null && borderColor !== null) {
    const color = match(borderColor)
    if (color !== borderColor) attributes.border = { ...node.border, color }
  }

  if (Object.keys(attributes).length > 0) await node.setAttributes(attributes)
}

const simulateNode = async (node: CanvasNode, context: SimulationContext) => {
  if ('visible' in node) {
    if (!node.visible || node.locked) return

    await remapNode(node, context)
  }

  const children = await node.getChildren()
  for (const child of children) await simulateNode(child, context)
}

const createSimulation = async (id: string) => {
  const rawPalette = window.localStorage.getItem(`palette_${id}`)

  if (rawPalette === undefined || rawPalette === null)
    throw new Error(tolgee.t('error.unfoundPalette'))

  const selection = await framer.getSelection()
  if (selection.length === 0)
    return {
      type: 'WARNING' as const,
      message: tolgee.t('warning.emptySelection'),
    }

  const palette = JSON.parse(rawPalette) as FullConfiguration
  const matcher = createPaletteMatcher(palette)

  if (matcher === null) throw new Error(tolgee.t('error.unfoundPalette'))

  const isAllowedToSetAttributes = framer.isAllowedTo('setAttributes')

  if (!isAllowedToSetAttributes) throw new Error(tolgee.t('error.generic'))

  const context: SimulationContext = {
    match: withVariables(matcher.color),
    canCreateTextStyle: framer.isAllowedTo('createTextStyle'),
    textStyles: null,
  }

  for (const node of selection) await simulateNode(node, context)
}

export default createSimulation
