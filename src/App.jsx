import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './components/MainLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import ProductDetailPage from './pages/ProductDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import AgentPortalPage from './pages/AgentPortalPage.jsx'
import AdminPortalPage from './pages/AdminPortalPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function readAuthUser() {
    try {
        const rawUser = localStorage.getItem('feedflow-auth-user')
        return rawUser ? JSON.parse(rawUser) : null
    } catch {
        return null
    }
}

function RoleRoute({ allowedRoles, children }) {
    const authUser = readAuthUser()

    if (!authUser) {
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(authUser.role)) {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products/:productId" element={<ProductDetailPage />} />
                <Route
                    path="/agent"
                    element={(
                        <RoleRoute allowedRoles={['Agent']}>
                            <AgentPortalPage />
                        </RoleRoute>
                    )}
                />
                <Route
                    path="/admin"
                    element={(
                        <RoleRoute allowedRoles={['Admin']}>
                            <AdminPortalPage />
                        </RoleRoute>
                    )}
                />
                <Route
                    path="/login"
                    element={<LoginPage />}
                />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="/home" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
