// Resize + compress an uploaded image in the browser so saved wheels stay small.
// 'photo' = JPEG with white background (wheel background). 'alpha' = WebP/PNG keeps transparency (entries, center).
export function readImage(file: File, max: number, kind: 'photo' | 'alpha'): Promise<string> {
  return new Promise((res, rej) => {
    if (!file.type.startsWith('image/')) return rej(new Error('type'));
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d');
      if (!x) return rej(new Error('canvas'));
      if (kind === 'photo') { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); }
      x.drawImage(im, 0, 0, w, h);
      let d = kind === 'photo' ? c.toDataURL('image/jpeg', 0.82) : c.toDataURL('image/webp', 0.85);
      if (kind === 'alpha' && !d.startsWith('data:image/webp')) d = c.toDataURL('image/png');
      res(d);
    };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('read')); };
    im.src = url;
  });
}
