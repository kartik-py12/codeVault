const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const buildUrl = (path) => `${API_BASE_URL}${path}`

export const authApi = {
  getCurrentUser: async () => {
    const response = await fetch(buildUrl('/api/auth/me'), {
      method: 'GET',
      credentials: 'include'
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to fetch user')
    }

    return payload.user
  },

  logout: async () => {
    const response = await fetch(buildUrl('/api/auth/logout'), {
      method: 'POST',
      credentials: 'include'
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to logout')
    }

    return payload
  },

  getGithubLoginUrl: () => buildUrl('/api/auth/github')
}

export const syncApi = {
  getSubmissions: async () => {
    const response = await fetch(buildUrl('/api/sync'), {
      method: 'GET',
      credentials: 'include'
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to fetch submissions')
    }

    return payload.submissions || []
  },

  getLatestSubmissions: async () => {
    const response = await fetch(buildUrl('/api/sync?latest=true'), {
      method: 'GET',
      credentials: 'include'
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to fetch latest submissions')
    }

    return payload.submissions || []
  },

  getProblemSubmissions: async (problemTitle) => {
    const encodedTitle = encodeURIComponent(problemTitle)
    console.log('[syncApi.getProblemSubmissions] Requesting title:', problemTitle)

    const response = await fetch(buildUrl(`/api/sync/problem/${encodedTitle}`), {
      method: 'GET',
      credentials: 'include'
    })

    const payload = await response.json()

    console.log('[syncApi.getProblemSubmissions] Response status:', response.status)
    console.log('[syncApi.getProblemSubmissions] Payload:', payload)

    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to fetch problem submissions')
    }

    return payload
  }
}
