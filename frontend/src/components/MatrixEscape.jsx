import React, { useEffect, useState } from 'react'

const MatrixEscape = ({ isActive, onComplete }) => {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const sequence = [
      () => setPhase(1), // Success message
      () => setPhase(2), // Slow matrix rain
      () => setPhase(3), // Fade out
      () => {
        setPhase(0)
        onComplete()
      }
    ]

    const timeouts = [
      setTimeout(sequence[0], 100),
      setTimeout(sequence[1], 1500),
      setTimeout(sequence[2], 4000),
      setTimeout(sequence[3], 5000)
    ]

    return () => timeouts.forEach(clearTimeout)
  }, [isActive, onComplete])

  if (!isActive) return null

  return (
    <div className={`matrix-escape phase-${phase}`}>
      {phase === 2 && (
        <div className="matrix-rain slow">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="matrix-column slow" style={{ left: `${i * 3.33}%`, animationDelay: `${i * 0.2}s` }}>
              {Array.from({ length: 15 }).map((_, j) => (
                <span key={j} className="matrix-char">
                  {String.fromCharCode(0x30A0 + Math.random() * 96)}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      
      <div className="escape-text">
        {phase === 1 && "ACCESS GRANTED! SECURITY BYPASSED..."}
        {phase === 2 && "ENTERING NEW SECURITY LAYER..."}
      </div>
    </div>
  )
}

export default MatrixEscape