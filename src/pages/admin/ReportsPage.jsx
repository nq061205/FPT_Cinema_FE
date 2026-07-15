import { useState } from 'react'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import StatCard from '../../components/common/StatCard.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import {
  BOOKING_CHANNELS,
  BOOKING_STATUSES,
  MEMBERSHIP_LEVELS,
  MOVIE_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PROMOTION_TYPES,
  REPORT_GROUPS,
  USER_STATUSES,
} from '../../constants/enums.js'
import { formatCurrency, formatLabel } from '../../lib/formatters.js'
import { reportService } from '../../services/report.service.js'

const REPORT_TYPES = [
  { value: 'revenue', label: 'Doanh thu' },
  { value: 'payment', label: 'Thanh toán' },
  { value: 'booking', label: 'Đặt vé' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'promotion', label: 'Khuyến mãi' },
  { value: 'movie', label: 'Phim' },
]

const INITIAL_FORM = {
  type: 'revenue',
  startDate: '',
  endDate: '',
  groupBy: 'DAY',
  paymentMethod: '',
  completedBookingsOnly: true,
  paymentStatus: '',
  bookingStatus: '',
  channel: '',
  movieId: '',
  membershipLevel: '',
  userStatus: '',
  promotionCode: '',
  promotionType: '',
  movieStatus: '',
}

function formatPercent(value) {
  if (value === null || value === undefined) return '-'
  return `${Number(value).toFixed(1)}%`
}

function buildPayload(form) {
  const base = {
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    groupBy: form.groupBy,
  }

  switch (form.type) {
    case 'revenue':
      return { ...base, paymentMethod: form.paymentMethod || null, completedBookingsOnly: form.completedBookingsOnly }
    case 'payment':
      return { ...base, paymentStatus: form.paymentStatus || null, paymentMethod: form.paymentMethod || null }
    case 'booking':
      return {
        ...base,
        statuses: form.bookingStatus ? [form.bookingStatus] : null,
        channels: form.channel ? [form.channel] : null,
        movieId: form.movieId ? Number(form.movieId) : null,
      }
    case 'customer':
      return { ...base, membershipLevel: form.membershipLevel || null, userStatus: form.userStatus || null }
    case 'promotion':
      return { ...base, promotionCode: form.promotionCode || null, promotionType: form.promotionType || null }
    case 'movie':
      return { ...base, movieStatus: form.movieStatus || null }
    default:
      return base
  }
}

function MiniLineChart({ data, xKey, yKey, isCurrency = false }) {
  if (!data || data.length === 0) return <p className="muted text-center py-4">Không có dữ liệu</p>

  const values = data.map(item => Number(item[yKey]))
  const maxVal = Math.max(...values, 1)
  const minVal = Math.min(...values, 0)
  
  const width = 500
  const height = 200
  const padding = 40
  
  const chartWidth = width - padding * 2
  const chartHeight = height - padding * 2

  const points = data.map((item, idx) => {
    const x = padding + (idx / Math.max(data.length - 1, 1)) * chartWidth
    const y = padding + chartHeight - ((Number(item[yKey]) - minVal) / (maxVal - minVal)) * chartHeight
    return { x, y, item }
  })

  let pathD = ""
  let areaD = ""
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
  }

  const formatYValue = (val) => {
    if (isCurrency) {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
      return `${val}`
    }
    return `${val.toFixed(0)}`
  }

  return (
    <div className="chart-container py-3 bg-white rounded border p-3 mb-4" style={{ boxShadow: 'var(--shadow)' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lineChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + chartHeight * ratio
          const val = maxVal - (maxVal - minVal) * ratio
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeDasharray="3 3" opacity="0.6" />
              <text x={padding - 8} y={y + 3} textAnchor="end" fontSize="9" fill="var(--muted)">
                {formatYValue(val)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#lineChartGrad)" />}

        {/* Path line */}
        {pathD && <path d={pathD} fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="chart-dot-group">
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke="var(--danger)" strokeWidth="1.5" />
            {data.length <= 15 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--ink)">
                {Number(p.item[yKey]) > 0 ? formatYValue(Number(p.item[yKey])) : ''}
              </text>
            )}
          </g>
        ))}

        {/* X axis labels */}
        {points.map((p, idx) => {
          const showLabel = data.length <= 8 || idx % Math.ceil(data.length / 5) === 0 || idx === data.length - 1
          if (!showLabel) return null
          return (
            <text key={idx} x={p.x} y={height - padding + 15} textAnchor="middle" fontSize="9" fill="var(--muted)">
              {p.item[xKey]}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function MiniBarChart({ data, xKey, yKey, isCurrency = false }) {
  if (!data || data.length === 0) return <p className="muted text-center py-4">Không có dữ liệu</p>

  const values = data.map(item => Number(item[yKey]))
  const maxVal = Math.max(...values, 1)

  const width = 500
  const paddingLeft = 130
  const paddingRight = 60
  const paddingTop = 15
  const paddingBottom = 15
  
  const chartWidth = width - paddingLeft - paddingRight
  const barHeight = 18
  const barGap = 10
  const chartHeight = data.length * (barHeight + barGap) + paddingTop + paddingBottom

  const formatBarValue = (val) => {
    if (isCurrency) return formatCurrency(val)
    return `${val}`
  }

  return (
    <div className="chart-container py-3 bg-white rounded border p-3 mb-4" style={{ boxShadow: 'var(--shadow)' }}>
      <svg viewBox={`0 0 ${width} ${chartHeight}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
        {data.map((item, idx) => {
          const val = Number(item[yKey])
          const barWidth = (val / maxVal) * chartWidth
          const y = paddingTop + idx * (barHeight + barGap)
          
          return (
            <g key={idx}>
              {/* Label */}
              <text x={paddingLeft - 10} y={y + barHeight / 2 + 4} textAnchor="end" fontSize="10.5" fontWeight="500" fill="var(--ink)">
                {item[xKey]?.length > 20 ? item[xKey].slice(0, 18) + '...' : item[xKey]}
              </text>
              {/* Background Bar */}
              <rect x={paddingLeft} y={y} width={chartWidth} height={barHeight} fill="var(--border)" opacity="0.2" rx="3" />
              {/* Highlight Bar */}
              <rect x={paddingLeft} y={y} width={Math.max(barWidth, 3)} height={barHeight} fill="var(--danger)" rx="3" />
              {/* Value label */}
              <text x={paddingLeft + barWidth + 6} y={y + barHeight / 2 + 4} textAnchor="start" fontSize="9.5" fontWeight="bold" fill="var(--danger)">
                {formatBarValue(val)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ReportTable({ columns, rows, emptyText = 'Không có dữ liệu.' }) {
  if (!rows || rows.length === 0) {
    return <p className="muted">{emptyText}</p>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === 'end' ? 'text-end' : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'end' ? 'text-end' : undefined}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RevenueResult({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng doanh thu" value={formatCurrency(data.totalRevenue)} tone="gold" />
        <StatCard label="Giá trị đơn trung bình" value={formatCurrency(data.averageOrderValue)} />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Xu hướng doanh thu</h2></div>
        <MiniLineChart data={data.revenueTrend} xKey="period" yKey="revenue" isCurrency={true} />
        <ReportTable
          rows={data.revenueTrend}
          columns={[
            { key: 'period', header: 'Kỳ' },
            { key: 'orderCount', header: 'Số đơn', align: 'end' },
            { key: 'revenue', header: 'Doanh thu', align: 'end', render: (row) => formatCurrency(row.revenue) },
          ]}
        />
      </article>
      <article className="panel">
        <div className="panel-header"><h2>Doanh thu theo phim</h2></div>
        <MiniBarChart data={data.movieRevenue} xKey="movieTitle" yKey="revenue" isCurrency={true} />
        <ReportTable
          rows={data.movieRevenue}
          columns={[
            { key: 'movieTitle', header: 'Phim' },
            { key: 'revenue', header: 'Doanh thu', align: 'end', render: (row) => formatCurrency(row.revenue) },
          ]}
        />
      </article>
    </>
  )
}

function PaymentResult({ data }) {
  const formattedMethods = (data.paymentMethods ?? []).map(m => ({
    ...m,
    paymentMethodLabel: formatLabel(m.paymentMethod)
  }))

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng giao dịch" value={data.totalTransactions ?? 0} />
        <StatCard label="Thành công" value={data.successfulTransactions ?? 0} tone="green" />
        <StatCard label="Thất bại" value={data.failedTransactions ?? 0} tone="red" />
        <StatCard label="Tổng tiền" value={formatCurrency(data.totalAmount)} tone="gold" />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Theo phương thức</h2></div>
        <MiniBarChart data={formattedMethods} xKey="paymentMethodLabel" yKey="amount" isCurrency={true} />
        <ReportTable
          rows={data.paymentMethods}
          columns={[
            { key: 'paymentMethod', header: 'Phương thức', render: (row) => formatLabel(row.paymentMethod) },
            { key: 'transactionCount', header: 'Số giao dịch', align: 'end' },
            { key: 'amount', header: 'Số tiền', align: 'end', render: (row) => formatCurrency(row.amount) },
          ]}
        />
      </article>
    </>
  )
}

function BookingResult({ data }) {
  const formattedChannels = (data.channelDistribution ?? []).map(c => ({
    ...c,
    channelLabel: formatLabel(c.channel)
  }))

  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng lượt đặt" value={data.totalBookings ?? 0} />
        <StatCard label="Hoàn tất" value={data.completedBookings ?? 0} tone="green" />
        <StatCard label="Đã hủy" value={data.cancelledBookings ?? 0} tone="red" />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Xu hướng đặt vé</h2></div>
        <MiniLineChart data={data.bookingTrend} xKey="period" yKey="bookingCount" isCurrency={false} />
        <ReportTable
          rows={data.bookingTrend}
          columns={[
            { key: 'period', header: 'Kỳ' },
            { key: 'bookingCount', header: 'Tổng', align: 'end' },
            { key: 'completedCount', header: 'Hoàn tất', align: 'end' },
            { key: 'cancelledCount', header: 'Đã hủy', align: 'end' },
          ]}
        />
      </article>
      <article className="panel">
        <div className="panel-header"><h2>Phân bổ theo kênh</h2></div>
        <MiniBarChart data={formattedChannels} xKey="channelLabel" yKey="bookingCount" isCurrency={false} />
        <ReportTable
          rows={data.channelDistribution}
          columns={[
            { key: 'channel', header: 'Kênh', render: (row) => formatLabel(row.channel) },
            { key: 'bookingCount', header: 'Số lượt', align: 'end' },
          ]}
        />
      </article>
    </>
  )
}

function CustomerResult({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng khách" value={data.totalCustomers ?? 0} />
        <StatCard label="Khách mới" value={data.newCustomers ?? 0} tone="green" />
        <StatCard label="Khách quay lại" value={data.returningCustomers ?? 0} tone="gold" />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Khách hàng hàng đầu</h2></div>
        <MiniBarChart data={data.topCustomers} xKey="customerName" yKey="spending" isCurrency={true} />
        <ReportTable
          rows={data.topCustomers}
          columns={[
            { key: 'customerName', header: 'Khách hàng' },
            { key: 'bookingCount', header: 'Số lượt đặt', align: 'end' },
            { key: 'spending', header: 'Chi tiêu', align: 'end', render: (row) => formatCurrency(row.spending) },
          ]}
        />
      </article>
    </>
  )
}

function PromotionResult({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng khuyến mãi" value={data.totalPromotions ?? 0} />
        <StatCard label="Lượt sử dụng" value={data.totalUsage ?? 0} tone="green" />
        <StatCard label="Tổng giảm giá" value={formatCurrency(data.totalDiscountAmount)} tone="gold" />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Khuyến mãi hàng đầu</h2></div>
        <MiniBarChart data={data.topPromotions} xKey="promotionCode" yKey="discountAmount" isCurrency={true} />
        <ReportTable
          rows={data.topPromotions}
          columns={[
            { key: 'promotionCode', header: 'Mã khuyến mãi' },
            { key: 'discountAmount', header: 'Giá trị giảm', align: 'end', render: (row) => formatCurrency(row.discountAmount) },
          ]}
        />
      </article>
    </>
  )
}

function MovieResult({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Tổng phim" value={data.totalMovies ?? 0} />
        <StatCard label="Vé đã bán" value={data.totalTicketsSold ?? 0} tone="green" />
        <StatCard label="Tỉ lệ lấp đầy TB" value={formatPercent(data.averageOccupancyRate)} tone="gold" />
      </div>
      <article className="panel">
        <div className="panel-header"><h2>Phim hàng đầu</h2></div>
        <MiniBarChart data={data.topMovies} xKey="movieTitle" yKey="revenue" isCurrency={true} />
        <ReportTable
          rows={data.topMovies}
          columns={[
            { key: 'movieTitle', header: 'Phim' },
            { key: 'ticketsSold', header: 'Vé bán', align: 'end' },
            { key: 'bookingCount', header: 'Lượt đặt', align: 'end' },
            { key: 'revenue', header: 'Doanh thu', align: 'end', render: (row) => formatCurrency(row.revenue) },
            { key: 'occupancyRate', header: 'Lấp đầy', align: 'end', render: (row) => formatPercent(row.occupancyRate) },
          ]}
        />
      </article>
    </>
  )
}

const RESULT_COMPONENTS = {
  revenue: RevenueResult,
  payment: PaymentResult,
  booking: BookingResult,
  customer: CustomerResult,
  promotion: PromotionResult,
  movie: MovieResult,
}

function ReportsPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [resultType, setResultType] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { checked, name, type, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setResult(null)

    if (!form.startDate || !form.endDate) {
      setError(new Error('Start date and end date are required.'))
      return
    }
    if (form.startDate > form.endDate) {
      setError(new Error('Start date must be before or equal to end date.'))
      return
    }

    setLoading(true)

    try {
      const response = await reportService[form.type](buildPayload(form))
      setResult(response)
      setResultType(form.type)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const ResultComponent = resultType ? RESULT_COMPONENTS[resultType] : null

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Analytics" title="Báo cáo" description="Thống kê doanh thu, thanh toán, đặt vé, khách hàng, khuyến mãi và phim." />
      <ErrorMessage error={error} />

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label className="form-label">
          Loại báo cáo
          <select className="form-select" name="type" value={form.type} onChange={updateField}>
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label className="form-label">
            Từ ngày
            <input className="form-control" name="startDate" type="date" value={form.startDate} onChange={updateField} />
          </label>
          <label className="form-label">
            Đến ngày
            <input className="form-control" name="endDate" type="date" value={form.endDate} onChange={updateField} />
          </label>
        </div>

        <label className="form-label">
          Nhóm theo
          <select className="form-select" name="groupBy" value={form.groupBy} onChange={updateField}>
            {REPORT_GROUPS.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </label>

        {form.type === 'revenue' ? (
          <>
            <label className="form-label">
              Phương thức thanh toán
              <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={updateField}>
                <option value="">Tất cả</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="form-check">
              <input className="form-check-input" name="completedBookingsOnly" type="checkbox" checked={form.completedBookingsOnly} onChange={updateField} />
              <span className="form-check-label">Chỉ tính đơn đã hoàn tất</span>
            </label>
          </>
        ) : null}

        {form.type === 'payment' ? (
          <div className="form-row">
            <label className="form-label">
              Trạng thái
              <select className="form-select" name="paymentStatus" value={form.paymentStatus} onChange={updateField}>
                <option value="">Tất cả</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Phương thức
              <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={updateField}>
                <option value="">Tất cả</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {form.type === 'booking' ? (
          <>
            <div className="form-row">
              <label className="form-label">
                Trạng thái
                <select className="form-select" name="bookingStatus" value={form.bookingStatus} onChange={updateField}>
                  <option value="">Tất cả</option>
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="form-label">
                Kênh
                <select className="form-select" name="channel" value={form.channel} onChange={updateField}>
                  <option value="">Tất cả</option>
                  {BOOKING_CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="form-label">
              Mã phim (movieId)
              <input className="form-control" name="movieId" type="number" min="1" value={form.movieId} onChange={updateField} placeholder="Tất cả" />
            </label>
          </>
        ) : null}

        {form.type === 'customer' ? (
          <div className="form-row">
            <label className="form-label">
              Hạng thành viên
              <select className="form-select" name="membershipLevel" value={form.membershipLevel} onChange={updateField}>
                <option value="">Tất cả</option>
                {MEMBERSHIP_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Trạng thái tài khoản
              <select className="form-select" name="userStatus" value={form.userStatus} onChange={updateField}>
                <option value="">Tất cả</option>
                {USER_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {form.type === 'promotion' ? (
          <div className="form-row">
            <label className="form-label">
              Mã khuyến mãi
              <input className="form-control" name="promotionCode" value={form.promotionCode} onChange={updateField} placeholder="Tất cả" />
            </label>
            <label className="form-label">
              Loại khuyến mãi
              <select className="form-select" name="promotionType" value={form.promotionType} onChange={updateField}>
                <option value="">Tất cả</option>
                {PROMOTION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {form.type === 'movie' ? (
          <label className="form-label">
            Trạng thái phim
            <select className="form-select" name="movieStatus" value={form.movieStatus} onChange={updateField}>
              <option value="">Tất cả</option>
              {MOVIE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        ) : null}

        <button className="btn btn-danger" type="submit" disabled={loading}>
          {loading ? 'Đang tạo báo cáo...' : 'Tạo báo cáo'}
        </button>
      </form>

      {ResultComponent && result ? (
        <ResultComponent data={result} />
      ) : (
        !loading && <EmptyState title="Chưa có báo cáo" description="Chọn bộ lọc và nhấn Tạo báo cáo để xem kết quả." />
      )}
    </section>
  )
}

export default ReportsPage
