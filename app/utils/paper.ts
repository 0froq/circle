export function paperTile(dark: boolean): HTMLCanvasElement {
  const tile = 160
  const spec = document.createElement('canvas')
  spec.width = tile
  spec.height = tile
  const grain = spec.getContext('2d')
  if (!grain)
    return spec

  const image = grain.createImageData(tile, tile)
  const pixels = image.data
  const ink = dark ? [242, 240, 234] : [26, 25, 23]
  for (let i = 0; i < pixels.length; i += 4) {
    const n = Math.random()
    const speck = n > 0.965 || n < 0.035
    pixels[i] = ink[0]!
    pixels[i + 1] = ink[1]!
    pixels[i + 2] = ink[2]!
    pixels[i + 3] = speck ? (dark ? 8 : 22) : 0
  }
  grain.putImageData(image, 0, 0)
  return spec
}
