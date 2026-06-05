#!/usr/bin/env python3
"""Generate PWA / Apple touch icons with no third-party deps.

Design: a rounded square in the Spanish-flag colours (red / yellow / red)
with a white speech bubble in the centre and three red "talking" dots.
Renders with 4x supersampling for smooth edges, encodes PNG via stdlib zlib.
"""
import struct, zlib, os

RED = (198, 11, 30)
YELLOW = (255, 196, 0)
WHITE = (255, 255, 255)
SS = 4  # supersampling factor

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")


def rounded_rect_contains(x, y, x0, y0, x1, y1, r):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    # corners
    if x < x0 + r and y < y0 + r:
        return (x - (x0 + r)) ** 2 + (y - (y0 + r)) ** 2 <= r * r
    if x > x1 - r and y < y0 + r:
        return (x - (x1 - r)) ** 2 + (y - (y0 + r)) ** 2 <= r * r
    if x < x0 + r and y > y1 - r:
        return (x - (x0 + r)) ** 2 + (y - (y1 - r)) ** 2 <= r * r
    if x > x1 - r and y > y1 - r:
        return (x - (x1 - r)) ** 2 + (y - (y1 - r)) ** 2 <= r * r
    return True


def point_in_tri(px, py, ax, ay, bx, by, cx, cy):
    d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
    d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
    d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
    neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (neg and pos)


def sample(x, y, S):
    """Return RGB for a point in [0,S) coordinate space, or None if transparent."""
    # Outer rounded square
    margin = S * 0.0
    r_out = S * 0.225
    if not rounded_rect_contains(x, y, margin, margin, S - margin, S - margin, r_out):
        return None
    # Flag bands
    t = y / S
    color = RED if (t < 0.25 or t > 0.75) else YELLOW
    # Speech bubble (white rounded rect)
    bx0, by0 = S * 0.235, S * 0.26
    bx1, by1 = S * 0.765, S * 0.64
    br = S * 0.10
    in_bubble = rounded_rect_contains(x, y, bx0, by0, bx1, by1, br)
    # Bubble tail (triangle pointing down-left)
    in_tail = point_in_tri(
        x, y,
        S * 0.34, by1 - S * 0.01,
        S * 0.50, by1 - S * 0.01,
        S * 0.33, by1 + S * 0.13,
    )
    if in_bubble or in_tail:
        # Three red talking dots
        cy = (by0 + by1) / 2 - S * 0.005
        dr = S * 0.045
        for cx in (S * 0.38, S * 0.50, S * 0.62):
            if (x - cx) ** 2 + (y - cy) ** 2 <= dr * dr:
                return RED
        return WHITE
    return color


def render(S):
    px = bytearray()
    for j in range(S):
        px.append(0)  # PNG filter byte: none
        for i in range(S):
            rsum = gsum = bsum = asum = 0
            for sy in range(SS):
                for sx in range(SS):
                    fx = i + (sx + 0.5) / SS
                    fy = j + (sy + 0.5) / SS
                    c = sample(fx, fy, S)
                    if c is not None:
                        rsum += c[0]; gsum += c[1]; bsum += c[2]; asum += 255
            n = SS * SS
            px += bytes((rsum // n, gsum // n, bsum // n, asum // n))
    return bytes(px)


def write_png(path, S):
    raw = render(S)

    def chunk(typ, data):
        c = struct.pack(">I", len(data)) + typ + data
        crc = zlib.crc32(typ + data) & 0xFFFFFFFF
        return c + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", S, S, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(raw, 9)
    png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path, S, "x", S)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for size, name in [
        (512, "icon-512.png"),
        (192, "icon-192.png"),
        (180, "apple-touch-icon.png"),
        (32, "favicon-32.png"),
    ]:
        write_png(os.path.join(OUT, name), size)
