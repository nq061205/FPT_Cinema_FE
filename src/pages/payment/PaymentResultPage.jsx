import { useCallback, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import DataState from '../../components/common/DataState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { formatCurrency, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { paymentService } from '../../services/payment.service.js'

function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const query = useMemo(() => Object.fromEntries(new URLSearchParams(queryString).entries()), [queryString])
  const loadResult = useCallback(() => paymentService.vnpayReturn(query), [query])
  const hasQuery = Object.keys(query).length > 0
  const { data, error, loading } = useAsync(loadResult, { initialData: null, immediate: hasQuery })

  return (
    <main className="center-page p-4">
      <section className="page-stack w-100" style={{ maxWidth: 620 }}>
        <PageHeader eyebrow="Payment" title="VNPay result" description="Payment gateway response for your transaction." />
        <DataState error={error} loading={loading}>
          {data ? <article className="panel"><dl className="detail-list"><dt>Payment code</dt><dd>{data.paymentCode ?? '-'}</dd><dt>Booking code</dt><dd>{data.bookingCode ?? '-'}</dd><dt>Status</dt><dd>{formatLabel(data.status)}</dd><dt>Amount</dt><dd>{formatCurrency(data.amount)}</dd><dt>Message</dt><dd>{data.message ?? '-'}</dd></dl></article> : <article className="panel"><p className="muted">No gateway parameters were provided.</p></article>}
        </DataState>
        <Link className="btn btn-danger align-self-start" to="/">Back to FPT Cinema</Link>
      </section>
    </main>
  )
}

export default PaymentResultPage
