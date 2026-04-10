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

export function createUploadsApi(apiBaseUrl) {
    return {
        async uploadImage(file, folder = 'images') {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', folder)

            const response = await fetch(`${apiBaseUrl}/api/Uploads/image`, {
                method: 'POST',
                body: formData,
            })

            return parseResponse(response)
        },
    }
}