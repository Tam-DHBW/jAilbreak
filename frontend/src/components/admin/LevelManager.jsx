import React, { useState, useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { getLevels, createLevel as createLevelAPI, deleteLevel as deleteLevelAPI } from '../../api/admin'

export default function LevelManager() {
  const auth = useAuth()
  const [levels, setLevels] = useState([])
  const [error, setError] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    loadLevels()
  }, [])

  const loadLevels = async () => {
    try {
      const data = await getLevels(auth)
      setLevels(data.levels)
      setError('')
    } catch (err) {
      setError('Failed to load levels: ' + err.message)
    }
  }

  const createLevel = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createLevelAPI({ name: name.trim() }, auth)
      setName('')
      loadLevels()
      setError('')
    } catch (err) {
      setError('Failed to create level: ' + err.message)
    }
  }

  const deleteLevel = async (levelId) => {
    try {
      await deleteLevelAPI(levelId, auth)
      loadLevels()
      setError('')
    } catch (err) {
      setError('Delete failed: ' + err.message)
    }
  }

  return (
    <div style={{ padding: window.innerWidth <= 768 ? '10px' : '20px' }}>
      <h2 style={{ fontSize: window.innerWidth <= 768 ? '14px' : '18px' }}>Level Management</h2>
      
      {error && (
        <div className="nes-container is-error" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
          <button onClick={() => setError('')} className="nes-btn">Clear</button>
        </div>
      )}

      <form onSubmit={createLevel} style={{ marginBottom: '2rem' }}>
        <div className="nes-field">
          <label style={{ fontSize: window.innerWidth <= 768 ? '10px' : '12px' }}>Level Name:</label>
          <input
            type="text"
            className="nes-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter level name"
            style={{ fontSize: window.innerWidth <= 768 ? '10px' : '12px' }}
          />
        </div>
        <button 
          type="submit" 
          className="nes-btn is-primary" 
          style={{ 
            marginTop: '1rem',
            fontSize: window.innerWidth <= 768 ? '10px' : '12px',
            padding: window.innerWidth <= 768 ? '6px 10px' : '8px 12px'
          }}
        >
          Create Level
        </button>
      </form>

      <div className="nes-table-responsive">
        <table className="nes-table is-bordered is-dark">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th className="desktop-only">Password</th>
              <th>Difficulty</th>
              <th className="desktop-only">Root</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map(level => (
              <tr key={level.level_id}>
                <td>{level.level_id}</td>
                <td style={{ fontSize: window.innerWidth <= 768 ? '10px' : '12px' }}>{level.name}</td>
                <td className="desktop-only">{level.password}</td>
                <td style={{ fontSize: window.innerWidth <= 768 ? '8px' : '12px' }}>{level.difficulty}</td>
                <td className="desktop-only">{level.is_root ? 'Yes' : 'No'}</td>
                <td>
                  <button 
                    onClick={() => deleteLevel(level.level_id)}
                    className="nes-btn is-error"
                    style={{ 
                      fontSize: window.innerWidth <= 768 ? '8px' : '12px', 
                      padding: window.innerWidth <= 768 ? '2px 4px' : '4px 8px' 
                    }}
                  >
                    {window.innerWidth <= 768 ? 'Del' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}