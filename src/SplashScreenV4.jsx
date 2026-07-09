import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const IMG = {
  leftLeaf:      '/left-leaf.png',
  rightLeaf:     '/right-leaf.png',
  avatar:        '/p6.png',
  photoLeft:     '/p1.png',
  photoMid:      '/p2.png',
  photoRight:    '/p3.png',
  photoBotMid:   '/p4.png',
  photoBotRight: '/p5.png',
  promoCard:     '/banner.png',
  heart:         '/heart.svg',
  watermark:     '/watermark.png',
  favIcon:       '/heart-filled.svg',
}

const W = 1280
const H = 960

// Phase 0: avatar fades in at top               auto 900ms
// Phase 1: name fades up + leaves breathe       auto 1000ms
// Phase 2: tray rises to Y_INTER automatically  auto 1500ms
//          — only first row visible, second row off-screen
//          — profile stays near top (no nudge)
// Phase 3: PAUSED                               scroll trigger
// Phase 4: tray slides to final grid position   (final state)
//          intro covered by opaque tray (no text through gaps)
//          header + toast appear
const PHASE_HOLD = [900, 1000, 1500, null]

const EASE        = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }
const SPRING      = { type: 'spring', stiffness: 85, damping: 20, mass: 1 }
const TRAY_SPRING = { type: 'spring', stiffness: 55, damping: 22, mass: 2 }

const INTRO_W  = 342
const INTRO_H  = 224
const INTRO_X  = (W - INTRO_W) / 2   // 469
const INTRO_Y0 = 120                  // ~120px padding from top

// Y_INTER: tray top in the intermediate state (phase 2–3).
// At y=548: first row at canvas y=548 (fully visible, 2px above bottom),
// second row at y=970 (off-screen — canvas is 960px tall).
const Y_INTER    = 548
const CARD_Y_TOP = 112   // first row final position
const CARD_Y_BOT = 534   // second row final position
const GRID_X     = [13, 435, 857]

// Cards positioned relative to tray top (top = card.y - CARD_Y_TOP)
const ALL_CARDS = [
  { x: GRID_X[0], y: CARD_Y_TOP, src: IMG.photoLeft,     border: true  },
  { x: GRID_X[1], y: CARD_Y_TOP, src: IMG.photoMid,      border: true  },
  { x: GRID_X[2], y: CARD_Y_TOP, src: IMG.photoRight,    border: true  },
  { x: GRID_X[0], y: CARD_Y_BOT, src: IMG.promoCard,     border: false },
  { x: GRID_X[1], y: CARD_Y_BOT, src: IMG.photoBotMid,   border: true  },
  { x: GRID_X[2], y: CARD_Y_BOT, src: IMG.photoBotRight, border: true  },
]

// ── Leaf wreath ────────────────────────────────────────────────────────────────
function Wreath({ size = 80, breathe = false }) {
  const s      = size / 80
  const cW     = 46 * s,     cH = 81.778 * s
  const iW     = 41.148 * s, iH = 96.503 * s
  const totalW = 152 * s

  const leftAnim  = breathe ? { rotate: [0, 10, 0] }  : { rotate: 0 }
  const rightAnim = breathe ? { rotate: [0, -10, 0] } : { rotate: 0 }
  const breatheTr = breathe ? { duration: 0.8, times: [0, 0.38, 1] } : { duration: 0.25 }

  return (
    <div style={{ position: 'relative', width: totalW, height: cH }}>
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, width: cW, height: cH, transformOrigin: 'right center' }}
        initial={{ rotate: 0 }}
        animate={leftAnim}
        transition={breatheTr}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.leftLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>

      <div style={{
        position: 'absolute', left: 36 * s, top: 1.778 * s,
        width: size, height: size, borderRadius: '50%',
        border: '1px solid #e0e1e1', overflow: 'hidden',
      }}>
        <img src={IMG.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <motion.div
        style={{ position: 'absolute', left: 106 * s, top: 0, width: cW, height: cH, transformOrigin: 'left center' }}
        initial={{ rotate: 0 }}
        animate={rightAnim}
        transition={{ ...breatheTr, delay: breathe ? 0.04 : 0 }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.rightLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function SplashScreenV4() {
  const [phase, setPhase] = useState(0)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const hold = PHASE_HOLD[phase]
    if (hold == null) return
    const t = setTimeout(() => setPhase(p => p + 1), hold)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 3 waits for scroll → phase 4
  useEffect(() => {
    if (phase !== 3) return
    const advance = () => setPhase(4)
    window.addEventListener('wheel',     advance, { once: true, passive: true })
    window.addEventListener('touchmove', advance, { once: true, passive: true })
    return () => {
      window.removeEventListener('wheel',     advance)
      window.removeEventListener('touchmove', advance)
    }
  }, [phase])

  const breathe      = phase === 1
  const showText     = phase >= 1
  const showTray     = phase >= 2
  const showHeader   = phase >= 4
  const showToast    = phase >= 4
  const showOverlays = phase >= 4   // watermark + heart appear after final settle

  // Tray target: intermediate position until scroll, then final grid position
  const trayTargetY = phase >= 4 ? CARD_Y_TOP : Y_INTER

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'white', overflow: 'hidden',
    }}>
      <div style={{
        width: W, height: H,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        background: '#ffffff',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* ── Intro — stays in DOM, tray covers it in phase 4 ─────────────── */}
        {/* No zIndex — sits below tray (zIndex:1) naturally */}
        <motion.div
          initial={{ y: INTRO_Y0 + 20, opacity: 0, scale: 0.96 }}
          animate={{ y: INTRO_Y0, scale: 1, opacity: 1 }}
          transition={EASE}
          style={{
            position: 'absolute', top: 0, left: INTRO_X,
            width: INTRO_W,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 32,
          }}
        >
          <Wreath size={100} breathe={breathe} />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 12 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: showText ? 0.2 : 0 }}
            style={{ textAlign: 'center', pointerEvents: 'none' }}
          >
            <p style={{
              fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 22,
              letterSpacing: -0.22, lineHeight: '24px', color: '#000409', margin: 0,
            }}>
              Welcome
            </p>
            <p style={{
              fontFamily: 'GreedStandard', fontSize: 56, letterSpacing: -1.68,
              lineHeight: 1.1, whiteSpace: 'nowrap', color: '#000409', margin: 0, marginTop: 4,
            }}>
              <span style={{ fontWeight: 420 }}>Olivia </span>
              <span style={{ fontWeight: 300 }}>Stone</span>
            </p>
          </motion.div>
        </motion.div>

        {/* ── Tray — single white layer containing both rows ──────────────── */}
        {/* Solid white background prevents any intro text from showing       */}
        {/* through card gutters. Slides from H → Y_INTER → CARD_Y_TOP.      */}
        {showTray && (
          <motion.div
            initial={{ y: H }}
            animate={{ y: trayTargetY }}
            transition={TRAY_SPRING}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: W,
              height: H + 500,   // extends well below canvas
              background: '#ffffff',
              zIndex: 1,
            }}
          >
            {ALL_CARDS.map((card, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top:  card.y - CARD_Y_TOP,  // relative to tray top
                  left: card.x,
                  width: 410, height: 410,
                  borderRadius: 12,
                  overflow: 'hidden',
                  outline: card.border ? '1px solid #e0e1e1' : 'none',
                }}
              >
                <img src={card.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                {/* Overlays appear after final position is reached */}
                {card.border && showOverlays && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
                      style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${IMG.watermark})`,
                        backgroundSize: 'cover', pointerEvents: 'none',
                      }}
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.7 }}
                      style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
                    >
                      <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
                    </motion.div>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Header — slides in as tray reaches final position ───────────── */}
        {showHeader && (
          <motion.div
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...EASE, delay: 0.3 }}
            style={{
              position: 'absolute', left: 13, top: 24,
              width: 1254, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              zIndex: 3,
            }}
          >
            <span style={{ fontFamily: 'GreedStandard', fontSize: 44, letterSpacing: -1.32, color: '#000409' }}>
              <span style={{ fontWeight: 420 }}>Olivia </span>
              <span style={{ fontWeight: 300 }}>Stone</span>
            </span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: 293 }}>
              <button style={{
                flex: 1,
                background: '#000409', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 24px', height: 48,
                fontSize: 16, fontFamily: 'GreedStandard', fontWeight: 450,
                cursor: 'pointer',
                boxShadow: 'inset 0px 2px 2px rgba(255,255,255,0.25)',
              }}>Pay &amp; Remove Watermark</button>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '0.375px solid #e5e6e6',
                background: 'linear-gradient(167deg, white 15%, #cccdce 167%)',
                padding: 2.25, overflow: 'hidden', flexShrink: 0,
              }}>
                <img src={IMG.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Toast ───────────────────────────────────────────────────────── */}
        {showToast && (
          <motion.div
            initial={{ y: 48, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            transition={{ ...SPRING, delay: 0.9 }}
            style={{
              position: 'absolute', left: '50%', bottom: 16,
              width: 356, height: 48,
              background: 'white', border: '1.5px solid #e0e1e1', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              pointerEvents: 'auto', zIndex: 10,
            }}
          >
            <img src={IMG.favIcon} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span style={{ fontFamily: 'GreedStandard', fontSize: 14, color: '#000409', lineHeight: '16px' }}>
              Pick your favourites. Pay once to make them yours.
            </span>
          </motion.div>
        )}

      </div>
    </div>
  )
}
