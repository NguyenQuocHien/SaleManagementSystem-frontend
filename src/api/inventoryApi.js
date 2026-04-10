async function parseResponse(response) {
    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API error: ${response.status}`)
    }

    return response.json()
}

export function createInventoryApi(apiBaseUrl) {
    return {
        async getAll() {
            const response = await fetch(`${apiBaseUrl}/api/Inventories`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async getLowStock() {
            const response = await fetch(`${apiBaseUrl}/api/Inventories/low-stock`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async create(payload) {
            const response = await fetch(`${apiBaseUrl}/api/Inventories`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })
            return parseResponse(response)
        },

        async adjustStock(inventoryId, quantityChange, reason) {
            const query = new URLSearchParams({
                quantityChange: String(quantityChange),
                reason,
            })

            const response = await fetch(`${apiBaseUrl}/api/Inventories/${inventoryId}/adjust?${query.toString()}`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            })

            return parseResponse(response)
        },
    }
}
