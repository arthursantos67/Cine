"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reviewsApi } from "@/api/reviews";
import { useI18n } from "@/i18n";
import type { MovieReview, MovieReviewsPage } from "@/types/catalog";
import { StarRating } from "@/components/movies/StarRating";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: MovieReviewsPage; page: number };

function formatDate(dateStr: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(dateStr)
    );
  } catch {
    return dateStr;
  }
}

type RowProps = {
  review: MovieReview;
  onDelete: (id: string) => void;
};

function ReviewRow({ onDelete, review }: RowProps) {
  const { locale, t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      onDelete(review.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <tr className="admin-review-row">
      <td className="admin-review-row__user">
        <span>{review.user.username || review.user.email}</span>
        <span className="admin-review-row__email">{review.user.email}</span>
      </td>
      <td className="admin-review-row__rating">
        <StarRating mode="display" value={Number(review.rating)} />
      </td>
      <td className="admin-review-row__comment">
        {review.comment || <em className="text-muted">—</em>}
      </td>
      <td className="admin-review-row__date">
        {formatDate(review.created_at, locale)}
      </td>
      <td className="admin-review-row__actions">
        {confirming ? (
          <span className="flex gap-2 items-center">
            <span className="text-sm text-muted">{t("reviews.deleteConfirm")}</span>
            <button
              className="button button-ghost text-error text-sm"
              disabled={deleting}
              onClick={() => void handleDelete()}
              type="button"
            >
              {t("reviews.delete")}
            </button>
            <button
              className="button button-ghost text-sm"
              onClick={() => setConfirming(false)}
              type="button"
            >
              {t("admin.cancel")}
            </button>
          </span>
        ) : (
          <button
            className="button button-ghost text-sm"
            onClick={() => void handleDelete()}
            type="button"
          >
            {t("reviews.delete")}
          </button>
        )}
      </td>
    </tr>
  );
}

export function AdminMovieReviewList({ movieId }: { movieId: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ status: "loading" });
  const pageRef = useRef(1);

  const loadPage = useCallback(
    async (page: number) => {
      setState({ status: "loading" });
      try {
        const data = await reviewsApi.listReviews(movieId, page);
        pageRef.current = page;
        setState({ status: "success", data, page });
      } catch {
        setState({ status: "error", message: t("reviews.loadError") });
      }
    },
    [movieId, t]
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  async function handleDelete(reviewId: string) {
    try {
      await reviewsApi.deleteReview(movieId, reviewId);
      void loadPage(pageRef.current);
    } catch {
      // silently reload
      void loadPage(pageRef.current);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="grid gap-2">
        {[1, 2, 3].map((i) => (
          <div className="h-12 animate-pulse rounded-[8px] bg-white/[0.05]" key={i} />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-error" role="alert">
        {state.message}
      </p>
    );
  }

  if (state.data.results.length === 0) {
    return (
      <p className="text-sm text-muted">{t("reviews.empty")}</p>
    );
  }

  return (
    <div className="grid gap-4">
      <table className="admin-review-table w-full text-sm">
        <thead>
          <tr>
            <th className="text-left font-semibold py-2 text-muted">{t("admin.users")}</th>
            <th className="text-left font-semibold py-2 text-muted">{t("reviews.title")}</th>
            <th className="text-left font-semibold py-2 text-muted">{t("reviews.writeReview")}</th>
            <th className="text-left font-semibold py-2 text-muted">{t("admin.session.date")}</th>
            <th className="text-left font-semibold py-2 text-muted">{t("admin.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {state.data.results.map((review) => (
            <ReviewRow
              key={review.id}
              onDelete={(id) => void handleDelete(id)}
              review={review}
            />
          ))}
        </tbody>
      </table>

      {(state.data.previous || state.data.next) && (
        <div className="flex gap-2">
          <button
            className="button button-ghost"
            disabled={!state.data.previous}
            onClick={() => void loadPage(state.page - 1)}
            type="button"
          >
            {t("common.previous")}
          </button>
          <button
            className="button button-ghost"
            disabled={!state.data.next}
            onClick={() => void loadPage(state.page + 1)}
            type="button"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
