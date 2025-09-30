import { useState } from 'react'
import { signUp, signIn, confirmSignUp } from 'aws-amplify/auth'
import { audioManager } from '../audio'

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmationCode, setConfirmationCode] = useState('')
  const [error, setError] = useState('')

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
        await signIn({ username: email, password })
        onAuthSuccess()
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
      setError(err.message)
    }
  }

  if (needsConfirmation) {
    return (
      <>
        <div className="scanlines"></div>
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">jAILBREAK</h1>
            <p className="auth-subtitle">ENTER CODE</p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter confirmation code"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="form-input"
              required
            />
            <button type="submit" className="btn-primary">
              CONFIRM
            </button>
          </form>
          {error && <div className="error-message">ERROR: {error}</div>}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="scanlines"></div>
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">jAILBREAK</h1>
          <p className="auth-subtitle">
            {isLogin ? 'ENTER PASSWORD' : 'CREATE NEW USER'}
          </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
          <button type="submit" className="btn-primary">
            {isLogin ? 'START GAME' : 'CREATE USER'}
          </button>
        </form>
        <button 
          onClick={() => {
            audioManager.playSound('click')
            setIsLogin(!isLogin)
          }}
          className="btn-secondary"
        >
          {isLogin ? 'NEW USER?' : 'LOGIN'}
        </button>
        {error && <div className="error-message">ERROR: {error}</div>}
        </div>
      </div>
    </>
  )
}