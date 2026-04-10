async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createCustomersApi(apiBaseUrl) {
    return {
        async getActive() {
            const response = await fetch(`${apiBaseUrl}/api/Customers/active/list`, {
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },
    }
}
