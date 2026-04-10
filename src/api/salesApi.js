async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createSalesApi(apiBaseUrl) {
    return {
        async getByAgent(agentId) {
            const response = await fetch(`${apiBaseUrl}/api/Sales/agent/${agentId}`, {
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },

        async create(payload) {
            const response = await fetch(`${apiBaseUrl}/api/Sales`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            return parseResponse(response)
        },
    }
}
