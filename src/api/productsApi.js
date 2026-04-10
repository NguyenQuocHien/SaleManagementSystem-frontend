function extractErrorMessage(rawPayload, fallback) {
    if (!rawPayload) {
        return fallback
    }

    const trimmed = rawPayload.trim()
    if (!trimmed) {
        return fallback
    }

    try {
        const parsed = JSON.parse(trimmed)

        if (typeof parsed === 'string') {
            return parsed
        }

        if (parsed?.message) {
            return parsed.message
        }

        if (parsed?.title) {
            return parsed.title
        }
    } catch {
        // Keep raw payload when it is not JSON.
    }

    return trimmed.replace(/^"|"$/g, '')
}

async function parseResponse(response) {
    const responseText = await response.text()

    if (!response.ok) {
        const fallbackMessage = `API error: ${response.status}`
        throw new Error(extractErrorMessage(responseText, fallbackMessage))
    }

    if (!responseText) {
        return null
    }

    try {
        return JSON.parse(responseText)
    } catch {
        return responseText
    }
}

export function createProductsApi(apiBaseUrl) {
    return {
        async getAll() {
            const response = await fetch(`${apiBaseUrl}/api/Products`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async getById(productId) {
            const response = await fetch(`${apiBaseUrl}/api/Products/${productId}`, {
                headers: { Accept: 'application/json' },
            })
            return parseResponse(response)
        },

        async getCategories() {
            try {
                const response = await fetch(`${apiBaseUrl}/api/Products/categories`, {
                    headers: { Accept: 'application/json' },
                })
                return await parseResponse(response)
            } catch {
                return []
            }
        },

        async create(payload) {
            const response = await fetch(`${apiBaseUrl}/api/Products`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            return parseResponse(response)
        },

        async update(productId, payload) {
            const response = await fetch(`${apiBaseUrl}/api/Products/${productId}`, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            return parseResponse(response)
        },

        async remove(productId) {
            const response = await fetch(`${apiBaseUrl}/api/Products/${productId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json' },
            })

            if (response.status !== 204 && !response.ok) {
                const errorText = await response.text()
                throw new Error(errorText || `API error: ${response.status}`)
            }
        },
    }
}
