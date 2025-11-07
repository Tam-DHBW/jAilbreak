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
    <div>
      <h2>Level Management</h2>
      
      {error && (
        <div className="nes-container is-error" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
          <button onClick={() => setError('')} className="nes-btn">Clear</button>
        </div>
      )}

      <form onSubmit={createLevel} style={{ marginBottom: '2rem' }}>
        <div className="nes-field">
          <label>Level Name:</label>
          <input
            type="text"
            className="nes-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter level name"
          />
        </div>
        <button type="submit" className="nes-btn is-primary" style={{ marginTop: '1rem' }}>
          Create Level
        </button>
      </form>

      <div className="nes-table-responsive">
        <table className="nes-table is-bordered is-dark">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Password</th>
              <th>Difficulty</th>
              <th>Root</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map(level => (
              <tr key={level.level_id}>
                <td>{level.level_id}</td>
                <td>{level.name}</td>
                <td>{level.password}</td>
                <td>{level.difficulty}</td>
                <td>{level.is_root ? 'Yes' : 'No'}</td>
                <td>
                  <button 
                    onClick={() => deleteLevel(level.level_id)}
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
  )
}