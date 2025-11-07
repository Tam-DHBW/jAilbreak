import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from 'react-oidc-context'
import { audioManager } from '../audio'
import AdminAuth from '../components/AdminAuth'

// API service layer
class AdminApiService {
  constructor(getToken) {
    this.getToken = getToken
  }

  async request(endpoint, options = {}, retries = 2) {
    const token = await this.getToken()
    if (!token) throw new Error('No authentication token available')

    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      })

      if (response.ok) {
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      }

      if (response.status === 403 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }

      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
      throw new Error(errorMessage.trim() || `Request failed with status ${response.status}`)
    }
  }

  // Level operations
  async getLevels() {
    const data = await this.request('/admin/levels')
    return data.levels || []
  }

  async createLevel(name) {
    const data = await this.request('/admin/levels', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    return data.level
  }

  async updateLevel(levelId, updates) {
    await this.request(`/admin/levels/${levelId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }

  async deleteLevel(levelId) {
    await this.request(`/admin/levels/${levelId}`, {
      method: 'DELETE'
    })
  }

  // Component operations
  async getComponents() {
    const data = await this.request('/admin/prompt/components')
    return data.components || []
  }

  async createComponent(text, predecessor = null) {
    // Create empty component
    const createData = await this.request('/admin/prompt/components', {
      method: 'POST',
      body: JSON.stringify({ predecessor })
    })
    
    const componentId = createData.component_id
    
    // Update with text immediately
    if (text && text.trim()) {
      await this.request(`/admin/prompt/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify({ new_text: text.trim() })
      })
    }
    
    return componentId
  }

  async deleteComponent(componentId) {
    await this.request(`/admin/prompt/components/${componentId}`, {
      method: 'DELETE'
    })
  }

  async updateComponent(componentId, text) {
    await this.request(`/admin/prompt/components/${componentId}`, {
      method: 'PUT',
      body: JSON.stringify({ new_text: text })
    })
  }

  async moveComponent(componentId, direction) {
    await this.request(`/admin/prompt/components/${componentId}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction })
    })
  }
}

function AdminPanel() {
  const auth = useAuth()
  
  // State management
  const [levels, setLevels] = useState([])
  const [components, setComponents] = useState([])
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [levelForm, setLevelForm] = useState({
    name: '',
    password: '',
    is_root: false,
    difficulty: 'Low',
    prompt_components: [],
    next: []
  })
  const [newComponentText, setNewComponentText] = useState('')
  const [editingComponent, setEditingComponent] = useState(null)
  const [editText, setEditText] = useState('')

  // API service
  const apiService = new AdminApiService(() => auth.user?.access_token)

  // Load data
  const loadData = useCallback(async (showLoading = true) => {
    if (!auth.user?.access_token) return
    
    if (showLoading) setLoading(true)
    
    try {
      const [levelsData, componentsData] = await Promise.all([
        apiService.getLevels(),
        apiService.getComponents()
      ])
      
      setLevels(levelsData)
      setComponents(componentsData)
      setError('') // Clear errors on success
      
      // Auto-select first level if none selected
      if (levelsData.length > 0 && !selectedLevel) {
        selectLevel(levelsData[0])
      }
    } catch (err) {
      console.error('Load data error:', err)
      if (showLoading) setError(`Failed to load data: ${err.message || 'Unknown error'}`)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [auth.user?.access_token, selectedLevel])

  // Effects
  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData()
      
      // Auto-refresh every 5 seconds
      const interval = setInterval(() => {
        loadData(false) // Don't show loading spinner for background refresh
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [auth.isAuthenticated, loadData])

  // Level operations
  const selectLevel = (level) => {
    setSelectedLevel(level)
    setLevelForm({
      name: level.name || '',
      password: level.password || '',
      is_root: level.is_root || false,
      difficulty: level.difficulty || 'Low',
      prompt_components: level.prompt_components || [],
      next: level.next || []
    })
  }

  const createLevel = async () => {
    audioManager.playSound('click')
    setError('')
    setSuccess('')
    
    try {
      await apiService.createLevel('New Level')
      await loadData()
      setSuccess('Level created successfully')
    } catch (err) {
      console.error('Create level error:', err)
      setError(`Failed to create level: ${err.message || 'Unknown error'}`)
    }
  }

  const updateLevel = async () => {
    if (!selectedLevel) return
    
    audioManager.playSound('click')
    setError('')
    setSuccess('')
    
    try {
      const updates = {}
      
      if (levelForm.name !== selectedLevel.name) updates.name = levelForm.name
      if (levelForm.password !== selectedLevel.password) updates.password = levelForm.password
      if (levelForm.is_root !== selectedLevel.is_root) updates.is_root = levelForm.is_root
      if (levelForm.difficulty !== selectedLevel.difficulty) updates.difficulty = levelForm.difficulty
      if (JSON.stringify(levelForm.prompt_components) !== JSON.stringify(selectedLevel.prompt_components)) {
        updates.prompt_components = levelForm.prompt_components
      }
      if (JSON.stringify(levelForm.next) !== JSON.stringify(selectedLevel.next)) {
        updates.next = levelForm.next
      }
      
      if (Object.keys(updates).length === 0) {
        return
      }
      
      await apiService.updateLevel(selectedLevel.level_id, updates)
      await loadData()
      setSuccess('Changes saved')
    } catch (err) {
      setError(`Failed to update level: ${err.message}`)
    }
  }


  const [isDeleting, setIsDeleting] = useState(false)

    const deleteLevel = async (levelId) => {
        if (isDeleting) return
        if (!confirm('Are you sure you want to delete this level?')) return

        audioManager.playSound('click')
        setError('')
        setIsDeleting(true)

        try {
            await apiService.deleteLevel(levelId)
            await loadData()

            if (selectedLevel?.level_id === levelId) {
                setSelectedLevel(null)
            }

            setSuccess('Level deleted successfully')
        } catch (err) {
            console.error('Delete level error:', err)
            setError(`Failed to delete level: ${err.message || 'Unknown error'}`)
        } finally {
            setIsDeleting(false)
        }
    }

  // Component operations
  const createComponent = async () => {
    if (!newComponentText.trim()) return
    
    audioManager.playSound('click')
    setError('')
    setSuccess('')
    
    try {
      await apiService.createComponent(newComponentText.trim())
      setNewComponentText('')
      // Add a small delay to ensure backend consistency
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadData()
      setSuccess('Component created')
    } catch (err) {
      setError(`Failed to create component: ${err.message}`)
    }
  }

  const deleteComponent = async (componentId) => {
    if (!confirm('Are you sure you want to delete this component?')) return
    
    audioManager.playSound('click')
    setError('')
    
    try {
      await apiService.deleteComponent(componentId)
      await loadData()
      setSuccess('Component deleted successfully')
    } catch (err) {
      setError(`Failed to delete component: ${err.message}`)
    }
  }

  const startEditComponent = (component) => {
    setEditingComponent(component.id)
    setEditText(component.text)
  }

  const saveEditComponent = async () => {
    try {
      await apiService.updateComponent(editingComponent, editText)
      setEditingComponent(null)
      setEditText('')
      await loadData()
      setSuccess('Component updated')
    } catch (err) {
      setError(`Failed to update component: ${err.message}`)
    }
  }

  const cancelEditComponent = () => {
    setEditingComponent(null)
    setEditText('')
  }

  const moveComponentUp = async (componentId) => {
    try {
      await apiService.moveComponent(componentId, 'up')
      await loadData()
    } catch (err) {
      setError(`Failed to move component: ${err.message}`)
    }
  }

  const moveComponentDown = async (componentId) => {
    try {
      await apiService.moveComponent(componentId, 'down')
      await loadData()
    } catch (err) {
      setError(`Failed to move component: ${err.message}`)
    }
  }

  const toggleComponent = (componentId) => {
    // Ensure consistent data types
    const id = Number(componentId)
    const currentComponents = levelForm.prompt_components.map(c => Number(c))
    
    const newComponents = currentComponents.includes(id)
      ? currentComponents.filter(cId => cId !== id)
      : [...currentComponents, id]
    
    setLevelForm({ ...levelForm, prompt_components: newComponents })
  }

  // Utility functions
  const handleSignOut = () => {
    audioManager.playSound('click')
    const clientId = "6optohklh97aifpu3d4o7jvrh1"
    const logoutUri = window.location.origin
    const cognitoDomain = "https://jailbreak-moderator-auth.auth.eu-central-1.amazoncognito.com"
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  // Render loading state
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

  // Render auth required
  if (!auth.isAuthenticated) {
    return (
      <>
        <div className="scanlines"></div>
        <AdminAuth />
      </>
    )
  }

  // Main render
  return (
    <>
      <div className="scanlines"></div>
      <div style={{ padding: '2rem', display: 'flex', gap: '2rem', height: '100vh' }}>
        
        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut} 
          className="nes-btn is-error"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          Sign Out
        </button>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div style={{ position: 'absolute', top: '4rem', right: '1rem', zIndex: 1000 }}>
            {error && (
              <div className="nes-container is-error" style={{ marginBottom: '1rem' }}>
                <p>{error}</p>
                <button className="nes-btn" onClick={clearMessages}>×</button>
              </div>
            )}
            {success && (
              <div className="nes-container is-success">
                <p>{success}</p>
                <button className="nes-btn" onClick={clearMessages}>×</button>
              </div>
            )}
          </div>
        )}

        {/* Left Panel - Levels */}
        <div className="nes-container is-dark" style={{ width: '300px', height: 'fit-content' }}>
          <h3>Levels</h3>
          
          {loading && <p>Loading...</p>}
          
          <div style={{ marginBottom: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {levels.map(level => {
              const levelId = level.level_id || level.id
              return (
                <div 
                  key={levelId}
                  style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem', 
                    cursor: 'pointer',
                    backgroundColor: selectedLevel?.level_id === levelId ? '#0066cc' : 'transparent',
                    marginBottom: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #666'
                  }}
                >
                  <span 
                    onClick={() => selectLevel(level)}
                    style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {level.name}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLevel(levelId)
                    }}
                    className="nes-btn is-error"
                    style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px',
                      minWidth: '30px',
                      marginLeft: '8px'
                    }}
                    title="Delete level"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
          
          <button 
            onClick={createLevel} 
            className="nes-btn is-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            Add Level
          </button>
        </div>

        {/* Right Panel - Level Editor */}
        {selectedLevel && (
          <div className="nes-container is-dark" style={{ flex: 1, height: 'fit-content' }}>
            
            {/* Level Basic Info */}
            <div style={{ marginBottom: '2rem' }}>
              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Level name</label>
                <input
                  type="text"
                  className="nes-input"
                  value={levelForm.name}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  placeholder="First steps"
                />
              </div>

              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Level password</label>
                <input
                  type="text"
                  className="nes-input"
                  value={levelForm.password}
                  onChange={(e) => setLevelForm({ ...levelForm, password: e.target.value })}
                  placeholder="kjs6r82387sdasoj"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label>
                  <input
                    type="checkbox"
                    className="nes-checkbox"
                    checked={levelForm.is_root}
                    onChange={(e) => setLevelForm({ ...levelForm, is_root: e.target.checked })}
                  />
                  <span>Is root</span>
                </label>
              </div>

              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Difficulty</label>
                <div className="nes-select">
                  <select
                    value={levelForm.difficulty}
                    onChange={(e) => setLevelForm({ ...levelForm, difficulty: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="nes-field" style={{ marginBottom: '1rem' }}>
                <label>Next</label>
                <input
                  type="text"
                  className="nes-input"
                  value={levelForm.next.join(', ')}
                  onChange={(e) => setLevelForm({ 
                    ...levelForm, 
                    next: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  placeholder="Trickery, Bonus level"
                />
              </div>
            </div>

            {/* Prompt Components */}
            <div style={{ marginBottom: '2rem' }}>
              <h4>Prompt components ({components.length})</h4>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                {components.map((component, index) => (
                  <div 
                    key={component.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                      padding: '0.5rem',
                      border: '1px solid #666',
                      borderRadius: '4px'
                    }}
                  >
                    <label style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        className="nes-checkbox"
                        checked={levelForm.prompt_components.map(c => Number(c)).includes(Number(component.id))}
                        onChange={() => toggleComponent(component.id)}
                        style={{ marginTop: '0.2rem' }}
                      />
                      {editingComponent === component.id ? (
                        <textarea
                          className="nes-textarea"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          style={{ flex: 1, fontSize: '0.9rem' }}
                        />
                      ) : (
                        <span style={{ 
                          fontSize: '0.9rem', 
                          lineHeight: '1.4',
                          wordBreak: 'break-word'
                        }}>
                          {component.text || '[Empty component]'}
                        </span>
                      )}
                    </label>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '1rem' }}>
                      {editingComponent === component.id ? (
                        <>
                          <button onClick={saveEditComponent} className="nes-btn is-success" style={{ fontSize: '10px', padding: '2px 4px' }}>✓</button>
                          <button onClick={cancelEditComponent} className="nes-btn" style={{ fontSize: '10px', padding: '2px 4px' }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditComponent(component)} className="nes-btn is-primary" style={{ fontSize: '10px', padding: '2px 4px' }}>✎</button>
                          {index > 0 && (
                            <button onClick={() => moveComponentUp(component.id)} className="nes-btn" style={{ fontSize: '10px', padding: '2px 4px' }}>↑</button>
                          )}
                          {index < components.length - 1 && (
                            <button onClick={() => moveComponentDown(component.id)} className="nes-btn" style={{ fontSize: '10px', padding: '2px 4px' }}>↓</button>
                          )}
                          <button onClick={() => deleteComponent(component.id)} className="nes-btn is-error" style={{ fontSize: '10px', padding: '2px 4px' }}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Create New Component */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div className="nes-field" style={{ flex: 1 }}>
                  <textarea
                    className="nes-textarea"
                    value={newComponentText}
                    onChange={(e) => setNewComponentText(e.target.value)}
                    placeholder="New component text"
                    rows={2}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button 
                  onClick={createComponent} 
                  className="nes-btn is-success"
                  disabled={!newComponentText.trim() || loading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Create new
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={updateLevel} 
              className="nes-btn is-success"
              disabled={loading}
              style={{ width: '100%' }}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default AdminPanel