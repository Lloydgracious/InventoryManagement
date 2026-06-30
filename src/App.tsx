import { useMemo, useState } from 'react'
import {
  Ban,
  Boxes,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  Download,
  Edit3,
  Image as ImageIcon,
  Loader2,
  LayoutDashboard,
  PackagePlus,
  PackageCheck,
  PackageX,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
  Wallet,
  X,
} from 'lucide-react'

type Page = 'Dashboard' | 'Inventory' | 'Re-stock Items' | 'Sold Items' | 'Cancelled Items' | 'Monthly Report'

type Product = {
  id: number
  name: string
  totalQuantity: number
  soldQuantity: number
  price: number
  costPrice: number
  priceUnit?: string
  addedDate: string
  imageUrl?: string
  isRestock?: boolean
  restockSourceProductId?: number
}

type SoldItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  salePrice: number
  costPrice: number
  priceUnit?: string
  date: string
  notes: string
}

type SoldItemView = SoldItem & {
  imageUrl?: string
}

type CancelledItem = {
  id: number
  productId: number
  productName: string
  quantity: number
  salePrice: number
  costPrice: number
  priceUnit?: string
  imageUrl?: string
  cancellationDate: string
  notes: string
}

type DashboardMetrics = {
  totalProducts: number
  totalQuantity: number
  totalSold: number
  cancelledStock: number
  remainingStock: number
  totalValue: number
  activeProfit: number
  cancelledProfitImpact: number
  netProfit: number
}

const today = '2026-06-08'

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Mouse',
    totalQuantity: 120,
    soldQuantity: 34,
    price: 18,
    costPrice: 11,
    addedDate: '2026-06-02',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 2,
    name: 'USB-C Cable',
    totalQuantity: 260,
    soldQuantity: 81,
    price: 7,
    costPrice: 4,
    addedDate: '2026-06-04',
    imageUrl: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 3,
    name: 'Laptop Stand',
    totalQuantity: 75,
    soldQuantity: 19,
    price: 32,
    costPrice: 21,
    addedDate: '2026-05-18',
    imageUrl: 'https://images.unsplash.com/photo-1616628188508-8bbafdd1f589?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 4,
    name: 'Desk Organizer',
    totalQuantity: 90,
    soldQuantity: 22,
    price: 14,
    costPrice: 8,
    addedDate: '2026-06-06',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=85',
  },
]

const initialSoldItems: SoldItem[] = [
  { id: 101, productId: 1, productName: 'Wireless Mouse', quantity: 12, salePrice: 18, costPrice: 11, date: '2026-06-03', notes: 'Counter sale' },
  { id: 102, productId: 2, productName: 'USB-C Cable', quantity: 25, salePrice: 7, costPrice: 4, date: '2026-06-05', notes: 'Office supply order' },
  { id: 103, productId: 4, productName: 'Desk Organizer', quantity: 8, salePrice: 14, costPrice: 8, date: '2026-06-07', notes: 'Store sale' },
]

const navItems: { label: string; page: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { label: 'Products', page: 'Inventory', icon: Boxes },
  { label: 'Sales', page: 'Sold Items', icon: ShoppingCart },
  { label: 'Cancelled Items', page: 'Cancelled Items', icon: Ban },
  { label: 'Monthly Report', page: 'Monthly Report', icon: CalendarDays },
]

const amount = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
const moneyLabel = (value: number) => `${amount(value)} MMK`
const priceLabel = (product: Product) => moneyLabel(product.price)
const profitAmount = (quantity: number, salePrice: number, costPrice: number) => quantity * (salePrice - costPrice)

const remainingQuantity = (product: Product) => Math.max(0, product.totalQuantity - product.soldQuantity)

type ExcelCell = string | number

type ExcelSheet = {
  name: string
  rows: ExcelCell[][]
}

type ExportReportSnapshot = {
  productsAdded: Product[]
  soldItems: SoldItem[]
  cancelledItems: CancelledItem[]
  soldTransactions: number
  productsSold: number
  cancelledQuantity: number
  remainingStock?: number
  revenue: number
  cost: number
  activeProfit: number
  cancelledProfitImpact: number
  netProfit: number
}

type Client = {
  id: number
  name: string
  phone: string
  note: string
}

const xmlEscape = (value: ExcelCell) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const excelSheetName = (name: string) => xmlEscape(name.replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31) || 'Sheet')
const fileSafe = (value: string) => value.replace(/[\\/:*?"<>|]+/g, '-')

const buildExcelWorkbook = (sheets: ExcelSheet[]) => `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#26334A"/>
   <Interior ss:Color="#DCE8FB" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${sheets
   .map(
     (sheet) => `<Worksheet ss:Name="${excelSheetName(sheet.name)}">
  <Table>
   ${sheet.rows
     .map((row, rowIndex) => {
       const isHeader = rowIndex === 0 || row[0] === 'Metric'
       return `<Row>${row
         .map((cell) => {
           const isNumber = typeof cell === 'number' && Number.isFinite(cell)
           return `<Cell${isHeader ? ' ss:StyleID="Header"' : ''}><Data ss:Type="${isNumber ? 'Number' : 'String'}">${isNumber ? cell : xmlEscape(cell)}</Data></Cell>`
         })
         .join('')}</Row>`
     })
     .join('')}
  </Table>
 </Worksheet>`,
   )
   .join('')}
</Workbook>`

const downloadExcelWorkbook = (fileName: string, sheets: ExcelSheet[]) => {
  const blob = new Blob([buildExcelWorkbook(sheets)], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${fileSafe(fileName)}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

const buildReportWorkbookSheets = (reportType: 'Daily' | 'Monthly', period: string, snapshot: ExportReportSnapshot): ExcelSheet[] => {
  const summaryRows: ExcelCell[][] = [
    ['InventoryPro Report', reportType],
    ['Period', period],
    [],
    ['Metric', 'Value'],
    ['Products Added', snapshot.productsAdded.length],
    ['Sold Transactions', snapshot.soldTransactions],
    ['Products Sold', snapshot.productsSold],
    ['Cancelled Quantity', snapshot.cancelledQuantity],
  ]

  if (typeof snapshot.remainingStock === 'number') {
    summaryRows.push(['Current Remaining Stock', snapshot.remainingStock])
  }

  summaryRows.push(
    ['Revenue (MMK)', snapshot.revenue],
    ['Cost (MMK)', snapshot.cost],
    ['Gross Profit (MMK)', snapshot.activeProfit],
    ['Cancelled Impact (MMK)', snapshot.cancelledProfitImpact],
    ['Net Profit (MMK)', snapshot.netProfit],
  )

  return [
    {
      name: 'Summary',
      rows: summaryRows,
    },
    {
      name: 'Products Added',
      rows: [
        ['Product Name', 'Type', 'Total Quantity', 'Sold Quantity', 'Remaining Quantity', 'Price (MMK)', 'Cost Price (MMK)', 'Added Date'],
        ...snapshot.productsAdded.map((product) => [
          product.name,
          product.isRestock ? 'Re-stock' : 'Inventory',
          product.totalQuantity,
          product.soldQuantity,
          remainingQuantity(product),
          product.price,
          product.costPrice,
          product.addedDate,
        ]),
      ],
    },
    {
      name: 'Products Sold',
      rows: [
        ['Product Name', 'Quantity Sold', 'Sell Price (MMK)', 'Cost Price (MMK)', 'Revenue (MMK)', 'Profit (MMK)', 'Date', 'Notes'],
        ...snapshot.soldItems.map((item) => [
          item.productName,
          item.quantity,
          item.salePrice,
          item.costPrice,
          item.quantity * item.salePrice,
          profitAmount(item.quantity, item.salePrice, item.costPrice),
          item.date,
          item.notes || '-',
        ]),
      ],
    },
    {
      name: 'Cancelled Items',
      rows: [
        ['Product Name', 'Quantity Cancelled', 'Sell Price (MMK)', 'Cost Price (MMK)', 'Reversed Profit (MMK)', 'Cancellation Date', 'Notes'],
        ...snapshot.cancelledItems.map((item) => [
          item.productName,
          item.quantity,
          item.salePrice,
          item.costPrice,
          profitAmount(item.quantity, item.salePrice, item.costPrice),
          item.cancellationDate,
          item.notes || '-',
        ]),
      ],
    },
  ]
}

function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [soldItems, setSoldItems] = useState<SoldItem[]>(initialSoldItems)
  const [cancelledItems, setCancelledItems] = useState<CancelledItem[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [addingProduct, setAddingProduct] = useState<Product | null>(null)
  const [editingCancelledItem, setEditingCancelledItem] = useState<CancelledItem | null>(null)
  const [addingCancelledItem, setAddingCancelledItem] = useState<CancelledItem | null>(null)
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null)
  const [cancellingSale, setCancellingSale] = useState<SoldItem | null>(null)
  const [selectedMonth, setSelectedMonth] = useState('2026-06')
  const isCompactPage = page !== 'Dashboard'

  const dashboard = useMemo(() => {
    const totalProducts = products.length
    const totalQuantity = products.reduce((sum, product) => sum + product.totalQuantity, 0)
    const totalSold = soldItems.reduce((sum, item) => sum + item.quantity, 0)
    const cancelledStock = cancelledItems.reduce((sum, item) => sum + item.quantity, 0)
    const remainingStock = products.reduce((sum, product) => sum + remainingQuantity(product), 0) + cancelledStock
    const totalValue = products.reduce((sum, product) => sum + remainingQuantity(product) * product.price, 0)
    const activeProfit = soldItems.reduce(
      (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
      0,
    )
    const cancelledProfitImpact = cancelledItems.reduce(
      (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
      0,
    )
    const netProfit = activeProfit - cancelledProfitImpact

    return {
      totalProducts,
      totalQuantity,
      totalSold,
      cancelledStock,
      remainingStock,
      totalValue,
      activeProfit,
      cancelledProfitImpact,
      netProfit,
    }
  }, [cancelledItems, products, soldItems])

  const monthlyReport = useMemo(() => {
    const inMonth = (date: string) => date.startsWith(selectedMonth)
    const productsAdded = products.filter((product) => inMonth(product.addedDate))
    const soldThisMonth = soldItems.filter((item) => inMonth(item.date))
    const cancelledThisMonth = cancelledItems.filter((item) => inMonth(item.cancellationDate))
    const productsSold = soldThisMonth.reduce((sum, item) => sum + item.quantity, 0)
    const cancelledQuantity = cancelledThisMonth.reduce((sum, item) => sum + item.quantity, 0)
    const totalCancelledStock = cancelledItems.reduce((sum, item) => sum + item.quantity, 0)
    const remainingStock = products.reduce((sum, product) => sum + remainingQuantity(product), 0) + totalCancelledStock
    const revenue = soldThisMonth.reduce((sum, item) => sum + item.quantity * item.salePrice, 0)
    const cost = soldThisMonth.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
    const activeProfit = soldThisMonth.reduce(
      (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
      0,
    )
    const cancelledProfitImpact = cancelledThisMonth.reduce(
      (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
      0,
    )
    const netProfit = activeProfit - cancelledProfitImpact

    return {
      productsAdded,
      soldThisMonth,
      cancelledThisMonth,
      productsSold,
      cancelledQuantity,
      remainingStock,
      revenue,
      cost,
      activeProfit,
      cancelledProfitImpact,
      netProfit,
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
              costPrice: Math.max(0, updated.costPrice),
            }
          : product,
      ),
    )
    setEditingProduct(null)
  }

  const addProduct = (newProduct: Product) => {
    setProducts((current) => {
      const totalQuantity = Math.max(0, newProduct.totalQuantity)
      const soldQuantity = Math.max(0, Math.min(newProduct.soldQuantity, totalQuantity))
      const nextProduct: Product = {
        ...newProduct,
        id: Math.max(0, ...current.map((product) => product.id)) + 1,
        name: newProduct.name.trim(),
        totalQuantity,
        soldQuantity,
        price: Math.max(0, newProduct.price),
        costPrice: Math.max(0, newProduct.costPrice),
        addedDate: today,
      }

      return [nextProduct, ...current]
    })
    setAddingProduct(null)
  }

  const recordSale = (product: Product, quantity: number, notes: string) => {
    const saleQuantity = Math.min(quantity, remainingQuantity(product))
    if (saleQuantity < 1) return

    setProducts((current) =>
      current
        .map((item) =>
          item.id === product.id ? { ...item, soldQuantity: item.soldQuantity + saleQuantity } : item,
        )
        .filter((item) => !(item.id === product.id && item.isRestock && remainingQuantity(item) === 0)),
    )
    setSoldItems((current) => [
      {
        id: Date.now(),
        productId: product.id,
        productName: product.name,
        quantity: saleQuantity,
        salePrice: product.price,
        costPrice: product.costPrice,
        priceUnit: product.priceUnit,
        date: today,
        notes,
      },
      ...current,
    ])
    setSellingProduct(null)
  }

  const deleteProduct = (product: Product) => {
    setProducts((current) => current.filter((item) => item.id !== product.id))
  }

  const cancelSale = (sale: SoldItem, quantity: number, notes: string) => {
    const cancelQuantity = Math.min(Math.max(0, quantity), sale.quantity)
    if (cancelQuantity < 1) return

    const product = products.find((item) => item.id === sale.productId)

    setSoldItems((current) =>
      current
        .map((item) => (item.id === sale.id ? { ...item, quantity: item.quantity - cancelQuantity } : item))
        .filter((item) => item.quantity > 0),
    )
    setCancelledItems((current) => [
      {
        id: Date.now(),
        productId: sale.productId,
        productName: sale.productName,
        quantity: cancelQuantity,
        salePrice: sale.salePrice,
        costPrice: sale.costPrice,
        priceUnit: sale.priceUnit ?? product?.priceUnit,
        imageUrl: product?.imageUrl,
        cancellationDate: today,
        notes,
      },
      ...current,
    ])
    setCancellingSale(null)
  }

  const saveCancelledItem = (updated: CancelledItem) => {
    setCancelledItems((current) =>
      current.map((item) =>
        item.id === updated.id
          ? {
              ...updated,
              productName: updated.productName.trim(),
              quantity: Math.max(0, updated.quantity),
              salePrice: Math.max(0, updated.salePrice),
              costPrice: Math.max(0, updated.costPrice),
            }
          : item,
      ),
    )
    setEditingCancelledItem(null)
  }

  const addCancelledToInventory = (cancelledItem: CancelledItem, quantity: number, price: number) => {
    const addQuantity = Math.min(Math.max(0, quantity), cancelledItem.quantity)
    if (addQuantity < 1) return

    setProducts((current) => {
      return [
        {
          id: Math.max(0, ...current.map((product) => product.id)) + 1,
          name: cancelledItem.productName,
          totalQuantity: addQuantity,
          soldQuantity: 0,
          price: Math.max(0, price),
          costPrice: cancelledItem.costPrice,
          priceUnit: cancelledItem.priceUnit,
          addedDate: today,
          imageUrl: cancelledItem.imageUrl,
          isRestock: true,
          restockSourceProductId: cancelledItem.productId,
        },
        ...current,
      ]
    })
    setCancelledItems((current) =>
      current
        .map((item) =>
          item.id === cancelledItem.id ? { ...item, quantity: item.quantity - addQuantity } : item,
        )
        .filter((item) => item.quantity > 0),
    )
    setAddingCancelledItem(null)
  }

  return (
    <div className={`app ${isCompactPage ? 'compact-view' : 'dashboard-view'}`}>
      <div className="app-frame">
        <aside className="sidebar">
          <div className="brand">
            <PackageCheck />
            <strong>GI</strong>
          </div>

          <nav className="nav" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  className={`nav-button ${page === item.page ? 'active' : ''}`}
                  key={item.label}
                  onClick={() => switchPage(item.page)}
                  title={item.label}
                >
                  <Icon />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="workspace">
          <main className="main">
            <section className="page-intro">
              <div>
                <h1>{page === 'Dashboard' ? 'Hello, Shop Team!' : page}</h1>
                <p>Here's what's happening with your inventory today.</p>
              </div>
              <div className="date-card">
                <CalendarDays />
                <strong>{today.slice(8)}</strong>
                <span>
                  <b>Sunday</b>
                  June 2026
                </span>
              </div>
            </section>
            <section className="content">
              <div className={`page-shell ${isPageLoading ? 'loading' : ''} ${isCompactPage ? 'compact-page-shell' : 'dashboard-page-shell'}`}>
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
                    onNavigate={switchPage}
                  />
                )}
                {page === 'Inventory' && (
                  <InventoryTable
                    products={products.filter((product) => !product.isRestock)}
                    onAdd={() =>
                      setAddingProduct({
                        id: Date.now(),
                        name: '',
                        totalQuantity: 0,
                        soldQuantity: 0,
                        price: 0,
                        costPrice: 0,
                        addedDate: today,
                      })
                    }
                    onViewRestocks={() => switchPage('Re-stock Items')}
                    onDelete={deleteProduct}
                    onEdit={setEditingProduct}
                    onSell={setSellingProduct}
                  />
                )}
                {page === 'Re-stock Items' && (
                  <RestockItemsTable
                    products={products.filter((product) => product.isRestock)}
                    onBack={() => switchPage('Inventory')}
                    onDelete={deleteProduct}
                    onEdit={setEditingProduct}
                    onSell={setSellingProduct}
                  />
                )}
                {page === 'Sold Items' && (
                  <SoldItemsTable
                    soldItems={soldItems.map((item) => ({
                      ...item,
                      imageUrl: products.find((product) => product.id === item.productId)?.imageUrl,
                    }))}
                    onCancel={setCancellingSale}
                  />
                )}
                {page === 'Cancelled Items' && (
                  <CancelledItemsTable
                    cancelledItems={cancelledItems}
                    onEdit={setEditingCancelledItem}
                    onAddToInventory={setAddingCancelledItem}
                  />
                )}
                {page === 'Monthly Report' && (
                  <MonthlyReport
                    report={monthlyReport}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    products={products}
                    soldItems={soldItems}
                    cancelledItems={cancelledItems}
                  />
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      {editingProduct && (
        <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onSave={saveProduct} />
      )}
      {addingProduct && (
        <EditProductModal
          product={addingProduct}
          title="Add Product"
          saveLabel="Add Product"
          onClose={() => setAddingProduct(null)}
          onSave={addProduct}
        />
      )}
      {editingCancelledItem && (
        <EditCancelledItemModal
          item={editingCancelledItem}
          onClose={() => setEditingCancelledItem(null)}
          onSave={saveCancelledItem}
        />
      )}
      {addingCancelledItem && (
        <AddCancelledToInventoryModal
          item={addingCancelledItem}
          onClose={() => setAddingCancelledItem(null)}
          onSave={addCancelledToInventory}
        />
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
  onNavigate,
}: {
  metrics: DashboardMetrics
  products: Product[]
  soldItems: SoldItem[]
  onNavigate: (page: Page) => void
}) {
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: 'Mandalay Office', phone: '09 450 112 884', note: 'Bulk cable buyer' },
    { id: 2, name: 'Front Counter', phone: 'Walk-in', note: 'Daily retail sales' },
  ])
  const [clientDraft, setClientDraft] = useState({ name: '', phone: '', note: '' })
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [clientSearch, setClientSearch] = useState('')

  const currentMonth = today.slice(0, 7)
  const sales = soldItems.map((item) => ({
    ...item,
    revenue: item.quantity * item.salePrice,
    profit: profitAmount(item.quantity, item.salePrice, item.costPrice),
  }))
  const monthlySales = sales.filter((item) => item.date.startsWith(currentMonth))
  const soldAmount = sales.reduce((sum, item) => sum + item.revenue, 0)
  const totalAmount = metrics.totalValue + soldAmount
  const totalCost = sales.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
  const monthlySoldQuantity = monthlySales.reduce((sum, item) => sum + item.quantity, 0)
  const maxMonthlyQuantity = Math.max(1, ...monthlySales.map((item) => item.quantity))
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearch.trim().toLowerCase()),
  )
  const dashboardCards = [
    {
      label: 'Total Amount',
      value: moneyLabel(totalAmount),
      note: 'Inventory value + sold',
      icon: CircleDollarSign,
      tone: 'blue',
      page: 'Inventory' as Page,
    },
    {
      label: 'Sold Amount',
      value: moneyLabel(soldAmount),
      note: `${metrics.totalSold} units sold`,
      icon: TrendingUp,
      tone: 'green',
      page: 'Sold Items' as Page,
    },
    {
      label: 'Total Cancel Item',
      value: amount(metrics.cancelledStock),
      note: `${moneyLabel(metrics.cancelledProfitImpact)} reversed profit`,
      icon: PackageX,
      tone: 'orange',
      page: 'Cancelled Items' as Page,
    },
    {
      label: 'Profit Made',
      value: moneyLabel(metrics.activeProfit),
      note: `${moneyLabel(soldAmount)} - ${moneyLabel(totalCost)} (cost)`,
      icon: ClipboardList,
      tone: 'purple',
      page: 'Sold Items' as Page,
    },
    {
      label: 'Lost / Cancelled Impact',
      value: moneyLabel(metrics.cancelledProfitImpact),
      note: 'Profit removed',
      icon: TrendingDown,
      tone: 'red',
      page: 'Cancelled Items' as Page,
    },
    {
      label: 'Net Profit',
      value: moneyLabel(metrics.netProfit),
      note: 'Profit after impact',
      icon: Wallet,
      tone: 'mint',
      page: 'Monthly Report' as Page,
    },
  ]

  const saveClient = () => {
    const name = clientDraft.name.trim()
    if (!name) return
    const updatedClient = {
      name,
      phone: clientDraft.phone.trim() || 'No phone',
      note: clientDraft.note.trim() || 'No note',
    }

    if (editingClientId) {
      setClients((current) =>
        current.map((client) => (client.id === editingClientId ? { ...client, ...updatedClient } : client)),
      )
      setEditingClientId(null)
      setClientDraft({ name: '', phone: '', note: '' })
      return
    }

    setClients((current) => [
      {
        id: Date.now(),
        ...updatedClient,
      },
      ...current,
    ])
    setClientDraft({ name: '', phone: '', note: '' })
  }

  const editClient = (client: Client) => {
    setEditingClientId(client.id)
    setClientDraft({ name: client.name, phone: client.phone, note: client.note })
  }

  const cancelClientEdit = () => {
    setEditingClientId(null)
    setClientDraft({ name: '', phone: '', note: '' })
  }

  const removeClient = (id: number) => {
    setClients((current) => current.filter((client) => client.id !== id))
    if (editingClientId === id) {
      cancelClientEdit()
    }
  }

  const renderClientRow = (client: Client, index: number) => (
    <div className="client-row" key={client.id}>
      <div className={`client-avatar ${index % 2 ? 'green' : 'blue'}`}>
        {index % 2 ? <Users /> : <Building2 />}
      </div>
      <div className="client-details">
        <strong>{client.name}</strong>
        <span>{client.phone}</span>
        <small>{client.note}</small>
      </div>
      <div className="client-actions">
        <button className="btn" type="button" onClick={() => editClient(client)}>
          <Edit3 />
          Edit
        </button>
        <button className="btn danger" type="button" onClick={() => removeClient(client.id)}>
          <Trash2 />
          Remove
        </button>
      </div>
    </div>
  )

  return (
    <div className="dashboard-new">
      <section className="kpi-grid">
        {dashboardCards.map((card) => {
          const Icon = card.icon
          return (
            <button className="kpi-card dashboard-action-card" key={card.label} type="button" onClick={() => onNavigate(card.page)}>
              <div className={`kpi-icon ${card.tone}`}>
                <Icon />
              </div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </button>
          )
        })}
      </section>

      <section className="dashboard-grid">
        <article className="sales-visual-card dashboard-action-panel" onClick={() => onNavigate('Sold Items')}>
          <div className="section-head">
            <h3>Monthly Sold Visualization</h3>
            <span>{monthlySoldQuantity} units in {currentMonth}</span>
          </div>
          <div className="sales-bars">
            {monthlySales.map((item) => (
              <div className="sales-bar-row" key={item.id}>
                <ProductImage product={products.find((product) => product.id === item.productId) ?? { name: item.productName }} />
                <strong>{item.productName}</strong>
                <div className="bar-track">
                  <i style={{ width: `${Math.max(8, Math.round((item.quantity / maxMonthlyQuantity) * 100))}%` }} />
                </div>
                <b>
                  {item.quantity} sold
                  <small>{Math.round((item.quantity / Math.max(1, monthlySoldQuantity)) * 100)}%</small>
                </b>
              </div>
            ))}
          </div>
          <button className="full-report" type="button" onClick={(event) => {
            event.stopPropagation()
            onNavigate('Monthly Report')
          }}>
            View Full Report
            <Check />
          </button>
        </article>

        <article className="client-card">
          <div className="section-head">
            <h3>Client Info</h3>
            <span>{clients.length} clients</span>
          </div>
          <div className="client-form">
            <input
              value={clientDraft.name}
              onChange={(event) => setClientDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Client name"
            />
            <input
              value={clientDraft.phone}
              onChange={(event) => setClientDraft((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone"
            />
            <input
              value={clientDraft.note}
              onChange={(event) => setClientDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="Note"
            />
            <button className="btn primary" type="button" onClick={saveClient} disabled={!clientDraft.name.trim()}>
              {editingClientId ? <Check /> : <Plus />}
              {editingClientId ? 'Save Changes' : 'Add Client'}
            </button>
            {editingClientId && (
              <button className="btn" type="button" onClick={cancelClientEdit}>
                <X />
                Cancel
              </button>
            )}
          </div>
          <label className="client-search">
            <Search />
            <input
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Search customer names"
            />
          </label>
          <div className="client-list">
            {filteredClients.map((client, index) => renderClientRow(client, index))}
            {!filteredClients.length && (
              <div className="empty-text">
                No customer names found.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

function InventoryTable({
  products,
  onAdd,
  onViewRestocks,
  onDelete,
  onEdit,
  onSell,
}: {
  products: Product[]
  onAdd: () => void
  onViewRestocks: () => void
  onDelete: (product: Product) => void
  onEdit: (product: Product) => void
  onSell: (product: Product) => void
}) {
  const totalRemaining = products.reduce((sum, product) => sum + remainingQuantity(product), 0)
  const totalValue = products.reduce((sum, product) => sum + remainingQuantity(product) * product.price, 0)
  const lowStock = products.filter((product) => remainingQuantity(product) / Math.max(1, product.totalQuantity) < 0.3).length

  return (
    <div className="inventory-workspace">
      <section className="module-hero inventory-hero">
        <div>
          <h3>{products.length} product lines under watch.</h3>
          <p>{totalRemaining} units available with {moneyLabel(totalValue)} estimated shelf value.</p>
        </div>
        <div className="inventory-hero-side">
          <div className="module-stats">
            <span><strong>{totalRemaining}</strong>Available</span>
            <span><strong>{lowStock}</strong>Low stock</span>
            <span><strong>{moneyLabel(totalValue)}</strong>Value</span>
          </div>
          <div className="inventory-hero-actions">
            <button className="btn primary add-product-btn" type="button" onClick={onAdd}>
              <PackagePlus />
              Add Product
            </button>
            <button className="btn restock-page-btn" type="button" onClick={onViewRestocks}>
              <PackageCheck />
              Re-stock Items
            </button>
          </div>
        </div>
      </section>

      <div className="inventory-grid">
        {products.map((product) => {
          const remaining = remainingQuantity(product)
          const stockRatio = product.totalQuantity ? remaining / product.totalQuantity : 0
          const status = product.isRestock ? 'Re-stock' : stockRatio < 0.3 ? 'Low' : stockRatio < 0.6 ? 'Watch' : 'Healthy'
          const statusClass = product.isRestock ? 'restock' : status.toLowerCase()

          return (
            <article className="inventory-card" key={product.id}>
              <button className="inventory-card-click" type="button" onClick={() => onEdit(product)}>
                <ProductImage product={product} variant="large" />
                <div className="inventory-card-body">
                  <div className="inventory-title-row">
                    <div>
                      <span className={`stock-chip ${statusClass}`}>{status}</span>
                      <h4>{product.name}</h4>
                    </div>
                    <div className="inventory-title-actions">
                      <button className="icon-btn" title="Edit product" onClick={(event) => {
                        event.stopPropagation()
                        onEdit(product)
                      }}>
                        <Edit3 />
                      </button>
                      <button className="icon-btn danger-icon" title="Delete product" onClick={(event) => {
                        event.stopPropagation()
                        onDelete(product)
                      }}>
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                  <div className="inventory-stats">
                    <span><strong>{remaining}</strong>Remaining</span>
                    <span><strong>{product.soldQuantity}</strong>Sold</span>
                    <span><strong>{product.totalQuantity}</strong>Total</span>
                  </div>
                </div>
              </button>
              <div className="row-actions inventory-card-actions">
                <strong className="price-pill">{priceLabel(product)}</strong>
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

function RestockItemsTable({
  products,
  onBack,
  onDelete,
  onEdit,
  onSell,
}: {
  products: Product[]
  onBack: () => void
  onDelete: (product: Product) => void
  onEdit: (product: Product) => void
  onSell: (product: Product) => void
}) {
  const totalRemaining = products.reduce((sum, product) => sum + remainingQuantity(product), 0)
  const totalValue = products.reduce((sum, product) => sum + remainingQuantity(product) * product.price, 0)

  return (
    <div className="inventory-workspace restock-workspace">
      <section className="module-hero restock-hero">
        <div>
          <h3>{products.length} re-stock batches ready to sell.</h3>
          <p>Cancelled items added back are kept here with their own selling price.</p>
        </div>
        <div className="inventory-hero-side">
          <div className="module-stats">
            <span><strong>{totalRemaining}</strong>Available</span>
            <span><strong>{moneyLabel(totalValue)}</strong>Value</span>
            <span><strong>{products.length}</strong>Batches</span>
          </div>
          <button className="btn" type="button" onClick={onBack}>
            <Boxes />
            Back to Products
          </button>
        </div>
      </section>

      {products.length === 0 ? (
        <div className="empty-state">
          <PackagePlus />
          <strong>No re-stock items yet.</strong>
          <span>Add cancelled items back into inventory to create separate re-stock batches.</span>
        </div>
      ) : (
        <div className="inventory-grid">
          {products.map((product) => {
            const remaining = remainingQuantity(product)

            return (
              <article className="inventory-card restock-card" key={product.id}>
                <button className="inventory-card-click" type="button" onClick={() => onEdit(product)}>
                  <ProductImage product={product} variant="large" />
                  <div className="inventory-card-body">
                    <div className="inventory-title-row">
                    <div>
                      <span className="stock-chip restock">Re-stock</span>
                      <h4>{product.name}</h4>
                    </div>
                      <div className="inventory-title-actions">
                        <button className="icon-btn" title="Edit re-stock item" onClick={(event) => {
                          event.stopPropagation()
                          onEdit(product)
                        }}>
                          <Edit3 />
                        </button>
                        <button className="icon-btn danger-icon" title="Delete re-stock item" onClick={(event) => {
                          event.stopPropagation()
                          onDelete(product)
                        }}>
                          <Trash2 />
                        </button>
                      </div>
                    </div>
                    <div className="inventory-stats">
                      <span><strong>{remaining}</strong>Remaining</span>
                      <span><strong>{product.soldQuantity}</strong>Sold</span>
                      <span><strong>{product.totalQuantity}</strong>Total</span>
                    </div>
                  </div>
                </button>
                <div className="row-actions inventory-card-actions">
                  <strong className="price-pill">{priceLabel(product)}</strong>
                  <button className="btn primary" onClick={() => onSell(product)} disabled={remaining === 0}>
                    <ShoppingCart />
                    Sell
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

type ProductImageSource = {
  name: string
  imageUrl?: string
}

function ProductImage({ product, variant = 'default' }: { product: ProductImageSource; variant?: 'default' | 'large' }) {
  return (
    <div className={`product-image ${variant === 'large' ? 'large' : ''}`}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} />
      ) : (
        <>
          <ImageIcon aria-hidden="true" />
          <span>{product.name}</span>
        </>
      )}
    </div>
  )
}

function SoldItemsTable({ soldItems, onCancel }: { soldItems: SoldItemView[]; onCancel: (item: SoldItem) => void }) {
  const totalProfit = soldItems.reduce(
    (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
    0,
  )
  const totalRevenue = soldItems.reduce((sum, item) => sum + item.quantity * item.salePrice, 0)

  return (
    <div className="ledger-workspace">
      <section className="module-hero sales-hero">
        <div>
          <h3>{soldItems.length} transactions captured.</h3>
          <p>{moneyLabel(totalRevenue)} revenue with {moneyLabel(totalProfit)} profit across active sold records.</p>
        </div>
        <div className="module-stats">
          <span><strong>{soldItems.length}</strong>Orders</span>
          <span><strong>{moneyLabel(totalRevenue)}</strong>Revenue</span>
          <span><strong>{moneyLabel(totalProfit)}</strong>Profit</span>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Quantity Sold</th>
              <th>Sell Price</th>
              <th>Cost</th>
              <th>Profit</th>
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
                <td>{moneyLabel(item.salePrice)}</td>
                <td>{moneyLabel(item.costPrice)}</td>
                <td className={profitAmount(item.quantity, item.salePrice, item.costPrice) >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {moneyLabel(profitAmount(item.quantity, item.salePrice, item.costPrice))}
                </td>
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

      <div className="sold-mobile-list">
        {soldItems.map((item) => (
          <article className="sold-mobile-card" key={item.id}>
            <ProductImage product={{ name: item.productName, imageUrl: item.imageUrl }} />
            <div className="sold-mobile-main">
              <strong>{item.productName}</strong>
              <div className="sold-mobile-stats">
                <span><small>Qty Sold</small>{item.quantity}</span>
                <span><small>Sell Price</small>{moneyLabel(item.salePrice)}</span>
              </div>
            </div>
            <div className="sold-mobile-profit">
              <small>Profit</small>
              <strong>{moneyLabel(profitAmount(item.quantity, item.salePrice, item.costPrice))}</strong>
              <button className="btn danger" onClick={() => onCancel(item)}>
                <Ban />
                Cancel
              </button>
            </div>
            <div className="sold-mobile-meta">
              <span><CalendarDays />{item.date}</span>
              <span><ClipboardList />{item.notes || '-'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function CancelledItemsTable({
  cancelledItems,
  onEdit,
  onAddToInventory,
}: {
  cancelledItems: CancelledItem[]
  onEdit: (item: CancelledItem) => void
  onAddToInventory: (item: CancelledItem) => void
}) {
  const cancelledImpact = cancelledItems.reduce(
    (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
    0,
  )
  const cancelledQuantity = cancelledItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="returns-workspace">
      <section className="module-hero returns-hero">
        <div>
          <h3>{cancelledQuantity} units waiting for a decision.</h3>
          <p>{moneyLabel(cancelledImpact)} profit currently reversed by cancelled sales.</p>
        </div>
        <div className="module-stats">
          <span><strong>{cancelledItems.length}</strong>Records</span>
          <span><strong>{cancelledQuantity}</strong>Units</span>
          <span><strong>{moneyLabel(cancelledImpact)}</strong>Impact</span>
        </div>
      </section>

      {cancelledItems.length === 0 ? (
        <div className="empty-state">
          <Ban />
          <strong>No cancelled items yet.</strong>
          <span>Cancelled sold items will appear here for editing or inventory recovery.</span>
        </div>
      ) : (
        <div className="inventory-grid">
          {cancelledItems.map((item) => (
            <article className="inventory-card cancelled-card" key={item.id}>
              <button className="inventory-card-click" type="button" onClick={() => onEdit(item)}>
                <ProductImage product={{ name: item.productName, imageUrl: item.imageUrl }} variant="large" />
                <div className="inventory-card-body">
                  <div className="inventory-title-row">
                    <div>
                      <span className="stock-chip low">Return</span>
                      <h4>{item.productName}</h4>
                    </div>
                    <strong className="price-pill">{moneyLabel(item.salePrice)}</strong>
                  </div>
                  <div className="inventory-stats cancelled-stats">
                    <span><strong>{item.quantity}</strong>Cancelled</span>
                    <span><strong>{item.cancellationDate}</strong>Date</span>
                  </div>
                  <p className="cancelled-note">{item.notes || 'No notes'}</p>
                </div>
              </button>
              <div className="row-actions inventory-card-actions">
                <button className="icon-btn" title="Edit cancelled item" onClick={() => onEdit(item)}>
                  <Edit3 />
                </button>
                <button className="btn primary" onClick={() => onAddToInventory(item)} disabled={item.quantity === 0}>
                  <PackagePlus />
                  Add to Inventory
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
function MonthlyReport({
  report,
  selectedMonth,
  setSelectedMonth,
  products,
  soldItems,
  cancelledItems,
}: {
  report: {
    productsAdded: Product[]
    soldThisMonth: SoldItem[]
    cancelledThisMonth: CancelledItem[]
    productsSold: number
    cancelledQuantity: number
    remainingStock: number
    revenue: number
    cost: number
    activeProfit: number
    cancelledProfitImpact: number
    netProfit: number
  }
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  products: Product[]
  soldItems: SoldItem[]
  cancelledItems: CancelledItem[]
}) {
  const [selectedDay, setSelectedDay] = useState(today)
  const [reportView, setReportView] = useState<'monthly' | 'daily'>('monthly')
  const dailySnapshot = useMemo<ExportReportSnapshot>(() => {
    const productsAdded = products.filter((product) => product.addedDate === selectedDay)
    const soldToday = soldItems.filter((item) => item.date === selectedDay)
    const cancelledToday = cancelledItems.filter((item) => item.cancellationDate === selectedDay)
    const productsSold = soldToday.reduce((sum, item) => sum + item.quantity, 0)
    const cancelledQuantity = cancelledToday.reduce((sum, item) => sum + item.quantity, 0)
    const revenue = soldToday.reduce((sum, item) => sum + item.quantity * item.salePrice, 0)
    const cost = soldToday.reduce((sum, item) => sum + item.quantity * item.costPrice, 0)
    const activeProfit = revenue - cost
    const cancelledProfitImpact = cancelledToday.reduce(
      (sum, item) => sum + profitAmount(item.quantity, item.salePrice, item.costPrice),
      0,
    )

    return {
      productsAdded,
      soldItems: soldToday,
      cancelledItems: cancelledToday,
      soldTransactions: soldToday.length,
      productsSold,
      cancelledQuantity,
      remainingStock: products.reduce((sum, product) => sum + remainingQuantity(product), 0) + cancelledItems.reduce((sum, item) => sum + item.quantity, 0),
      revenue,
      cost,
      activeProfit,
      cancelledProfitImpact,
      netProfit: activeProfit - cancelledProfitImpact,
    }
  }, [cancelledItems, products, selectedDay, soldItems])

  const monthlySnapshot: ExportReportSnapshot = {
    productsAdded: report.productsAdded,
    soldItems: report.soldThisMonth,
    cancelledItems: report.cancelledThisMonth,
    soldTransactions: report.soldThisMonth.length,
    productsSold: report.productsSold,
    cancelledQuantity: report.cancelledQuantity,
    remainingStock: report.remainingStock,
    revenue: report.revenue,
    cost: report.cost,
    activeProfit: report.activeProfit,
    cancelledProfitImpact: report.cancelledProfitImpact,
    netProfit: report.netProfit,
  }
  const visibleSnapshot = reportView === 'daily' ? dailySnapshot : monthlySnapshot
  const visibleLabel = reportView === 'daily' ? selectedDay : selectedMonth
  const visiblePeriodName = reportView === 'daily' ? 'day' : 'month'

  const exportDailyReport = () => {
    downloadExcelWorkbook(
      `inventory-daily-report-${selectedDay}`,
      buildReportWorkbookSheets('Daily', selectedDay, dailySnapshot),
    )
  }

  const exportMonthlyReport = () => {
    downloadExcelWorkbook(
      `inventory-monthly-report-${selectedMonth}`,
      buildReportWorkbookSheets('Monthly', selectedMonth, monthlySnapshot),
    )
  }

  return (
    <div className="report-layout">
      <section className="module-hero report-hero">
        <div>
          <h3>{visibleLabel} operating report.</h3>
          <p>{visibleSnapshot.productsSold} units sold, {visibleSnapshot.cancelledQuantity} cancelled, and {moneyLabel(visibleSnapshot.netProfit)} net profit.</p>
        </div>
        <div className="report-controls">
          <div className="report-view-toggle" aria-label="Report view">
            <button
              className={reportView === 'monthly' ? 'active' : ''}
              type="button"
              onClick={() => setReportView('monthly')}
            >
              Monthly
            </button>
            <button
              className={reportView === 'daily' ? 'active' : ''}
              type="button"
              onClick={() => setReportView('daily')}
            >
              Daily
            </button>
          </div>
          {reportView === 'monthly' ? (
            <label className="month-picker">
              <span>Selected month</span>
              <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </label>
          ) : (
            <label className="month-picker">
              <span>Selected day</span>
              <input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
            </label>
          )}
          <div className="export-actions">
            <button className="btn" type="button" onClick={exportDailyReport}>
              <Download />
              Daily Excel
            </button>
            <button className="btn primary" type="button" onClick={exportMonthlyReport}>
              <Download />
              Monthly Excel
            </button>
          </div>
        </div>
      </section>

      <div className="metric-grid compact">
        <article className="card metric-card">
          <div className="metric-label"><span>Products Added</span><Boxes /></div>
          <strong>{visibleSnapshot.productsAdded.length}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Products Sold</span><ShoppingCart /></div>
          <strong>{visibleSnapshot.productsSold}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Remaining Stock</span><PackageCheck /></div>
          <strong>{visibleSnapshot.remainingStock ?? report.remainingStock}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Cancelled Quantity</span><Ban /></div>
          <strong>{visibleSnapshot.cancelledQuantity}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Revenue</span><TrendingUp /></div>
          <strong>{moneyLabel(visibleSnapshot.revenue)}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Cost</span><ClipboardList /></div>
          <strong>{moneyLabel(visibleSnapshot.cost)}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Gross Profit</span><TrendingUp /></div>
          <strong>{moneyLabel(visibleSnapshot.activeProfit)}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Cancelled Impact</span><TrendingDown /></div>
          <strong>{moneyLabel(visibleSnapshot.cancelledProfitImpact)}</strong>
        </article>
        <article className="card metric-card">
          <div className="metric-label"><span>Net Profit</span><Check /></div>
          <strong>{moneyLabel(visibleSnapshot.netProfit)}</strong>
        </article>
      </div>

      <div className="card report-card">
        <div className="section-head">
          <h3>Products Added</h3>
          <span>{visibleLabel}</span>
        </div>
        <SimpleList
          empty={`No products were added in this ${visiblePeriodName}.`}
          rows={visibleSnapshot.productsAdded.map((product) => ({
            title: product.name,
            detail: `${product.totalQuantity} total quantity - added ${product.addedDate}`,
          }))}
        />
      </div>

      <div className="card report-card">
        <div className="section-head">
          <h3>Products Sold</h3>
          <span>{visibleLabel}</span>
        </div>
        <SimpleList
          empty={`No products were sold in this ${visiblePeriodName}.`}
          rows={visibleSnapshot.soldItems.map((item) => ({
            title: item.productName,
            detail: `${item.quantity} sold - sell ${moneyLabel(item.salePrice)} - cost ${moneyLabel(item.costPrice)} - profit ${moneyLabel(profitAmount(item.quantity, item.salePrice, item.costPrice))}`,
          }))}
        />
      </div>

      <div className="card report-card">
        <div className="section-head">
          <h3>Cancelled Profit Impact</h3>
          <span>{visibleLabel}</span>
        </div>
        <SimpleList
          empty={`No cancelled sales in this ${visiblePeriodName}.`}
          rows={visibleSnapshot.cancelledItems.map((item) => ({
            title: item.productName,
            detail: `${item.quantity} cancelled - reversed profit ${moneyLabel(profitAmount(item.quantity, item.salePrice, item.costPrice))} - ${item.notes || 'No notes'}`,
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
  title = 'Edit Product',
  saveLabel = 'Save',
  onClose,
  onSave,
}: {
  product: Product
  title?: string
  saveLabel?: string
  onClose: () => void
  onSave: (product: Product) => void
}) {
  const [draft, setDraft] = useState(product)
  const update = (key: keyof Product, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: ['totalQuantity', 'soldQuantity', 'price', 'costPrice'].includes(key) ? Number(value) : value,
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
          <h3>{title}</h3>
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
            <span>Selling Price</span>
            <input type="number" min="0" value={draft.price} onChange={(event) => update('price', event.target.value)} />
          </label>
          <label>
            <span>Cost Price</span>
            <input type="number" min="0" value={draft.costPrice} onChange={(event) => update('costPrice', event.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(draft)} disabled={!draft.name.trim()}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditCancelledItemModal({
  item,
  onClose,
  onSave,
}: {
  item: CancelledItem
  onClose: () => void
  onSave: (item: CancelledItem) => void
}) {
  const [draft, setDraft] = useState(item)
  const update = (key: keyof CancelledItem, value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: ['quantity', 'salePrice', 'costPrice'].includes(key) ? Number(value) : value,
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
          <h3>Edit Cancelled Item</h3>
          <button className="icon-btn" title="Close" onClick={onClose}><X /></button>
        </div>
        <div className="form-grid">
          <div className="image-editor full">
            <ProductImage product={{ name: draft.productName, imageUrl: draft.imageUrl }} />
            <div>
              <label className="upload-button">
                <Upload />
                <span>Upload Item Image</span>
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
            <input value={draft.productName} onChange={(event) => update('productName', event.target.value)} />
          </label>
          <label>
            <span>Cancelled Quantity</span>
            <input type="number" min="0" value={draft.quantity} onChange={(event) => update('quantity', event.target.value)} />
          </label>
          <label>
            <span>Selling Price</span>
            <input type="number" min="0" value={draft.salePrice} onChange={(event) => update('salePrice', event.target.value)} />
          </label>
          <label>
            <span>Cost Price</span>
            <input type="number" min="0" value={draft.costPrice} onChange={(event) => update('costPrice', event.target.value)} />
          </label>
          <label>
            <span>Cancellation Date</span>
            <input type="date" value={draft.cancellationDate} onChange={(event) => update('cancellationDate', event.target.value)} />
          </label>
          <label className="full">
            <span>Notes</span>
            <textarea value={draft.notes} onChange={(event) => update('notes', event.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave(draft)} disabled={!draft.productName.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function AddCancelledToInventoryModal({
  item,
  onClose,
  onSave,
}: {
  item: CancelledItem
  onClose: () => void
  onSave: (item: CancelledItem, quantity: number, price: number) => void
}) {
  const [quantity, setQuantity] = useState(Math.min(1, item.quantity))
  const [price, setPrice] = useState(item.salePrice)

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <h3>Create Re-stock Batch</h3>
          <button className="icon-btn" title="Close" onClick={onClose}><X /></button>
        </div>
        <div className="form-grid">
          <div className="image-editor full">
            <ProductImage product={{ name: item.productName, imageUrl: item.imageUrl }} />
            <div className="add-inventory-summary">
              <strong>{item.productName}</strong>
              <span>{item.quantity} cancelled units available</span>
              <span>This creates a separate re-stock item with its own selling price.</span>
              <span>Cost {moneyLabel(item.costPrice)}</span>
            </div>
          </div>
          <label>
            <span>How Many</span>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Selling Price</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            onClick={() => onSave(item, quantity, price)}
            disabled={quantity < 1 || quantity > item.quantity}
          >
            Create Re-stock
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
  const profit = profitAmount(quantity, product.price, product.costPrice)

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
          <label>
            <span>Selling Price</span>
            <input value={moneyLabel(product.price)} disabled />
          </label>
          <label>
            <span>Cost Price</span>
            <input value={moneyLabel(product.costPrice)} disabled />
          </label>
          <div className={`summary-box full ${profit >= 0 ? 'profit-summary' : 'loss-summary'}`}>
            <strong>{moneyLabel(profit)} estimated profit</strong>
            <span>{quantity} units x ({moneyLabel(product.price)} - {moneyLabel(product.costPrice)})</span>
          </div>
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
  onSave: (sale: SoldItem, quantity: number, notes: string) => void
}) {
  const [quantity, setQuantity] = useState(Math.min(1, sale.quantity))
  const [notes, setNotes] = useState('')
  const reversedProfit = profitAmount(quantity, sale.salePrice, sale.costPrice)

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
          <span>
            Cancelling {quantity} reverses {moneyLabel(reversedProfit)} profit
          </span>
        </div>
        <label className="field-block">
          <span>Quantity to Cancel</span>
          <input
            type="number"
            min="1"
            max={sale.quantity}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        <label className="field-block">
          <span>Cancellation Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Reason for cancellation" />
        </label>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Back</button>
          <button
            className="btn danger"
            onClick={() => onSave(sale, quantity, notes)}
            disabled={quantity < 1 || quantity > sale.quantity}
          >
            Cancel Quantity
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

