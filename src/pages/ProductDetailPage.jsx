import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

function ProductDetailPage() {
    const { productId } = useParams()
    const decodedProductId = decodeURIComponent(productId || '')
    const [product, setProduct] = useState(null)
    const [status, setStatus] = useState('Đang tải chi tiết sản phẩm...')

    useEffect(() => {
        let cancelled = false

        async function loadDetail() {
            if (!decodedProductId) {
                if (!cancelled) {
                    setStatus('ID sản phẩm không hợp lệ.')
                }
                return
            }

            console.log('Loading product with ID:', decodedProductId)

            try {
                const detail = await productsApi.getById(decodedProductId)
                console.log('Product loaded:', detail)
                if (!cancelled) {
                    setProduct(detail)
                    setStatus('')
                }
            } catch (error) {
                console.error('Error loading product:', error)
                if (!cancelled) {
                    setStatus(`Không tìm thấy sản phẩm. Lỗi: ${error.message}`)
                }
            }
        }

        loadDetail()
        return () => {
            cancelled = true
        }
    }, [decodedProductId])

    if (status) {
        return (
            <section className="route-page">
                <p>{status}</p>
                <Link className="action-btn" to="/">
                    Quay lại Home
                </Link>
            </section>
        )
    }

    if (!product) {
        return null
    }

    return (
        <section className="route-page">
            <p className="eyebrow">Chi tiết sản phẩm</p>
            <h1>{product.productName}</h1>
            <div className="detail-card">
                <img
                    className="detail-media"
                    src={product.imageUrl || fallbackProductImage}
                    alt={product.productName}
                    onError={(event) => {
                        event.currentTarget.src = fallbackProductImage
                    }}
                />
                <p>
                    <strong>Thương hiệu:</strong> {product.brand || 'Đang cập nhật'}
                </p>
                <p>
                    <strong>Danh mục:</strong> {product.category}
                </p>
                <p>
                    <strong>Đơn vị:</strong> {product.unit}
                </p>
                <p>
                    <strong>Trọng lượng:</strong> {Number(product.weight || 0).toFixed(2)} kg/{product.unit}
                </p>
                <p>
                    <strong>Giá:</strong> {currencyFormatter.format(product.unitPrice)}
                </p>
                <p>
                    <strong>Mô tả:</strong> {product.description || 'Đang cập nhật.'}
                </p>
                <p>
                    <strong>Trạng thái:</strong> {product.isActive ? 'Đang kinh doanh' : 'Tạm dừng'}
                </p>
            </div>
            <div className="detail-actions">
                <Link className="action-btn" to="/">
                    Quay lại danh sách
                </Link>
            </div>
        </section>
    )
}

export default ProductDetailPage
