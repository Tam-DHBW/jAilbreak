import { useState, useEffect } from 'react'

export default function ProgressBar({ progress = 0, label = 'Loading' }) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        if (prev >= progress) return progress
        return prev + 2
      })
    }, 50)

    return () => clearInterval(timer)
  }, [progress])

  const barLength = 30
  const filled = Math.floor((displayProgress / 100) * barLength)
  const empty = barLength - filled

  return (
    <div className="ascii-progress">
      <div className="progress-label">{label}</div>
      <div className="progress-bar">
        [{'█'.repeat(filled)}{'░'.repeat(empty)}] {displayProgress}%
      </div>
    </div>
  )
}