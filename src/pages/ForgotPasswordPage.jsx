import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/authApi.js'

function ForgotPasswordPage() {
    const navigate = useNavigate()
    const [phone, setPhone] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setNotice('')

        if (!phone.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin.')
            return
        }

        if (newPassword.trim() !== confirmPassword.trim()) {
            setError('Mật khẩu xác nhận không khớp.')
            return
        }

        try {
            setIsSubmitting(true)
            await forgotPassword({
                phone: phone.trim(),
                newPassword: newPassword.trim(),
                confirmPassword: confirmPassword.trim(),
            })

            setNotice('Đặt lại mật khẩu thành công. Đang chuyển đến trang đăng nhập...')
            setTimeout(() => navigate('/login'), 700)
        } catch (apiError) {
            setError(apiError?.message || 'Không thể đặt lại mật khẩu.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="route-page login-page">
            <h1>Quên mật khẩu</h1>
            <p>Nhập số điện thoại và mật khẩu mới để đặt lại tài khoản.</p>

            <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-label" htmlFor="forgot-phone-input">Số điện thoại</label>
                <input
                    id="forgot-phone-input"
                    className="login-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="VD: 0901234567"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                />

                <label className="login-label" htmlFor="new-password-input">Mật khẩu mới</label>
                <input
                    id="new-password-input"
                    className="login-input"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                />

                <label className="login-label" htmlFor="confirm-new-password-input">Xác nhận mật khẩu mới</label>
                <input
                    id="confirm-new-password-input"
                    className="login-input"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                />

                {error ? <p className="login-feedback error">{error}</p> : null}
                {notice ? <p className="login-feedback notice">{notice}</p> : null}

                <div className="login-actions">
                    <button type="submit" className="action-btn login-submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>
                    <Link to="/login" className="action-btn ghost">Quay lại đăng nhập</Link>
                </div>
            </form>
        </section>
    )
}

export default ForgotPasswordPage