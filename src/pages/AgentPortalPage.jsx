import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/env.js'
import { createCustomersApi } from '../api/customersApi.js'
import { createDebtApi } from '../api/debtApi.js'
import { createImportReceiptsApi } from '../api/importReceiptsApi.js'
import { createInventoryApi } from '../api/inventoryApi.js'
import { createProductsApi } from '../api/productsApi.js'
import { createSalesApi } from '../api/salesApi.js'
import { createUploadsApi } from '../api/uploadsApi.js'

const productsApi = createProductsApi(API_BASE_URL)
const debtApi = createDebtApi(API_BASE_URL)
const salesApi = createSalesApi(API_BASE_URL)
const importReceiptsApi = createImportReceiptsApi(API_BASE_URL)
const customersApi = createCustomersApi(API_BASE_URL)
const inventoryApi = createInventoryApi(API_BASE_URL)
const uploadsApi = createUploadsApi(API_BASE_URL)

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
})

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

function readAuthUser() {
    try {
        const rawUser = localStorage.getItem('feedflow-auth-user')
        return rawUser ? JSON.parse(rawUser) : null
    } catch {
        return null
    }
}

function createDefaultProductForm() {
    return {
        productName: '',
        brand: '',
        category: '',
        unit: '',
        weight: '',
        unitPrice: '',
        imageUrl: '',
        description: '',
        isActive: true,
    }
}

function isValidImageUrl(url) {
    if (!url) {
        return true
    }

    try {
        const parsed = new URL(url)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
        return false
    }
}

function normalizeVndInput(value) {
    return String(value ?? '').replace(/[^\d]/g, '')
}

function parseVndAmount(value) {
    const normalized = normalizeVndInput(value)
    return normalized ? Number(normalized) : 0
}

function toVndInputValue(value) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return ''
    }

    return String(Math.round(numericValue))
}

function createDefaultSaleForm() {
    return {
        customerId: '',
        inventoryId: '',
        unitType: 'Bag',
        quantity: '',
        dueDate: '',
        notes: '',
        itemNotes: '',
    }
}

function createDefaultReceiptForm() {
    return {
        productId: '',
        supplierName: '',
        warehouseLocation: '',
        costPrice: '',
        imageUrl: '',
        bagQuantity: '',
        looseQuantity: '',
        reorderLevel: '',
        manufactureDate: '',
        expiryDate: '',
        notes: '',
    }
}

function createDefaultInventoryAdjustForm() {
    return {
        inventoryId: '',
        quantityChange: '',
        reason: 'Điều chỉnh thủ công',
    }
}

function getInventoryTotalQuantity(item) {
    if (item?.totalQuantity !== undefined && item?.totalQuantity !== null) {
        return Number(item.totalQuantity) || 0
    }

    const bagQuantity = Number(item?.bagQuantity) || 0
    const bagWeight = Number(item?.bagWeight) || 0
    const looseQuantity = Number(item?.looseQuantity) || 0
    return (bagQuantity * bagWeight) + looseQuantity
}

function AgentPortalPage() {
    const [authUser] = useState(() => readAuthUser())
    const [activeTab, setActiveTab] = useState('products')
    const [isLoading, setIsLoading] = useState(true)
    const [busyAction, setBusyAction] = useState('')
    const [pageError, setPageError] = useState('')
    const [pageNotice, setPageNotice] = useState('')

    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [debtors, setDebtors] = useState([])
    const [unpaidSales, setUnpaidSales] = useState([])
    const [customers, setCustomers] = useState([])
    const [inventories, setInventories] = useState([])
    const [sales, setSales] = useState([])
    const [importReceipts, setImportReceipts] = useState([])

    const [productForm, setProductForm] = useState(createDefaultProductForm)
    const [productFormErrors, setProductFormErrors] = useState({})
    const [editingProductId, setEditingProductId] = useState('')

    const [saleForm, setSaleForm] = useState(createDefaultSaleForm)
    const [receiptForm, setReceiptForm] = useState(createDefaultReceiptForm)
    const [inventoryAdjustForm, setInventoryAdjustForm] = useState(createDefaultInventoryAdjustForm)
    const [paymentDrafts, setPaymentDrafts] = useState({})

    const agentId = authUser?.userId || ''
    const isAgent = authUser?.role === 'Agent'

    const clearMessages = () => {
        setPageError('')
        setPageNotice('')
    }

    const loadPortalData = async ({ preserveMessages = false, showGlobalLoading = true } = {}) => {
        if (!isAgent || !agentId) {
            setIsLoading(false)
            setPageError('Tài khoản hiện tại không phải Agent hoặc chưa đăng nhập.')
            return
        }

        if (showGlobalLoading) {
            setIsLoading(true)
        }

        if (!preserveMessages) {
            clearMessages()
        }

        try {
            const [
                productResult,
                categoryResult,
                debtorResult,
                unpaidResult,
                customerResult,
                inventoryResult,
                agentSalesResult,
                receiptResult,
            ] = await Promise.allSettled([
                productsApi.getAll(),
                productsApi.getCategories(),
                debtApi.getDebtors(),
                debtApi.getUnpaidSales(),
                customersApi.getActive(),
                inventoryApi.getAll(),
                salesApi.getByAgent(agentId),
                importReceiptsApi.getAll(),
            ])

            const safeProducts = productResult.status === 'fulfilled' && Array.isArray(productResult.value)
                ? productResult.value
                : []
            const safeCategories = categoryResult.status === 'fulfilled' && Array.isArray(categoryResult.value)
                ? categoryResult.value
                : []
            const safeDebtors = debtorResult.status === 'fulfilled' && Array.isArray(debtorResult.value)
                ? debtorResult.value
                : []
            const safeUnpaid = unpaidResult.status === 'fulfilled' && Array.isArray(unpaidResult.value)
                ? unpaidResult.value
                : []
            const safeCustomers = customerResult.status === 'fulfilled' && Array.isArray(customerResult.value)
                ? customerResult.value
                : []
            const safeInventories = inventoryResult.status === 'fulfilled' && Array.isArray(inventoryResult.value)
                ? inventoryResult.value
                : []
            const safeSales = agentSalesResult.status === 'fulfilled' && Array.isArray(agentSalesResult.value)
                ? agentSalesResult.value
                : []
            const safeReceipts = receiptResult.status === 'fulfilled' && Array.isArray(receiptResult.value)
                ? receiptResult.value
                : []

            setProducts(safeProducts)
            setCategories(safeCategories)
            setDebtors(safeDebtors.filter((item) => item.managedByUserId === agentId))
            setUnpaidSales(safeUnpaid.filter((item) => item.agentId === agentId))
            setCustomers(safeCustomers.filter((item) => item.managedByUserId === agentId))
            setInventories(safeInventories)
            setSales(safeSales)
            setImportReceipts(
                safeReceipts.filter((item) => !item.createdByUserId || item.createdByUserId === agentId)
            )

            if (productResult.status === 'rejected') {
                throw productResult.reason
            }
        } catch (error) {
            setPageError(error?.message || 'Không thể tải dữ liệu khu vực Agent.')
        } finally {
            if (showGlobalLoading) {
                setIsLoading(false)
            }
        }
    }

    useEffect(() => {
        loadPortalData()
    }, [])

    const metrics = useMemo(() => {
        const totalDebt = unpaidSales.reduce((sum, item) => sum + (Number(item.debtAmount) || 0), 0)
        const totalRevenue = sales.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)

        return [
            { label: 'Sản phẩm', value: products.length, hint: 'Danh mục đang kinh doanh' },
            { label: 'Hóa đơn bán', value: sales.length, hint: 'Đơn hàng đã ghi nhận' },
            { label: 'Công nợ cần thu', value: currencyFormatter.format(totalDebt), hint: `${unpaidSales.length} hóa đơn chưa thanh toán` },
            { label: 'Doanh số', value: currencyFormatter.format(totalRevenue), hint: 'Tổng tiền các hóa đơn đã tạo' },
        ]
    }, [products, sales, unpaidSales])

    const selectedInventory = useMemo(
        () => inventories.find((item) => item.inventoryId === saleForm.inventoryId) || null,
        [inventories, saleForm.inventoryId]
    )

    const selectedReceiptProduct = useMemo(
        () => products.find((item) => item.productId === receiptForm.productId) || null,
        [products, receiptForm.productId]
    )

    const lowStockInventories = useMemo(
        () => inventories.filter((item) => getInventoryTotalQuantity(item) <= (Number(item.reorderLevel) || 0)),
        [inventories]
    )

    const categoryOptions = useMemo(() => {
        const fromApi = categories
            .map((item) => String(item || '').trim())
            .filter(Boolean)

        const fromProducts = products
            .map((item) => String(item?.category || '').trim())
            .filter(Boolean)

        const options = Array.from(new Set([...fromApi, ...fromProducts])).sort((a, b) => a.localeCompare(b, 'vi'))
        return options.length > 0 ? options : ['Chưa phân loại']
    }, [categories, products])

    const handleProductFormChange = (field, value) => {
        setProductForm((prev) => ({ ...prev, [field]: value }))
        setProductFormErrors((prev) => {
            if (!prev[field]) {
                return prev
            }

            const next = { ...prev }
            delete next[field]
            return next
        })
    }

    const resetProductForm = () => {
        setProductForm(createDefaultProductForm())
        setProductFormErrors({})
        setEditingProductId('')
    }

    const handleUploadProductImage = async (event) => {
        const selectedFile = event.target.files?.[0]
        event.target.value = ''

        if (!selectedFile) {
            return
        }

        clearMessages()

        try {
            setBusyAction('upload-product-image')
            const result = await uploadsApi.uploadImage(selectedFile, 'products')
            const uploadedUrl = typeof result === 'string' ? result : result?.url

            if (!uploadedUrl) {
                throw new Error('Upload thành công nhưng không nhận được URL ảnh.')
            }

            setProductForm((prev) => ({ ...prev, imageUrl: uploadedUrl }))
            setProductFormErrors((prev) => {
                if (!prev.imageUrl) {
                    return prev
                }

                const next = { ...prev }
                delete next.imageUrl
                return next
            })
            setPageNotice('Đã tải ảnh sản phẩm lên Filebase.')
        } catch (error) {
            setPageError(error?.message || 'Không thể tải ảnh sản phẩm lên Filebase.')
        } finally {
            setBusyAction('')
        }
    }

    const handleUploadReceiptImage = async (event) => {
        const selectedFile = event.target.files?.[0]
        event.target.value = ''

        if (!selectedFile) {
            return
        }

        clearMessages()

        try {
            setBusyAction('upload-receipt-image')
            const result = await uploadsApi.uploadImage(selectedFile, 'import-receipts')
            const uploadedUrl = typeof result === 'string' ? result : result?.url

            if (!uploadedUrl) {
                throw new Error('Upload thành công nhưng không nhận được URL ảnh.')
            }

            setReceiptForm((prev) => ({ ...prev, imageUrl: uploadedUrl }))
            setPageNotice('Đã tải ảnh lô nhập lên Filebase.')
        } catch (error) {
            setPageError(error?.message || 'Không thể tải ảnh lô nhập lên Filebase.')
        } finally {
            setBusyAction('')
        }
    }

    const handleSubmitProduct = async (event) => {
        event.preventDefault()
        clearMessages()

        const unitPrice = parseVndAmount(productForm.unitPrice)
        const weight = Number(productForm.weight)
        const formErrors = {}

        if (!productForm.productName.trim()) {
            formErrors.productName = 'Vui lòng nhập tên sản phẩm.'
        }

        if (!productForm.category.trim()) {
            formErrors.category = 'Vui lòng chọn danh mục.'
        }

        if (!productForm.unit.trim()) {
            formErrors.unit = 'Vui lòng nhập đơn vị.'
        }

        if (!Number.isFinite(weight) || weight <= 0) {
            formErrors.weight = 'Trọng lượng phải lớn hơn 0.'
        }

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            formErrors.unitPrice = 'Đơn giá phải lớn hơn 0.'
        }

        if (!isValidImageUrl(productForm.imageUrl.trim())) {
            formErrors.imageUrl = 'URL ảnh không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://.'
        }

        if (Object.keys(formErrors).length > 0) {
            setProductFormErrors(formErrors)
            return
        }

        setProductFormErrors({})

        const payload = {
            productName: productForm.productName.trim(),
            brand: productForm.brand.trim() || null,
            category: productForm.category.trim(),
            unit: productForm.unit.trim(),
            weight,
            unitPrice,
            imageUrl: productForm.imageUrl.trim() || null,
            description: productForm.description.trim() || null,
        }

        try {
            setBusyAction('save-product')

            if (editingProductId) {
                await productsApi.update(editingProductId, {
                    ...payload,
                    isActive: productForm.isActive,
                })
                setPageNotice('Đã cập nhật sản phẩm thành công.')
            } else {
                await productsApi.create(payload)
                setPageNotice('Đã tạo sản phẩm mới thành công.')
            }

            resetProductForm()
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            const errorMessage = error?.message || 'Không thể lưu sản phẩm.'

            if (/sản phẩm|trọng lượng|tồn tại/i.test(errorMessage)) {
                setProductFormErrors({ productName: errorMessage })
            } else {
                setPageError(errorMessage)
            }
        } finally {
            setBusyAction('')
        }
    }

    const handleEditProduct = (product) => {
        setEditingProductId(product.productId)
        setProductForm({
            productName: product.productName || '',
            brand: product.brand || '',
            category: product.category || '',
            unit: product.unit || '',
            weight: String(product.weight ?? ''),
            unitPrice: toVndInputValue(product.unitPrice),
            imageUrl: product.imageUrl || '',
            description: product.description || '',
            isActive: Boolean(product.isActive),
        })
    }

    const handleDeleteProduct = async (product) => {
        if (!product?.productId) {
            return
        }

        const approved = window.confirm(`Xóa sản phẩm "${product.productName}"?`)
        if (!approved) {
            return
        }

        clearMessages()

        try {
            setBusyAction(`delete-${product.productId}`)
            await productsApi.remove(product.productId)
            setPageNotice('Đã xóa sản phẩm thành công.')
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            setPageError(error?.message || 'Không thể xóa sản phẩm.')
        } finally {
            setBusyAction('')
        }
    }

    const handlePayDebt = async (saleId) => {
        const amount = Number(paymentDrafts[saleId])

        clearMessages()

        if (!amount || amount <= 0) {
            setPageError('Số tiền thanh toán phải lớn hơn 0.')
            return
        }

        try {
            setBusyAction(`pay-${saleId}`)
            await debtApi.payDebt(saleId, amount)
            setPaymentDrafts((prev) => ({ ...prev, [saleId]: '' }))
            setPageNotice('Đã cập nhật thanh toán công nợ.')
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            setPageError(error?.message || 'Không thể thanh toán công nợ.')
        } finally {
            setBusyAction('')
        }
    }

    const handleCreateSale = async (event) => {
        event.preventDefault()
        clearMessages()

        if (!saleForm.customerId || !saleForm.inventoryId) {
            setPageError('Vui lòng chọn khách hàng và lô hàng tồn kho.')
            return
        }

        const quantity = Number(saleForm.quantity)
        if (!quantity || quantity <= 0) {
            setPageError('Số lượng bán phải lớn hơn 0.')
            return
        }

        if (!selectedInventory) {
            setPageError('Không tìm thấy lô hàng tồn kho đã chọn.')
            return
        }

        const payload = {
            agentId,
            customerId: saleForm.customerId,
            dueDate: saleForm.dueDate ? `${saleForm.dueDate}T00:00:00` : null,
            notes: saleForm.notes.trim() || null,
            saleItems: [
                {
                    productId: selectedInventory.productId,
                    inventoryId: selectedInventory.inventoryId,
                    unitType: saleForm.unitType,
                    quantity,
                    bagWeightUsed: Number(selectedInventory.bagWeight) || 0,
                    notes: saleForm.itemNotes.trim() || null,
                },
            ],
        }

        try {
            setBusyAction('create-sale')
            await salesApi.create(payload)
            setSaleForm(createDefaultSaleForm())
            setPageNotice('Đã tạo hóa đơn bán hàng thành công.')
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            setPageError(error?.message || 'Không thể tạo hóa đơn bán hàng.')
        } finally {
            setBusyAction('')
        }
    }

    const handleCreateReceipt = async (event) => {
        event.preventDefault()
        clearMessages()

        if (!receiptForm.productId || !receiptForm.warehouseLocation.trim()) {
            setPageError('Vui lòng chọn sản phẩm và vị trí kho.')
            return
        }

        if (!receiptForm.manufactureDate || !receiptForm.expiryDate) {
            setPageError('Vui lòng nhập đầy đủ ngày sản xuất và hạn sử dụng.')
            return
        }

        if (!isValidImageUrl(receiptForm.imageUrl.trim())) {
            setPageError('URL ảnh phiếu nhập không hợp lệ. Vui lòng nhập link bắt đầu bằng http:// hoặc https://, hoặc để trống.')
            return
        }

        const bagWeight = Number(selectedReceiptProduct?.weight) || 0
        const costPrice = parseVndAmount(receiptForm.costPrice)
        const bagQuantity = Number(receiptForm.bagQuantity)
        const looseQuantity = Number(receiptForm.looseQuantity)
        const reorderLevel = Number(receiptForm.reorderLevel)

        if (bagWeight <= 0 || costPrice <= 0 || bagQuantity < 0 || looseQuantity < 0 || reorderLevel < 0) {
            setPageError('Dữ liệu phiếu nhập không hợp lệ. Vui lòng kiểm tra lại số lượng và đơn giá.')
            return
        }

        const payload = {
            importDate: new Date().toISOString(),
            supplierName: receiptForm.supplierName.trim() || null,
            createdByUserId: agentId,
            notes: receiptForm.notes.trim() || null,
            items: [
                {
                    productId: receiptForm.productId,
                    warehouseLocation: receiptForm.warehouseLocation.trim(),
                    bagWeight,
                    costPrice,
                    imageUrl: receiptForm.imageUrl.trim() || null,
                    bagQuantity,
                    looseQuantity,
                    reorderLevel,
                    manufactureDate: `${receiptForm.manufactureDate}T00:00:00`,
                    expiryDate: `${receiptForm.expiryDate}T00:00:00`,
                },
            ],
        }

        try {
            setBusyAction('create-receipt')
            await importReceiptsApi.create(payload)
            setReceiptForm(createDefaultReceiptForm())
            setPageNotice('Đã tạo phiếu nhập kho thành công.')
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            setPageError(error?.message || 'Không thể tạo phiếu nhập kho.')
        } finally {
            setBusyAction('')
        }
    }

    const handleAdjustInventory = async (event) => {
        event.preventDefault()
        clearMessages()

        const quantityChange = Number(inventoryAdjustForm.quantityChange)
        if (!inventoryAdjustForm.inventoryId) {
            setPageError('Vui lòng chọn lô kho cần điều chỉnh.')
            return
        }

        if (!Number.isInteger(quantityChange) || quantityChange === 0) {
            setPageError('Số lượng điều chỉnh phải là số nguyên và khác 0.')
            return
        }

        try {
            setBusyAction('adjust-stock')
            await inventoryApi.adjustStock(
                inventoryAdjustForm.inventoryId,
                quantityChange,
                inventoryAdjustForm.reason.trim() || 'Điều chỉnh thủ công'
            )
            setInventoryAdjustForm(createDefaultInventoryAdjustForm())
            setPageNotice('Đã cập nhật tồn kho thành công.')
            await loadPortalData({ preserveMessages: true, showGlobalLoading: false })
        } catch (error) {
            setPageError(error?.message || 'Không thể điều chỉnh tồn kho.')
        } finally {
            setBusyAction('')
        }
    }

    if (!authUser) {
        return (
            <section className="route-page">
                <h1>Khu vực Agent</h1>
                <p>Bạn cần đăng nhập để sử dụng trang nghiệp vụ Agent.</p>
                <div className="login-actions">
                    <Link to="/login" className="action-btn">Đăng nhập</Link>
                    <Link to="/" className="action-btn ghost">Về Home</Link>
                </div>
            </section>
        )
    }

    if (!isAgent) {
        return (
            <section className="route-page">
                <h1>Không có quyền truy cập</h1>
                <p>Tài khoản hiện tại không thuộc vai trò Agent.</p>
                <div className="login-actions">
                    <Link to="/" className="action-btn">Về Home</Link>
                </div>
            </section>
        )
    }

    return (
        <section className="agent-shell">
            <div className="agent-head">

                <h1>Quản trị nghiệp vụ đại lý</h1>

                <div className="agent-head-actions">
                    <button type="button" className="action-btn" onClick={() => loadPortalData()}>
                        Làm mới dữ liệu
                    </button>
                </div>

                <div className="agent-tabs" role="tablist" aria-label="Chức năng Agent">
                    <button
                        type="button"
                        className={`agent-tab ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Quản lí sản phẩm
                    </button>
                    <button
                        type="button"
                        className={`agent-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Quản lý kho
                    </button>
                    <button
                        type="button"
                        className={`agent-tab ${activeTab === 'debt' ? 'active' : ''}`}
                        onClick={() => setActiveTab('debt')}
                    >
                        Quản lý công nợ
                    </button>
                    <button
                        type="button"
                        className={`agent-tab ${activeTab === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveTab('documents')}
                    >
                        Xuất/Nhập phiếu hóa đơn
                    </button>
                </div>
            </div>

            {isLoading ? <p className="agent-loading">Đang tải dữ liệu Agent...</p> : null}

            {!isLoading ? (
                <>
                    <div className="agent-block dashboard-grid">
                        {metrics.map((item) => (
                            <article className="metric-card" key={item.label}>
                                <p className="metric-label">{item.label}</p>
                                <p className="metric-value">{item.value}</p>
                                <p className="metric-hint">{item.hint}</p>
                            </article>
                        ))}
                    </div>

                    {activeTab === 'products' ? (
                        <div className="agent-block">
                            <div className="agent-section-title">

                                {editingProductId ? (
                                    <button type="button" className="soft-btn" onClick={resetProductForm}>
                                        Hủy chỉnh sửa
                                    </button>
                                ) : null}
                            </div>

                            <form className="agent-form" onSubmit={handleSubmitProduct}>
                                <label>
                                    Tên sản phẩm
                                    <input
                                        value={productForm.productName}
                                        onChange={(event) => handleProductFormChange('productName', event.target.value)}
                                        placeholder="Ví dụ: Cám heo tăng trọng"
                                    />
                                    {productFormErrors.productName ? <p className="form-field-error">{productFormErrors.productName}</p> : null}
                                </label>

                                <label>
                                    Thương hiệu
                                    <input
                                        value={productForm.brand}
                                        onChange={(event) => handleProductFormChange('brand', event.target.value)}
                                        placeholder="Ví dụ: Anco"
                                    />
                                </label>

                                <label>
                                    Danh mục
                                    <select
                                        value={productForm.category}
                                        onChange={(event) => handleProductFormChange('category', event.target.value)}
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categoryOptions.map((item) => (
                                            <option key={item} value={item}>{item}</option>
                                        ))}
                                    </select>
                                    {productFormErrors.category ? <p className="form-field-error">{productFormErrors.category}</p> : null}
                                </label>

                                <label>
                                    Đơn vị
                                    <input
                                        value={productForm.unit}
                                        onChange={(event) => handleProductFormChange('unit', event.target.value)}
                                        placeholder="Ví dụ: bao, kg"
                                    />
                                    {productFormErrors.unit ? <p className="form-field-error">{productFormErrors.unit}</p> : null}
                                </label>

                                <label>
                                    Trọng lượng (kg/bao)
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={productForm.weight}
                                        onChange={(event) => handleProductFormChange('weight', event.target.value)}
                                        placeholder="Ví dụ: 25 hoặc 40"
                                    />
                                    {productFormErrors.weight ? <p className="form-field-error">{productFormErrors.weight}</p> : null}
                                </label>

                                <label>
                                    Giá bán
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={productForm.unitPrice}
                                        onChange={(event) => handleProductFormChange('unitPrice', normalizeVndInput(event.target.value))}
                                        placeholder="Ví dụ: 540000 hoặc 540.000"
                                    />
                                    {productFormErrors.unitPrice ? <p className="form-field-error">{productFormErrors.unitPrice}</p> : null}
                                </label>

                                <label className="full">
                                    URL ảnh sản phẩm
                                    <input
                                        value={productForm.imageUrl}
                                        onChange={(event) => handleProductFormChange('imageUrl', event.target.value)}
                                        placeholder="https://..."
                                    />
                                    {productFormErrors.imageUrl ? <p className="form-field-error">{productFormErrors.imageUrl}</p> : null}
                                </label>

                                <label className="full">
                                    Hoặc tải ảnh từ máy lên Filebase
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleUploadProductImage}
                                        disabled={busyAction === 'upload-product-image'}
                                    />
                                </label>

                                <label className="full">
                                    Mô tả
                                    <textarea
                                        rows="2"
                                        value={productForm.description}
                                        onChange={(event) => handleProductFormChange('description', event.target.value)}
                                        placeholder="Thông tin mô tả sản phẩm"
                                    />
                                </label>

                                {editingProductId ? (
                                    <label className="checkbox full">
                                        <input
                                            type="checkbox"
                                            checked={productForm.isActive}
                                            onChange={(event) => handleProductFormChange('isActive', event.target.checked)}
                                        />
                                        Trạng thái hoạt động
                                    </label>
                                ) : null}

                                <div className="agent-form-actions full">
                                    <button type="submit" className="action-btn" disabled={busyAction === 'save-product' || busyAction === 'upload-product-image'}>
                                        {busyAction === 'save-product'
                                            ? 'Đang lưu...'
                                            : busyAction === 'upload-product-image'
                                                ? 'Đang tải ảnh...'
                                                : editingProductId
                                                    ? 'Cập nhật sản phẩm'
                                                    : 'Tạo sản phẩm'}
                                    </button>
                                </div>

                                {pageError ? <p className="agent-feedback error">{pageError}</p> : null}
                                {pageNotice ? <p className="agent-feedback notice">{pageNotice}</p> : null}

                            </form>

                            <div className="table-wrap compact">
                                <table className="agent-table">
                                    <thead>

                                        <tr>
                                            <th>Danh mục</th>
                                            <th>Tên sản phẩm</th>
                                            {/* <th>Thương hiệu</th> */}

                                            <th>Trọng lượng</th>
                                            {/* <th>Đơn vị</th> */}
                                            <th>Giá bán</th>
                                            <th>Ảnh</th>
                                            <th>Trạng thái</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="agent-empty-cell">Chưa có sản phẩm nào.</td>
                                            </tr>
                                        ) : (
                                            products.map((item) => (
                                                <tr key={item.productId}>
                                                    <td>{item.category}</td>
                                                    <td>{item.productName}</td>
                                                    {/* <td>{item.brand || '-'}</td> */}

                                                    <td>{Number(item.weight || 0).toFixed(2)} kg</td>
                                                    {/* <td>{item.unit}</td> */}
                                                    <td>{currencyFormatter.format(Number(item.unitPrice) || 0)}</td>
                                                    <td>{item.imageUrl ? 'Có ảnh' : 'Chưa có'}</td>
                                                    <td>
                                                        <span className={`status-pill ${item.isActive ? 'active' : 'banned'}`}>
                                                            {item.isActive ? 'Đang bán' : 'Ngừng bán'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="row-actions">
                                                            <button
                                                                type="button"
                                                                className="mini-btn"
                                                                onClick={() => handleEditProduct(item)}
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="mini-btn danger"
                                                                onClick={() => handleDeleteProduct(item)}
                                                                disabled={busyAction === `delete-${item.productId}`}
                                                            >
                                                                {busyAction === `delete-${item.productId}` ? 'Đang xóa...' : 'Xóa'}
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
                    ) : null}

                    {activeTab === 'debt' ? (
                        <>
                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Khách hàng còn công nợ</h2>
                                </div>

                                <div className="table-wrap">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Khách hàng</th>
                                                <th>Điện thoại</th>
                                                <th>Công nợ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {debtors.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="agent-empty-cell">Không có khách hàng nợ trong khu vực bạn quản lý.</td>
                                                </tr>
                                            ) : (
                                                debtors.map((item) => (
                                                    <tr key={item.customerId}>
                                                        <td>{item.customerName}</td>
                                                        <td>{item.phone || '-'}</td>
                                                        <td>{currencyFormatter.format(Number(item.totalDebt) || 0)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Thu nợ theo hóa đơn</h2>
                                </div>

                                <div className="table-wrap">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Đến hạn</th>
                                                <th>Công nợ còn lại</th>
                                                <th>Thanh toán</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unpaidSales.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="agent-empty-cell">Không có hóa đơn nợ nào.</td>
                                                </tr>
                                            ) : (
                                                unpaidSales.map((item) => (
                                                    <tr key={item.saleId}>
                                                        <td>{String(item.saleId).slice(0, 8)}...</td>
                                                        <td>{item.customerName || '-'}</td>
                                                        <td>{formatDate(item.dueDate)}</td>
                                                        <td>{currencyFormatter.format(Number(item.debtAmount) || 0)}</td>
                                                        <td>
                                                            <div className="inline-adjust">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={paymentDrafts[item.saleId] || ''}
                                                                    onChange={(event) => {
                                                                        const value = event.target.value
                                                                        setPaymentDrafts((prev) => ({ ...prev, [item.saleId]: value }))
                                                                    }}
                                                                    placeholder="Số tiền"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="mini-btn"
                                                                    onClick={() => handlePayDebt(item.saleId)}
                                                                    disabled={busyAction === `pay-${item.saleId}`}
                                                                >
                                                                    {busyAction === `pay-${item.saleId}` ? 'Đang thu...' : 'Thu nợ'}
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

                    {activeTab === 'inventory' ? (
                        <>
                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Điều chỉnh tồn kho</h2>
                                </div>

                                <form className="agent-form" onSubmit={handleAdjustInventory}>
                                    <label>
                                        Lô tồn kho
                                        <select
                                            value={inventoryAdjustForm.inventoryId}
                                            onChange={(event) => {
                                                setInventoryAdjustForm((prev) => ({
                                                    ...prev,
                                                    inventoryId: event.target.value,
                                                }))
                                            }}
                                        >
                                            <option value="">Chọn lô kho</option>
                                            {inventories.map((item) => (
                                                <option key={item.inventoryId} value={item.inventoryId}>
                                                    {item.productName} - {item.warehouseLocation} ({getInventoryTotalQuantity(item).toFixed(2)} kg)
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Số lượng điều chỉnh
                                        <input
                                            type="number"
                                            step="1"
                                            value={inventoryAdjustForm.quantityChange}
                                            onChange={(event) => {
                                                setInventoryAdjustForm((prev) => ({
                                                    ...prev,
                                                    quantityChange: event.target.value,
                                                }))
                                            }}
                                            placeholder="Ví dụ: 10 hoặc -5"
                                        />
                                    </label>

                                    <label className="full">
                                        Lý do điều chỉnh
                                        <input
                                            value={inventoryAdjustForm.reason}
                                            onChange={(event) => {
                                                setInventoryAdjustForm((prev) => ({
                                                    ...prev,
                                                    reason: event.target.value,
                                                }))
                                            }}
                                            placeholder="Mô tả lý do điều chỉnh"
                                        />
                                    </label>

                                    <div className="agent-form-actions full">
                                        <button type="submit" className="action-btn" disabled={busyAction === 'adjust-stock'}>
                                            {busyAction === 'adjust-stock' ? 'Đang cập nhật...' : 'Cập nhật tồn kho'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Cảnh báo sắp hết hàng</h2>
                                </div>

                                <div className="table-wrap compact">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Kho</th>
                                                <th>Tổng tồn (kg)</th>
                                                <th>Mức tái nhập</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockInventories.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="agent-empty-cell">Không có mặt hàng nào dưới mức tái nhập.</td>
                                                </tr>
                                            ) : (
                                                lowStockInventories.map((item) => (
                                                    <tr key={item.inventoryId}>
                                                        <td>{item.productName}</td>
                                                        <td>{item.warehouseLocation}</td>
                                                        <td>{getInventoryTotalQuantity(item).toFixed(2)}</td>
                                                        <td>{Number(item.reorderLevel || 0).toFixed(2)}</td>
                                                        <td>
                                                            <span className="status-pill banned">Sắp hết hàng</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Danh sách tồn kho</h2>
                                </div>

                                <div className="table-wrap compact">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Kho</th>
                                                <th>Kg/bao</th>
                                                <th>Số bao</th>
                                                <th>Kg lẻ</th>
                                                <th>Tổng tồn (kg)</th>
                                                <th>Mức tái nhập</th>
                                                <th>Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventories.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="agent-empty-cell">Chưa có dữ liệu tồn kho.</td>
                                                </tr>
                                            ) : (
                                                inventories.map((item) => (
                                                    <tr key={item.inventoryId}>
                                                        <td>{item.productName}</td>
                                                        <td>{item.warehouseLocation}</td>
                                                        <td>{Number(item.bagWeight || 0).toFixed(2)}</td>
                                                        <td>{item.bagQuantity || 0}</td>
                                                        <td>{Number(item.looseQuantity || 0).toFixed(2)}</td>
                                                        <td>{getInventoryTotalQuantity(item).toFixed(2)}</td>
                                                        <td>{Number(item.reorderLevel || 0).toFixed(2)}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="mini-btn"
                                                                onClick={() => {
                                                                    setInventoryAdjustForm((prev) => ({
                                                                        ...prev,
                                                                        inventoryId: item.inventoryId,
                                                                    }))
                                                                    setActiveTab('inventory')
                                                                }}
                                                            >
                                                                Điều chỉnh
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

                    {activeTab === 'documents' ? (
                        <>
                            <div className="debt-panels">
                                <article className="debt-panel">
                                    <h3>Tạo hóa đơn bán hàng</h3>
                                    <p className="meta-line">Chọn khách hàng và lô hàng tồn kho để lập hóa đơn.</p>

                                    <form className="agent-form" onSubmit={handleCreateSale}>
                                        <label>
                                            Khách hàng
                                            <select
                                                value={saleForm.customerId}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, customerId: event.target.value }))}
                                            >
                                                <option value="">Chọn khách hàng</option>
                                                {customers.map((item) => (
                                                    <option key={item.customerId} value={item.customerId}>
                                                        {item.customerName}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Lô tồn kho
                                            <select
                                                value={saleForm.inventoryId}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, inventoryId: event.target.value }))}
                                            >
                                                <option value="">Chọn lô tồn kho</option>
                                                {inventories.map((item) => (
                                                    <option key={item.inventoryId} value={item.inventoryId}>
                                                        {item.productName} - {item.warehouseLocation} ({item.bagWeight}kg/bao)
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Loại bán
                                            <select
                                                value={saleForm.unitType}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, unitType: event.target.value }))}
                                            >
                                                <option value="Bag">Bag (bao)</option>
                                                <option value="Loose">Loose (kg lẻ)</option>
                                            </select>
                                        </label>

                                        <label>
                                            Số lượng
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={saleForm.quantity}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Hạn thanh toán
                                            <input
                                                type="date"
                                                value={saleForm.dueDate}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Ghi chú hóa đơn
                                            <input
                                                value={saleForm.notes}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, notes: event.target.value }))}
                                                placeholder="Ghi chú chung"
                                            />
                                        </label>

                                        <label className="full">
                                            Ghi chú dòng hàng
                                            <input
                                                value={saleForm.itemNotes}
                                                onChange={(event) => setSaleForm((prev) => ({ ...prev, itemNotes: event.target.value }))}
                                                placeholder="Ghi chú cho dòng bán"
                                            />
                                        </label>

                                        <div className="agent-form-actions full">
                                            <button type="submit" className="action-btn" disabled={busyAction === 'create-sale'}>
                                                {busyAction === 'create-sale' ? 'Đang tạo...' : 'Tạo hóa đơn'}
                                            </button>
                                        </div>
                                    </form>
                                </article>

                                <article className="debt-panel">
                                    <h3>Tạo phiếu nhập kho</h3>
                                    <p className="meta-line">Nhập một dòng sản phẩm để cập nhật tồn kho theo phiếu nhập.</p>

                                    <form className="agent-form" onSubmit={handleCreateReceipt}>
                                        <label>
                                            Sản phẩm
                                            <select
                                                value={receiptForm.productId}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, productId: event.target.value }))}
                                            >
                                                <option value="">Chọn sản phẩm</option>
                                                {products.map((item) => (
                                                    <option key={item.productId} value={item.productId}>
                                                        {item.productName}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Nhà cung cấp
                                            <input
                                                value={receiptForm.supplierName}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, supplierName: event.target.value }))}
                                                placeholder="Tên nhà cung cấp"
                                            />
                                        </label>

                                        <label>
                                            Vị trí kho
                                            <input
                                                value={receiptForm.warehouseLocation}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, warehouseLocation: event.target.value }))}
                                                placeholder="Ví dụ: Kho A - Kệ 01"
                                            />
                                        </label>

                                        <label>
                                            Trọng lượng bao (kg)
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={selectedReceiptProduct ? Number(selectedReceiptProduct.weight || 0).toFixed(2) : ''}
                                                readOnly
                                                placeholder="Lấy theo sản phẩm"
                                            />
                                        </label>

                                        <label>
                                            Giá vốn
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={receiptForm.costPrice}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, costPrice: normalizeVndInput(event.target.value) }))}
                                                placeholder="Ví dụ: 320000 hoặc 320.000"
                                            />
                                        </label>

                                        <label>
                                            URL ảnh lô nhập (tuỳ chọn)
                                            <input
                                                value={receiptForm.imageUrl}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                                                placeholder="https://..."
                                            />
                                        </label>

                                        <label>
                                            Hoặc tải ảnh từ máy lên Filebase
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleUploadReceiptImage}
                                                disabled={busyAction === 'upload-receipt-image'}
                                            />
                                        </label>

                                        <label>
                                            Số bao
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={receiptForm.bagQuantity}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, bagQuantity: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Số lượng lẻ (kg)
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={receiptForm.looseQuantity}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, looseQuantity: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Mức tái nhập
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={receiptForm.reorderLevel}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, reorderLevel: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Ngày sản xuất
                                            <input
                                                type="date"
                                                value={receiptForm.manufactureDate}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, manufactureDate: event.target.value }))}
                                            />
                                        </label>

                                        <label>
                                            Hạn sử dụng
                                            <input
                                                type="date"
                                                value={receiptForm.expiryDate}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, expiryDate: event.target.value }))}
                                            />
                                        </label>

                                        <label className="full">
                                            Ghi chú phiếu nhập
                                            <input
                                                value={receiptForm.notes}
                                                onChange={(event) => setReceiptForm((prev) => ({ ...prev, notes: event.target.value }))}
                                                placeholder="Ghi chú bổ sung"
                                            />
                                        </label>

                                        <div className="agent-form-actions full">
                                            <button type="submit" className="action-btn" disabled={busyAction === 'create-receipt' || busyAction === 'upload-receipt-image'}>
                                                {busyAction === 'create-receipt'
                                                    ? 'Đang tạo...'
                                                    : busyAction === 'upload-receipt-image'
                                                        ? 'Đang tải ảnh...'
                                                        : 'Tạo phiếu nhập'}
                                            </button>
                                        </div>
                                    </form>
                                </article>
                            </div>

                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Hóa đơn gần đây</h2>
                                </div>

                                <div className="table-wrap compact">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Khách hàng</th>
                                                <th>Ngày bán</th>
                                                <th>Thanh toán</th>
                                                <th>Tổng tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="agent-empty-cell">Chưa có hóa đơn bán hàng.</td>
                                                </tr>
                                            ) : (
                                                sales.slice(0, 10).map((item) => (
                                                    <tr key={item.saleId}>
                                                        <td>{String(item.saleId).slice(0, 8)}...</td>
                                                        <td>{item.customerName || '-'}</td>
                                                        <td>{formatDate(item.saleDate)}</td>
                                                        <td>{item.paymentStatus || '-'}</td>
                                                        <td>{currencyFormatter.format(Number(item.totalAmount) || 0)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="agent-block">
                                <div className="agent-section-title">
                                    <h2>Phiếu nhập gần đây</h2>
                                </div>

                                <div className="table-wrap compact">
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Mã phiếu</th>
                                                <th>Ngày nhập</th>
                                                <th>Nhà cung cấp</th>
                                                <th>Tổng chi phí</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importReceipts.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="agent-empty-cell">Chưa có phiếu nhập.</td>
                                                </tr>
                                            ) : (
                                                importReceipts.slice(0, 10).map((item) => (
                                                    <tr key={item.importReceiptId}>
                                                        <td>{item.receiptCode || String(item.importReceiptId).slice(0, 8)}</td>
                                                        <td>{formatDate(item.importDate)}</td>
                                                        <td>{item.supplierName || '-'}</td>
                                                        <td>{currencyFormatter.format(Number(item.totalCost) || 0)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : null}
                </>
            ) : null}
        </section>
    )
}

export default AgentPortalPage