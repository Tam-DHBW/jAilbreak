const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

function getAdminAuthToken(auth) {
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Admin authentication required')
  }
  return auth.user.id_token
}

export async function createLevel(levelData) {
  try {
    const token = await getAdminAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/admin/levels`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(levelData)
    })

    if (!response.ok) {
      throw new Error(`Failed to create level: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Create level error:', error)
    throw error
  }
}

export async function getLevels() {
  try {
    const token = await getAdminAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/admin/levels`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get levels: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get levels error:', error)
    throw error
  }
}

export async function deleteLevel(levelId) {
  try {
    const token = await getAdminAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/api/admin/levels/${levelId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete level: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Delete level error:', error)
    throw error
  }
}