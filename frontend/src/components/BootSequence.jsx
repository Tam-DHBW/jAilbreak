import { useState, useEffect } from 'react'
import ProgressBar from './ProgressBar'

export default function BootSequence({ onComplete }) {
  const [currentLine, setCurrentLine] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [progress, setProgress] = useState(0)

  const bootLines = [
    'INITIALIZING JAILBREAK SYSTEM...',
    'LOADING SECURITY PROTOCOLS...',
    'ESTABLISHING ENCRYPTED CONNECTION...',
    'MOUNTING VIRTUAL FILESYSTEM...',
    'STARTING AI GATEKEEPER...',
    'SYSTEM READY. WELCOME TO JAILBREAK.',
    ''
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLine(prev => {
        if (prev >= bootLines.length - 1) {
          setProgress(100)
          setTimeout(onComplete, 1000)
          return prev
        }
        const newLine = prev + 1
        setProgress(Math.floor((newLine / bootLines.length) * 100))
        return newLine
      })
    }, 800)

    return () => clearInterval(timer)
  }, [onComplete])

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)

    return () => clearInterval(cursorTimer)
  }, [])

  return (
    <div className="boot-sequence">
      <div className="boot-content">
        {bootLines.slice(0, currentLine + 1).map((line, index) => (
          <div key={index} className="boot-line">
            {line}
            {index === currentLine && showCursor && <span className="boot-cursor">█</span>}
          </div>
        ))}
        <ProgressBar progress={progress} label="System Initialization" />
      </div>
    </div>
  )
}