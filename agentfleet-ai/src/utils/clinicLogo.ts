const LOGO_SIZE = 192

export function isClinicLogoImage(value?: string | null) {
  if (!value) return false
  return value.startsWith('data:image/') || /^https?:\/\//.test(value) || (value.startsWith('/') && !value.startsWith('//'))
}

export function compressClinicLogo(file: File) {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Choose a PNG, JPG, or WebP image.'))
  if (file.size > 4 * 1024 * 1024) return Promise.reject(new Error('Logo must be under 4 MB.'))
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read that image.'))
    reader.onload = () => {
      const image = new window.Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = LOGO_SIZE
        canvas.height = LOGO_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Unable to process that image.'))
          return
        }
        const scale = Math.min(LOGO_SIZE / Math.max(image.width, 1), LOGO_SIZE / Math.max(image.height, 1))
        const width = image.width * scale
        const height = image.height * scale
        ctx.clearRect(0, 0, LOGO_SIZE, LOGO_SIZE)
        ctx.drawImage(image, (LOGO_SIZE - width) / 2, (LOGO_SIZE - height) / 2, width, height)
        const keepAlpha = /png|webp|svg/i.test(file.type)
        resolve(canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', 0.86))
      }
      image.onerror = () => reject(new Error('That file is not a valid image.'))
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
