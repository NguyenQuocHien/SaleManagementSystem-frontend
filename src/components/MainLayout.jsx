import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/env.js'

function readAuthUser() {
    try {
        const rawUser = localStorage.getItem('feedflow-auth-user')
        return rawUser ? JSON.parse(rawUser) : null
    } catch {
        return null
    }
}

function MainLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const navLinkClass = ({ isActive }) => (isActive ? 'active' : '')
    const [authUser, setAuthUser] = useState(() => readAuthUser())
    const isPortalRoute = location.pathname.startsWith('/agent') || location.pathname.startsWith('/admin')
    const hideHomeLink = Boolean(authUser) && isPortalRoute

    useEffect(() => {
        setAuthUser(readAuthUser())
    }, [location.pathname])

    useEffect(() => {
        const syncAuthState = () => {
            setAuthUser(readAuthUser())
        }

        window.addEventListener('storage', syncAuthState)
        window.addEventListener('feedflow-auth-changed', syncAuthState)

        return () => {
            window.removeEventListener('storage', syncAuthState)
            window.removeEventListener('feedflow-auth-changed', syncAuthState)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('feedflow-auth-user')
        window.dispatchEvent(new Event('feedflow-auth-changed'))
        navigate('/login')
    }

    return (
        <div className="app-shell">
            <div className="orb orb-a"></div>
            <div className="orb orb-b"></div>

            <header className="topbar">
                <NavLink to="/" className="brand">
                    FeedFlow
                </NavLink>

                <nav className="links">
                    {!hideHomeLink ? (
                        <NavLink to="/" className={navLinkClass} end>
                            Home
                        </NavLink>
                    ) : null}
                    {authUser?.role === 'Agent' ? (
                        <NavLink to="/agent" className={navLinkClass}>
                            Agent
                        </NavLink>
                    ) : null}
                    {authUser?.role === 'Admin' ? (
                        <NavLink to="/admin" className={navLinkClass}>
                            Admin
                        </NavLink>
                    ) : null}
                    {!authUser ? (
                        <>
                            <NavLink to="/login" className={navLinkClass}>
                                Đăng nhập
                            </NavLink>
                            <NavLink to="/register" className={navLinkClass}>
                                Đăng ký
                            </NavLink>
                        </>
                    ) : (
                        <button type="button" className="nav-logout" onClick={handleLogout}>
                            Logout
                        </button>
                    )}
                    {/* <a href={`${API_BASE_URL}/swagger`} target="_blank" rel="noreferrer">
                        Swagger
                    </a> */}
                </nav>
            </header>

            <main className="content">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout
