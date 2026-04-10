async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createImportReceiptsApi(apiBaseUrl) {
    return {
        async getAll() {
            const response = await fetch(`${apiBaseUrl}/api/ImportReceipts`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async create(payload) {
            const response = await fetch(`${apiBaseUrl}/api/ImportReceipts`, {
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
