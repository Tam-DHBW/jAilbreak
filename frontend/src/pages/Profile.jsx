import { useState, useEffect } from 'react'
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUserData = async () => {
      try {
        const currentUser = await getCurrentUser()
        const attributes = await fetchUserAttributes()
        setUser({ ...currentUser, attributes })
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
                <strong>NAME:</strong> <span className="profile-value">{user?.attributes?.name || user?.username || 'N/A'}</span>
              </div>
              <div className="profile-field">
                <strong>EMAIL:</strong> <span className="profile-value">{user?.attributes?.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile