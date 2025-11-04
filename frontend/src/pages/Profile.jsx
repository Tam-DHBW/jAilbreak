import { useState, useEffect } from 'react'
import { getStoredUsername, getGameProgress, getUserSettings } from '../localStorage'

function Profile() {
  const [user, setUser] = useState(null)
  const [gameProgress, setGameProgress] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserData = () => {
      try {
        const username = getStoredUsername()
        const progress = getGameProgress()
        const userSettings = getUserSettings()
        
        setUser({ username, name: username })
        setGameProgress(progress)
        setSettings(userSettings)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
      setLoading(false)
    }
    getUserData()
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="nes-container is-dark">
          <h1 className="page-title">USER PROFILE</h1>
          <div className="page-content">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="nes-container is-dark">
        <h1 className="page-title">USER PROFILE</h1>
        <div className="page-content">
          <div className="profile-section">
            <div className="profile-picture">
              <div className="profile-placeholder">
                [PROFILE_IMAGE]
              </div>
            </div>
            
            <div className="profile-info">
              <h3>PERSONAL INFORMATION</h3>
              <div className="profile-field">
                <strong>NAME:</strong> <span className="profile-value">{user?.name || 'N/A'}</span>
              </div>
              <div className="profile-field">
                <strong>SESSION:</strong> <span className="profile-value">Local Session</span>
              </div>
              <div className="profile-field">
                <strong>LEVEL:</strong> <span className="profile-value">{gameProgress?.currentLevel || 1}</span>
              </div>
              <div className="profile-field">
                <strong>COMPLETED:</strong> <span className="profile-value">{gameProgress?.completedLevels?.length || 0} levels</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile