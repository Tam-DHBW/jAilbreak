const API_BASE_URL = import.meta.env.VITE_API_URL || window.location.origin

function getAdminAuthToken(auth) {
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Admin authentication required')
  }
  return auth.user.access_token
}

export async function createLevel(levelData, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
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

export async function getLevels(auth) {
  try {
    const token = getAdminAuthToken(auth)
    
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

export async function deleteLevel(levelId, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
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

export async function getComponents(auth) {
  try {
    const token = getAdminAuthToken(auth)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/prompt/components`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get components: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get components error:', error)
    throw error
  }
}

export async function createComponent(componentData, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/prompt/components`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(componentData)
    })

    if (!response.ok) {
      throw new Error(`Failed to create component: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Create component error:', error)
    throw error
  }
}

export async function updateComponent(componentId, componentData, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/prompt/components/${componentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(componentData)
    })

    if (!response.ok) {
      throw new Error(`Failed to update component: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Update component error:', error)
    throw error
  }
}

export async function editComponent(componentId, newText, auth) {
  return updateComponent(componentId, { new_text: newText }, auth)
}

export async function deleteComponent(componentId, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/prompt/components/${componentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete component: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Delete component error:', error)
    throw error
  }
}

export async function moveComponent(componentId, direction, auth) {
  try {
    const token = getAdminAuthToken(auth)
    
    const response = await fetch(`${API_BASE_URL}/api/admin/prompt/components/${componentId}/move`, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direction })
    })

    if (!response.ok) {
      throw new Error(`Failed to move component: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Move component error:', error)
    throw error
  }
}