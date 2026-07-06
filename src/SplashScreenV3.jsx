import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ImageGeneration } from 'img-fx'

const IMG = {
  clover:       'https://www.figma.com/api/mcp/asset/2dd4e729-aebd-44a0-a660-6607c66fcca1',
  avatar:       '/p6.png',
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

// Phase 0: img-fx pixel reveal — 2s hold then triggerReveal(); advances on 'visible' from onCycle
// Phase 1: two cards fan out from behind main card (1200ms)
// Phase 2: all 3 cards fly to grid top row (950ms)
// Phase 3: header + bottom row reveal (800ms)
// Phase 4: toast (final)
const PHASE_HOLD = [null, 1200, 950, 800]  // null = phase 0 driven by img-fx, not timeout

const SPRING     = { type: 'spring', stiffness: 85, damping: 20, mass: 1 }
const EASE       = { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }

// Main card sits centered in the 960px canvas
const MAIN_X = (W - 460) / 2   // 410
const MAIN_Y = (H - 460) / 2   // 250

// Fan positions — cards peek from behind the main card at rotated angles
const FAN_RIGHT = { x: 495, y: 244, rotate: 12.9 }
const FAN_LEFT  = { x: 368, y: 258, rotate: -8.6 }

// Grid top-row slots
const GRID = {
  mid:   { x: 435, y: 112, w: 410, h: 410 },
  right: { x: 857, y: 112, w: 410, h: 410 },
  left:  { x: 13,  y: 112, w: 410, h: 410 },
}

// ── Pixel sparkle loading icon ────────────────────────────────────────────────
const PIXELS = [
  { x: 0,  y: 4,  color: '#ededed' },
  { x: 4,  y: 8,  color: '#d9d9d9' },
  { x: 0,  y: 8,  color: '#cbcbcb' },
  { x: 0,  y: 12, color: '#8c8c8c' },
  { x: 4,  y: 12, color: '#8c8c8c' },
  { x: 8,  y: 12, color: '#d9d9d9' },
  { x: 12, y: 12, color: '#ededed' },
]

function PixelSparkle() {
  return (
    <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
      {PIXELS.map((p, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: p.x, top: p.y,
            width: 4, height: 4,
            background: p.color,
            boxShadow: '0px 4px 2px 0px #737373',
          }}
        />
      ))}
    </div>
  )
}

const LOADING_LABELS = [
  'Applying touches',
  'Making best looks',
  'Imagining you differently',
]

// ── "Applying touches" label ──────────────────────────────────────────────────
function LoadingLabel({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <PixelSparkle />
      {/* Fixed-height clip window for the ticker */}
      <div style={{ position: 'relative', overflow: 'hidden', height: 18, width: 240 }}>
        <AnimatePresence>
          <motion.span
            key={text}
            initial={{ y: 18 }}
            animate={{ y: 0 }}
            exit={{ y: -18 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'absolute', top: 0, left: 0,
              display: 'block',
              fontFamily: 'GreedStandard',
              fontWeight: 450,
              fontSize: 16,
              lineHeight: '18px',
              background: 'linear-gradient(95.74deg, #000409 43.7%, #ffffff 150.44%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Watermark + heart overlays — always in DOM, fade in when in grid ──────────
function CardOverlays({ inGrid, delay = 0 }) {
  return (
    <>
      <motion.div
        animate={{ opacity: inGrid ? 0.7 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: inGrid ? delay : 0 }}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${IMG.watermark})`,
          backgroundSize: 'cover', pointerEvents: 'none',
        }}
      />
      <motion.div
        animate={{ opacity: inGrid ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: inGrid ? delay + 0.1 : 0 }}
        style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
      >
        <img src={IMG.heart} alt="" style={{ width: '100%', height: '100%' }} />
      </motion.div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SplashScreenV3() {
  const [phase, setPhase] = useState(0)
  const [scale, setScale] = useState(1)
  const [labelIndex, setLabelIndex] = useState(0)
  const [showLabel, setShowLabel] = useState(true)
  const imgFxRef = useRef(null)
  const phaseRef = useRef(0)

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H))
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Cycle loading label every 1.1s while in phase 0
  useEffect(() => {
    if (phase !== 0) return
    const t = setInterval(() => setLabelIndex(i => (i + 1) % LOADING_LABELS.length), 1100)
    return () => clearInterval(t)
  }, [phase])

  // Phase 0: fade label + trigger reveal at 2s; advance to phase 1 at 3.5s
  useEffect(() => {
    if (phase !== 0) return
    const tReveal  = setTimeout(() => {
      setShowLabel(false)
      imgFxRef.current?.triggerReveal()
    }, 2000)
    const tAdvance = setTimeout(() => setPhase(p => p === 0 ? 1 : p), 3500)
    return () => { clearTimeout(tReveal); clearTimeout(tAdvance) }
  }, [phase])

  // Phase 1+ auto-advance
  useEffect(() => {
    const hold = PHASE_HOLD[phase]
    if (hold == null) return
    const t = setTimeout(() => setPhase(p => p + 1), hold)
    return () => clearTimeout(t)
  }, [phase])

  // Advance phase 0 → 1 early if img-fx fires 'visible' before the 3.5s fallback
  const handleCycle = useCallback((cyclePhase) => {
    if (cyclePhase === 'visible' && phaseRef.current === 0) setPhase(1)
  }, [])

  const isFan      = phase === 1
  const isGrid     = phase >= 2
  const showBottom = phase >= 3
  const showToast  = phase >= 4

  // ── Main card position/size by phase
  const mainX = isGrid ? GRID.mid.x : MAIN_X
  const mainY = isGrid ? GRID.mid.y : MAIN_Y
  const mainW = isGrid ? 410 : 460
  const mainH = isGrid ? 410 : 460

  // ── Right fan card position/size by phase
  const rightX = isGrid ? GRID.right.x : isFan ? FAN_RIGHT.x : MAIN_X + 26
  const rightY = isGrid ? GRID.right.y : isFan ? FAN_RIGHT.y : MAIN_Y + 26
  const rightW = isGrid ? 410 : 408
  const rightH = isGrid ? 410 : 408
  const rightR = isGrid || !isFan ? 0 : FAN_RIGHT.rotate

  // ── Left fan card position/size by phase
  const leftX = isGrid ? GRID.left.x : isFan ? FAN_LEFT.x : MAIN_X + 26
  const leftY = isGrid ? GRID.left.y : isFan ? FAN_LEFT.y : MAIN_Y + 26
  const leftW = isGrid ? 410 : 408
  const leftH = isGrid ? 410 : 408
  const leftR = isGrid || !isFan ? 0 : FAN_LEFT.rotate

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

        {/* ── Left fan card (renders first = behind) ──────────────────── */}
        <motion.div
          initial={{ x: MAIN_X + 26, y: MAIN_Y + 26, width: 408, height: 408, opacity: 0, rotate: 0, borderRadius: 12 }}
          animate={{ x: leftX, y: leftY, width: leftW, height: leftH, opacity: isFan || isGrid ? 1 : 0, rotate: leftR, borderRadius: 12 }}
          transition={{ ...SPRING, delay: isFan ? 0.05 : 0 }}
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', willChange: 'transform, width, height' }}
        >
          <img src={IMG.photoLeft} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <CardOverlays inGrid={isGrid} delay={0.4} />
        </motion.div>

        {/* ── Right fan card (renders second) ─────────────────────────── */}
        <motion.div
          initial={{ x: MAIN_X + 26, y: MAIN_Y + 26, width: 408, height: 408, opacity: 0, rotate: 0, borderRadius: 12 }}
          animate={{ x: rightX, y: rightY, width: rightW, height: rightH, opacity: isFan || isGrid ? 1 : 0, rotate: rightR, borderRadius: 12 }}
          transition={{ ...SPRING, delay: isFan ? 0 : 0 }}
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', willChange: 'transform, width, height' }}
        >
          <img src={IMG.photoRight} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <CardOverlays inGrid={isGrid} delay={0.3} />
        </motion.div>

        {/* ── Main card (renders last = on top) ───────────────────────── */}
        <motion.div
          initial={{ x: MAIN_X, y: MAIN_Y, width: 460, height: 460, opacity: 0, borderRadius: 24 }}
          animate={{ x: mainX, y: mainY, width: mainW, height: mainH, opacity: 1, borderRadius: isGrid ? 12 : 24 }}
          transition={SPRING}
          style={{
            position: 'absolute', top: 0, left: 0,
            overflow: 'hidden',
            outline: isGrid ? '1px solid #e0e1e1' : 'none',
            willChange: 'transform, width, height',
          }}
        >
          {/* Regular photo — always underneath; visible from phase 1 onward */}
          <img src={IMG.photoMid} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

          {/* img-fx pixel reveal — overlays the photo during phase 0, fades out on exit */}
          <AnimatePresence>
            {phase === 0 && (
              <motion.div
                key="imgfx"
                exit={{ opacity: 0, transition: { duration: 0.25 } }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <ImageGeneration
                  ref={imgFxRef}
                  preset="pixels-organic"
                  strength={1.00}
                  images={[IMG.photoMid]}
                  theme="light"
                  onCycle={handleCycle}
                >
                  <div style={{ width: 460, height: 460, borderRadius: 24 }} />
                </ImageGeneration>
              </motion.div>
            )}
          </AnimatePresence>

          <CardOverlays inGrid={isGrid} delay={0.2} />
        </motion.div>

        {/* ── "APPLYING TOUCHES" loading label (phase 0, hides on reveal) ── */}
        <AnimatePresence>
          {phase === 0 && showLabel && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.4, delay: 0.4 }}
              style={{
                position: 'absolute',
                left: MAIN_X,
                top: MAIN_Y + 460 + 25,
              }}
            >
              <LoadingLabel text={LOADING_LABELS[labelIndex]} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Header + bottom row (phase 3+) ──────────────────────────── */}
        <AnimatePresence>
          {showBottom && (
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

        {/* ── Toast (phase 4, final) ───────────────────────────────────── */}
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
