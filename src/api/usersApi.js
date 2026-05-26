async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
        return response.json()
    }

    return null
}

export function createUsersApi(baseUrl) {
    return {
        async getAll() {
            const response = await fetch(`${baseUrl}/api/Users`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async create(payload) {
            const response = await fetch(`${baseUrl}/api/Users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            })

            return parseResponse(response)
        },

        async update(userId, payload) {
            const response = await fetch(`${baseUrl}/api/Users/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            })

            return parseResponse(response)
        },

        async deactivate(userId) {
            const response = await fetch(`${baseUrl}/api/Users/${encodeURIComponent(userId)}/deactivate`, {
                method: 'PUT',
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },

        async activate(userId) {
            const response = await fetch(`${baseUrl}/api/Users/${encodeURIComponent(userId)}/activate`, {
                method: 'PUT',
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },
    }
}
