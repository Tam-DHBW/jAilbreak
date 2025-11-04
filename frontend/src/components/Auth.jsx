import { useState } from 'react'
import { audioManager } from '../audio'
import { setStoredUsername, getStoredUsername } from '../localStorage'
import BootSequence from './BootSequence'

export default function Auth({ onAuthSuccess }) {
  const [name, setName] = useState(getStoredUsername())
  const [error, setError] = useState('')
  const [showBoot, setShowBoot] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    audioManager.playSound('click')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setStoredUsername(name.trim())
    setShowBoot(true)
  }

  const handleBootComplete = () => {
    setTimeout(() => {
      onAuthSuccess()
    }, 500)
  }

  if (showBoot) {
    return <BootSequence onComplete={handleBootComplete} />
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">jAILBREAK</h1>
        <p className="auth-subtitle">ENTER YOUR NAME</p>
        <form onSubmit={handleSubmit}>
          <div className="nes-field" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="nes-input"
              required
              maxLength={50}
            />
          </div>
          <button type="submit" className="nes-btn" style={{ width: '100%' }}>
            START GAME
          </button>
        </form>
        {error && <div className="nes-text is-error" style={{ marginTop: '1rem' }}>ERROR: {error}</div>}
      </div>
    </div>
  )
}