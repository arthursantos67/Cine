"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { reviewsApi } from "@/api/reviews";
import { cn } from "@/components/ui/classNames";
import { useI18n } from "@/i18n";
import type { CatalogMovieDetail, MovieReview, MovieReviewsPage } from "@/types/catalog";
import { StarRating } from "./StarRating";

type ReviewsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: MovieReviewsPage; page: number };

type SubmitState = "idle" | "submitting" | "error";

function getUserInitials(username: string, email: string) {
  const name = username || email || "?";
  return name
    .split(/[\s._@-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRelativeDate(dateStr: string, locale: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (days > 30) {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(dateStr)
      );
    }
    if (days > 0) return rtf.format(-days, "day");
    if (hours > 0) return rtf.format(-hours, "hour");
    if (minutes > 0) return rtf.format(-minutes, "minute");
    return rtf.format(-seconds, "second");
  } catch {
    return dateStr;
  }
}

type RatingSummaryBarProps = {
  averageRating: number | null | undefined;
  reviewCount: number | undefined;
  expanded: boolean;
  onToggle: () => void;
};

export function RatingSummaryBar({
  averageRating,
  expanded,
  onToggle,
  reviewCount,
}: RatingSummaryBarProps) {
  const { locale, t } = useI18n();
  const count = reviewCount ?? 0;

  const formattedAvg =
    averageRating != null
      ? averageRating.toLocaleString(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        })
      : null;

  const formattedCount = count.toLocaleString(locale);

  return (
    <button
      aria-expanded={expanded}
      className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left"
      onClick={onToggle}
      type="button"
    >
      <div className="flex items-center">
        {averageRating != null ? (
          <StarRating
            label={t("reviews.average", { value: formattedAvg ?? "0" })}
            mode="display"
            value={averageRating}
          />
        ) : (
          <StarRating
            label={t("reviews.empty")}
            mode="display"
            value={0}
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        {formattedAvg != null ? (
          <span className="font-semibold text-[var(--color-cinema-gold)]">
            {formattedAvg}
          </span>
        ) : null}
        <span className="text-sm text-white/50">
          {count > 0
            ? t("reviews.count", { count: formattedCount })
            : t("reviews.empty")}
        </span>
      </div>

      <span className="ml-auto shrink-0 text-sm text-white/50">
        {expanded ? t("reviews.collapse") : t("reviews.expand")}
      </span>
    </button>
  );
}

type ReviewFormProps = {
  movieId: string;
  existingReview: MovieReview | null;
  onSubmitted: (review: MovieReview) => void;
};

function ReviewForm({ existingReview, movieId, onSubmitted }: ReviewFormProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitState("submitting");
    try {
      const review = await reviewsApi.submitReview(movieId, { rating, comment });
      onSubmitted(review);
      setSubmitState("idle");
    } catch {
      setSubmitState("error");
    }
  }

  return (
    <form
      className="space-y-3 border-b border-white/10 pb-5"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <h3 className="text-sm font-semibold text-white/80">
        {t("reviews.writeReview")}
      </h3>
      <div>
        <StarRating
          label={t("reviews.writeReview")}
          mode="interactive"
          onChange={setRating}
          value={rating}
        />
      </div>
      <textarea
        className="w-full min-h-[80px] resize-y rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-cinema-gold)]/50"
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("reviews.commentPlaceholder")}
        rows={4}
        value={comment}
      />
      {submitState === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {t("reviews.loadError")}
        </p>
      )}
      <button
        className="button button-primary"
        disabled={rating === 0 || submitState === "submitting"}
        type="submit"
      >
        {submitState === "submitting"
          ? t("reviews.submitting")
          : t("reviews.submit")}
      </button>
    </form>
  );
}

type ReviewCardProps = {
  canDelete: boolean;
  review: MovieReview;
  onDelete: (id: string) => void;
};

function ReviewCard({ canDelete, onDelete, review }: ReviewCardProps) {
  const { locale, t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initials = getUserInitials(review.user.username, review.user.email);
  const date = formatRelativeDate(review.created_at, locale);

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
    <article className="border-b border-white/10 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-cinema-gold)]/15 text-xs font-bold text-[var(--color-cinema-gold)]"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-sm font-semibold text-white/90">
            {review.user.username || review.user.email}
          </strong>
          <time className="text-xs text-white/40" dateTime={review.created_at}>
            {date}
          </time>
        </div>
        <div className="shrink-0">
          <StarRating mode="display" value={review.rating} />
        </div>
      </div>
      {review.comment && (
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {review.comment}
        </p>
      )}
      {canDelete && (
        <div className="mt-2 flex items-center gap-2">
          {confirming ? (
            <>
              <span className="text-sm text-white/60">
                {t("reviews.deleteConfirm")}
              </span>
              <button
                className="button button-ghost text-red-400 hover:text-red-300"
                disabled={deleting}
                onClick={() => void handleDelete()}
                type="button"
              >
                {t("reviews.delete")}
              </button>
              <button
                className="button button-ghost"
                onClick={() => setConfirming(false)}
                type="button"
              >
                {t("admin.cancel")}
              </button>
            </>
          ) : (
            <button
              className="button button-ghost"
              onClick={() => void handleDelete()}
              type="button"
            >
              {t("reviews.delete")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

type ReviewListSectionProps = {
  movieId: string;
  currentUserId: string | null;
  isAdmin: boolean;
};

function ReviewListSection({
  currentUserId,
  isAdmin,
  movieId,
}: ReviewListSectionProps) {
  const { t } = useI18n();
  const [state, setState] = useState<ReviewsState>({ status: "idle" });
  const activePageRef = useRef(1);

  const loadPage = useCallback(
    async (page: number) => {
      setState({ status: "loading" });
      try {
        const data = await reviewsApi.listReviews(movieId, page);
        activePageRef.current = page;
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
    if (state.status !== "success") return;
    try {
      await reviewsApi.deleteReview(movieId, reviewId);
      void loadPage(activePageRef.current);
    } catch {
      // silent — UI stays as-is
    }
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div aria-busy="true" className="space-y-3" role="status">
        {[1, 2, 3].map((i) => (
          <div
            className="h-16 animate-pulse rounded bg-white/5"
            key={i}
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-red-400" role="alert">
        {state.message}
      </p>
    );
  }

  if (state.data.results.length === 0) {
    return (
      <p className="text-sm text-white/50">{t("reviews.empty")}</p>
    );
  }

  return (
    <div>
      {state.data.results.map((review) => {
        const canDelete =
          isAdmin || (currentUserId != null && review.user.id === currentUserId);
        return (
          <ReviewCard
            canDelete={canDelete}
            key={review.id}
            onDelete={(id) => void handleDelete(id)}
            review={review}
          />
        );
      })}
      {(state.data.previous || state.data.next) && (
        <div className="mt-4 flex items-center justify-between gap-4">
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

type MovieReviewsPanelProps = {
  currentUserId?: string | null;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  movie: CatalogMovieDetail;
};

export function MovieReviewsPanel({
  currentUserId = null,
  isAdmin = false,
  isAuthenticated = false,
  movie,
}: MovieReviewsPanelProps) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function handleToggle() {
    setExpanded((prev) => {
      if (!prev) {
        requestAnimationFrame(() => {
          panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
      }
      return !prev;
    });
  }

  function handleSubmitted(review: MovieReview) {
    setMyReview(review);
  }

  return (
    <section aria-labelledby="reviews-heading">
      <h2 className="sr-only" id="reviews-heading">
        {t("reviews.title")}
      </h2>

      <RatingSummaryBar
        averageRating={movie.average_rating}
        expanded={expanded}
        onToggle={handleToggle}
        reviewCount={movie.review_count}
      />

      <div
        className={cn("mt-4 space-y-5", !expanded && "hidden")}
        hidden={!expanded}
        ref={panelRef}
      >
        {isAuthenticated ? (
          <ReviewForm
            existingReview={myReview}
            movieId={movie.id}
            onSubmitted={handleSubmitted}
          />
        ) : (
          <p className="text-sm text-white/60">
            <Link
              className="text-[var(--color-cinema-gold)] underline hover:no-underline"
              href="/login"
            >
              {t("reviews.loginPrompt")}
            </Link>
          </p>
        )}

        <ReviewListSection
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          movieId={movie.id}
        />
      </div>
    </section>
  );
}
