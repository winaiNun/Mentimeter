/**
 * 3D PWA Icon Generator — Mentimeter Clone
 * Renders a Saturn-style purple planet with 3D Phong shading,
 * squircle (iOS-style) transparent corners, for all PWA device sizes.
 * Uses only Node.js built-ins (no external deps).
 */
import { deflateRawSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
mkdirSync(publicDir, { recursive: true })

// ── Math helpers ─────────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t
const sat  = v => Math.max(0, Math.min(1, v))
const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
function norm3(v) {
  const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])
  return [v[0]/l, v[1]/l, v[2]/l]
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function pngChunk(type, data) {
  const lb = Buffer.alloc(4); lb.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const cb = Buffer.alloc(4); cb.writeUInt32BE(crc32(td))
  return Buffer.concat([lb, td, cb])
}
function encodePng(width, height, rgba) {
  const rowBytes = 1 + width * 4
  const raw = Buffer.alloc(height * rowBytes)
  for (let y = 0; y < height; y++) {
    raw[y * rowBytes] = 0
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4
      const di = y * rowBytes + 1 + x * 4
      raw[di]=rgba[si]; raw[di+1]=rgba[si+1]; raw[di+2]=rgba[si+2]; raw[di+3]=rgba[si+3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8]=8; ihdr[9]=6
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateRawSync(raw, { level: 8 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

// ── Icon renderer ─────────────────────────────────────────────────────────────
function renderIcon(size, { maskable = false } = {}) {
  const cx = size / 2, cy = size / 2
  const sqR  = size * 0.46   // squircle radius (slightly inset from edge)
  const pR   = size * 0.29   // planet radius
  const sqN  = 4             // squircle exponent

  // Ring geometry (Saturn-style, 25° tilt toward viewer)
  const TILT   = 25 * Math.PI / 180
  const cosT   = Math.cos(TILT)
  const sinT   = Math.sin(TILT)
  const rInner = pR * 1.28
  const rOuter = pR * 1.88

  // Lighting
  const LIGHT = norm3([-0.55, -0.75, 0.60])
  const HALF  = norm3([LIGHT[0], LIGHT[1], LIGHT[2] + 1]) // halfway to viewer (0,0,1)

  // Float framebuffer RGBA [0..1]
  const fb = new Float32Array(size * size * 4)

  function composite(x, y, r, g, b, a) {
    const ix = Math.round(x), iy = Math.round(y)
    if (ix < 0 || ix >= size || iy < 0 || iy >= size) return
    const i = (iy * size + ix) * 4
    const sa = sat(a), da = fb[i+3]
    const oa = sa + da * (1 - sa)
    if (oa < 1e-8) return
    fb[i]   = (sat(r)*sa + fb[i]  *da*(1-sa)) / oa
    fb[i+1] = (sat(g)*sa + fb[i+1]*da*(1-sa)) / oa
    fb[i+2] = (sat(b)*sa + fb[i+2]*da*(1-sa)) / oa
    fb[i+3] = oa
  }

  // Squircle alpha (soft edge)
  function sqAlpha(dx, dy) {
    if (maskable) return 1.0  // maskable = full square
    const v = Math.pow(Math.abs(dx/sqR), sqN) + Math.pow(Math.abs(dy/sqR), sqN)
    if (v <= 0.88) return 1.0
    if (v >= 1.08) return 0.0
    return sat((1.08 - v) / 0.20)
  }

  // ── Pass 1: Deep space background ──────────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const a = sqAlpha(dx, dy)
      if (a <= 0) continue
      const d = Math.sqrt(dx*dx+dy*dy) / sqR
      // Deep space — near black with slight purple
      composite(x, y, lerp(0.068, 0.018, d), lerp(0.020, 0.006, d), lerp(0.155, 0.055, d), a)
    }
  }

  // ── Pass 2: Deterministic star field ───────────────────────────────────────
  const nStars = Math.max(6, Math.round(size * size * 0.00006))
  for (let s = 0; s < nStars; s++) {
    let seed = (s * 2654435761 + 0x9e3779b9) >>> 0
    const sxf = cx + (((seed = (seed * 1664525 + 1013904223) >>> 0) & 0xffff) / 0xffff - 0.5) * sqR * 1.8
    const syf = cy + (((seed = (seed * 1664525 + 1013904223) >>> 0) & 0xffff) / 0xffff - 0.5) * sqR * 1.8
    const sdx = sxf - cx, sdy = syf - cy
    if (Math.pow(Math.abs(sdx/sqR), sqN) + Math.pow(Math.abs(sdy/sqR), sqN) > 0.85) continue
    if (Math.sqrt(sdx*sdx+sdy*sdy) < pR * 1.7) continue
    const br = 0.25 + (seed & 0xff) / 255 * 0.55
    composite(sxf, syf, br, br * 0.93, 1, br * 0.55)
  }

  // ── Pass 3: Planet atmospheric glow ────────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      if (sqAlpha(dx, dy) <= 0) continue
      const d = Math.sqrt(dx*dx+dy*dy)
      if (d > pR * 2.6) continue
      const t = 1 - d / (pR * 2.6)
      composite(x, y, 0.52, 0.12, 0.95, t * t * 0.14)
    }
  }

  // ── Ring renderer (front=false → back half, front=true → front half) ───────
  function renderRing(front) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy
        if (sqAlpha(dx, dy) <= 0) continue

        // Unproject y to ring plane
        const ry = dy / cosT
        const ringDist = Math.sqrt(dx*dx + ry*ry)
        if (ringDist < rInner - 2.5 || ringDist > rOuter + 2.5) continue

        // dy > 0 = bottom = front (ring comes toward viewer from below)
        const isFront = dy >= 0
        if (isFront !== front) continue

        // Back half: occlude pixels inside planet
        if (!front && Math.sqrt(dx*dx+dy*dy) < pR - 0.5) continue

        // Smooth ring coverage
        const innerCov = sat((ringDist - rInner) / 2.5)
        const outerCov = sat((rOuter - ringDist) / 2.5)
        const cov = innerCov * outerCov
        if (cov <= 0) continue

        // Gradient along ring (inner bright → outer darker)
        const t = (ringDist - rInner) / (rOuter - rInner)

        // Ring brightness: front is lit, back is shadowed
        const lit = front ? 1.0 : 0.48
        // Slight shading along the ring (simulate ring self-shadow on back)
        const angularLit = front ? 1.0 : lerp(0.65, 0.35, sat(Math.abs(dx) / pR))

        const r = lerp(0.82, 0.36, t) * lit * angularLit
        const g = lerp(0.50, 0.12, t) * lit * angularLit
        const b = lerp(1.00, 0.64, t) * lit * angularLit
        const a = lerp(0.90, 0.58, t) * cov

        composite(x, y, r, g, b, a)
      }
    }
  }

  // ── Pass 4: Ring back half ──────────────────────────────────────────────────
  renderRing(false)

  // ── Pass 5: Planet sphere (3D Phong) ───────────────────────────────────────
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      if (sqAlpha(dx, dy) <= 0) continue

      const dist = Math.sqrt(dx*dx+dy*dy)
      if (dist > pR + 1.5) continue

      // Smooth sphere edge
      const cov = sat(pR + 0.8 - dist)
      if (cov <= 0) continue

      if (dist < 0.01) { composite(x, y, 0.35, 0.05, 0.75, cov); continue }

      // Surface normal
      const t = dist / pR
      if (t >= 1) continue
      const nx = dx / pR, ny = dy / pR
      const nz = Math.sqrt(sat(1 - nx*nx - ny*ny))
      const N = [nx, ny, nz]

      // Diffuse (Lambert)
      const diff = sat(dot3(N, LIGHT))

      // Specular (Blinn-Phong, sharp)
      const spec = Math.pow(sat(dot3(N, HALF)), 42)

      // Rim light (soft purple outline)
      const rim = Math.pow(1 - nz, 3.5) * 0.45

      // Fresnel-style edge darkening at grazing angle
      const fresnel = 1 - nz

      // Color channels: vivid purple planet
      const ambR = 0.18, ambG = 0.04, ambB = 0.55
      const diffR = 0.62, diffG = 0.14, diffB = 0.98

      let r = ambR * 0.25 + diffR * diff * 0.85
      let g = ambG * 0.25 + diffG * diff * 0.85
      let b = ambB * 0.25 + diffB * diff * 0.85

      // Specular highlight (warm white-violet)
      r = r + spec * 0.92
      g = g + spec * 0.80
      b = b + spec * 1.00

      // Rim (deep purple/magenta edge)
      r = r + rim * 0.65
      g = g + rim * 0.05
      b = b + rim * 0.88

      composite(x, y, r, g, b, cov)
    }
  }

  // ── Pass 6: Ring front half ─────────────────────────────────────────────────
  renderRing(true)

  // ── Pass 7: Tiny specular reflection dot ───────────────────────────────────
  // Bright glint at specular highlight location (adds realism)
  {
    const gx = cx + LIGHT[0] * pR * (-0.38)
    const gy = cy + LIGHT[1] * pR * (-0.42)
    const gr = pR * (size > 100 ? 0.06 : 0.09)
    for (let y = Math.floor(gy-gr*2); y <= Math.ceil(gy+gr*2); y++) {
      for (let x = Math.floor(gx-gr*2); x <= Math.ceil(gx+gr*2); x++) {
        const dx = x - gx, dy = y - gy
        const d = Math.sqrt(dx*dx+dy*dy)
        if (d > gr * 2) continue
        const a = sat(1 - d / (gr * 2)) * 0.55
        composite(x, y, 0.98, 0.92, 1.0, a * a)
      }
    }
  }

  // ── Serialize to Uint8ClampedArray ─────────────────────────────────────────
  const pixels = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    pixels[i*4]   = Math.round(sat(fb[i*4])   * 255)
    pixels[i*4+1] = Math.round(sat(fb[i*4+1]) * 255)
    pixels[i*4+2] = Math.round(sat(fb[i*4+2]) * 255)
    pixels[i*4+3] = Math.round(sat(fb[i*4+3]) * 255)
  }
  return pixels
}

// ── Generate all icon sizes ───────────────────────────────────────────────────
const SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512]

for (const size of SIZES) {
  const pixels = renderIcon(size)
  const dest = join(publicDir, `icon-${size}.png`)
  writeFileSync(dest, encodePng(size, size, pixels))
  process.stdout.write(`✓ icon-${size}.png\n`)
}

// Apple touch icon (180, full square background for iOS)
{
  const pixels = renderIcon(180, { maskable: true })
  // Fill transparent pixels with dark background for iOS
  for (let i = 0; i < 180 * 180; i++) {
    if (pixels[i*4+3] < 255) {
      const a = pixels[i*4+3] / 255
      pixels[i*4]   = Math.round(pixels[i*4]   * a + 10 * (1-a))
      pixels[i*4+1] = Math.round(pixels[i*4+1] * a + 3  * (1-a))
      pixels[i*4+2] = Math.round(pixels[i*4+2] * a + 28 * (1-a))
      pixels[i*4+3] = 255
    }
  }
  writeFileSync(join(publicDir, 'apple-touch-icon.png'), encodePng(180, 180, pixels))
  process.stdout.write(`✓ apple-touch-icon.png\n`)
}

// Maskable icons (512 with full background, safe zone = center 80%)
{
  const pixels = renderIcon(512, { maskable: true })
  for (let i = 0; i < 512*512; i++) {
    if (pixels[i*4+3] < 255) {
      const a = pixels[i*4+3] / 255
      const dist = Math.sqrt(((i%512)-256)**2 + (Math.floor(i/512)-256)**2) / 256
      const bgR = Math.round(lerp(0.068,0.018,dist)*255)
      const bgG = Math.round(lerp(0.020,0.006,dist)*255)
      const bgB = Math.round(lerp(0.155,0.055,dist)*255)
      pixels[i*4]   = Math.round(pixels[i*4]   * a + bgR*(1-a))
      pixels[i*4+1] = Math.round(pixels[i*4+1] * a + bgG*(1-a))
      pixels[i*4+2] = Math.round(pixels[i*4+2] * a + bgB*(1-a))
      pixels[i*4+3] = 255
    }
  }
  writeFileSync(join(publicDir, 'icon-512-maskable.png'), encodePng(512, 512, pixels))
  process.stdout.write(`✓ icon-512-maskable.png\n`)
}

const lerp2 = (a, b, t) => a + (b-a)*t
process.stdout.write(`\n🎨 All PWA icons generated in public/\n`)
