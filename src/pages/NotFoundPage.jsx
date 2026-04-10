import { Link } from 'react-router-dom'

function NotFoundPage() {
    return (
        <section className="route-page">
            <h1>Không tìm thấy trang</h1>
            <p>Đường dẫn không tồn tại.</p>
            <Link className="action-btn" to="/">
                Quay lại Home
            </Link>
        </section>
    )
}

export default NotFoundPage
