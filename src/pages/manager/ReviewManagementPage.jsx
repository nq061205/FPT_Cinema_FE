import { useCallback, useState, useEffect } from "react";
import DataState from "../../components/common/DataState.jsx";
import ErrorMessage from "../../components/common/ErrorMessage.jsx";
import PageHeader from "../../components/common/PageHeader.jsx";
import AppModal from "../../components/common/AppModal.jsx";
import { asArray } from "../../lib/collections.js";
import { formatDateTime } from "../../lib/formatters.js";
import { reviewService } from "../../services/review.service.js";
import { movieService } from "../../services/movie.service.js";

function ReviewManagementPage() {
  const [movies, setMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, rRes] = await Promise.all([
        movieService.list(),
        reviewService.list({ size: 1000 })
      ]);
      setMovies(asArray(mRes?.content ?? mRes));
      setReviews(asArray(rRes?.content ?? rRes));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(reviewId) {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này không?")) return;
    setActionError(null);
    try {
      await reviewService.delete(reviewId);
      const rRes = await reviewService.list({ size: 1000 });
      const newReviews = asArray(rRes?.content ?? rRes);
      setReviews(newReviews);
      
     
      if (selectedMovie) {
         setSelectedMovie(prev => ({
             ...prev,
             reviews: newReviews.filter(r => String(r.movieId) === String(prev.id)),
             totalReviews: newReviews.filter(r => String(r.movieId) === String(prev.id)).length
         }));
      }
    } catch (err) {
      setActionError(err);
    }
  }

  const movieStats = movies.map(movie => {
    const movieReviews = reviews.filter(r => String(r.movieId) === String(movie.id));
    const totalReviews = movieReviews.length;
    const avgRating = totalReviews > 0 
      ? (movieReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
      : 0;
    
    return {
      ...movie,
      totalReviews,
      avgRating,
      reviews: movieReviews
    };
  });
  

  movieStats.sort((a, b) => b.totalReviews - a.totalReviews);

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Quản lý"
        title="Đánh giá & Bình Luận"
        description="Tổng quan phản hồi của khán giả theo từng bộ phim."
      />

      <DataState data={movieStats} loading={loading} error={error} emptyTitle="Không có dữ liệu">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {movieStats.map(m => (
            <div 
              key={m.id} 
              className="panel" 
              style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", padding: 16 }}
              onClick={() => setSelectedMovie(m)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div style={{ display: "flex", gap: 16 }}>
                <img 
                  src={m.posterUrl || m.poster || m.image || "https://placehold.co/100x150?text=No+Image"} 
                  alt={m.title} 
                  onError={(e) => { e.currentTarget.src = "https://placehold.co/100x150?text=No+Image"; }}
                  style={{ width: 80, height: 120, objectFit: "cover", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, marginBottom: 8 }}>{m.title}</div>
                    <div className="badge">{m.status}</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <strong style={{ fontSize: "1.5rem", color: "var(--brand)" }}>{m.avgRating}</strong>
                      <span className="muted small">/ 5 ⭐</span>
                    </div>
                    <div className="muted small">{m.totalReviews} đánh giá</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      <AppModal
        open={!!selectedMovie}
        onClose={() => { setSelectedMovie(null); setActionError(null); }}
        title={`Đánh giá: ${selectedMovie?.title}`}
        size="lg"
      >
        <ErrorMessage error={actionError} />
        {selectedMovie && selectedMovie.reviews.length === 0 ? (
           <div className="muted text-center" style={{ padding: 40 }}>Chưa có đánh giá nào cho phim này.</div>
        ) : (
           <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Đánh giá</th>
                    <th>Bình luận</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMovie?.reviews.map(review => (
                    <tr key={review.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {review.avatarUrl && (
                            <img
                              src={review.avatarUrl}
                              alt=""
                              style={{ width: "24px", height: "24px", borderRadius: "50%" }}
                            />
                          )}
                          <span style={{ fontWeight: 600 }}>{review.maskedName ?? "Người dùng"}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "#f59e0b", letterSpacing: "2px" }}>
                           {Array.from({ length: review.rating || 0 }).map(() => "⭐").join("")}
                        </div>
                      </td>
                      <td style={{ maxWidth: "250px", whiteSpace: "normal", wordWrap: "break-word" }}>
                        {review.comment}
                      </td>
                      <td className="muted small">{formatDateTime(review.createdAt)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(review.id)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        )}
      </AppModal>
    </section>
  );
}

export default ReviewManagementPage;
