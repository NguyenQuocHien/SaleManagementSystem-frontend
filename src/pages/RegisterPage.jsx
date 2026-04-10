import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAccount } from '../api/authApi.js'

function RegisterPage() {
    const navigate = useNavigate()
    const [fullName, setFullName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setNotice('')

        if (!fullName.trim() || !username.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin đăng ký.')
            return
        }

        if (password.trim() !== confirmPassword.trim()) {
            setError('Mật khẩu xác nhận không khớp.')
            return
        }

        try {
            setIsSubmitting(true)

            await registerAccount({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password: password.trim(),
                confirmPassword: confirmPassword.trim(),
            })

            setNotice('Đăng ký thành công. Đang chuyển đến trang đăng nhập...')
            setTimeout(() => navigate('/login'), 700)
        } catch (apiError) {
            setError(apiError?.message || 'Đăng ký thất bại.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="route-page login-page">
            <h1>Đăng ký</h1>
            <p>Tạo tài khoản đại lý mới để đăng nhập hệ thống.</p>

            <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-label" htmlFor="full-name-input">Họ và tên</label>
                <input
                    id="full-name-input"
                    className="login-input"
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                />

                <label className="login-label" htmlFor="username-register-input">Tên đăng nhập</label>
                <input
                    id="username-register-input"
                    className="login-input"
                    type="text"
                    placeholder="VD: nguyenvana"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />

                <label className="login-label" htmlFor="email-register-input">Email</label>
                <input
                    id="email-register-input"
                    className="login-input"
                    type="email"
                    placeholder="VD: vana@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />

                <label className="login-label" htmlFor="phone-register-input">Số điện thoại</label>
                <input
                    id="phone-register-input"
                    className="login-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="VD: 0901234567"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                />

                <label className="login-label" htmlFor="password-register-input">Mật khẩu</label>
                <input
                    id="password-register-input"
                    className="login-input"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />

                <label className="login-label" htmlFor="confirm-password-register-input">Xác nhận mật khẩu</label>
                <input
                    id="confirm-password-register-input"
                    className="login-input"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                />

                {error ? <p className="login-feedback error">{error}</p> : null}
                {notice ? <p className="login-feedback notice">{notice}</p> : null}

                <div className="login-actions">
                    <button type="submit" className="action-btn login-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
                    </button>
                    <Link to="/login" className="action-btn ghost">Đăng Nhập</Link>
                </div>
            </form>
        </section>
    )
}

export default RegisterPage