import { useMemo, useState } from 'react'
import {
  Ban,
  Bell,
  Boxes,
  CalendarDays,
  Check,
  ClipboardList,
  Edit3,
  Image as ImageIcon,
  Loader2,
  LayoutDashboard,
  PackageCheck,
  PackageX,
  Search,
  ShoppingCart,
  Upload,
  X,
} from 'lucide-react'

type Page = 'Dashboard' | 'Inventory' | 'Sold Items' | 'Cancelled Items' | 'Monthly Report'

type Product = {
  id: number
  name: string
  totalQuantity: number
  soldQuantity: number
  price: number
  priceUnit?: string
  addedDate: string
  imageUrl?: string
}

type SoldItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  date: string
  notes: string
}

type CancelledItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  cancellationDate: string
  notes: string
}

type DashboardMetrics = {
  totalProducts: number
  totalQuantity: number
  totalSold: number
  remainingStock: number
  totalValue: number
}

const today = '2026-06-08'

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Mouse',
    totalQuantity: 120,
    soldQuantity: 34,
    price: 18,
    addedDate: '2026-06-02',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 2,
    name: 'USB-C Cable',
    totalQuantity: 260,
    soldQuantity: 81,
    price: 7,
    addedDate: '2026-06-04',
    imageUrl: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 3,
    name: 'Laptop Stand',
    totalQuantity: 75,
    soldQuantity: 19,
    price: 32,
    addedDate: '2026-05-18',
    imageUrl: 'https://images.unsplash.com/photo-1616628188508-8bbafdd1f589?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 4,
    name: 'Desk Organizer',
    totalQuantity: 90,
    soldQuantity: 22,
    price: 14,
    addedDate: '2026-06-06',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=85',
  },
]

const initialSoldItems: SoldItem[] = [
  { id: 101, productId: 1, productName: 'Wireless Mouse', quantity: 12, date: '2026-06-03', notes: 'Counter sale' },
  { id: 102, productId: 2, productName: 'USB-C Cable', quantity: 25, date: '2026-06-05', notes: 'Office supply order' },
  { id: 103, productId: 4, productName: 'Desk Organizer', quantity: 8, date: '2026-06-07', notes: 'Store sale' },
]

const pages: { page: Page; icon: typeof LayoutDashboard }[] = [
  { page: 'Dashboard', icon: LayoutDashboard },
  { page: 'Inventory', icon: Boxes },
  { page: 'Sold Items', icon: ShoppingCart },
  { page: 'Cancelled Items', icon: Ban },
  { page: 'Monthly Report', icon: CalendarDays },
]

const amount = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
const priceLabel = (product: Product) =>
  [amount(product.price), product.priceUnit?.trim()].filter(Boolean).join(' ')

const remainingQuantity = (product: Product) => Math.max(0, product.totalQuantity - product.soldQuantity)

function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [soldItems, setSoldItems] = useState<SoldItem[]>(initialSoldItems)
  const [cancelledItems, setCancelledItems] = useState<CancelledItem[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null)
  const [cancellingSale, setCancellingSale] = useState<SoldItem | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2026-06')

  const dashboard = useMemo(() => {
    const totalProducts = products.length
    const totalQuantity = products.reduce((sum, product) => sum + product.totalQuantity, 0)
    const totalSold = products.reduce((sum, product) => sum + product.soldQuantity, 0)
    const remainingStock = products.reduce((sum, product) => sum + remainingQuantity(product), 0)
    const totalValue = products.reduce((sum, product) => sum + remainingQuantity(product) * product.price, 0)

    return { totalProducts, totalQuantity, totalSold, remainingStock, totalValue }
  }, [products])

  const monthlyReport = useMemo(() => {
    const inMonth = (date: string) => date.startsWith(selectedMonth)
    const productsAdded = products.filter((product) => inMonth(product.addedDate))
    const soldThisMonth = soldItems.filter((item) => inMonth(item.date))
    const cancelledThisMonth = cancelledItems.filter((item) => inMonth(item.cancellationDate))
    const productsSold = soldThisMonth.reduce((sum, item) => sum + item.quantity, 0)
    const cancelledQuantity = cancelledThisMonth.reduce((sum, item) => sum + item.quantity, 0)
    const remainingStock = products.reduce((sum, product) => sum + remainingQuantity(product), 0)

    return {
      productsAdded,
      soldThisMonth,
      cancelledThisMonth,
      productsSold,
      cancelledQuantity,
      remainingStock,
    }
  }, [cancelledItems, products, selectedMonth, soldItems])

  const switchPage = (nextPage: Page) => {
    if (nextPage === page) return

    setIsPageLoading(true)
    setPage(nextPage)
    window.setTimeout(() => setIsPageLoading(false), 360)
  }

  const saveProduct = (updated: Product) => {
    const soldQuantity = Math.min(updated.soldQuantity, updated.totalQuantity)
    setProducts((current) =>
      current.map((product) =>
        product.id === updated.id
          ? {
              ...updated,
              totalQuantity: Math.max(0, updated.totalQuantity),
              soldQuantity: Math.max(0, soldQuantity),
              price: Math.max(0, updated.price),
            }
          : product,
      ),
    )
    setEditingProduct(null)
  }

  const recordSale = (product: Product, quantity: number, notes: string) => {
    const saleQuantity = Math.min(quantity, remainingQuantity(product))
    if (saleQuantity < 1) return

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, soldQuantity: item.soldQuantity + saleQuantity } : item,
      ),
    )
    setSoldItems((current) => [
      { id: Date.now(), productId: product.id, productName: product.name, quantity: saleQuantity, date: today, notes },
      ...current,
    ])
    setSellingProduct(null)
  }

  const cancelSale = (sale: SoldItem, notes: string) => {
    setSoldItems((current) => current.filter((item) => item.id !== sale.id))
    setCancelledItems((current) => [
      {
        id: Date.now(),
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        cancellationDate: today,
        notes,
      },
      ...current,
    ])
    setProducts((current) =>
      current.map((product) =>
        product.id === sale.productId
          ? { ...product, soldQuantity: Math.max(0, product.soldQuantity - sale.quantity) }
          : product,
      ),
    )
    setCancellingSale(null)
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <PackageCheck />
          <div>
            <h1>Inventory Admin</h1>
            <span>Simple stock control</span>
          </div>
        </div>
        <nav className="nav">
          {pages.map((item) => {
            const Icon = item.icon
            return (
              <button
                className={`nav-button ${page === item.page ? 'active' : ''}`}
                key={item.page}
                onClick={() => switchPage(item.page)}
              >
                <Icon />
                {item.page}
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>{page}</h2>
            <p>Manage product quantities, sales, cancellations, and monthly stock totals.</p>
          </div>
          <div className="topbar-actions">
            <label className="quick-search">
              <Search />
              <input aria-label="Quick search" placeholder="Search inventory" />
            </label>
            <button className="icon-btn alert-btn" title="Notifications">
              <Bell />
            </button>
          </div>
        </header>

        <section className="content">
          <div className={`page-shell ${isPageLoading ? 'loading' : ''}`}>
            {isPageLoading && (
              <div className="loading-scrim" role="status" aria-label="Loading page">
                <Loader2 />
              </div>
            )}
            {page === 'Dashboard' && (
              <Dashboard
                metrics={dashboard}
                products={products}
                soldItems={soldItems}
              />
            )}
            {page === 'Inventory' && (
              <InventoryTable products={products} onEdit={setEditingProduct} onSell={setSellingProduct} />
            )}
            {page === 'Sold Items' && (
              <SoldItemsTable soldItems={soldItems} onCancel={setCancellingSale} />
            )}
            {page === 'Cancelled Items' && <CancelledItemsTable cancelledItems={cancelledItems} />}
            {page === 'Monthly Report' && (
              <MonthlyReport
                report={monthlyReport}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />
            )}
          </div>
        </section>
      </main>

      {editingProduct && (
        <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={saveProduct} />
      )}
      {sellingProduct && (
        <SellProductModal product={sellingProduct} onClose={() => setSellingProduct(null)} onSave={recordSale} />
      )}
      {cancellingSale && (
        <CancelSaleModal sale={cancellingSale} onClose={() => setCancellingSale(null)} onSave={cancelSale} />
      )}
    </div>
  )
}

function Dashboard({
  metrics,
  products,
  soldItems,
}: {
  metrics: DashboardMetrics
  products: Product[]
  soldItems: SoldItem[]
}) {
  const stockTurnover = metrics.totalQuantity ? Math.round((metrics.totalSold / metrics.totalQuantity) * 100) : 0
  const lowStockProducts = products.filter((product) => remainingQuantity(product) <= product.totalQuantity * 0.28)
  const currentMonth = today.slice(0, 7)
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const monthlySales = soldItems
    .filter((item) => item.date.startsWith(currentMonth))
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId)
      const unitPrice = product?.price ?? 0
      return {
        ...item,
        unitPrice,
        revenue: item.quantity * unitPrice,
      }
    })
  const monthlyRevenue = monthlySales.reduce((sum, item) => sum + item.revenue, 0)
  const monthlyUnits = monthlySales.reduce((sum, item) => sum + item.quantity, 0)
  const averageSale = monthlySales.length ? Math.round(monthlyRevenue / monthlySales.length) : 0
  const cards = [
    ['Total Products', metrics.totalProducts, 'Catalog breadth', Boxes],
    ['Stock On Hand', metrics.remainingStock, `${metrics.totalQuantity} units received`, ClipboardList],
    ['Items Sold', metrics.totalSold, `${stockTurnover}% turnover`, ShoppingCart],
    ['Low Stock', lowStockProducts.length, 'Needs review', PackageX],
    ['Inventory Value', amount(metrics.totalValue), 'Current sellable value', Check],
  ] as const

  return (
    <div className="dashboard-layout">
      <div className="dashboard-hero">
        <div>
          <span className="eyebrow">Inventory Summary</span>
          <h3>Inventory control center</h3>
          <p>Review stock, sales, low inventory, and latest movement from a clean daily operations view.</p>
        </div>
        <div className="hero-summary">
          <span>Sell-through</span>
          <strong>{stockTurnover}%</strong>
          <small>{metrics.totalSold} sold from {metrics.totalQuantity} received</small>
        </div>
      </div>

      <div className="metric-grid">
        {cards.map(([label, value, helper, Icon]) => (
          <article className="card metric-card" key={label}>
            <div className="metric-label">
              <span>{label}</span>
              <Icon />
            </div>
            <strong>{value}</strong>
            <small>{helper}</small>
          </article>
        ))}
      </div>

      <section className="card monthly-revenue-card">
        <div className="monthly-revenue-head">
          <div>
            <span className="eyebrow subtle">Monthly Revenue</span>
            <h3>{amount(monthlyRevenue)}</h3>
            <p>{monthLabel} sales revenue from recorded sold items.</p>
          </div>
          <div className="revenue-kpis">
            <span>
              <strong>{monthlyUnits}</strong>
              Units sold
            </span>
            <span>
              <strong>{monthlySales.length}</strong>
              Transactions
            </span>
            <span>
              <strong>{amount(averageSale)}</strong>
              Avg sale
            </span>
          </div>
        </div>
        <div className="revenue-list">
          {monthlySales.map((item) => (
            <div className="revenue-row" key={item.id}>
              <div>
                <strong>{item.productName}</strong>
                <span>{item.quantity} units at {amount(item.unitPrice)} each</span>
              </div>
              <time>{item.date}</time>
              <b>{amount(item.revenue)}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function InventoryTable({
  products,
  onEdit,
  onSell,
}: {
  products: Product[]
  onEdit: (product: Product) => void
  onSell: (product: Product) => void
}) {
  return (
    <div className="card">
      <div className="section-head">
        <h3>Main Inventory</h3>
        <span>{products.length} products</span>
      </div>
      <div className="inventory-grid">
        {products.map((product) => {
          const remaining = remainingQuantity(product)
          const stockLevel = product.totalQuantity ? Math.round((remaining / product.totalQuantity) * 100) : 0

          return (
            <article className="inventory-card" key={product.id}>
              <button className="inventory-card-click" type="button" onClick={() => onEdit(product)}>
                <ProductImage product={product} variant="large" />
                <div className="inventory-card-body">
                  <div className="inventory-title-row">
                    <h4>{product.name}</h4>
                    <strong>{priceLabel(product)}</strong>
                  </div>
                  <div className="inventory-stats">
                    <span>
                      <strong>{remaining}</strong>
                      Remaining
                    </span>
                    <span>
                      <strong>{product.soldQuantity}</strong>
                      Sold
                    </span>
                    <span>
                      <strong>{product.totalQuantity}</strong>
                      Total
                    </span>
                  </div>
                  <div className="inventory-progress" aria-label={`${product.name} stock ${stockLevel}%`}>
                    <span style={{ width: `${stockLevel}%` }} />
                  </div>
                </div>
              </button>
              <div className="row-actions inventory-card-actions">
                <button className="icon-btn" title="Edit product" onClick={() => onEdit(product)}>
                  <Edit3 />
                </button>
                <button className="btn primary" onClick={() => onSell(product)} disabled={remaining === 0}>
                  <ShoppingCart />
                  Sell
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function ProductImage({ product, variant = 'default' }: { product: Product; variant?: 'default' | 'large' }) {
  return (
    <div className={`product-image ${variant === 'large' ? 'large' : ''}`}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} />
      ) : (
        <ImageIcon aria-hidden="true" />
      )}
    </div>
  )
}

function SoldItemsTable({ soldItems, onCancel }: { soldItems: SoldItem[]; onCancel: (item: SoldItem) => void }) {
  return (
    <div className="card">
      <div className="section-head">
        <h3>Sold Items</h3>
        <span>{soldItems.length} transactions</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity Sold</th>
              <th>Date</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {soldItems.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.productName}</strong></td>
                <td>{item.quantity}</td>
                <td>{item.date}</td>
                <td>{item.notes || '-'}</td>
                <td>
                  <button className="btn danger" onClick={() => onCancel(item)}>
                    <Ban />
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CancelledItemsTable({ cancelledItems }: { cancelledItems: CancelledItem[] }) {
  return (
    <div className="card">
      <div className="section-head">
        <h3>Cancelled Items</h3>
        <span>{cancelledItems.length} cancelled records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Cancellation Date</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {cancelledItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">No cancelled items yet.</td>
              </tr>
            ) : (
              cancelledItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.productName}</strong></td>
                  <td>{item.quantity}</td>
                  <td>{item.cancellationDate}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthlyReport({
  report,
  selectedMonth,
  setSelectedMonth,
}: {
  report: {
    productsAdded: Product[]
    soldThisMonth: SoldItem[]
    cancelledThisMonth: CancelledItem[]
    productsSold: number
    cancelledQuantity: number
    remainingStock: number
  }
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}) {
  return (
    <div className="report-layout">
      <div className="section-head report-head">
        <h3>Monthly Report</h3>
        <label className="month-picker">
          <span>Selected month</span>
          <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
        </label>
      </div>

      <div className="metric-grid compact">
        <article className="card metric-card">
          <div className="metric-label"><span>Products Added</span><Boxes /></div>
          <strong>{report.productsAdded.length}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Products Sold</span><ShoppingCart /></div>
          <strong>{report.productsSold}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Remaining Stock</span><PackageCheck /></div>
          <strong>{report.remainingStock}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Cancelled Quantity</span><Ban /></div>
          <strong>{report.cancelledQuantity}</strong>
        </article>
      </div>

      <div className="card">
        <div className="section-head">
          <h3>Products Added</h3>
          <span>{selectedMonth}</span>
        </div>
        <SimpleList
          empty="No products were added in this month."
          rows={report.productsAdded.map((product) => ({
            title: product.name,
            detail: `${product.totalQuantity} total quantity - added ${product.addedDate}`,
          }))}
        />
      </div>

      <div className="card">
        <div className="section-head">
          <h3>Products Sold</h3>
          <span>{selectedMonth}</span>
        </div>
        <SimpleList
          empty="No products were sold in this month."
          rows={report.soldThisMonth.map((item) => ({
            title: item.productName,
            detail: `${item.quantity} sold - ${item.date} - ${item.notes || 'No notes'}`,
          }))}
        />
      </div>
    </div>
  )
}

function SimpleList({ rows, empty }: { rows: { title: string; detail: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="empty-text">{empty}</p>

  return (
    <div className="list">
      {rows.map((row) => (
        <div className="list-row" key={`${row.title}-${row.detail}`}>
          <strong>{row.title}</strong>
          <span>{row.detail}</span>
        </div>
      ))}
    </div>
  )
}

function EditProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product
  onClose: () => void
  onSave: (product: Product) => void
}) {
  const [draft, setDraft] = useState(product)
  const update = (key: keyof Product, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: ['totalQuantity', 'soldQuantity', 'price'].includes(key) ? Number(value) : value,
    }))
  }
  const handleImageUpload = (file: File | undefined) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setDraft((current) => ({ ...current, imageUrl: String(reader.result) }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>Edit Product</h3>
          <button className="icon-btn" title="Close" onClick={onClose}><X /></button>
        </div>
        <div className="form-grid">
          <div className="image-editor full">
            <ProductImage product={draft} />
            <div>
              <label className="upload-button">
                <Upload />
                <span>Upload Product Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageUpload(event.target.files?.[0])}
                />
              </label>
              {draft.imageUrl && (
                <button className="btn" onClick={() => setDraft((current) => ({ ...current, imageUrl: undefined }))}>
                  Remove Image
                </button>
              )}
            </div>
          </div>
          <label>
            <span>Product Name</span>
            <input value={draft.name} onChange={(event) => update('name', event.target.value)} />
          </label>
          <label>
            <span>Total Quantity</span>
            <input type="number" min="0" value={draft.totalQuantity} onChange={(event) => update('totalQuantity', event.target.value)} />
          </label>
          <label>
            <span>Sold Quantity</span>
            <input type="number" min="0" max={draft.totalQuantity} value={draft.soldQuantity} onChange={(event) => update('soldQuantity', event.target.value)} />
          </label>
          <label>
            <span>Price</span>
            <input type="number" min="0" value={draft.price} onChange={(event) => update('price', event.target.value)} />
          </label>
          <label>
            <span>Unit</span>
            <input value={draft.priceUnit ?? ''} onChange={(event) => update('priceUnit', event.target.value)} placeholder="Optional" />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function SellProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product
  onClose: () => void
  onSave: (product: Product, quantity: number, notes: string) => void
}) {
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const available = remainingQuantity(product)

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>Sell Item</h3>
          <button className="icon-btn" title="Close" onClick={onClose}><X /></button>
        </div>
        <div className="form-grid">
          <label>
            <span>Product</span>
            <input value={product.name} disabled />
          </label>
          <label>
            <span>Remaining Quantity</span>
            <input value={available} disabled />
          </label>
          <label>
            <span>Quantity Sold</span>
            <input type="number" min="1" max={available} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          </label>
          <label className="full">
            <span>Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(product, quantity, notes)} disabled={quantity < 1 || quantity > available}>
            Record Sale
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelSaleModal({
  sale,
  onClose,
  onSave,
}: {
  sale: SoldItem
  onClose: () => void
  onSave: (sale: SoldItem, notes: string) => void
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>Cancel Sold Transaction</h3>
          <button className="icon-btn" title="Close" onClick={onClose}><X /></button>
        </div>
        <div className="summary-box">
          <strong>{sale.productName}</strong>
          <span>{sale.quantity} sold on {sale.date}</span>
        </div>
        <label className="field-block">
          <span>Cancellation Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Reason for cancellation" />
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Back</button>
          <button className="btn danger" onClick={() => onSave(sale, notes)}>
            Cancel Transaction
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
