import { useState } from 'react'
import { signUp, signIn, confirmSignUp, signOut } from 'aws-amplify/auth'
import { audioManager } from '../audio'
import BootSequence from './BootSequence'

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [error, setError] = useState('')
  const [showBoot, setShowBoot] = useState(false)
  const [loginProgress, setLoginProgress] = useState(0)



  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    audioManager.playSound('click')

    try {
      if (needsConfirmation) {
        await confirmSignUp({ username: email, confirmationCode })
        setNeedsConfirmation(false)
        setIsLogin(true)
      } else if (isLogin) {
        setLoginProgress(25)
        await signIn({ username: email, password })
        setLoginProgress(75)
        setShowBoot(true)
      } else {
        await signUp({ 
          username: email, 
          password,
          options: {
            userAttributes: {
              name: name
            }
          }
        })
        setNeedsConfirmation(true)
      }
    } catch (err) {
      if (err.message.includes('already a signed in user')) {
        // Clear the session and reset form
        try {
          await signOut()
          setError('')
          setEmail('')
          setPassword('')
          setName('')
        } catch (signOutErr) {
          setError('Please clear your browser data: Settings > Privacy > Clear browsing data')
        }
      } else {
        setError(err.message)
      }
    }
  }

  const handleBootComplete = () => {
    setLoginProgress(100)
    setTimeout(() => {
      onAuthSuccess()
    }, 500)
  }

  if (showBoot) {
    return <BootSequence onComplete={handleBootComplete} />
  }

  if (needsConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">jAILBREAK</h1>
          <p className="auth-subtitle">ENTER CODE</p>
          <form onSubmit={handleSubmit}>
            <div className="nes-field" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Enter confirmation code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="nes-input"
                required
              />
            </div>
            <button type="submit" className="nes-btn" style={{ width: '100%' }}>
              CONFIRM
            </button>
          </form>
          {error && <div className="nes-text is-error" style={{ marginTop: '1rem' }}>ERROR: {error}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">jAILBREAK</h1>
        <p className="auth-subtitle">
          {isLogin ? 'ENTER PASSWORD' : 'CREATE NEW USER'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="nes-field" style={{ marginBottom: '1rem' }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="nes-input"
              required
            />
          </div>
          {!isLogin && (
            <div className="nes-field" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="nes-input"
                required
              />
            </div>
          )}
          <div className="nes-field" style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="nes-input"
              required
            />
          </div>
          <button type="submit" className="nes-btn" style={{ width: '100%', marginBottom: '1rem' }}>
            {isLogin ? 'START GAME' : 'CREATE USER'}
          </button>
        </form>
        <button 
          onClick={() => {
            audioManager.playSound('click')
            setIsLogin(!isLogin)
          }}
          className="nes-btn"
          style={{ width: '100%' }}
        >
          {isLogin ? 'NEW USER?' : 'LOGIN'}
        </button>
        {error && <div className="nes-text is-error" style={{ marginTop: '1rem' }}>ERROR: {error}</div>}
      </div>
    </div>
  )
}