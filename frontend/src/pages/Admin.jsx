import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser, fetchAuthSession, signIn, signOut } from 'aws-amplify/auth'
import { audioManager } from '../audio'

const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

const getAuthToken = async () => {
  const session = await fetchAuthSession()
  const token = session.tokens?.idToken?.toString()
  if (!token) throw new Error('No auth token available')
  console.log('Auth token (first 50 chars):', token.substring(0, 50) + '...')
  return token
}

const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        ...options.headers
      }
    })
    
    if (response.status === 403) {
      console.error('403 Forbidden - Auth failed for:', endpoint)
      console.error('Response:', await response.text())
      // Token expired, try to refresh auth
      window.location.reload()
      return
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
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
  const [componentsLoading, setComponentsLoading] = useState(false)



  useEffect(() => {
    checkAuth()
  }, [])

  // Auto-refresh when switching to prompts tab
  useEffect(() => {
    if (user && activeTab === 'prompts') {
      loadPromptComponents()
    }
  }, [activeTab, user, loadPromptComponents])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      // Load initial data
      await Promise.all([
        loadLevels(),
        loadPromptComponents()
      ])
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
      setComponentsLoading(true)
      setError('')
      const data = await apiRequest('/api/admin/prompt/components')
      console.log('Loaded components:', data) // Debug log
      setPromptComponents(data.components || [])
    } catch (err) {
      console.error('Load components error:', err)
      setError(`Failed to load prompt components: ${err.message}`)
    } finally {
      setComponentsLoading(false)
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
      
      console.log('Create response:', createData) // Debug log
      
      const componentId = createData.component_id?.[0] || createData.component_id
      
      if (!componentId) {
        throw new Error('No component ID returned from create request')
      }
      
      // Update with text
      const updateData = await apiRequest(`/api/admin/prompt/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify({ new_text: newPrompt.text.trim() })
      })
      
      console.log('Update response:', updateData) // Debug log
      
      // Add to local state immediately
      const newComponent = {
        id: [componentId],
        text: newPrompt.text.trim()
      }
      setPromptComponents(prev => [...prev, newComponent])
      
      setNewPrompt({ text: '', predecessor: null })
      setShowPromptForm(false)
      setSuccess('Prompt component created successfully')
      
      // Also reload to ensure sync
      setTimeout(() => loadPromptComponents(), 500)
    } catch (err) {
      console.error('Create prompt error:', err)
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
    setSuccess('')
    
    try {
      await apiRequest(`/api/admin/prompt/components/${componentId}`, { method: 'DELETE' })
      // Immediately update local state
      setPromptComponents(prev => prev.filter(comp => {
        const id = comp.id?.[0] || comp.id
        return id !== componentId
      }))
      setSuccess('Prompt component deleted successfully')
    } catch (err) {
      console.error('Delete component error:', err)
      setError(`Failed to delete component: ${err.message}`)
      // Reload on error to get fresh state
      loadPromptComponents()
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
              onClick={() => {
                audioManager.playSound('click')
                loadPromptComponents()
              }}
              disabled={loading}
              style={{ marginLeft: '1rem' }}
            >
              Refresh
            </button>
            <button 
              className="nes-btn is-warning"
              onClick={() => {
                audioManager.playSound('click')
                setPromptComponents([])
                setTimeout(() => loadPromptComponents(), 100)
              }}
              style={{ marginLeft: '1rem' }}
            >
              Force Reload
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
            
            {componentsLoading ? (
              <div className="nes-container">
                <p>Loading prompt components...</p>
              </div>
            ) : promptComponents.length === 0 ? (
              <div className="nes-container">
                <p>No prompt components found. Create one to get started.</p>
              </div>
            ) : (
              promptComponents.map((component) => {
                // The backend returns: { id: ComponentID, text: String }
                // ComponentID is a wrapper around a number, so component.id should be the number directly
                const componentId = component.id
                const componentText = component.text || '[Empty text]'
                
                return (
                  <div key={componentId} className="nes-container" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4>Component {componentId}</h4>
                        <div style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontSize: '0.9rem', 
                          color: '#00ff00', 
                          border: '1px solid #333', 
                          padding: '8px', 
                          marginTop: '8px',
                          minHeight: '40px',
                          backgroundColor: 'rgba(0, 255, 0, 0.05)'
                        }}>
                          {componentText}
                        </div>
                        <details style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.7 }}>
                          <summary>Debug Info</summary>
                          <pre style={{ fontSize: '0.6rem', overflow: 'auto', maxHeight: '100px' }}>
                            ID: {JSON.stringify(component.id)}
                            Text: {JSON.stringify(component.text)}
                            Full: {JSON.stringify(component, null, 2)}
                          </pre>
                        </details>
                      </div>
                      <button 
                        className="nes-btn is-error"
                        onClick={() => deletePromptComponent(componentId)}
                        disabled={operationLoading[`delete-prompt-${componentId}`]}
                        style={{ marginLeft: '1rem' }}
                      >
                        {operationLoading[`delete-prompt-${componentId}`] ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin