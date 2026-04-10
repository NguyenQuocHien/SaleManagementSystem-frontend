import { API_BASE_URL } from '../config/env.js'

function extractErrorMessage(rawMessage, fallbackMessage) {
    if (!rawMessage) {
        return fallbackMessage
    }

    if (typeof rawMessage === 'string') {
        const trimmed = rawMessage.trim()

        try {
            const parsed = JSON.parse(trimmed)

            if (typeof parsed === 'string') {
                return parsed
            }

            if (parsed?.message) {
                return parsed.message
            }
        } catch {
            // Keep original message if payload is not JSON.
        }

        return trimmed || fallbackMessage
    }

    if (rawMessage?.message) {
        return rawMessage.message
    }

    return fallbackMessage
}

async function postAuth(path, payload, fallbackMessage) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    if (!response.ok) {
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

export async function loginByPhone(payload) {
    return postAuth('/api/Users/login', payload, 'Đăng nhập thất bại.')
}

export async function registerAccount(payload) {
    return postAuth('/api/Users/register', payload, 'Đăng ký thất bại.')
}

export async function forgotPassword(payload) {
    return postAuth('/api/Users/forgot-password', payload, 'Không thể đặt lại mật khẩu.')
}
