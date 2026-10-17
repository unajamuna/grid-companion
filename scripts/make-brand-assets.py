"""Builds icons and the header logo from the originals in brand/.
Usage: python3 scripts/make-brand-assets.py   (needs Pillow)
"""
from PIL import Image

def trimmed(path):
    im = Image.open(path).convert('RGBA')
    return im.crop(im.getchannel('A').getbbox())

def square(im, pad=0.08, bg=None):
    side = round(max(im.size) * (1 + 2 * pad))
    out = Image.new('RGBA', (side, side), bg or (0, 0, 0, 0))
    out.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    return out

leaf = trimmed('brand/leaf-original.png')
word = trimmed('brand/wordmark-original.png')

# Browser tab icons: transparent, small margin.
icon = square(leaf, pad=0.04)
for size, name in [(32, 'public/favicon-32.png'), (192, 'public/icon-192.png'), (512, 'public/icon-512.png')]:
    icon.resize((size, size), Image.LANCZOS).save(name, optimize=True)
# iPhone home screen: iOS fills transparency with black, so use a cream tile.
square(leaf, pad=0.18, bg=(246, 241, 231, 255)).resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png', optimize=True)
# Header wordmark at 2x for sharp screens (shown about 32 px tall).
h = 96
word.resize((round(word.width * h / word.height), h), Image.LANCZOS).save('public/logo-grid.png', optimize=True)
# Chrome extension icons.
for size in (16, 32, 48, 128):
    icon.resize((size, size), Image.LANCZOS).save(f'extension/icons/icon{size}.png', optimize=True)
print('ok')
