"""Builds icons and the header logo from the originals in brand/
(green, white and black versions of the leaf and the GRID wordmark).
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

leaf = trimmed('brand/leaf-green.png')
word_white = trimmed('brand/wordmark-white.png')

# Browser tab icons: transparent, small margin.
icon = square(leaf, pad=0.04)
for size, name in [(32, 'public/favicon-32.png'), (192, 'public/icon-192.png'), (512, 'public/icon-512.png')]:
    icon.resize((size, size), Image.LANCZOS).save(name, optimize=True)
# iPhone home screen: iOS fills transparency with black, so use a cream tile.
square(leaf, pad=0.18, bg=(246, 241, 231, 255)).resize((180, 180), Image.LANCZOS).save('public/apple-touch-icon.png', optimize=True)
# Header wordmark (white version), at 3x for sharp screens (shown about 22 px tall).
h = 66
word_white.resize((round(word_white.width * h / word_white.height), h), Image.LANCZOS).save('public/logo-grid-white.png', optimize=True)
# Chrome extension icons.
for size in (16, 32, 48, 128):
    icon.resize((size, size), Image.LANCZOS).save(f'extension/icons/icon{size}.png', optimize=True)

# Chrome Web Store icon: 96 px of artwork centred on a 128 px transparent square.
art = leaf.resize((round(leaf.width * 96 / max(leaf.size)), round(leaf.height * 96 / max(leaf.size))), Image.LANCZOS)
tile = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
tile.alpha_composite(art, ((128 - art.width) // 2, (128 - art.height) // 2))
tile.save('store/images/store-icon-128.png', optimize=True)
print('ok')
