import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const IMG = {
  clover:       '/leaf.png',
  avatar:       '/p6.png',
  photoLeft:    '/p1.png',
  photoMid:     '/p2.png',
  photoRight:   '/p3.png',
  photoBotMid:  '/p4.png',
  photoBotRight:'/p5.png',
  promoCard:    '/banner.png',
  favIcon:      '/fav-icon.png',
  watermark:    '/watermark.png',
  heart:        '/heart.png',
}

const W = 1280
const H = 960

// Phase 0: large card enters (460×460, square)
// Phase 1: card morphs to rounded (338×338, r=80), new photo
// Phase 2: next photo crossfades in card
// Phase 3: next photo crossfades in card
// Phase 4: intro — avatar + wreath + name centered
// Phase 5: three grid cards burst from center
// Phase 6: header + bottom row reveal
// Phase 7: toast (final, no timer)
const PHASE_HOLD = [1200, 900, 700, 700, 1100, 950, 800]

const SPRING     = { type: 'spring', stiffness: 85, damping: 20, mass: 1 }
const EASE_SLOW  = { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }
const LEAF_SPRING = { type: 'spring', stiffness: 220, damping: 11, mass: 1 }

// Card size/radius by phase (phases 0–3)
const CARD_CFG = [
  { w: 460, h: 460, r: 16 },
  { w: 338, h: 338, r: 80 },
  { w: 338, h: 338, r: 80 },
  { w: 338, h: 338, r: 80 },
]

// Photos shown in the cycling card at each phase
const CYCLE_PHOTOS = ['/p3.png', '/p1.png', '/p2.png', '/p3.png']

// Cycling card resting center (phases 1–3 position, used as burst origin for grid cards)
const BURST_X = (W - 338) / 2  // 471
const BURST_Y = (H - 338) / 2  // 311

// Fixed grid positions — cards go directly to grid (no tall-portrait phase)
const GRID_POS = {
  right: [857, 112, 410, 410],
  mid:   [435, 112, 410, 410],
  left:  [13,  112, 410, 410],
}

const GRID_IMGS = {
  right: '/p3.png',
  mid:   '/p2.png',
  left:  '/p1.png',
}

const EASE = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }

// ── Wreath ────────────────────────────────────────────────────────────────────
function Wreath({ size = 80, showLeaves = false }) {
  const s = size / 80
  const cW = 46 * s, cH = 81.778 * s
  const iW = 41.148 * s, iH = 96.503 * s
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
          <img src={IMG.clover} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </motion.div>

      <div style={{
        position: 'absolute', left: 36 * s, top: 1.778 * s,
        width: size, height: size, borderRadius: '50%',
        border: `${1 * s}px solid #e5e6e6`,
        background: 'linear-gradient(167deg, white 15%, #cccdce 167%)',
        padding: 3.75 * s,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <img src={IMG.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
      </div>

      <motion.div
        style={{
          position: 'absolute', left: 106 * s, top: 0, width: cW, height: cH,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transformOrigin: 'left center',
        }}
        initial={{ rotate: 38, opacity: 0 }}
        animate={showLeaves ? { rotate: 0, opacity: 1 } : { rotate: 38, opacity: 0 }}
        transition={{ ...LEAF_SPRING, delay: showLeaves ? 0.04 : 0 }}
      >
        <div style={{ transform: 'scaleY(-1) rotate(180deg)' }}>
          <div style={{ position: 'relative', width: cW, height: cH }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
              <img src={IMG.clover} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Grid card — bursts from cycling-card center to its grid slot ──────────────
function GridCard({ id, delay = 0 }) {
  const [gx, gy, gw, gh] = GRID_POS[id]

  return (
    <motion.div
      initial={{ x: BURST_X, y: BURST_Y, width: 338, height: 338, opacity: 0, borderRadius: 80 }}
      animate={{ x: gx, y: gy, width: gw, height: gh, opacity: 1, borderRadius: 12 }}
      transition={{ ...SPRING, delay }}
      style={{
        position: 'absolute', top: 0, left: 0,
        overflow: 'hidden',
        outline: '1px solid #e0e1e1',
        willChange: 'transform, width, height',
      }}
    >
      <img src={GRID_IMGS[id]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: delay + 0.5, duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMG.watermark})`,
          backgroundSize: 'cover', pointerEvents: 'none',
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.6, duration: 0.35, ease: 'easeOut' }}
        style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
      >
        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
      </motion.div>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SplashScreenV2() {
  const [phase, setPhase] = useState(0)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (phase >= PHASE_HOLD.length) return
    const t = setTimeout(() => setPhase(p => p + 1), PHASE_HOLD[phase])
    return () => clearTimeout(t)
  }, [phase])

  const cfg         = CARD_CFG[Math.min(phase, 3)]
  const cardX       = (W - cfg.w) / 2
  const cardY       = (H - cfg.h) / 2
  const cyclePhoto  = CYCLE_PHOTOS[Math.min(phase, 3)]

  const showCyclingCard = phase <= 3
  const showIntro       = phase === 4
  const showGridCards   = phase >= 5
  const showBottomRow   = phase >= 6
  const showToast       = phase >= 7

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
        background: 'white', flexShrink: 0,
      }}>

        {/* ── Cycling photo card (phases 0–3) ─────────────────────────── */}
        <AnimatePresence>
          {showCyclingCard && (
            <motion.div
              key="cycling-card"
              initial={{ x: (W - CARD_CFG[0].w) / 2, y: (H - CARD_CFG[0].h) / 2, width: CARD_CFG[0].w, height: CARD_CFG[0].h, borderRadius: CARD_CFG[0].r, scale: 0.88, opacity: 0 }}
              animate={{ x: cardX, y: cardY, width: cfg.w, height: cfg.h, borderRadius: cfg.r, scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } }}
              transition={SPRING}
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden' }}
            >
              <AnimatePresence>
                <motion.img
                  key={cyclePhoto}
                  src={cyclePhoto}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Intro: avatar + wreath + name (phase 4 only) ────────────── */}
        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2, ease: 'easeIn' } }}
              transition={{ ...EASE_SLOW, delay: 0.2 }}
              style={{
                position: 'absolute',
                left: (W - 342) / 2,
                top: (H - 210) / 2,
                width: 342,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 40,
              }}
            >
              <Wreath size={80} showLeaves />
              <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                <p style={{ fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 18, letterSpacing: -0.09, lineHeight: '20px', color: '#000' }}>Welcome</p>
                <p style={{ fontFamily: 'GreedStandard', fontSize: 56, letterSpacing: -1.68, lineHeight: 1.1, whiteSpace: 'nowrap', color: '#000', margin: 0 }}>
                  <span style={{ fontWeight: 420 }}>Olivia </span>
                  <span style={{ fontWeight: 300 }}>Stone</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid cards burst from center (phase 5+) ─────────────────── */}
        {showGridCards && <GridCard id="right" delay={0.25} />}
        {showGridCards && <GridCard id="mid"   delay={0.3}  />}
        {showGridCards && <GridCard id="left"  delay={0.35} />}

        {/* ── Header + bottom row (phase 6+) ──────────────────────────── */}
        <AnimatePresence>
          {showBottomRow && (
            <motion.div
              key="ui-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <motion.div
                initial={{ y: -64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...EASE, delay: 0.05 }}
                style={{
                  position: 'absolute', left: 13, top: 24,
                  width: 1254, height: 48,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  pointerEvents: 'auto',
                }}
              >
                <span style={{ fontFamily: 'GreedStandard', fontSize: 44, letterSpacing: -1.32, color: '#000409' }}>
                  <span style={{ fontWeight: 420 }}>Olivia </span>
                  <span style={{ fontWeight: 300 }}>Stone</span>
                </span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: 410 }}>
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
                    padding: 2.25, overflow: 'hidden',
                  }}>
                    <img src={IMG.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                </div>
              </motion.div>

              {[
                { src: IMG.promoCard,     left: 13,  delay: 0.12, border: false },
                { src: IMG.photoBotMid,   left: 435, delay: 0.2,  border: true  },
                { src: IMG.photoBotRight, left: 857, delay: 0.28, border: true  },
              ].map(({ src, left, delay, border }) => (
                <motion.div
                  key={left}
                  initial={{ y: 120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ ...SPRING, delay }}
                  style={{
                    position: 'absolute', left, top: 534,
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

        {/* ── Toast (phase 7, final) ───────────────────────────────────── */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              key="toast"
              initial={{ y: 60, opacity: 0, x: '-50%' }}
              animate={{ y: 0, opacity: 1, x: '-50%' }}
              transition={{ ...SPRING, stiffness: 90, damping: 18 }}
              style={{
                position: 'absolute', left: '50%', bottom: 20,
                width: 380, height: 52,
                background: 'white', border: '1.5px solid #e0e1e1', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
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
