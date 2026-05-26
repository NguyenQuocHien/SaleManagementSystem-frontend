import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config/env.js'
import { createUsersApi } from '../api/usersApi.js'

const usersApi = createUsersApi(API_BASE_URL)

function formatDate(dateText) {
    if (!dateText) {
        return '-'
    }

    const date = new Date(dateText)
    if (Number.isNaN(date.getTime())) {
        return '-'
    }

    return date.toLocaleDateString('vi-VN')
}

function AdminPortalPage() {
    const [authUser] = useState(() => {
        try {
            const rawUser = localStorage.getItem('feedflow-auth-user')
            return rawUser ? JSON.parse(rawUser) : null
        } catch {
            return null
        }
    })

    const [users, setUsers] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [roleFilter, setRoleFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [pageError, setPageError] = useState('')
    const [pageNotice, setPageNotice] = useState('')
    const [updatingUserId, setUpdatingUserId] = useState('')

    // Form modal state
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
    const [formErrors, setFormErrors] = useState({})
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        fullName: '',
        phone: '',
        role: '1',
    })
    const [editingUserId, setEditingUserId] = useState('')
    const [isSubmittingForm, setIsSubmittingForm] = useState(false)

    const clearMessages = () => {
        setPageError('')
        setPageNotice('')
    }

    const loadUsers = async ({ preserveMessages = false } = {}) => {
        setIsLoading(true)

        try {
            if (!preserveMessages) {
                clearMessages()
            }
            const userList = await usersApi.getAll()
            setUsers(Array.isArray(userList) ? userList : [])
        } catch (error) {
            setPageError(error?.message || 'Không thể tải danh sách tài khoản.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const roles = useMemo(() => {
        const distinctRoles = [...new Set(users.map((item) => item.role).filter(Boolean))]
        return ['all', ...distinctRoles]
    }, [users])

    const stats = useMemo(() => {
        const total = users.length
        const active = users.filter((item) => item.isActive).length
        const banned = total - active
        const admins = users.filter((item) => item.role === 'Admin').length
        const agents = users.filter((item) => item.role === 'Agent').length

        return [
            { label: 'Tổng tài khoản', value: total, hint: 'Toàn hệ thống' },
            { label: 'Đang hoạt động', value: active, hint: 'Có thể đăng nhập' },
            { label: 'Đã bị khóa', value: banned, hint: 'Bị cấm đăng nhập' },
            { label: 'Admin / Agent', value: `${admins} / ${agents}`, hint: 'Theo vai trò' },
        ]
    }, [users])

    const filteredUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return users.filter((item) => {
            const matchesStatus =
                statusFilter === 'all'
                || (statusFilter === 'active' && item.isActive)
                || (statusFilter === 'banned' && !item.isActive)

            const matchesRole = roleFilter === 'all' || item.role === roleFilter

            const searchable = [item.fullName, item.username, item.email, item.phone]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()

            const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch)

            return matchesStatus && matchesRole && matchesSearch
        })
    }, [users, search, statusFilter, roleFilter])

    const handleToggleStatus = async (targetUser) => {
        if (!targetUser?.userId) {
            return
        }

        if (authUser?.userId === targetUser.userId && targetUser.isActive) {
            setPageError('Không thể tự khóa chính tài khoản Admin đang đăng nhập.')
            return
        }

        clearMessages()
        setUpdatingUserId(targetUser.userId)

        try {
            if (targetUser.isActive) {
                await usersApi.deactivate(targetUser.userId)
                await loadUsers({ preserveMessages: true })
                setPageNotice(`Đã khóa tài khoản ${targetUser.username}.`)
            } else {
                await usersApi.activate(targetUser.userId)
                await loadUsers({ preserveMessages: true })
                setPageNotice(`Đã mở khóa tài khoản ${targetUser.username}.`)
            }
        } catch (error) {
            setPageError(error?.message || 'Không thể cập nhật trạng thái tài khoản.')
        } finally {
            setUpdatingUserId('')
        }
    }

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            email: '',
            fullName: '',
            phone: '',
            role: '1',
        })
        setFormErrors({})
    }

    const openCreateModal = () => {
        setModalMode('create')
        resetForm()
        setEditingUserId('')
        setShowModal(true)
    }

    const openEditModal = (user) => {
        setModalMode('edit')
        setEditingUserId(user.userId)
        setFormData({
            username: user.username,
            password: '',
            confirmPassword: '',
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: String(user.role),
        })
        setFormErrors({})
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        resetForm()
        setEditingUserId('')
    }

    const validateForm = () => {
        const errors = {}

        if (!formData.username.trim()) {
            errors.username = 'Username không được để trống'
        }

        if (!formData.email.trim()) {
            errors.email = 'Email không được để trống'
        } else if (!formData.email.includes('@')) {
            errors.email = 'Email không hợp lệ'
        }

        if (!formData.fullName.trim()) {
            errors.fullName = 'Họ tên không được để trống'
        }

        if (!formData.phone.trim()) {
            errors.phone = 'Số điện thoại không được để trống'
        }

        if (modalMode === 'create') {
            if (!formData.password.trim()) {
                errors.password = 'Mật khẩu không được để trống'
            } else if (formData.password.length < 6) {
                errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
            }

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Mật khẩu không khớp'
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmitForm = async (event) => {
        event.preventDefault()

        if (!validateForm()) {
            return
        }

        clearMessages()
        setIsSubmittingForm(true)

        try {
            if (modalMode === 'create') {
                const payload = {
                    username: formData.username.trim(),
                    password: formData.password.trim(),
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim(),
                    role: parseInt(formData.role),
                }
                await usersApi.create(payload)
                setPageNotice('Tạo tài khoản thành công.')
            } else {
                const payload = {
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim(),
                    role: parseInt(formData.role),
                }
                if (formData.password.trim()) {
                    payload.password = formData.password.trim()
                }
                await usersApi.update(editingUserId, payload)
                setPageNotice('Cập nhật tài khoản thành công.')
            }

            await loadUsers({ preserveMessages: true })
            closeModal()
        } catch (error) {
            setPageError(error?.message || 'Không thể lưu tài khoản.')
        } finally {
            setIsSubmittingForm(false)
        }
    }

    return (
        <section className="agent-shell">
            <div className="agent-head">
                <h1>Dashboard quản trị</h1>
                <div className="agent-head-actions">
                    <button type="button" className="action-btn" onClick={openCreateModal} style={{ marginLeft: '8px', backgroundColor: '#4CAF50' }}>+ Tạo tài khoản</button>
                </div>
            </div>

            {pageError ? <p className="agent-feedback error">{pageError}</p> : null}
            {pageNotice ? <p className="agent-feedback notice">{pageNotice}</p> : null}

            {isLoading ? <p className="agent-loading">Đang tải dữ liệu tài khoản...</p> : null}

            {!isLoading ? (
                <>
                    <div className="agent-block dashboard-grid">
                        {stats.map((item) => (
                            <article className="metric-card" key={item.label}>
                                <p className="metric-label">{item.label}</p>
                                <p className="metric-value">{item.value}</p>
                                <p className="metric-hint">{item.hint}</p>
                            </article>
                        ))}
                    </div>

                    <div className="agent-block">
                        <div className="agent-section-title">
                            <h2>Quản lý tài khoản</h2>
                        </div>

                        <div className="admin-filters">
                            <input
                                type="search"
                                className="search"
                                placeholder="Tìm theo tên, username, email, số điện thoại..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />

                            <select
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value)}
                            >
                                {roles.map((role) => (
                                    <option key={role} value={role}>
                                        {role === 'all' ? 'Tất cả vai trò' : role}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="banned">Đã khóa</option>
                            </select>
                        </div>

                        <div className="table-wrap">
                            <table className="agent-table">
                                <thead>
                                    <tr>
                                        <th>Họ tên</th>
                                        <th>Username</th>
                                        <th>Vai trò</th>
                                        <th>Điện thoại</th>
                                        <th>Email</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="agent-empty-cell">Không có tài khoản phù hợp với bộ lọc.</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.userId}>
                                                <td>{user.fullName}</td>
                                                <td>{user.username}</td>
                                                <td>{user.role}</td>
                                                <td>{user.phone}</td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`status-pill ${user.isActive ? 'active' : 'banned'}`}>
                                                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(user.createdDate)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        <button
                                                            type="button"
                                                            className="mini-btn"
                                                            onClick={() => openEditModal(user)}
                                                            disabled={updatingUserId === user.userId}
                                                            style={{ fontSize: '12px', padding: '4px 8px' }}
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`mini-btn ${user.isActive ? 'danger' : ''}`}
                                                            onClick={() => handleToggleStatus(user)}
                                                            disabled={updatingUserId === user.userId}
                                                            style={{ fontSize: '12px', padding: '4px 8px' }}
                                                        >
                                                            {updatingUserId === user.userId
                                                                ? 'Đang xử lý...'
                                                                : user.isActive
                                                                    ? 'Khóa'
                                                                    : 'Mở khóa'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}

            {/* Modal Form */}
            {showModal ? (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'create' ? 'Tạo tài khoản mới' : 'Sửa thông tin tài khoản'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>

                        <form onSubmit={handleSubmitForm} className="modal-form">
                            {formErrors.general && (
                                <p className="form-error">{formErrors.general}</p>
                            )}

                            <div className="form-group">
                                <label htmlFor="username">Username *</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className={formErrors.username ? 'error' : ''}
                                    disabled={isSubmittingForm || modalMode === 'edit'}
                                />
                                {formErrors.username && <p className="field-error">{formErrors.username}</p>}
                            </div>

                            {modalMode === 'create' ? (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="password">Mật khẩu *</label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className={formErrors.password ? 'error' : ''}
                                            disabled={isSubmittingForm}
                                        />
                                        {formErrors.password && <p className="field-error">{formErrors.password}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className={formErrors.confirmPassword ? 'error' : ''}
                                            disabled={isSubmittingForm}
                                        />
                                        {formErrors.confirmPassword && <p className="field-error">{formErrors.confirmPassword}</p>}
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="password">Mật khẩu mới (để trống nếu không thay đổi)</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={formErrors.password ? 'error' : ''}
                                        disabled={isSubmittingForm}
                                    />
                                    {formErrors.password && <p className="field-error">{formErrors.password}</p>}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={formErrors.email ? 'error' : ''}
                                    disabled={isSubmittingForm}
                                />
                                {formErrors.email && <p className="field-error">{formErrors.email}</p>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="fullName">Họ tên *</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className={formErrors.fullName ? 'error' : ''}
                                    disabled={isSubmittingForm}
                                />
                                {formErrors.fullName && <p className="field-error">{formErrors.fullName}</p>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Số điện thoại *</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={formErrors.phone ? 'error' : ''}
                                    disabled={isSubmittingForm}
                                />
                                {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Vai trò *</label>
                                <select
                                    id="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    disabled={isSubmittingForm}
                                >
                                    <option value="1">Agent</option>
                                    <option value="2">Staff</option>
                                    <option value="3">User</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal} disabled={isSubmittingForm}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-primary" disabled={isSubmittingForm}>
                                    {isSubmittingForm ? 'Đang xử lý...' : modalMode === 'create' ? 'Tạo tài khoản' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </section>
    )
}

export default AdminPortalPage
