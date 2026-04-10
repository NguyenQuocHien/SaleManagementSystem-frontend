import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginByPhone } from '../api/authApi.js'

function LoginPage() {
    const navigate = useNavigate()
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setNotice('')

        if (!phone.trim() || !password.trim()) {
            setError('Vui lòng nhập đầy đủ số điện thoại và mật khẩu.')
            return
        }

        try {
            setIsSubmitting(true)

            const response = await loginByPhone({
                phone: phone.trim(),
                password: password.trim(),
            })

            const role = response?.user?.role
            if (response?.user) {
                localStorage.setItem('feedflow-auth-user', JSON.stringify(response.user))
                window.dispatchEvent(new Event('feedflow-auth-changed'))
            }
            setNotice('Đăng nhập thành công. Đang chuyển trang...')

            if (role === 'Agent') {
                navigate('/agent')
                return
            }

            if (role === 'Admin') {
                navigate('/admin')
                return
            }

            navigate('/')
        } catch (apiError) {
            setError(apiError?.message || 'Đăng nhập thất bại.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="route-page login-page">
            <h1>Đăng nhập</h1>
            <p>Nhập số điện thoại và mật khẩu để đăng nhập hệ thống.</p>

            <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-label" htmlFor="phone-input">Số điện thoại</label>
                <input
                    id="phone-input"
                    className="login-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="VD: 0901234567"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                />

                <label className="login-label" htmlFor="password-input">Mật khẩu</label>
                <input
                    id="password-input"
                    className="login-input"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                {error ? <p className="login-feedback error">{error}</p> : null}
                {notice ? <p className="login-feedback notice">{notice}</p> : null}

                <div className="login-actions">
                    <button type="submit" className="action-btn login-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
                    </button>
                    <Link to="/" className="action-btn ghost">Quay về Home</Link>
                </div>

                <div className="auth-alt-links">
                    <Link to="/forgot-password">Quên mật khẩu?</Link>
                    <Link to="/register">Chưa có tài khoản? Đăng ký</Link>
                </div>
            </form>
        </section>
    )
}

export default LoginPage