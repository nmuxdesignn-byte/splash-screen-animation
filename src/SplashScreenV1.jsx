import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const IMG = {
  clover:       'https://www.figma.com/api/mcp/asset/2dd4e729-aebd-44a0-a660-6607c66fcca1',
  avatar:       '/p6.png',
  photoRightLg: '/p1.png',
  photoLeft:    '/p1.png',
  photoMid:     '/p2.png',
  photoRight:   '/p3.png',
  photoBotMid:  '/p4.png',
  photoBotRight:'/p5.png',
  promoCard:    '/banner.png',
  favIcon:      'https://www.figma.com/api/mcp/asset/42fded6c-21c7-4cab-9772-453aa93c590e',
  watermark:    'https://www.figma.com/api/mcp/asset/e65ec655-96a0-4d56-bd37-8909d54e9878',
  heart:        'https://www.figma.com/api/mcp/asset/b417c120-f7be-4718-a8a3-e2a66cbdef6d',
}

const W = 1280
const H = 960

const PHASE_HOLD = [1300, 1100, 950, 850, 800, 700, 900]

const SPRING    = { type: 'spring', stiffness: 85, damping: 20, mass: 1 }
const EASE      = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }
const EASE_SLOW = { duration: 0.8,  ease: [0.25, 0.1, 0.25, 1] }

const LAYOUTS = {
  right: [
    null, null,
    [625, 171, 599, 618],
    [856, 171, 368, 618],
    [856, 171, 368, 368],
    [857, 112, 410, 410],
    [857, 112, 410, 410],
    [857, 112, 410, 410],
  ],
  mid: [
    null, null, null,
    [456, 171, 368, 618],
    [456, 171, 368, 618],
    [435, 112, 410, 410],
    [435, 112, 410, 410],
    [435, 112, 410, 410],
  ],
  left: [
    null, null, null,
    [56, 171, 368, 618],
    [56, 421, 368, 368],
    [13, 112, 410, 410],
    [13, 112, 410, 410],
    [13, 112, 410, 410],
  ],
}

const LEAF_SPRING = { type: 'spring', stiffness: 220, damping: 11, mass: 1 }

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

function PersistentCard({ id, img, phase, entryFrom, delay = 0 }) {
  const pos = LAYOUTS[id][phase]
  if (!pos) return null
  const [x, y, w, h] = pos
  const inGrid = phase >= 5

  return (
    <motion.div
      initial={{ ...entryFrom, opacity: 0 }}
      animate={{ x, y, width: w, height: h, opacity: 1, borderRadius: inGrid ? 12 : 16 }}
      transition={{ ...SPRING, delay }}
      style={{
        position: 'absolute', top: 0, left: 0,
        overflow: 'hidden',
        outline: inGrid ? '1px solid #e0e1e1' : 'none',
        willChange: 'transform, width, height',
      }}
    >
      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <motion.div
        animate={{ opacity: inGrid ? 0.7 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMG.watermark})`,
          backgroundSize: 'cover',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ opacity: inGrid ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: inGrid ? 0.1 : 0 }}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 24, height: 24, borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
      </motion.div>
    </motion.div>
  )
}

export default function SplashScreenV1() {
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

  const showIntro     = phase <= 2
  const avatarX       = phase <= 1 ? 469 : 164
  const avatarY       = 378
  const showWreath    = phase >= 1
  const showBottomRow = phase >= 6
  const showToast     = phase >= 7

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
        background: 'white',
        flexShrink: 0,
      }}>

        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ x: 469, y: 408, opacity: 0, scale: 0.88 }}
              animate={{ x: avatarX, y: avatarY, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: avatarY - 32, transition: { duration: 0.2, ease: 'easeIn' } }}
              transition={EASE_SLOW}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: 342,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 40,
              }}
            >
              <Wreath size={80} showLeaves={showWreath} />
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

        {phase >= 2 && (
          <PersistentCard
            id="right"
            img={phase === 2 ? IMG.photoRightLg : IMG.photoRight}
            phase={phase}
            entryFrom={{ x: W + 80, y: 171, width: 599, height: 618 }}
          />
        )}

        {phase >= 3 && (
          <PersistentCard
            id="mid"
            img={IMG.photoMid}
            phase={phase}
            entryFrom={{ x: -370, y: 171, width: 368, height: 618 }}
            delay={0.25}
          />
        )}

        {phase >= 3 && (
          <PersistentCard
            id="left"
            img={IMG.photoLeft}
            phase={phase}
            entryFrom={{ x: -370, y: 171, width: 368, height: 618 }}
            delay={0.45}
          />
        )}

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
                { src: IMG.promoCard,    left: 13,  delay: 0.12, border: false },
                { src: IMG.photoBotMid,  left: 435, delay: 0.2,  border: true  },
                { src: IMG.photoBotRight,left: 857, delay: 0.28, border: true  },
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
