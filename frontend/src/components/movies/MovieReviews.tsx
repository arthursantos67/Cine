"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { reviewsApi } from "@/api/reviews";
import { cn } from "@/components/ui/classNames";
import { useI18n } from "@/i18n";
import type {
  CatalogMovieDetail,
  MovieReview,
  MovieReviewVoteValue,
  MovieReviewsPage,
} from "@/types/catalog";
import { StarRating } from "./StarRating";

// ─── helpers ────────────────────────────────────────────────────────────────

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

// ─── RatingSummaryBar ────────────────────────────────────────────────────────

type RatingSummaryBarProps = {
  averageRating: number | null | undefined;
  reviewCount: number | undefined;
  expanded: boolean;
  onToggle: () => void;
  onOpenModal: () => void;
};

export function RatingSummaryBar({
  averageRating,
  expanded,
  onOpenModal,
  onToggle,
  reviewCount,
}: RatingSummaryBarProps) {
  const { locale, t } = useI18n();
  const count = reviewCount ?? 0;

  const numAvg = averageRating != null ? Number(averageRating) : null;
  const formattedAvg =
    numAvg != null && !isNaN(numAvg)
      ? numAvg.toLocaleString(locale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : null;

  const formattedCount = count.toLocaleString(locale);

  return (
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
      {/* toggle inline expand */}
      <button
        aria-expanded={expanded}
        className="flex cursor-pointer items-center gap-x-3 gap-y-1 border-0 bg-transparent p-0 text-left flex-wrap"
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-center">
          {numAvg != null ? (
            <StarRating
              label={t("reviews.average", { value: formattedAvg ?? "0" })}
              mode="display"
              value={numAvg}
            />
          ) : (
            <StarRating label={t("reviews.empty")} mode="display" value={0} />
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

        <span className="shrink-0 text-sm text-white/50">
          {expanded ? t("reviews.collapse") : t("reviews.expand")}
        </span>
      </button>

      {/* open modal button */}
      <button
        className="shrink-0 text-sm text-[var(--color-cinema-gold)]/70 underline hover:text-[var(--color-cinema-gold)] transition-colors border-0 bg-transparent p-0 cursor-pointer"
        onClick={onOpenModal}
        type="button"
      >
        {t("reviews.openModal")}
      </button>
    </div>
  );
}

// ─── ReviewForm ──────────────────────────────────────────────────────────────

type SubmitFeedback = "idle" | "submitting" | "success" | "updated" | "error";

type ReviewFormProps = {
  movieId: string;
  existingReview: MovieReview | null;
  onDeleted?: () => void;
  onSubmitted: (review: MovieReview, wasUpdate: boolean) => void;
};

function ReviewForm({ existingReview, movieId, onDeleted, onSubmitted }: ReviewFormProps) {
  const { t } = useI18n();
  const [rating, setRating] = useState(existingReview?.rating != null ? Number(existingReview.rating) : 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [feedback, setFeedback] = useState<SubmitFeedback>("idle");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setRating(existingReview?.rating != null ? Number(existingReview.rating) : 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview]);

  async function handleDelete() {
    if (!existingReview) return;
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try {
      await reviewsApi.deleteReview(movieId, existingReview.id);
      onDeleted?.();
    } catch {
      // silent
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setFeedback("submitting");
    try {
      const review = await reviewsApi.submitReview(movieId, { rating, comment });
      const wasUpdate = existingReview != null;
      setFeedback(wasUpdate ? "updated" : "success");
      onSubmitted(review, wasUpdate);
      setTimeout(() => setFeedback("idle"), 3500);
    } catch {
      setFeedback("error");
    }
  }

  const isEditing = existingReview != null;

  return (
    <form
      className="space-y-3 border-b border-white/10 pb-5"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <h3 className="text-sm font-semibold text-white/80">
        {isEditing ? t("reviews.editReview") : t("reviews.writeReview")}
      </h3>

      {isEditing && (
        <p className="text-xs text-[var(--color-cinema-gold)]/80">
          {t("reviews.alreadyReviewed")}
        </p>
      )}

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

      {feedback === "success" && (
        <p className="text-sm text-green-400" role="status">
          {t("reviews.submitSuccess")}
        </p>
      )}
      {feedback === "updated" && (
        <p className="text-sm text-green-400" role="status">
          {t("reviews.updateSuccess")}
        </p>
      )}
      {feedback === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {t("reviews.submitError")}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          className="button button-primary"
          disabled={rating === 0 || feedback === "submitting"}
          type="submit"
        >
          {feedback === "submitting" ? t("reviews.submitting") : t("reviews.submit")}
        </button>

        {isEditing && (
          confirming ? (
            <>
              <span className="text-sm text-white/60">{t("reviews.deleteConfirm")}</span>
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
              className="button button-ghost text-red-400/70 hover:text-red-400"
              disabled={feedback === "submitting" || deleting}
              onClick={() => void handleDelete()}
              type="button"
            >
              {t("reviews.deleteOwnReview")}
            </button>
          )
        )}
      </div>
    </form>
  );
}

// ─── VoteButton ──────────────────────────────────────────────────────────────

type VoteButtonProps = {
  count: number;
  isActive: boolean;
  label: string;
  onClick: () => void;
  variant: "like" | "dislike";
};

function VoteButton({ count, isActive, label, onClick, variant }: VoteButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={isActive}
      className={cn(
        "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
        isActive
          ? variant === "like"
            ? "bg-[var(--color-cinema-gold)]/20 text-[var(--color-cinema-gold)]"
            : "bg-red-500/20 text-red-400"
          : "text-white/40 hover:text-white/70"
      )}
      onClick={onClick}
      type="button"
    >
      {variant === "like" ? (
        <svg aria-hidden="true" fill="currentColor" height="12" viewBox="0 0 20 20" width="12">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      ) : (
        <svg aria-hidden="true" fill="currentColor" height="12" viewBox="0 0 20 20" width="12">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
      )}
      <span>{count}</span>
    </button>
  );
}

// ─── ReviewCard ──────────────────────────────────────────────────────────────

type ReviewCardProps = {
  canDelete: boolean;
  compact?: boolean;
  isAuthenticated: boolean;
  isOwn?: boolean;
  movieId: string;
  review: MovieReview;
  onDelete: (id: string) => void;
  onVoteChange: (reviewId: string, newVote: MovieReviewVoteValue | null, likeDelta: number, dislikeDelta: number) => void;
};

function ReviewCard({
  canDelete,
  compact = false,
  isAuthenticated,
  isOwn = false,
  movieId,
  onDelete,
  onVoteChange,
  review,
}: ReviewCardProps) {
  const { locale, t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  const initials = getUserInitials(review.user.username, review.user.email);
  const date = formatRelativeDate(review.created_at, locale);

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try { onDelete(review.id); }
    finally { setDeleting(false); setConfirming(false); }
  }

  async function handleVote(vote: MovieReviewVoteValue) {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const isSameVote = review.user_vote === vote;
      if (isSameVote) {
        await reviewsApi.removeVote(movieId, review.id);
        onVoteChange(review.id, null, vote === "like" ? -1 : 0, vote === "dislike" ? -1 : 0);
      } else {
        await reviewsApi.voteReview(movieId, review.id, vote);
        const prev = review.user_vote;
        onVoteChange(
          review.id,
          vote,
          vote === "like" ? 1 : prev === "like" ? -1 : 0,
          vote === "dislike" ? 1 : prev === "dislike" ? -1 : 0,
        );
      }
    } catch {
      // silent
    } finally {
      setVoteLoading(false);
    }
  }

  return (
    <article className={cn("border-b border-white/10 py-4 last:border-0", isOwn && "rounded-lg bg-[var(--color-cinema-gold)]/5 px-3")}>
      {isOwn && (
        <span className="mb-1 block text-xs font-semibold text-[var(--color-cinema-gold)]/80">
          {t("reviews.yourReview")}
        </span>
      )}
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
          <StarRating mode="display" value={Number(review.rating)} />
        </div>
      </div>

      {review.comment && (
        <p className={cn("mt-2 text-sm leading-relaxed text-white/70", compact && "line-clamp-2")}>
          {review.comment}
        </p>
      )}

      {!compact && (
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {isAuthenticated && (
            <>
              <VoteButton
                count={review.like_count}
                isActive={review.user_vote === "like"}
                label={t("reviews.like")}
                onClick={() => void handleVote("like")}
                variant="like"
              />
              <VoteButton
                count={review.dislike_count}
                isActive={review.user_vote === "dislike"}
                label={t("reviews.dislike")}
                onClick={() => void handleVote("dislike")}
                variant="dislike"
              />
            </>
          )}
          {!isAuthenticated && (review.like_count > 0 || review.dislike_count > 0) && (
            <span className="text-xs text-white/30">
              {review.like_count > 0 && `${review.like_count} 👍`}
              {review.like_count > 0 && review.dislike_count > 0 && " · "}
              {review.dislike_count > 0 && `${review.dislike_count} 👎`}
            </span>
          )}
          {canDelete && (
            confirming ? (
              <>
                <span className="text-sm text-white/60">{t("reviews.deleteConfirm")}</span>
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
            )
          )}
        </div>
      )}

      {compact && (review.like_count > 0) && (
        <span className="mt-1.5 block text-xs text-white/30">{review.like_count} 👍</span>
      )}
    </article>
  );
}

// ─── StarFilter ──────────────────────────────────────────────────────────────

type StarFilterProps = {
  selected: number | null;
  onChange: (rating: number | null) => void;
};

function StarFilter({ onChange, selected }: StarFilterProps) {
  const { t } = useI18n();
  const options: Array<{ label: string; value: number | null }> = [
    { label: t("reviews.filterAll"), value: null },
    { label: "★★★★★", value: 5 },
    { label: "★★★★", value: 4 },
    { label: "★★★", value: 3 },
    { label: "★★", value: 2 },
    { label: "★", value: 1 },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          className={cn(
            "rounded px-3 py-1 text-xs font-medium transition-colors",
            selected === opt.value
              ? "bg-[var(--color-cinema-gold)] text-black"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
          )}
          key={String(opt.value)}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── ReviewListSection ───────────────────────────────────────────────────────

type ReviewsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: MovieReviewsPage; page: number; ratingFilter: number | null };

type ReviewListSectionProps = {
  movieId: string;
  currentUserId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  ratingFilter: number | null;
  refreshKey: number;
  scrollable?: boolean;
  compact?: boolean;
  maxItems?: number;
  onMyReviewLoaded?: (review: MovieReview | null) => void;
};

function ReviewListSection({
  compact = false,
  currentUserId,
  isAdmin,
  isAuthenticated,
  maxItems,
  movieId,
  onMyReviewLoaded,
  ratingFilter,
  refreshKey,
  scrollable = false,
}: ReviewListSectionProps) {
  const { t } = useI18n();
  const [state, setState] = useState<ReviewsState>({ status: "idle" });
  const activePageRef = useRef(1);

  const loadPage = useCallback(
    async (page: number, rating: number | null) => {
      setState({ status: "loading" });
      try {
        const data = await reviewsApi.listReviews(movieId, page, rating ?? undefined);
        activePageRef.current = page;
        setState({ status: "success", data, page, ratingFilter: rating });
        if (onMyReviewLoaded && "my_review" in data) {
          onMyReviewLoaded(data.my_review ?? null);
        }
      } catch {
        setState({ status: "error", message: t("reviews.loadError") });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movieId, t]
  );

  useEffect(() => {
    void loadPage(1, ratingFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter, refreshKey]);

  async function handleDelete(reviewId: string) {
    if (state.status !== "success") return;
    try {
      await reviewsApi.deleteReview(movieId, reviewId);
      void loadPage(activePageRef.current, ratingFilter);
    } catch {
      // silent
    }
  }

  function handleVoteChange(
    reviewId: string,
    newVote: MovieReviewVoteValue | null,
    likeDelta: number,
    dislikeDelta: number
  ) {
    setState((prev) => {
      if (prev.status !== "success") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          results: prev.data.results.map((r) =>
            r.id === reviewId
              ? { ...r, user_vote: newVote, like_count: r.like_count + likeDelta, dislike_count: r.dislike_count + dislikeDelta }
              : r
          ),
        },
      };
    });
  }

  if (state.status === "loading" || state.status === "idle") {
    return (
      <div aria-busy="true" className="space-y-3" role="status">
        {[1, 2, 3].map((i) => (
          <div className="h-16 animate-pulse rounded bg-white/5" key={i} />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-red-400" role="alert">{state.message}</p>;
  }

  if (state.data.results.length === 0) {
    return (
      <p className="text-sm text-white/50">
        {ratingFilter != null ? t("reviews.emptyForFilter") : t("reviews.empty")}
      </p>
    );
  }

  const displayedResults = maxItems != null
    ? state.data.results.slice(0, maxItems)
    : state.data.results;

  return (
    <div>
      <div className={cn(scrollable && "max-h-[420px] overflow-y-auto pr-1")}>
        {displayedResults.map((review) => {
          const canDelete =
            !compact && (isAdmin || (currentUserId != null && review.user.id === currentUserId));
          const isOwn = !compact && currentUserId != null && review.user.id === currentUserId;
          return (
            <ReviewCard
              canDelete={canDelete}
              compact={compact}
              isAuthenticated={isAuthenticated && !compact}
              isOwn={isOwn}
              key={review.id}
              movieId={movieId}
              onDelete={(id) => void handleDelete(id)}
              onVoteChange={handleVoteChange}
              review={review}
            />
          );
        })}
      </div>
      {!maxItems && (state.data.previous || state.data.next) && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <button
            className="button button-ghost"
            disabled={!state.data.previous}
            onClick={() => void loadPage(state.page - 1, ratingFilter)}
            type="button"
          >
            {t("common.previous")}
          </button>
          <button
            className="button button-ghost"
            disabled={!state.data.next}
            onClick={() => void loadPage(state.page + 1, ratingFilter)}
            type="button"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── InlineReviewForm ─────────────────────────────────────────────────────────

type InlineReviewFormProps = {
  movieId: string;
  expanded: boolean;
  isAuthenticated: boolean;
  myReview: MovieReview | null;
  onDeleted?: () => void;
  onSubmitted: (review: MovieReview, wasUpdate: boolean) => void;
};

function InlineReviewForm({
  expanded,
  isAuthenticated,
  movieId,
  myReview,
  onDeleted,
  onSubmitted,
}: InlineReviewFormProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [expanded]);

  return (
    <div
      className={cn("mt-4", !expanded && "hidden")}
      hidden={!expanded}
      ref={panelRef}
    >
      {isAuthenticated ? (
        <ReviewForm
          existingReview={myReview}
          movieId={movieId}
          onDeleted={onDeleted}
          onSubmitted={onSubmitted}
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
    </div>
  );
}

// ─── ReviewModal ─────────────────────────────────────────────────────────────

type ReviewModalProps = {
  currentUserId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  movie: CatalogMovieDetail;
  onClose: () => void;
};

function ReviewModal({
  currentUserId,
  isAdmin,
  isAuthenticated,
  movie,
  onClose,
}: ReviewModalProps) {
  const { t } = useI18n();
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  function handleSubmitted(review: MovieReview) {
    setMyReview(review);
    setRefreshKey((k) => k + 1);
  }

  function handleDeleted() {
    setMyReview(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div
      aria-labelledby="review-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      ref={backdropRef}
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full max-w-xl flex-col gap-5 rounded-xl bg-[#0d0d0d] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto focus:outline-none"
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white" id="review-modal-title">
              {t("reviews.title")}
            </h2>
            <p className="text-sm text-white/50">{movie.title}</p>
          </div>
          <button
            aria-label={t("reviews.close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* form */}
        {isAuthenticated ? (
          <ReviewForm
            existingReview={myReview}
            movieId={movie.id}
            onDeleted={handleDeleted}
            onSubmitted={handleSubmitted}
          />
        ) : (
          <p className="text-sm text-white/60 border-b border-white/10 pb-5">
            <Link
              className="text-[var(--color-cinema-gold)] underline hover:no-underline"
              href="/login"
            >
              {t("reviews.loginPrompt")}
            </Link>
          </p>
        )}

        {/* star filter */}
        <StarFilter onChange={setRatingFilter} selected={ratingFilter} />

        {/* review list */}
        <ReviewListSection
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          movieId={movie.id}
          onMyReviewLoaded={setMyReview}
          ratingFilter={ratingFilter}
          refreshKey={refreshKey}
          scrollable
        />
      </div>
    </div>
  );
}

// ─── MovieReviewsPanel ───────────────────────────────────────────────────────

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
  const [modalOpen, setModalOpen] = useState(false);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const [inlineRefreshKey, setInlineRefreshKey] = useState(0);

  function handleSubmitted(review: MovieReview) {
    setMyReview(review);
    setInlineRefreshKey((k) => k + 1);
  }

  function handleDeleted() {
    setMyReview(null);
    setInlineRefreshKey((k) => k + 1);
  }

  return (
    <section aria-labelledby="reviews-heading">
      <h2 className="sr-only" id="reviews-heading">
        {t("reviews.title")}
      </h2>

      <RatingSummaryBar
        averageRating={movie.average_rating}
        expanded={expanded}
        onOpenModal={() => setModalOpen(true)}
        onToggle={() => setExpanded((prev) => !prev)}
        reviewCount={movie.review_count}
      />

      {/* Form — shown/hidden by toggle */}
      <InlineReviewForm
        expanded={expanded}
        isAuthenticated={isAuthenticated}
        movieId={movie.id}
        myReview={myReview}
        onDeleted={handleDeleted}
        onSubmitted={handleSubmitted}
      />

      {/* Top-3 reviews always visible */}
      {(movie.review_count ?? 0) > 0 && (
        <div className="mt-4">
          <ReviewListSection
            compact
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            maxItems={3}
            movieId={movie.id}
            onMyReviewLoaded={setMyReview}
            ratingFilter={null}
            refreshKey={inlineRefreshKey}
          />
        </div>
      )}

      {modalOpen && (
        <ReviewModal
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          movie={movie}
          onClose={() => setModalOpen(false)}
        />
      )}
    </section>
  );
}
