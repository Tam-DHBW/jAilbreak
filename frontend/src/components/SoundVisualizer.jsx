import { useState, useEffect } from 'react'

export default function SoundVisualizer({ isPlaying = false }) {
  const [bars, setBars] = useState(Array(8).fill(0))

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(8).fill(0))
      return
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.floor(Math.random() * 8) + 1))
    }, 200)

    return () => clearInterval(interval)
  }, [isPlaying])

  const getBarChar = (height) => {
    const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
    return chars[height - 1] || '▁'
  }

  return (
    <div className="sound-visualizer">
      <span className="visualizer-label">♪ </span>
      {bars.map((height, index) => (
        <span key={index} className="visualizer-bar">
          {getBarChar(height)}
        </span>
      ))}
    </div>
  )
}