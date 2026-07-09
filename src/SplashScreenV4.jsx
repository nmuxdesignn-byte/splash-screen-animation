import { motion, AnimatePresence } from 'framer-motion'
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

// Phase 0: gray bg, avatar floats in                         hold 800ms
// Phase 1: leaves spring open (bouncy), text fades up        hold 1400ms
// Phase 2: cards fly from bottom to grid (no stop),
//          intro simultaneously exits off the top            hold 1000ms
// Phase 3: bg→white, header slides in, bottom row up        hold 800ms
// Phase 4: toast (final)
const PHASE_HOLD = [800, 1400, 1000, 800]

const SPRING = { type: 'spring', stiffness: 85, damping: 20, mass: 1 }
const EASE   = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }

// Underdamped — leaves overshoot past 0° (outward) then spring back inward
const LEAF_SPRING = { type: 'spring', stiffness: 180, damping: 7, mass: 1 }

// Cards: slightly underdamped for a natural landing feel
const CARD_SPRING = { type: 'spring', stiffness: 95, damping: 16, mass: 1 }

const INTRO_W  = 342
const INTRO_H  = 224
const INTRO_X  = (W - INTRO_W) / 2   // 469 — centers the block
const INTRO_Y0 = (H - INTRO_H) / 2   // 368 — centered in canvas

const CARD_Y_GRID = 112
const GRID_X      = [13, 435, 857]
const TOP_IMGS    = [IMG.photoLeft, IMG.photoMid, IMG.photoRight]
const BOT_ITEMS   = [
  { x: 13,  src: IMG.promoCard,     border: false },
  { x: 435, src: IMG.photoBotMid,   border: true  },
  { x: 857, src: IMG.photoBotRight, border: true  },
]

// ── Leaf wreath ───────────────────────────────────────────────────────────────
function Wreath({ size = 80, showLeaves = false }) {
  const s      = size / 80
  const cW     = 46 * s, cH = 81.778 * s
  const iW     = 41.148 * s, iH = 96.503 * s
  const totalW = 152 * s

  return (
    <div style={{ position: 'relative', width: totalW, height: cH }}>
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, width: cW, height: cH, transformOrigin: 'right center' }}
        initial={{ rotate: -38, opacity: 0 }}
        animate={showLeaves ? { rotate: 0, opacity: 1 } : { rotate: -38, opacity: 0 }}
        transition={LEAF_SPRING}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.leftLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>

      <div style={{
        position: 'absolute', left: 36 * s, top: 1.778 * s,
        width: size, height: size,
        borderRadius: '50%',
        border: '1px solid #e0e1e1',
        overflow: 'hidden',
      }}>
        <img src={IMG.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <motion.div
        style={{
          position: 'absolute', left: 106 * s, top: 0,
          width: cW, height: cH,
          transformOrigin: 'left center',
        }}
        initial={{ rotate: 38, opacity: 0 }}
        animate={showLeaves ? { rotate: 0, opacity: 1 } : { rotate: 38, opacity: 0 }}
        transition={{ ...LEAF_SPRING, delay: showLeaves ? 0.04 : 0 }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.rightLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>
    </div>
  )
}

// ── Watermark + heart overlays ────────────────────────────────────────────────
function CardOverlays({ show = false, delay = 0 }) {
  return (
    <>
      <motion.div
        animate={{ opacity: show ? 0.7 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: show ? delay : 0 }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMG.watermark})`,
          backgroundSize: 'cover', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ opacity: show ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: show ? delay + 0.1 : 0 }}
        style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
      >
        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
      </motion.div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
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

  const showWreath = phase >= 1
  const showText   = phase >= 1
  const showIntro  = phase <= 1   // exits when cards enter in phase 2
  const showCards  = phase >= 2
  const showBottom = phase >= 3
  const showToast  = phase >= 4

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'white', overflow: 'hidden',
    }}>
      <div
        style={{
          width: W, height: H,
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: phase >= 3 ? '#ffffff' : '#f7f7f8',
          transition: 'background 0.6s ease-in-out',
          flexShrink: 0,
        }}
      >

        {/* ── Intro: avatar + wreath + name ───────────────────────────── */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ x: INTRO_X, y: INTRO_Y0 + 24, opacity: 0, scale: 0.95 }}
              animate={{ x: INTRO_X, y: INTRO_Y0, opacity: 1, scale: 1 }}
              exit={{
                y: -380,
                opacity: 0,
                transition: { duration: 0.55, ease: [0.4, 0, 1, 1] },
              }}
              transition={EASE}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: INTRO_W,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 32,
                zIndex: 2,
              }}
            >
              <Wreath size={100} showLeaves={showWreath} />

              {/* Text fades up after the leaves have started swinging in */}
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
          )}
        </AnimatePresence>

        {/* ── Top row photo cards — mount in phase 2, fly straight to grid ── */}
        {showCards && GRID_X.map((x, i) => (
          <motion.div
            key={`top-${x}`}
            initial={{ x, y: H + 100, width: 410, height: 410, opacity: 0, borderRadius: 12 }}
            animate={{ x, y: CARD_Y_GRID, width: 410, height: 410, opacity: 1, borderRadius: 12 }}
            transition={{ ...CARD_SPRING, delay: i * 0.09 }}
            style={{
              position: 'absolute', top: 0, left: 0,
              overflow: 'hidden',
              outline: '1px solid #e0e1e1',
              willChange: 'transform',
            }}
          >
            <img src={TOP_IMGS[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <CardOverlays show={showBottom} delay={i * 0.08} />
          </motion.div>
        ))}

        {/* ── Header + bottom row (phase 3+) ──────────────────────────── */}
        <AnimatePresence>
          {showBottom && (
            <motion.div
              key="ui-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              {/* Header slides down from above */}
              <motion.div
                initial={{ y: -64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...EASE, delay: 0.05 }}
                style={{
                  position: 'absolute', left: 24, top: 24,
                  width: 1232, height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  pointerEvents: 'auto',
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

              {/* Bottom row slides up */}
              {BOT_ITEMS.map(({ x, src, border }, i) => (
                <motion.div
                  key={x}
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.08 + i * 0.08 }}
                  style={{
                    position: 'absolute', left: x, top: 534,
                    width: 410, height: 410, borderRadius: 12,
                    overflow: 'hidden',
                    outline: border ? '1px solid #e0e1e1' : 'none',
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {border && (
                    <>
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${IMG.watermark})`,
                        backgroundSize: 'cover', opacity: 0.7,
                      }} />
                      <div style={{
                        position: 'absolute', top: 12, right: 12,
                        width: 24, height: 24, borderRadius: 4, overflow: 'hidden',
                      }}>
                        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toast (phase 4) ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              key="toast"
              initial={{ y: 60, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              transition={{ ...SPRING, stiffness: 90, damping: 18 }}
              style={{
                position: 'absolute', left: '50%', bottom: 16,
                width: 356, height: 48,
                background: 'white', border: '1.5px solid #e0e1e1', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
                pointerEvents: 'auto', zIndex: 10,
              }}
            >
              <img src={IMG.favIcon} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span style={{ fontFamily: 'GreedStandard', fontSize: 14, color: '#000409', lineHeight: '16px' }}>
                Pick your favourites. Pay once to make them yours.
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
