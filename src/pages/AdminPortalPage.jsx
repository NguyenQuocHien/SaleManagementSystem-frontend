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

    return (
        <section className="agent-shell">
            <div className="agent-head">
                <p className="eyebrow">Admin Workspace</p>
                <h1>Dashboard quản trị</h1>
                <p className="subtitle">Quản lý toàn bộ tài khoản hệ thống, theo dõi trạng thái và khóa/mở khóa tài khoản trực tiếp.</p>
                <div className="agent-head-actions">
                    <button type="button" className="action-btn" onClick={() => loadUsers()}>Làm mới dữ liệu</button>
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
                                                    <button
                                                        type="button"
                                                        className={`mini-btn ${user.isActive ? 'danger' : ''}`}
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={updatingUserId === user.userId}
                                                    >
                                                        {updatingUserId === user.userId
                                                            ? 'Đang xử lý...'
                                                            : user.isActive
                                                                ? 'Khóa tài khoản'
                                                                : 'Mở khóa'}
                                                    </button>
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
        </section>
    )
}

export default AdminPortalPage
