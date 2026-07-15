import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatDateTime } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { paymentService } from '../../services/payment.service.js'

function RefundManagementPage() {
  const loadPendingRefunds = useCallback(async () => asArray(await paymentService.listPendingRefunds()), [])
  const { data: refunds, error, loading, execute } = useAsync(loadPendingRefunds, { initialData: [] })
  const [confirmingId, setConfirmingId] = useState(null)
  const [rejectOpenId, setRejectOpenId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [confirmMessage, setConfirmMessage] = useState('')

  async function handleConfirm(bookingId) {
    setConfirmingId(bookingId)
    setActionError(null)
    setConfirmMessage('')

    try {
      const result = await paymentService.confirmRefund({ bookingId })
      setConfirmMessage(
        result?.voucherCode
          ? `Refund confirmed. Voucher issued: ${result.voucherCode}`
          : 'Refund confirmed.',
      )
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setConfirmingId(null)
    }
  }

  function openRejectForm(bookingId) {
    setRejectOpenId(bookingId)
    setRejectReason('')
    setActionError(null)
  }

  async function handleReject(bookingId) {
    setRejectingId(bookingId)
    setActionError(null)

    try {
      await paymentService.rejectRefund({ bookingId, reason: rejectReason.trim() || null })
      setRejectOpenId(null)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setRejectingId(null)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Management"
        title="Refund Management"
        description="Review and confirm or reject pending refund requests from customers."
      />

      <ErrorMessage error={actionError} title="Failed to process refund" />
      {confirmMessage ? <div className="alert alert-success">{confirmMessage}</div> : null}

      <DataState
        data={refunds}
        emptyTitle="No pending refunds"
        emptyDescription="Refund requests submitted by customers will appear here."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Booking Code</th>
                <th>Movie</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Method</th>
                <th>Requested At</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.bookingId}>
                  <td>{refund.bookingCode}</td>
                  <td>{refund.movieTitle}</td>
                  <td>{refund.customerName}</td>
                  <td>{refund.customerPhone}</td>
                  <td><span className="status-pill">{refund.refundMethod === 'CASH' ? 'Cash' : 'Online'}</span></td>
                  <td>{formatDateTime(refund.refundRequestedAt)}</td>
                  <td className="text-end">{formatCurrency(refund.finalAmount)}</td>
                  <td className="text-end">
                    {rejectOpenId === refund.bookingId ? (
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        <input
                          className="form-control form-control-sm"
                          onChange={(event) => setRejectReason(event.target.value)}
                          placeholder="Reason (optional)"
                          value={rejectReason}
                        />
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={rejectingId === refund.bookingId}
                          onClick={() => handleReject(refund.bookingId)}
                          type="button"
                        >
                          {rejectingId === refund.bookingId ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                        <button className="btn btn-outline-dark btn-sm" onClick={() => setRejectOpenId(null)} type="button">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-2 justify-content-end">
                        <button
                          className="btn btn-outline-dark btn-sm"
                          disabled={confirmingId === refund.bookingId}
                          onClick={() => openRejectForm(refund.bookingId)}
                          type="button"
                        >
                          Reject
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={confirmingId === refund.bookingId}
                          onClick={() => handleConfirm(refund.bookingId)}
                          type="button"
                        >
                          {confirmingId === refund.bookingId ? 'Confirming...' : 'Confirm Refund'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
    </section>
  )
}

export default RefundManagementPage
