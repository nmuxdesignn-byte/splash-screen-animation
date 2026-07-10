import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

const IMG = {
  leftLeaf:     '/left-leaf.png',
  rightLeaf:    '/right-leaf.png',
  avatar:       '/p6.png',
  photo1:       '/p1.png',
  photo2:       '/p2.png',
  mobileBanner: '/mobile-banner.png',
  heart:        '/heart.svg',
  heartFilled:  '/heart-filled.svg',
  watermark:    '/watermark.png',
}

const MW = 390
const MH = 844

// Phase 0: full-screen photo fades in             auto 900ms
// Phase 1: photo shrinks + morphs to circle       auto 1200ms
// Phase 2: leaves spring out+back, crossfade      auto 1000ms
// Phase 3: intro to top + tray rises              auto 1500ms
// Phase 4: scroll/touch driven layer-over-layer
// Phase 5: header + toast
const PHASE_HOLD = [900, 1200, 1000, 1500, null]

const EASE        = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }
const SPRING      = { type: 'spring', stiffness: 85,  damping: 20, mass: 1 }
const TRAY_SPRING = { type: 'spring', stiffness: 55,  damping: 22, mass: 2 }
const FOLLOW      = { type: 'spring', stiffness: 260, damping: 36, mass: 0.5 }
const LEAF_SPRING = { type: 'spring', stiffness: 220, damping: 11, mass: 1 }

const AVATAR_SIZE  = 100
const S            = AVATAR_SIZE / 80             // 1.25
const WREATH_W     = 152 * S                      // 190
const WREATH_H     = 81.778 * S                   // ~102.2
const AVATAR_OFF_X = 36 * S                       // 45
const AVATAR_OFF_Y = 1.778 * S                    // ~2.22

// Y of the intro container so the avatar sits exactly at canvas vertical center
const INTRO_CENTER_Y  = MH / 2 - AVATAR_SIZE / 2 - AVATAR_OFF_Y  // ~370

// Where the shrinking photo lands — matches the avatar inside Wreath when centered
const PHOTO_TARGET_X  = (MW - WREATH_W) / 2 + AVATAR_OFF_X       // 145
const PHOTO_TARGET_Y  = INTRO_CENTER_Y + AVATAR_OFF_Y             // ~372

const PROFILE_FULL_H = WREATH_H + 16 + 70        // wreath + gap + text ≈ 188
const INTRO_TOP_Y    = 28                         // profile y when moved to top
const Y_INTER        = INTRO_TOP_Y + PROFILE_FULL_H + 24  // tray start y ≈ 240
const CARD_Y_FINAL   = 60                         // tray final y (below header)

const CARD_W        = MW - 20                     // 370
const CARD_H        = 370
const BANNER_H      = 140
const CARD_GAP      = 12
const CTA_H         = 78
const SCROLL_TOTAL  = 450

const TRAY_CARD1_Y  = 0
const TRAY_BANNER_Y = CARD_H + CARD_GAP               // 382
const TRAY_CARD2_Y  = TRAY_BANNER_Y + BANNER_H + CARD_GAP  // 534

// ── Leaf wreath with spring-in animation ──────────────────────────────────────
function Wreath({ size = 100, showLeaves = false }) {
  const s  = size / 80
  const cW = 46 * s,     cH = 81.778 * s
  const iW = 41.148 * s, iH = 96.503 * s

  return (
    <div style={{ position: 'relative', width: 152 * s, height: cH }}>
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
        width: size, height: size, borderRadius: '50%',
        border: '1px solid #e0e1e1', overflow: 'hidden',
      }}>
        <img src={IMG.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <motion.div
        style={{ position: 'absolute', left: 106 * s, top: 0, width: cW, height: cH, transformOrigin: 'left center' }}
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

// ── Watermarked photo card ─────────────────────────────────────────────────────
function PhotoCard({ src, style }) {
  return (
    <div style={{
      position: 'absolute', left: 10,
      width: CARD_W, height: CARD_H,
      borderRadius: 12, overflow: 'hidden',
      outline: '1px solid #e0e1e1',
      ...style,
    }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${IMG.watermark})`,
        backgroundSize: 'cover', opacity: 0.7, pointerEvents: 'none',
      }} />
      <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}>
        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SplashScreenMobileV4() {
  const [phase, setPhase] = useState(0)
  const [scale, setScale] = useState(1)
  const [showLeaves, setShowLeaves] = useState(false)

  // Photo motion values — drives the shrink-to-circle animation
  const photoOp = useMotionValue(0)
  const photoW  = useMotionValue(MW)
  const photoH  = useMotionValue(MH)
  const photoX  = useMotionValue(0)
  const photoY  = useMotionValue(0)
  const photoBR = useMotionValue(0)

  // Intro (wreath + name) motion values
  const introY  = useMotionValue(INTRO_CENTER_Y)
  const introOp = useMotionValue(0)

  // Tray
  const trayY = useMotionValue(MH)

  const scrollAccum = useRef(0)
  const touchStartY = useRef(0)

  // Viewport scale
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / MW, window.innerHeight / MH))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Phase auto-advance
  useEffect(() => {
    const hold = PHASE_HOLD[phase]
    if (hold == null) return
    const t = setTimeout(() => setPhase(p => p + 1), hold)
    return () => clearTimeout(t)
  }, [phase])

  // Phase 0 (mount): photo fades in full-screen
  useEffect(() => {
    animate(photoOp, 1, { duration: 0.7, ease: 'easeOut' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 1: photo shrinks + morphs into circular avatar
  useEffect(() => {
    if (phase !== 1) return
    // Instant border-radius lock → progressively becomes a circle as size decreases
    photoBR.set(AVATAR_SIZE / 2)
    animate(photoW, AVATAR_SIZE, SPRING)
    animate(photoH, AVATAR_SIZE, SPRING)
    animate(photoX, PHOTO_TARGET_X, SPRING)
    animate(photoY, PHOTO_TARGET_Y, SPRING)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 2: leaves spring out+back, crossfade photo→wreath
  useEffect(() => {
    if (phase !== 2) return
    setShowLeaves(true)
    animate(photoOp, 0, { duration: 0.4, ease: 'easeOut' })
    animate(introOp, 1, { duration: 0.4, ease: 'easeOut' })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 3: intro moves to top, tray rises from below
  useEffect(() => {
    if (phase !== 3) return
    animate(introY, INTRO_TOP_Y, TRAY_SPRING)
    animate(trayY,  Y_INTER,     TRAY_SPRING)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 4: scroll/touch driven — tray rises, intro sinks (layer-over-layer)
  useEffect(() => {
    if (phase !== 4) return
    scrollAccum.current = 0

    const update = (rawDelta) => {
      const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 80)
      scrollAccum.current = Math.max(0, Math.min(SCROLL_TOTAL, scrollAccum.current + delta))
      const t = scrollAccum.current / SCROLL_TOTAL
      animate(trayY,  Y_INTER - t * (Y_INTER - CARD_Y_FINAL), FOLLOW)
      animate(introY, INTRO_TOP_Y + t * 120, FOLLOW)
      if (scrollAccum.current >= SCROLL_TOTAL) setPhase(5)
    }

    const onWheel      = (e) => update(e.deltaY)
    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      const dy = touchStartY.current - e.touches[0].clientY
      touchStartY.current = e.touches[0].clientY
      update(dy * 1.6)
    }

    window.addEventListener('wheel',      onWheel,      { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: true })
    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 5: snap final positions, reveal header + toast
  useEffect(() => {
    if (phase !== 5) return
    animate(trayY,  CARD_Y_FINAL, TRAY_SPRING)
    animate(introOp, 0, { duration: 0.15 })
    introY.set(MH + 100)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const showChrome = phase >= 3
  const showHeader = phase >= 5
  const showToast  = phase >= 5

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000409', overflow: 'hidden',
    }}>
      <div style={{
        width: MW, height: MH,
        position: 'relative',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        background: '#ffffff',
        flexShrink: 0,
        overflow: 'hidden',
      }}>

        {/* ── Shrinking photo (phases 0–2) ──────────────────────────────── */}
        <motion.div style={{
          position: 'absolute', left: 0, top: 0,
          x: photoX, y: photoY,
          width: photoW, height: photoH,
          borderRadius: photoBR,
          overflow: 'hidden', opacity: photoOp,
          zIndex: 0,
        }}>
          <img
            src={IMG.photo1} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
          />

          {/* Gradient + welcome text — shown only during phase 0 full-screen state */}
          <AnimatePresence>
            {phase === 0 && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 38%, rgba(0,4,9,0.80) 100%)',
                }} />
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
                  style={{
                    position: 'absolute', bottom: CTA_H + 20, left: 0, right: 0,
                    textAlign: 'center', padding: '0 24px',
                  }}
                >
                  <p style={{
                    fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 16,
                    color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: -0.2, lineHeight: '22px',
                  }}>Welcome</p>
                  <p style={{
                    fontFamily: 'GreedStandard', fontSize: 44,
                    letterSpacing: -1.32, lineHeight: 1.05, color: '#ffffff', margin: 0, marginTop: 4,
                  }}>
                    <span style={{ fontWeight: 420 }}>Olivia </span>
                    <span style={{ fontWeight: 300 }}>Stone</span>
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Intro — wreath + name, motion-value driven ────────────────── */}
        <motion.div style={{
          position: 'absolute', left: 0, right: 0,
          y: introY, opacity: introOp,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          zIndex: 0, pointerEvents: 'none',
        }}>
          <Wreath size={AVATAR_SIZE} showLeaves={showLeaves} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 8 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: phase >= 2 ? 0.3 : 0 }}
            style={{ textAlign: 'center' }}
          >
            <p style={{
              fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 14,
              color: '#000409', margin: 0, letterSpacing: -0.2, lineHeight: '20px',
            }}>Welcome</p>
            <p style={{
              fontFamily: 'GreedStandard', fontSize: 38,
              letterSpacing: -1.14, lineHeight: 1.1, color: '#000409', margin: 0, marginTop: 2,
            }}>
              <span style={{ fontWeight: 420 }}>Olivia </span>
              <span style={{ fontWeight: 300 }}>Stone</span>
            </p>
          </motion.div>
        </motion.div>

        {/* ── Tray — cards + banner, slides up over intro ──────────────── */}
        <motion.div style={{
          position: 'absolute', top: 0, left: 0,
          width: MW, height: MH + 1000,
          background: '#ffffff', zIndex: 1, y: trayY,
        }}>
          <PhotoCard src={IMG.photo1} style={{ top: TRAY_CARD1_Y }} />

          <div style={{
            position: 'absolute', top: TRAY_BANNER_Y, left: 10,
            width: CARD_W, height: BANNER_H,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <img src={IMG.mobileBanner} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <PhotoCard src={IMG.photo2} style={{ top: TRAY_CARD2_Y }} />
        </motion.div>

        {/* ── Hamburger (phases 3–4, replaced by header at phase 5) ────── */}
        {showChrome && !showHeader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', top: 16, right: 24, zIndex: 4, cursor: 'pointer', padding: 4 }}
          >
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 20, height: 1.5, background: '#000409', borderRadius: 1, marginBottom: i < 2 ? 4.5 : 0 }} />
            ))}
          </motion.div>
        )}

        {/* ── Sticky CTA (phases 3–4) ──────────────────────────────────── */}
        {showChrome && !showHeader && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRING, delay: 0.2 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: CTA_H, zIndex: 5, background: 'white',
              borderTop: '1px solid #e0e1e1',
              display: 'flex', alignItems: 'center', padding: '0 24px',
            }}
          >
            <button style={{
              width: '100%', height: 54, borderRadius: 12, border: 'none',
              background: '#000409', color: 'white',
              fontFamily: 'GreedStandard', fontWeight: 450,
              fontSize: 17, letterSpacing: -0.3, cursor: 'pointer',
              boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.25)',
            }}>Pay &amp; Remove Watermark</button>
          </motion.div>
        )}

        {/* ── Header (phase 5) ──────────────────────────────────────────── */}
        {showHeader && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...EASE, delay: 0.3 }}
            style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: 60,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px', background: 'white', zIndex: 3,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '0.5px solid #e5e6e6', overflow: 'hidden',
                background: 'linear-gradient(167deg, white 15%, #cccdce 167%)',
                padding: 1.5, flexShrink: 0,
              }}>
                <img src={IMG.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <span style={{ fontFamily: 'GreedStandard', fontSize: 20, letterSpacing: -0.6, color: '#000409' }}>
                <span style={{ fontWeight: 420 }}>Olivia </span>
                <span style={{ fontWeight: 300 }}>Stone</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4.5, cursor: 'pointer', padding: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 20, height: 1.5, background: '#000409', borderRadius: 1 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Phase 5 sticky CTA (with heart) ──────────────────────────── */}
        {showHeader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: CTA_H, zIndex: 5,
              background: 'white', borderTop: '1px solid #e0e1e1',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '0 24px',
            }}
          >
            <div style={{
              width: 54, height: 54, borderRadius: 12, border: '1.5px solid #e0e1e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <img src={IMG.heartFilled} alt="" style={{ width: 24, height: 24 }} />
            </div>
            <button style={{
              flex: 1, height: 54, borderRadius: 12, border: 'none',
              background: '#000409', color: 'white',
              fontFamily: 'GreedStandard', fontWeight: 450,
              fontSize: 17, letterSpacing: -0.3, cursor: 'pointer',
              boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.25)',
            }}>Pay &amp; Remove Watermark</button>
          </motion.div>
        )}

        {/* ── Toast (phase 5) ───────────────────────────────────────────── */}
        {showToast && (
          <motion.div
            initial={{ y: 48, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            transition={{ ...SPRING, delay: 0.9 }}
            style={{
              position: 'absolute', left: '50%', bottom: CTA_H + 12,
              width: 340, height: 44,
              background: 'white', border: '1.5px solid #e0e1e1', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', zIndex: 10,
            }}
          >
            <img src={IMG.heartFilled} alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />
            <span style={{ fontFamily: 'GreedStandard', fontSize: 13, color: '#000409', lineHeight: '16px' }}>
              Pick your favourites. Pay once to make them yours.
            </span>
          </motion.div>
        )}

      </div>
    </div>
  )
}
