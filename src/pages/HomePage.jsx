import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createProductsApi } from '../api/productsApi.js'
import { API_BASE_URL } from '../config/env.js'

const productsApi = createProductsApi(API_BASE_URL)
const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
})

const fallbackProductImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#f6e4cf"/><stop offset="1" stop-color="#ead6b8"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#7a6452" font-size="28" font-family="Arial, sans-serif">Hinh anh san pham</text></svg>'
)}`

function HomePage() {
    const [products, setProducts] = useState([])
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [status, setStatus] = useState('Đang kết nối dữ liệu...')

    useEffect(() => {
        let cancelled = false

        async function loadProducts() {
            try {
                const result = await productsApi.getAll()
                if (!cancelled) {
                    setProducts(result)
                    setStatus('')
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus('Không thể tải dữ liệu sản phẩm. Kiểm tra backend và CORS.')
                }
                console.error(error)
            }
        }

        loadProducts()
        return () => {
            cancelled = true
        }
    }, [])

    const categories = useMemo(
        () => ['all', ...new Set(products.map((item) => item.category))],
        [products]
    )

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        return products.filter((item) => {
            const matchCategory = category === 'all' || item.category === category
            const matchSearch = item.productName.toLowerCase().includes(normalizedSearch)
            return matchCategory && matchSearch
        })
    }, [products, category, search])

    return (
        <>
            <section className="hero reveal">
                <p className="eyebrow">Public Home</p>
                <h1>Nguồn Thức Ăn Gia Súc Cho Đại Lý Và Hộ Chăn Nuôi</h1>
                <p className="subtitle">
                    Trang công khai cho người dùng xem sản phẩm. Khu vực Agent và Admin được tách route riêng.
                </p>
            </section>

            <section className="toolbar reveal" aria-label="Bộ lọc">
                <input
                    className="search"
                    type="search"
                    placeholder="Tìm tên sản phẩm..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />

                <div className="chips">
                    {categories.map((item) => (
                        <button
                            key={item}
                            className={`chip ${category === item ? 'active' : ''}`}
                            onClick={() => setCategory(item)}
                        >
                            {item === 'all' ? 'Tất cả' : item}
                        </button>
                    ))}
                </div>
            </section>

            <section className="products reveal">
                <div className="section-head">
                    <h2>Danh Sách Sản Phẩm</h2>
                    <p className="meta">{filteredProducts.length} sản phẩm</p>
                </div>

                <div className="status" role="status" aria-live="polite">
                    {status}
                </div>

                <div className="grid">
                    {!status && filteredProducts.length === 0 ? (
                        <p className="empty">Không tìm thấy sản phẩm phù hợp.</p>
                    ) : null}

                    {filteredProducts.map((item, index) => (
                        <article className="card" style={{ animationDelay: `${index * 70}ms` }} key={item.productId}>
                            <img
                                className="product-media"
                                src={item.imageUrl || fallbackProductImage}
                                alt={item.productName}
                                loading="lazy"
                                onError={(event) => {
                                    event.currentTarget.src = fallbackProductImage
                                }}
                            />
                            <p className="tag">{item.category}</p>
                            <h3>{item.productName}</h3>
                            <p className="meta-line">{item.brand || 'Thương hiệu đang cập nhật'}</p>
                            <p className="meta-line">Quy cách: {Number(item.weight || 0).toFixed(2)} kg/{item.unit || 'bao'}</p>
                            <p className="desc">{item.description || 'Sản phẩm chất lượng cao, thông tin đang cập nhật.'}</p>
                            <div className="card-foot">
                                <strong>{currencyFormatter.format(item.unitPrice)}</strong>
                                <span>/ {item.unit}</span>
                            </div>
                            <Link className="detail-link" to={`/products/${encodeURIComponent(item.productId)}`}>
                                Xem chi tiết
                            </Link>
                        </article>
                    ))}
                </div>
            </section>
        </>
    )
}

export default HomePage
