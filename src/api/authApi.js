import { API_BASE_URL } from '../config/env.js'

function decodeJWT(token) {
    try {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }

        const decoded = JSON.parse(atob(parts[1]))
        return decoded
    } catch {
        return null
    }
}

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
    const response = await postAuth('/api/Users/login', payload, 'Đăng nhập thất bại.')

    // Save JWT token if exists
    if (response?.token) {
        localStorage.setItem('feedflow-auth-token', response.token)

        // Decode JWT to get user info
        const decoded = decodeJWT(response.token)
        if (decoded) {
            // Create user object from JWT claims
            const user = {
                userId: decoded.sub || decoded.userId || '',
                role: response.role || decoded.role || 'User',
                phone: decoded.phone || '',
                email: decoded.email || '',
                fullName: decoded.fullName || '',
                username: decoded.username || '',
            }

            return {
                ...response,
                user: user
            }
        }
    }

    return response
}

export async function registerAccount(payload) {
    return postAuth('/api/Users/register', payload, 'Đăng ký thất bại.')
}

export async function forgotPassword(payload) {
    return postAuth('/api/Users/forgot-password', payload, 'Không thể đặt lại mật khẩu.')
}

export function getAuthToken() {
    return localStorage.getItem('feedflow-auth-token')
}

export function clearAuthToken() {
    localStorage.removeItem('feedflow-auth-token')
}
