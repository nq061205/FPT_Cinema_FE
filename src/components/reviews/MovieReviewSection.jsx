import { useCallback, useState } from "react";
import { useAuth } from "../../hooks/useAuth.js";
import { useAsync } from "../../hooks/useAsync.js";
import { reviewService } from "../../services/review.service.js";
import DataState from "../common/DataState.jsx";
import EmptyState from "../common/EmptyState.jsx";
import { asArray } from "../../lib/collections.js";
import { formatDateTime } from "../../lib/formatters.js";
import ErrorMessage from "../common/ErrorMessage.jsx";

function MovieReviewSection({ movieId }) {
  const { isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ comment: "", rating: 5 });
  const [actionError, setActionError] = useState(null);

  const loadReviews = useCallback(async () => {
    const data = await reviewService.listByMovie(movieId);
    return asArray(data);
  }, [movieId]);

  const {
    data: reviews,
    error,
    loading,
    execute,
  } = useAsync(loadReviews, { initialData: [] });

  //cap nhat gia tri khi user go form
  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmitReview(event) {
    event.preventDefault();
    setActionError(null);

    try {
      const payload = {
        movieId: movieId,
        comment: form.comment,
        rating: Number(form.rating),
      };
      await reviewService.create(payload);

      //xoa trang form sau khi tao thanh cong
      setForm({ comment: "", rating: 5 });

      //load loi danh sach
      await execute();
    } catch (err) {
      setActionError(err);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Danh gia tu nguoi xem</h2>
      </div>
      <ErrorMessage error={actionError}></ErrorMessage>
      {isAuthenticated ? (
        <form className="filter-bar mb-4" onSubmit={handleSubmitReview}>
          <input
            className="form-control"
            name="comment"
            placeholder="Nhap danh gia cua ban..."
            value={form.comment}
            onChange={updateField}
            required
          />
          <select
            className="form-select"
            name="rating"
            value={form.rating}
            onChange={updateField}
            style={{ width: "auto" }}
          >
            <option value="5">5⭐</option>
            <option value="4">4⭐</option>
            <option value="3">3⭐</option>
            <option value="2">2⭐</option>
            <option value="1">1⭐</option>
          </select>
          <button className="btn btn-danger" type="submit">
            Gui
          </button>
        </form>
      ) : (
        <div className="alert alert-info">
          Vui lòng đăng nhập để gửi đánh giá
        </div>
      )}

      <DataState error={error} loading={loading}>
        {reviews.length ? (
          <div className="review-list mt-3">
            {reviews.map((review) => (
              <article className="review-data" key={review.id}>
                <div className="review-item_head">
                  {review.avatarUrl ? (
                    <img
                      src={review.avatarUrl}
                      alt="avatar"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                      }}
                    ></img>
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#ccc",
                      }}
                    ></div>
                  )}

                  <strong>{review.maskedName ?? "Người dùng"}</strong>

                  {review.rating ? (
                    <span className="status-pill">{review.rating}/5⭐</span>
                  ) : null}

                  <div>
                    <p style={{ marginTop: "8px" }}>{review.comment}</p>
                    <small className="muted">
                      {formatDateTime(review.createdAt)}
                    </small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có đánh giá"
            description="Hãy là người đầu tiên đánh giá bộ phim này!"
          />
        )}
      </DataState>
    </section>
  );
}

export default MovieReviewSection;
