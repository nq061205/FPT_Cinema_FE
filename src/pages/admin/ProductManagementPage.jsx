import { useCallback, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { productService } from '../../services/product.service.js'

const EMPTY_FORM = { name: '', productType: 'FOOD', price: '', isActive: true }
const PRODUCT_TYPES = ['FOOD', 'BEVERAGE', 'COMBO']

function ProductManagementPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailId, setDetailId] = useState('')
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)
  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 100 })), [])
  const { data: products, error, loading, execute } = useAsync(loadProducts, { initialData: [] })

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name ?? '',
      productType: product.productType ?? 'FOOD',
      price: product.price ?? '',
      isActive: product.isActive !== false,
    })
    setActionError(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function viewDetail(productId) {
    setActionError(null)
    try {
      setDetail(await productService.detail(productId))
      setDetailId(String(productId))
    } catch (err) {
      setActionError(err)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price) }
      if (editingId) await productService.update(editingId, payload)
      else await productService.create(payload)
      resetForm()
      setDetail(null)
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader eyebrow="Management" title="Products" description="Create, update and activate cinema food or merchandise products." />
      <ErrorMessage error={actionError} />

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>{editingId ? `Edit product #${editingId}` : 'Add product'}</h2>
          {editingId ? <button className="btn btn-outline-dark btn-sm" type="button" onClick={resetForm}>Cancel</button> : null}
        </div>
        <div className="form-row">
          <label className="form-label">Name<input className="form-control" name="name" value={form.name} onChange={updateField} required /></label>
          <label className="form-label">Type<select className="form-select" name="productType" value={form.productType} onChange={updateField} required>{PRODUCT_TYPES.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select></label>
        </div>
        <div className="form-row">
          <label className="form-label">Price (VND)<input className="form-control" name="price" type="number" min="1" step="1000" value={form.price} onChange={updateField} required /></label>
          <label className="form-check align-self-end"><input className="form-check-input" name="isActive" type="checkbox" checked={form.isActive} onChange={updateField} /><span className="form-check-label">Active</span></label>
        </div>
        <button className="btn btn-danger" type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Create product'}</button>
      </form>

      <form className="panel form-row align-items-end" onSubmit={(event) => { event.preventDefault(); viewDetail(Number(detailId)) }}>
        <label className="form-label">Product ID<input className="form-control" type="number" min="1" value={detailId} onChange={(event) => setDetailId(event.target.value)} required /></label>
        <button className="btn btn-outline-dark" type="submit">Find product, including inactive</button>
      </form>

      <DataState data={products} emptyTitle="No products" emptyDescription="Products will appear here after creation." error={error} loading={loading}>
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Status</th><th /></tr></thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{formatLabel(product.productType)}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td><span className="status-pill">{product.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-secondary" type="button" onClick={() => viewDetail(product.id)}>Detail</button><button className="btn btn-outline-dark" type="button" onClick={() => startEdit(product)}>Edit</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataState>
      {detail ? <article className="panel"><div className="panel-header"><h2>{detail.name}</h2><div className="d-flex gap-2"><button className="btn btn-danger btn-sm" type="button" onClick={() => startEdit(detail)}>Edit / reactivate</button><button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setDetail(null)}>Close</button></div></div><dl className="detail-list"><dt>Type</dt><dd>{formatLabel(detail.productType)}</dd><dt>Price</dt><dd>{formatCurrency(detail.price)}</dd><dt>Status</dt><dd>{detail.isActive ? 'Active' : 'Inactive'}</dd><dt>Created</dt><dd>{detail.createdAt ?? '-'}</dd><dt>Updated</dt><dd>{detail.updatedAt ?? '-'}</dd></dl></article> : null}
    </section>
  )
}

export default ProductManagementPage
