import { useState, useEffect } from 'react'
import SplashScreenV1 from './SplashScreenV1'
import SplashScreenV2 from './SplashScreenV2'
import SplashScreenV3 from './SplashScreenV3'
import SplashScreenV4 from './SplashScreenV4'
import SplashScreenMobileV4 from './SplashScreenMobileV4'

const VERSIONS = ['v1', 'v2', 'v3', 'v4']

export default function SplashScreen() {
  const [version, setVersion] = useState('v4')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Mobile always gets the mobile V4 animation
  if (isMobile) return <SplashScreenMobileV4 key="mobile-v4" />

  return (
    <>
      {version === 'v1' && <SplashScreenV1 key="v1" />}
      {version === 'v2' && <SplashScreenV2 key="v2" />}
      {version === 'v3' && <SplashScreenV3 key="v3" />}
      {version === 'v4' && <SplashScreenV4 key="v4" />}

      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'white', border: '1px solid #e0e1e1',
        borderRadius: 10, padding: '5px 6px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)', zIndex: 9999,
      }}>
        {VERSIONS.map(v => (
          <button
            key={v}
            onClick={() => setVersion(v)}
            style={{
              padding: '4px 14px', borderRadius: 6, border: 'none',
              background: version === v ? '#000409' : 'transparent',
              color: version === v ? 'white' : '#000409',
              fontFamily: 'GreedStandard', fontWeight: 450,
              fontSize: 13, letterSpacing: -0.2, lineHeight: '22px',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </>
  )
}
