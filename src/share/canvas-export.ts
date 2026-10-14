export const createExportCanvas = (width: number, height: number): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  return context
}

export const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('could not encode the image'))),
      'image/png'
    )
  })
