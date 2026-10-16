"""Draws the extension icons (dark rounded tile, green ring, yellow bolt) as PNGs.
No dependencies: rasterizes with 4x4 supersampling and writes PNG with zlib.
Usage: python3 scripts/make-extension-icons.py extension/icons
"""
import struct, sys, zlib

def png(path, size, px):
    raw = b''.join(b'\x00' + bytes(px[y * size * 4:(y + 1) * size * 4]) for y in range(size))
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

def inside_poly(x, y, pts):
    c = False
    for i in range(len(pts)):
        (x1, y1), (x2, y2) = pts[i], pts[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

BOLT = [(0.56, 0.18), (0.32, 0.54), (0.48, 0.54), (0.42, 0.82), (0.68, 0.44), (0.52, 0.44), (0.58, 0.18)]

def color(u, v):
    # rounded-square tile
    r = 0.22
    dx = max(abs(u - 0.5) - (0.5 - r), 0); dy = max(abs(v - 0.5) - (0.5 - r), 0)
    if dx * dx + dy * dy > r * r: return None
    d = ((u - 0.5) ** 2 + (v - 0.5) ** 2) ** 0.5
    if inside_poly(u, v, BOLT): return (242, 193, 78)
    if 0.30 < d < 0.36: return (127, 214, 127)
    return (28, 28, 30)

for size in (16, 32, 48, 128):
    px = []
    for y in range(size):
        for x in range(size):
            acc = [0, 0, 0, 0]; n = 4
            for sy in range(n):
                for sx in range(n):
                    c = color((x + (sx + .5) / n) / size, (y + (sy + .5) / n) / size)
                    if c: acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            a = acc[3] / (n * n)
            k = acc[3] / 255 or 1
            px += [round(acc[0] / k), round(acc[1] / k), round(acc[2] / k), round(a)]
    png(f'{sys.argv[1]}/icon{size}.png', size, px)
print('ok')
