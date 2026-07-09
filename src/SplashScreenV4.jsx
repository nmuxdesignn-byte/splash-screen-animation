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

// Phase 0: avatar fades in centered (white bg)               hold 900ms
// Phase 1: name fades up + leaves breathe                    hold 1000ms
// Phase 2: ALL 6 images enter from below simultaneously,
//          intro shrinks to stamp at top — hold here         hold 1800ms
// Phase 3: all 6 images shift up to final grid,
//          header slides in, intro exits off top             hold 800ms
// Phase 4: toast (final)
const PHASE_HOLD = [900, 1000, 1800, 800]

const SPRING      = { type: 'spring', stiffness: 85,  damping: 20, mass: 1 }
const EASE        = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }
const CARD_SPRING = { type: 'spring', stiffness: 55,  damping: 24, mass: 3 }

// Intro block
const INTRO_W  = 342
const INTRO_H  = 224
const INTRO_X  = (W - INTRO_W) / 2   // 469 — horizontally centered
const INTRO_Y0 = (H - INTRO_H) / 2   // 368 — vertically centered

// Phase 2 stamp: scale+position matches Figma node 2963:5151
// visual top ≈ 103px, visual bottom ≈ 288px (just above top row cards at y=272)
const INTRO_SCALE2 = 0.826
const INTRO_Y2     = 84

// Phase 2 card positions (Figma mid frame — top row fully visible, bottom row peeking)
const MID_TOP_Y   = 272
const MID_BOT_Y   = 696

// Phase 3 final grid positions (Figma landing frame 2963:5203)
const CARD_Y_GRID = 112
const BOT_Y_GRID  = 534

const GRID_X   = [13, 435, 857]
const TOP_IMGS = [IMG.photoLeft, IMG.photoMid, IMG.photoRight]
const BOT_ITEMS = [
  { x: 13,  src: IMG.promoCard,     border: false },
  { x: 435, src: IMG.photoBotMid,   border: true  },
  { x: 857, src: IMG.photoBotRight, border: true  },
]

// ── Leaf wreath ───────────────────────────────────────────────────────────────
function Wreath({ size = 80, breathe = false }) {
  const s      = size / 80
  const cW     = 46 * s,     cH = 81.778 * s
  const iW     = 41.148 * s, iH = 96.503 * s
  const totalW = 152 * s

  const leftAnim  = breathe ? { rotate: [0, 10, 0] }  : { rotate: 0 }
  const rightAnim = breathe ? { rotate: [0, -10, 0] } : { rotate: 0 }
  const breatheTr = breathe
    ? { duration: 0.8, times: [0, 0.38, 1] }
    : { duration: 0.25 }

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
        width: size, height: size,
        borderRadius: '50%',
        border: '1px solid #e0e1e1',
        overflow: 'hidden',
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

  const breathe    = phase === 1
  const showText   = phase >= 1
  const showIntro  = phase <= 2
  const showCards  = phase >= 2
  const isGrid     = phase >= 3
  const showHeader = phase >= 3
  const showToast  = phase >= 4

  const introScale = isGrid ? INTRO_SCALE2 : (phase >= 2 ? INTRO_SCALE2 : 1)
  const introY     = phase >= 2 ? INTRO_Y2 : INTRO_Y0

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

        {/* ── Intro: avatar + wreath + name ───────────────────────────── */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ x: INTRO_X, y: INTRO_Y0 + 24, opacity: 0, scale: 0.95 }}
              animate={{ x: INTRO_X, y: introY, scale: introScale, opacity: 1 }}
              exit={{
                y: -380,
                opacity: 0,
                transition: { duration: 0.7, ease: [0.4, 0, 1, 1] },
              }}
              transition={phase >= 2 ? SPRING : EASE}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: INTRO_W,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 32,
                zIndex: 2,
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
          )}
        </AnimatePresence>

        {/* ── Top row — enter phase 2 at y=272, shift to y=112 in phase 3 ── */}
        {showCards && GRID_X.map((x, i) => (
          <motion.div
            key={`top-${x}`}
            initial={{ x, y: H + 100, width: 410, height: 410, opacity: 0, borderRadius: 12 }}
            animate={{
              x, y: isGrid ? CARD_Y_GRID : MID_TOP_Y,
              width: 410, height: 410, opacity: 1, borderRadius: 12,
            }}
            transition={isGrid ? SPRING : CARD_SPRING}
            style={{
              position: 'absolute', top: 0, left: 0,
              overflow: 'hidden',
              outline: '1px solid #e0e1e1',
              willChange: 'transform',
            }}
          >
            <img src={TOP_IMGS[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* watermark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${IMG.watermark})`,
                backgroundSize: 'cover', pointerEvents: 'none',
              }}
            />
            {/* heart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
              style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
            >
              <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
            </motion.div>
          </motion.div>
        ))}

        {/* ── Bottom row — enter phase 2 at y=696 (peeking), shift to y=534 in phase 3 ── */}
        {showCards && BOT_ITEMS.map(({ x, src, border }, i) => (
          <motion.div
            key={`bot-${x}`}
            initial={{ x, y: H + 100, width: 410, height: 410, opacity: 0, borderRadius: 12 }}
            animate={{
              x, y: isGrid ? BOT_Y_GRID : MID_BOT_Y,
              width: 410, height: 410, opacity: 1, borderRadius: 12,
            }}
            transition={isGrid ? SPRING : CARD_SPRING}
            style={{
              position: 'absolute', top: 0, left: 0,
              overflow: 'hidden',
              outline: border ? '1px solid #e0e1e1' : 'none',
              willChange: 'transform',
            }}
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {border && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${IMG.watermark})`,
                    backgroundSize: 'cover', pointerEvents: 'none',
                  }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.2 }}
                  style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
                >
                  <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
                </motion.div>
              </>
            )}
          </motion.div>
        ))}

        {/* ── Header (phase 3) ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showHeader && (
            <motion.div
              key="header"
              initial={{ y: -64, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...EASE, delay: 0.1 }}
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
