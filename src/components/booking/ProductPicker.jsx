import { formatCurrency } from '../../lib/formatters.js'

function ProductPicker({ products, quantities, onChangeQuantity }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <div className="product-card" key={product.id}>
          <div className="product-card__media">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} loading="lazy" />
            ) : (
              <div className="poster-fallback" />
            )}
          </div>
          <div className="product-card__body">
            <h3>{product.name}</h3>
            <div className="muted small">{formatCurrency(product.price)}</div>
            <div className="btn-group">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => onChangeQuantity(product.id, -1)} type="button">−</button>
              <span className="btn btn-outline-secondary btn-sm disabled">{quantities[product.id] ?? 0}</span>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => onChangeQuantity(product.id, 1)} type="button">+</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductPicker
