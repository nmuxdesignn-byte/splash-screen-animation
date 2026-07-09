import { useState } from 'react'
import SplashScreenV1 from './SplashScreenV1'
import SplashScreenV2 from './SplashScreenV2'
import SplashScreenV3 from './SplashScreenV3'
import SplashScreenV4 from './SplashScreenV4'

const VERSIONS = ['v1', 'v2', 'v3', 'v4']

export default function SplashScreen() {
  const [version, setVersion] = useState('v1')

  return (
    <>
      {version === 'v1' && <SplashScreenV1 key="v1" />}
      {version === 'v2' && <SplashScreenV2 key="v2" />}
      {version === 'v3' && <SplashScreenV3 key="v3" />}
      {version === 'v4' && <SplashScreenV4 key="v4" />}

      {/* Version switcher floater — fixed to viewport, outside canvas scaling */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        background: 'white',
        border: '1px solid #e0e1e1',
        borderRadius: 10,
        padding: '5px 6px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
        zIndex: 9999,
      }}>
        {VERSIONS.map(v => {
          const isDisabled = false
          const isActive   = version === v
          return (
            <button
              key={v}
              disabled={isDisabled}
              onClick={() => !isDisabled && setVersion(v)}
              style={{
                padding: '4px 14px',
                borderRadius: 6,
                border: 'none',
                background: isActive ? '#000409' : 'transparent',
                color: isDisabled ? '#c8c9ca' : isActive ? 'white' : '#000409',
                fontFamily: 'GreedStandard',
                fontWeight: 450,
                fontSize: 13,
                letterSpacing: -0.2,
                lineHeight: '22px',
                cursor: isDisabled ? 'default' : 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {v}
            </button>
          )
        })}
      </div>
    </>
  )
}
