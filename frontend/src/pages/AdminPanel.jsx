import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { audioManager } from '../audio'
import AdminAuth from '../components/AdminAuth'

function AdminPanel() {
  const auth = useAuth()
  const [levels, setLevels] = useState([])
  const [error, setError] = useState('')
  const nameRef = useRef()
  const passwordRef = useRef()
  const promptRef = useRef()

  useEffect(() => {
    if (auth.isAuthenticated) {
      setLevels([
        { id: 1, name: 'Level 1', password: 'secret123', prompt: 'Basic security prompt' },
        { id: 2, name: 'Level 2', password: 'advanced456', prompt: 'Advanced security prompt' }
      ])
    }
  }, [auth.isAuthenticated])

  const handleSignOut = () => {
    audioManager.playSound('click')
    const clientId = "7bgrd9vmbepbe2pup7tupf18ba"
    const logoutUri = window.location.origin
    const cognitoDomain = "https://jailbreak-moderator-auth.auth.eu-central-1.amazoncognito.com"
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`
  }

  const handleSubmit = (e) => {
    console.log('Form submit triggered')
    e.preventDefault()
    audioManager.playSound('click')
    
    console.log('Refs:', { nameRef: nameRef.current, passwordRef: passwordRef.current, promptRef: promptRef.current })
    
    const name = nameRef.current?.value || ''
    const password = passwordRef.current?.value || ''
    const prompt = promptRef.current?.value || ''

    console.log('Form values:', { name, password, prompt })

    if (!name || !password || !prompt) {
      setError('All fields are required')
      return
    }

    const newLevel = {
      id: Date.now(),
      name,
      password,
      prompt
    }

    setLevels(prev => [...prev, newLevel])
    
    // Clear form
    nameRef.current.value = ''
    passwordRef.current.value = ''
    promptRef.current.value = ''
    setError('')
  }

  const deleteLevel = (id) => {
    audioManager.playSound('click')
    setLevels(prev => prev.filter(level => level.id !== id))
  }

  if (auth.isLoading) {
    return (
      <>
        <div className="scanlines"></div>
        <div className="boot-sequence">
          <div className="boot-content">
            <div className="boot-line">CHECKING ADMIN CREDENTIALS...</div>
          </div>
        </div>
      </>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <>
        <div className="scanlines"></div>
        <AdminAuth />
      </>
    )
  }

  return (
    <>
      <div className="scanlines"></div>
      <div className="page-container">
        <div className="nes-container is-dark" style={{ margin: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>ADMIN PANEL</h1>
            <button onClick={handleSignOut} className="nes-btn is-error">
              Sign Out
            </button>
          </div>

          {error && (
            <div className="nes-container is-error" style={{ marginBottom: '2rem' }}>
              <p>ERROR: {error}</p>
              <button onClick={() => setError('')} className="nes-btn">Clear</button>
            </div>
          )}

          <div style={{ marginBottom: '3rem' }}>
            <h2>Create New Level</h2>
            <form onSubmit={handleSubmit}>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Level Name:</label>
                <input
                  ref={nameRef}
                  type="text"
                  className="nes-input"
                  placeholder="Enter level name"
                  onInput={(e) => console.log('Name input:', e.target.value)}
                />
              </div>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Level Password:</label>
                <input
                  ref={passwordRef}
                  type="text"
                  className="nes-input"
                  placeholder="Enter level password"
                />
              </div>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>AI Prompt:</label>
                <textarea
                  ref={promptRef}
                  className="nes-textarea"
                  rows="4"
                  placeholder="Enter AI prompt"
                />
              </div>
              <button type="submit" className="nes-btn is-primary">
                Create Level
              </button>
            </form>
          </div>

          <div>
            <h2>Existing Levels ({levels.length})</h2>
            <div className="nes-table-responsive">
              <table className="nes-table is-bordered is-dark">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Password</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map(level => (
                    <tr key={level.id}>
                      <td>{level.id}</td>
                      <td>{level.name}</td>
                      <td>{level.password}</td>
                      <td>
                        <button 
                          onClick={() => deleteLevel(level.id)}
                          className="nes-btn is-error"
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminPanel