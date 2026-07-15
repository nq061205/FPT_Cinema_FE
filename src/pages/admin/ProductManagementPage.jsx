import { useCallback, useMemo, useState } from 'react'
import DataState from '../../components/common/DataState.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import { PRODUCT_TYPES } from '../../constants/enums.js'
import { asArray } from '../../lib/collections.js'
import { formatCurrency, formatLabel } from '../../lib/formatters.js'
import { useAsync } from '../../hooks/useAsync.js'
import { productService } from '../../services/product.service.js'

const emptyForm = { name: '', type: 'FOOD', price: '', description: '', imageUrl: '' }

function ProductManagementPage() {
  const loadProducts = useCallback(async () => asArray(await productService.list({ page: 0, size: 100 })), [])
  const { data: products, error, loading, execute } = useAsync(loadProducts, { initialData: [] })

  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [saving, setSaving] = useState(false)

  const filteredProducts = useMemo(
    () => (typeFilter ? products.filter((product) => product.type === typeFilter) : products),
    [products, typeFilter],
  )

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name ?? '',
      type: product.type ?? 'FOOD',
      price: product.price ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setActionError(null)
    setSaving(true)

    const payload = { ...form, price: Number(form.price) || 0 }

    try {
      if (editingId) {
        await productService.update(editingId, payload)
      } else {
        await productService.create(payload)
      }

      cancelEdit()
      await execute()
    } catch (err) {
      setActionError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    setActionError(null)

    try {
      await productService.remove(product.id)
      await execute()
    } catch (err) {
      setActionError(err)
    }
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Management"
        title="Food & Beverage Management"
        description="Manage food, beverage, and combos sold at the counter."
      />

      <ErrorMessage error={actionError} />

      <form className="panel form-grid" onSubmit={handleSubmit}>
        <div className="panel-header">
          <h2>{editingId ? 'Update Product' : 'Create New Product'}</h2>
          {editingId ? (
            <button className="btn btn-outline-dark btn-sm" type="button" onClick={cancelEdit}>Cancel Edit</button>
          ) : null}
        </div>

        <div className="form-row">
          <label className="form-label">
            Product Name
            <input className="form-control" name="name" value={form.name} onChange={updateField} required />
          </label>
          <label className="form-label">
            Type
            <select className="form-select" name="type" value={form.type} onChange={updateField}>
              {PRODUCT_TYPES.map((type) => (
                <option key={type} value={type}>{formatLabel(type)}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="form-label">
          Selling Price
          <input className="form-control" name="price" type="number" min="0" value={form.price} onChange={updateField} required />
        </label>

        <label className="form-label">
          Description
          <textarea className="form-control" name="description" rows="2" value={form.description} onChange={updateField} />
        </label>

        <label className="form-label">
          Product Image (URL)
          <input className="form-control" name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="https://..." />
        </label>

        <button className="btn btn-danger" disabled={saving} type="submit">
          {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
        </button>
      </form>

      <div className="filter-bar">
        <select className="form-select" name="type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All types</option>
          {PRODUCT_TYPES.map((type) => (
            <option key={type} value={type}>{formatLabel(type)}</option>
          ))}
        </select>
      </div>

      <DataState
        data={filteredProducts}
        emptyTitle="No products found"
        emptyDescription="Create your first food, beverage, or combo item."
        error={error}
        loading={loading}
      >
        <div className="panel table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Type</th>
                <th className="text-end">Price</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 8 }} className="poster-fallback" />
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td><span className="status-pill">{formatLabel(product.type)}</span></td>
                  <td className="text-end">{formatCurrency(product.price)}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-dark" type="button" onClick={() => startEdit(product)}>Edit</button>
                      <button className="btn btn-outline-dark" type="button" onClick={() => handleDelete(product)}>Delete</button>
                    </div>
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

export default ProductManagementPage
