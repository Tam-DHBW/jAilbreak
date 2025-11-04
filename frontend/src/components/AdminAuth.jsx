import { useAuth } from 'react-oidc-context'
import { audioManager } from '../audio'

export default function AdminAuth() {
  const auth = useAuth()

  const handleSignIn = () => {
    audioManager.playSound('click')
    auth.signinRedirect()
  }

  if (auth.isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">ADMIN ACCESS</h1>
          <p className="auth-subtitle">AUTHENTICATING...</p>
        </div>
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">ADMIN ACCESS</h1>
          <p className="auth-subtitle">AUTHENTICATION ERROR</p>
          <div className="nes-text is-error">ERROR: {auth.error.message}</div>
          <button onClick={handleSignIn} className="nes-btn" style={{ width: '100%', marginTop: '1rem' }}>
            TRY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">ADMIN ACCESS</h1>
        <p className="auth-subtitle">AUTHORIZED PERSONNEL ONLY</p>
        <button onClick={handleSignIn} className="nes-btn" style={{ width: '100%' }}>
          SIGN IN WITH COGNITO
        </button>
      </div>
    </div>
  )
}