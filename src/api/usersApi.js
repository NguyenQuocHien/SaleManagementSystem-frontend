async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createUsersApi(baseUrl) {
    return {
        async getAll() {
            const response = await fetch(`${baseUrl}/api/Users`, {
                headers: { Accept: 'application/json' },
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
