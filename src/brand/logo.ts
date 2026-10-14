// one drawing for the header, the favicon and the readme. it's cut bold so the globe still reads at 16px
export const LOGO_VIEWBOX = '0 0 256 256'
export const LOGO_TILT = 'rotate(-15 128 128)'
export const GLOBE_LINE_WIDTH = 15

export const STAMP_PATH =
  'M46 32H66a14 14 0 0 0 28 0H114a14 14 0 0 0 28 0H162a14 14 0 0 0 28 0H210a14 14 0 0 0 14 14V66a14 14 0 0 0 0 28V114a14 14 0 0 0 0 28V162a14 14 0 0 0 0 28V210a14 14 0 0 0-14 14H190a14 14 0 0 0-28 0H142a14 14 0 0 0-28 0H94a14 14 0 0 0-28 0H46a14 14 0 0 0-14-14V190a14 14 0 0 0 0-28V142a14 14 0 0 0 0-28V94a14 14 0 0 0 0-28V46a14 14 0 0 0 14-14ZM62 62H194V194H62Z'

export const GLOBE_LINES_PATH =
  'M76 128a52 52 0 1 0 104 0a52 52 0 1 0-104 0M107 128a21 52 0 1 0 42 0a21 52 0 1 0-42 0M76 128h104'

// the one filled cell is the country you've been to
export const STAMPED_CELL_PATH = 'M128 76A52 52 0 0 1 180 128H149A21 52 0 0 0 128 76Z'

interface LogoColors {
  frame: string
  globe: string
}

export const buildLogoSvg = ({ frame, globe }: LogoColors): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO_VIEWBOX}"><title>Stamped</title><g transform="${LOGO_TILT}"><path fill="${frame}" fill-rule="evenodd" d="${STAMP_PATH}"/><path fill="${globe}" d="${STAMPED_CELL_PATH}"/><path fill="none" stroke="${globe}" stroke-width="${GLOBE_LINE_WIDTH}" stroke-linecap="round" d="${GLOBE_LINES_PATH}"/></g></svg>`

// escapes only what breaks a data url, so the icon stays about half the size of full encoding
const encodeForDataUrl = (svg: string): string =>
  svg.replaceAll('"', "'").replace(/[<>#%]/g, encodeURIComponent)

export const buildLogoDataUrl = (colors: LogoColors): string =>
  `data:image/svg+xml,${encodeForDataUrl(buildLogoSvg(colors))}`
