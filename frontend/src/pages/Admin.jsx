import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth'
import { audioManager } from '../audio'

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

const getAuthToken = async () => {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('No auth token available')
  return token
}

const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...options.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

function Admin() {
  const [levels, setLevels] = useState([])
  const [promptComponents, setPromptComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPromptForm, setShowPromptForm] = useState(false)
  const [newLevel, setNewLevel] = useState({ name: '', difficulty: 'Low' })
  const [newPrompt, setNewPrompt] = useState({ text: '', predecessor: null })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('levels')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showLogin, setShowLogin] = useState(false)
  const [operationLoading, setOperationLoading] = useState({})



  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      loadLevels()
      loadPromptComponents()
    } catch {
      setUser(null)
    }
    setAuthLoading(false)
  }

  const handleLogin = async () => {
    try {
      await signIn({ username: loginForm.email, password: loginForm.password })
      await checkAuth()
      setShowLogin(false)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
  }

  const loadLevels = useCallback(async () => {
    try {
      setError('')
      const data = await apiRequest('/api/admin/levels')
      setLevels(data.levels || [])
    } catch (err) {
      setError(`Failed to load levels: ${err.message}`)
    }
  }, [])

  const loadPromptComponents = useCallback(async () => {
    try {
      setError('')
      const data = await apiRequest('/api/admin/prompt/components')
      setPromptComponents(data.components || [])
    } catch (err) {
      setError(`Failed to load prompt components: ${err.message}`)
    }
  }, [])

  const createLevel = async () => {
    if (!newLevel.name.trim()) {
      setError('Level name is required')
      return
    }
    
    audioManager.playSound('click')
    setOperationLoading(prev => ({ ...prev, createLevel: true }))
    setError('')
    setSuccess('')
    
    try {
      await apiRequest('/api/admin/levels', {
        method: 'POST',
        body: JSON.stringify({ name: newLevel.name.trim() })
      })
      
      await loadLevels()
      setNewLevel({ name: '', difficulty: 'Low' })
      setShowCreateForm(false)
      setSuccess('Level created successfully')
    } catch (err) {
      setError(`Failed to create level: ${err.message}`)
    } finally {
      setOperationLoading(prev => ({ ...prev, createLevel: false }))
    }
  }

  const createPromptComponent = async () => {
    if (!newPrompt.text.trim()) {
      setError('Prompt text is required')
      return
    }
    
    audioManager.playSound('click')
    setOperationLoading(prev => ({ ...prev, createPrompt: true }))
    setError('')
    setSuccess('')
    
    try {
      // Create component
      const createData = await apiRequest('/api/admin/prompt/components', {
        method: 'POST',
        body: JSON.stringify({ predecessor: newPrompt.predecessor })
      })
      
      const componentId = createData.component_id?.[0] || createData.component_id
      
      // Update with text
      await apiRequest(`/api/admin/prompt/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify({ new_text: newPrompt.text.trim() })
      })
      
      await loadPromptComponents()
      setNewPrompt({ text: '', predecessor: null })
      setShowPromptForm(false)
      setSuccess('Prompt component created successfully')
    } catch (err) {
      setError(`Failed to create prompt component: ${err.message}`)
    } finally {
      setOperationLoading(prev => ({ ...prev, createPrompt: false }))
    }
  }

  const deleteLevel = async (levelId) => {
    if (!confirm('Are you sure you want to delete this level?')) return
    
    audioManager.playSound('click')
    setOperationLoading(prev => ({ ...prev, [`delete-${levelId}`]: true }))
    setError('')
    
    try {
      await apiRequest(`/api/admin/levels/${levelId}`, { method: 'DELETE' })
      await loadLevels()
      setSuccess('Level deleted successfully')
    } catch (err) {
      setError(`Failed to delete level: ${err.message}`)
    } finally {
      setOperationLoading(prev => ({ ...prev, [`delete-${levelId}`]: false }))
    }
  }

  const deletePromptComponent = async (componentId) => {
    if (!confirm('Are you sure you want to delete this prompt component?')) return
    
    audioManager.playSound('click')
    setOperationLoading(prev => ({ ...prev, [`delete-prompt-${componentId}`]: true }))
    setError('')
    
    try {
      await apiRequest(`/api/admin/prompt/components/${componentId}`, { method: 'DELETE' })
      await loadPromptComponents()
      setSuccess('Prompt component deleted successfully')
    } catch (err) {
      setError(`Failed to delete component: ${err.message}`)
    } finally {
      setOperationLoading(prev => ({ ...prev, [`delete-prompt-${componentId}`]: false }))
    }
  }

  const testLLM = async (levelId) => {
    audioManager.playSound('click')
    setOperationLoading(prev => ({ ...prev, [`test-${levelId}`]: true }))
    setError('')
    
    try {
      const sessionId = `admin-test-${Date.now()}`
      const data = await apiRequest(`/api/levels/${levelId}/chat/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello, what is the password?',
          user_info: { username: 'admin' }
        })
      })
      
      alert(`LLM Response: ${data.reply}`)
      setSuccess('LLM test completed')
    } catch (err) {
      setError(`LLM test failed: ${err.message}`)
    } finally {
      setOperationLoading(prev => ({ ...prev, [`test-${levelId}`]: false }))
    }
  }

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="nes-container is-dark">
          <h1 className="page-title">ADMIN PANEL</h1>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="nes-container is-dark">
          <h1 className="page-title">ADMIN PANEL</h1>
          <div className="nes-container is-error" style={{ marginBottom: '1rem' }}>
            <p>Admin Access Required</p>
          </div>
          {!showLogin ? (
            <button className="nes-btn is-primary" onClick={() => setShowLogin(true)}>
              Admin Login
            </button>
          ) : (
            <div className="nes-container">
              <h3>Admin Login</h3>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <input
                  type="email"
                  className="nes-input"
                  placeholder="Admin email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <input
                  type="password"
                  className="nes-input"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <button className="nes-btn is-success" onClick={handleLogin}>
                Login
              </button>
              <button className="nes-btn" onClick={() => setShowLogin(false)} style={{ marginLeft: '1rem' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="nes-container is-dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 className="page-title">ADMIN PANEL</h1>
          <button className="nes-btn" onClick={handleLogout}>Logout</button>
        </div>
        
        {error && (
          <div className="nes-container is-error" style={{ marginBottom: '1rem' }}>
            <p>{error}</p>
            <button className="nes-btn" onClick={() => setError('')} style={{ marginTop: '0.5rem' }}>Dismiss</button>
          </div>
        )}
        
        {success && (
          <div className="nes-container is-success" style={{ marginBottom: '1rem' }}>
            <p>{success}</p>
            <button className="nes-btn" onClick={() => setSuccess('')} style={{ marginTop: '0.5rem' }}>Dismiss</button>
          </div>
        )}

        <div className="admin-tabs" style={{ marginBottom: '2rem' }}>
          <button 
            className={`nes-btn ${activeTab === 'levels' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('levels')}
          >
            Levels
          </button>
          <button 
            className={`nes-btn ${activeTab === 'prompts' ? 'is-primary' : ''}`}
            onClick={() => setActiveTab('prompts')}
            style={{ marginLeft: '1rem' }}
          >
            Prompt Components
          </button>
        </div>

        {activeTab === 'levels' && (
          <div className="admin-actions" style={{ marginBottom: '2rem' }}>
            <button 
              className="nes-btn is-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={loading}
            >
              {showCreateForm ? 'Cancel' : 'Create Level'}
            </button>
            <button 
              className="nes-btn"
              onClick={loadLevels}
              disabled={loading}
              style={{ marginLeft: '1rem' }}
            >
              Refresh
            </button>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="admin-actions" style={{ marginBottom: '2rem' }}>
            <button 
              className="nes-btn is-primary"
              onClick={() => setShowPromptForm(!showPromptForm)}
              disabled={loading}
            >
              {showPromptForm ? 'Cancel' : 'Create Prompt'}
            </button>
            <button 
              className="nes-btn"
              onClick={loadPromptComponents}
              disabled={loading}
              style={{ marginLeft: '1rem' }}
            >
              Refresh
            </button>
          </div>
        )}

        {showCreateForm && activeTab === 'levels' && (
          <div className="nes-container" style={{ marginBottom: '2rem' }}>
            <h3>Create New Level</h3>
            <div className="nes-field" style={{ marginBottom: '1rem' }}>
              <label>Level Name:</label>
              <input
                type="text"
                className="nes-input"
                value={newLevel.name}
                onChange={(e) => setNewLevel({...newLevel, name: e.target.value})}
                placeholder="Enter level name"
              />
            </div>
            <button 
              className="nes-btn is-success"
              onClick={createLevel}
              disabled={operationLoading.createLevel || !newLevel.name.trim()}
            >
              {operationLoading.createLevel ? 'Creating...' : 'Create'}
            </button>
          </div>
        )}

        {showPromptForm && activeTab === 'prompts' && (
          <div className="nes-container" style={{ marginBottom: '2rem' }}>
            <h3>Create Prompt Component</h3>
            <div className="nes-field" style={{ marginBottom: '1rem' }}>
              <label>Prompt Text:</label>
              <textarea
                className="nes-textarea"
                value={newPrompt.text}
                onChange={(e) => setNewPrompt({...newPrompt, text: e.target.value})}
                placeholder="Enter prompt text (use {{USER_SUB}}, {{LEVEL_NAME}}, {{LEVEL_PASSWORD}} for variables)"
                rows={4}
              />
            </div>
            <button 
              className="nes-btn is-success"
              onClick={createPromptComponent}
              disabled={operationLoading.createPrompt || !newPrompt.text.trim()}
            >
              {operationLoading.createPrompt ? 'Creating...' : 'Create'}
            </button>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="levels-list">
            <h3>Existing Levels ({levels.length})</h3>
            {loading && <p>Loading...</p>}
            
            {levels.map((level) => {
              const levelId = level.level_id?.[0] || level.level_id || level.id
              return (
                <div key={levelId} className="nes-container" style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4>Level {levelId}: {level.name}</h4>
                      <p>Password: {level.password || 'Auto-generated'}</p>
                      <p>Difficulty: {level.difficulty}</p>
                      <p>Prompt Components: {level.prompt_components?.length || 0}</p>
                      <p>Next: {level.next?.length ? level.next.join(', ') : 'None'}</p>
                    </div>
                    <div>
                      <button 
                        className="nes-btn is-warning"
                        onClick={() => testLLM(levelId)}
                        disabled={operationLoading[`test-${levelId}`]}
                        style={{ marginRight: '0.5rem' }}
                      >
                        {operationLoading[`test-${levelId}`] ? 'Testing...' : 'Test LLM'}
                      </button>
                      <button 
                        className="nes-btn is-error"
                        onClick={() => deleteLevel(levelId)}
                        disabled={operationLoading[`delete-${levelId}`]}
                      >
                        {operationLoading[`delete-${levelId}`] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="prompts-list">
            <h3>Prompt Components ({promptComponents.length})</h3>
            <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>These are reusable prompt pieces that can be assigned to levels</p>
            
            {promptComponents.map((component) => (
              <div key={component.id[0]} className="nes-container" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4>Component {component.id[0]}</h4>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{component.text}</p>
                  </div>
                  <button 
                    className="nes-btn is-error"
                    onClick={() => deletePromptComponent(component.id[0] || component.id)}
                    disabled={operationLoading[`delete-prompt-${component.id[0] || component.id}`]}
                    style={{ marginLeft: '1rem' }}
                  >
                    {operationLoading[`delete-prompt-${component.id[0] || component.id}`] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin