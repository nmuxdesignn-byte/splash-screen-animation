import { motion, useMotionValue, animate } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

const IMG = {
  leftLeaf:    '/left-leaf.png',
  rightLeaf:   '/right-leaf.png',
  avatar:      '/p6.png',
  mainPhoto:   '/p1.png',
  promoCard:   '/banner.png',
  heart:       '/heart.svg',
  heartFilled: '/heart-filled.svg',
  watermark:   '/watermark.png',
}

const MW = 390
const MH = 844

// Phase 0: full-screen photo fades in           auto 900ms
// Phase 1: hold photo visible                   auto 1000ms
// Phase 2: photo fades, profile appears at top, tray rises  auto 1500ms
// Phase 3: scroll/touch-driven — tray slides up, profile sinks
// Phase 4: header + toast
const PHASE_HOLD = [900, 1000, 1500, null]

const EASE        = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }
const SPRING      = { type: 'spring', stiffness: 85,  damping: 20, mass: 1 }
const TRAY_SPRING = { type: 'spring', stiffness: 55,  damping: 22, mass: 2 }
const FOLLOW      = { type: 'spring', stiffness: 260, damping: 36, mass: 0.5 }

const PROFILE_Y    = 28    // profile top when at rest
const PROFILE_H    = 152   // wreath (74px) + gap (14px) + text (64px)
const CARD_W       = MW - 20
const CARD_H       = 370
const PROMO_H      = 148
const Y_INTER      = PROFILE_Y + PROFILE_H + 24   // 204 — tray top at scroll start
const CARD_Y_FINAL = 60                            // tray final y (below header)
const SCROLL_TOTAL = 450

function Wreath({ size = 72 }) {
  const s      = size / 80
  const cW     = 46 * s,     cH = 81.778 * s
  const iW     = 41.148 * s, iH = 96.503 * s
  const totalW = 152 * s

  return (
    <div style={{ position: 'relative', width: totalW, height: cH }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: cW, height: cH }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.leftLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 36 * s, top: 1.778 * s,
        width: size, height: size, borderRadius: '50%',
        border: '1px solid #e0e1e1', overflow: 'hidden',
      }}>
        <img src={IMG.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ position: 'absolute', left: 106 * s, top: 0, width: cW, height: cH }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: iW, height: iH }}>
          <img src={IMG.rightLeaf} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}

export default function SplashScreenMobileV4() {
  const [phase, setPhase] = useState(0)
  const [scale, setScale] = useState(1)

  const photoOp   = useMotionValue(0)
  const profileY  = useMotionValue(PROFILE_Y)
  const profileOp = useMotionValue(0)
  const trayY     = useMotionValue(MH)

  const scrollAccum = useRef(0)
  const touchStartY = useRef(0)

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / MW, window.innerHeight / MH))
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

  // Phase 0: photo fades in
  useEffect(() => {
    animate(photoOp, 1, { duration: 0.7, ease: 'easeOut' })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 2: photo fades, profile appears, tray rises
  useEffect(() => {
    if (phase !== 2) return
    animate(photoOp,   0, EASE)
    animate(profileOp, 1, { duration: 0.5, ease: 'easeOut', delay: 0.35 })
    animate(trayY, Y_INTER, TRAY_SPRING)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 3: scroll + touch driven
  useEffect(() => {
    if (phase !== 3) return
    scrollAccum.current = 0

    const update = (rawDelta) => {
      const delta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 80)
      scrollAccum.current = Math.max(0, Math.min(SCROLL_TOTAL, scrollAccum.current + delta))
      const t = scrollAccum.current / SCROLL_TOTAL
      animate(trayY,    Y_INTER - t * (Y_INTER - CARD_Y_FINAL), FOLLOW)
      animate(profileY, PROFILE_Y + t * 120, FOLLOW)
      if (scrollAccum.current >= SCROLL_TOTAL) setPhase(4)
    }

    const onWheel = (e) => update(e.deltaY)

    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      const dy = touchStartY.current - e.touches[0].clientY
      touchStartY.current = e.touches[0].clientY
      update(dy * 1.6)  // amplify touch slightly for responsiveness
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

  // Phase 4: finalize
  useEffect(() => {
    if (phase !== 4) return
    animate(trayY, CARD_Y_FINAL, TRAY_SPRING)
    animate(profileOp, 0, { duration: 0.15 })
    profileY.set(MH + 100)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const showHeader = phase >= 4
  const showToast  = phase >= 4

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

        {/* ── Full-screen photo intro (phases 0–1) ──────────────────────── */}
        <motion.div style={{ position: 'absolute', inset: 0, opacity: photoOp }}>
          <img
            src={IMG.mainPhoto}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Dark gradient for text readability */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,4,9,0.78) 100%)',
          }} />
          {/* Welcome text at bottom of photo */}
          <div style={{
            position: 'absolute', bottom: 60, left: 0, right: 0,
            textAlign: 'center', padding: '0 24px', pointerEvents: 'none',
          }}>
            <p style={{
              fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 16,
              color: 'rgba(255,255,255,0.75)', margin: 0,
              letterSpacing: -0.2, lineHeight: '22px',
            }}>Welcome</p>
            <p style={{
              fontFamily: 'GreedStandard', fontSize: 44,
              letterSpacing: -1.32, lineHeight: 1.05,
              color: '#ffffff', margin: 0, marginTop: 4,
            }}>
              <span style={{ fontWeight: 420 }}>Olivia </span>
              <span style={{ fontWeight: 300 }}>Stone</span>
            </p>
          </div>
        </motion.div>

        {/* ── Profile — wreath + text (phases 2+) ──────────────────────── */}
        <motion.div
          style={{
            position: 'absolute', left: 0, right: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            y: profileY, opacity: profileOp,
            zIndex: 0, pointerEvents: 'none',
          }}
        >
          <Wreath size={72} />
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontFamily: 'GreedStandard', fontWeight: 420, fontSize: 14,
              color: '#000409', margin: 0, letterSpacing: -0.2, lineHeight: '20px',
            }}>Welcome</p>
            <p style={{
              fontFamily: 'GreedStandard', fontSize: 38,
              letterSpacing: -1.14, lineHeight: 1.1,
              color: '#000409', margin: 0, marginTop: 2,
            }}>
              <span style={{ fontWeight: 420 }}>Olivia </span>
              <span style={{ fontWeight: 300 }}>Stone</span>
            </p>
          </div>
        </motion.div>

        {/* ── Tray — card + promo + CTA, slides up over profile ─────────── */}
        <motion.div
          style={{
            position: 'absolute', top: 0, left: 0,
            width: MW, height: MH + 800,
            background: '#ffffff',
            zIndex: 1,
            y: trayY,
          }}
        >
          {/* Main photo card */}
          <div style={{
            position: 'absolute', top: 0, left: 10,
            width: CARD_W, height: CARD_H,
            borderRadius: 12, overflow: 'hidden',
            outline: '1px solid #e0e1e1',
          }}>
            <img
              src={IMG.mainPhoto}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${IMG.watermark})`,
              backgroundSize: 'cover', opacity: 0.7, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 12, right: 12,
              width: 24, height: 24, borderRadius: 4, overflow: 'hidden',
            }}>
              <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Promo card */}
          <div style={{
            position: 'absolute', top: CARD_H + 12, left: 10,
            width: CARD_W, height: PROMO_H,
            borderRadius: 12, overflow: 'hidden',
          }}>
            <img
              src={IMG.promoCard}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* CTA button */}
          <div style={{
            position: 'absolute',
            top: CARD_H + PROMO_H + 20,
            left: 24, right: 24,
          }}>
            <button style={{
              width: '100%', height: 54,
              borderRadius: 12, border: 'none',
              background: '#000409', color: 'white',
              fontFamily: 'GreedStandard', fontWeight: 450,
              fontSize: 17, letterSpacing: -0.3,
              cursor: 'pointer',
              boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.25)',
            }}>
              Pay &amp; Remove Watermark
            </button>
          </div>
        </motion.div>

        {/* ── Header ───────────────────────────────────────────────────── */}
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
                width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                border: '0.5px solid #e5e6e6',
                background: 'linear-gradient(167deg, white 15%, #cccdce 167%)',
                padding: 1.5, flexShrink: 0,
              }}>
                <img
                  src={IMG.avatar}
                  alt=""
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <span style={{ fontFamily: 'GreedStandard', fontSize: 20, letterSpacing: -0.6, color: '#000409' }}>
                <span style={{ fontWeight: 420 }}>Olivia </span>
                <span style={{ fontWeight: 300 }}>Stone</span>
              </span>
            </div>
            {/* Hamburger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4.5, cursor: 'pointer', padding: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 20, height: 1.5, background: '#000409', borderRadius: 1 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Toast ────────────────────────────────────────────────────── */}
        {showToast && (
          <motion.div
            initial={{ y: 48, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            transition={{ ...SPRING, delay: 0.9 }}
            style={{
              position: 'absolute', left: '50%', bottom: 20,
              width: 340, height: 44,
              background: 'white', border: '1.5px solid #e0e1e1', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 12px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
              zIndex: 10,
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
