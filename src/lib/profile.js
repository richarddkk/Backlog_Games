export const MAX_PHOTO_LENGTH = 180000;
export function validateProfile(value) {
  if (typeof value.displayName !== 'string' || value.displayName.trim().length > 60) throw new Error('Use um nome de exibição com até 60 caracteres.');
  if (typeof value.photoData !== 'string' || value.photoData.length > MAX_PHOTO_LENGTH || (value.photoData && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value.photoData))) throw new Error('Escolha uma foto válida pelos controles de upload.');
  return { displayName: value.displayName.trim(), photoData: value.photoData };
}
export async function preparePhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('A imagem pode ter até 5 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Não foi possível abrir esta imagem.')); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 12000 || image.naturalHeight > 12000) throw new Error('Escolha uma imagem com dimensões de até 12.000 pixels.');
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Seu navegador não conseguiu preparar a imagem.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, 256, 256);
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    const result = canvas.toDataURL('image/jpeg', .82);
    validateProfile({ displayName: '', photoData: result });
    return result;
  } finally { URL.revokeObjectURL(url); }
}
