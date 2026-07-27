import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getReviewableItems, getMyReviews, submitReview } from "@/lib/reviews.functions";
import { Star, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/_layout/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const qc = useQueryClient();
  const fetchEligible = useServerFn(getReviewableItems);
  const fetchMine = useServerFn(getMyReviews);
  const submit = useServerFn(submitReview);

  const { data: eligible } = useQuery({ queryKey: ["reviewable"], queryFn: () => fetchEligible() });
  const { data: mine } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchMine() });

  const [active, setActive] = useState<{ orderId: string; menuItemId: string; name: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await submit({ data: { orderId: active.orderId, menuItemId: active.menuItemId, rating, text: text || undefined } });
      setActive(null);
      setText("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviewable"] });
      qc.invalidateQueries({ queryKey: ["my-reviews"] });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Reviews</h1>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Waiting for your review</h2>
        <p className="text-sm text-muted-foreground">Only items from your completed, paid orders can be reviewed.</p>
        {(eligible?.items.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing to review yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {eligible?.items.map((it) => (
              <li
                key={`${it.order_id}:${it.menu_item_id}`}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="text-sm font-medium text-foreground">{it.name}</span>
                <button
                  onClick={() => setActive({ orderId: it.order_id, menuItemId: it.menu_item_id, name: it.name })}
                  className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Review
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Your reviews</h2>
        {(mine?.reviews.length ?? 0) === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">You haven't written any reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mine?.reviews.map((r) => {
              const mi = r.menu_item as { name: string } | null;
              return (
                <li key={r.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{mi?.name ?? "Item"}</span>
                    <span className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                  </div>
                  {r.text && <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>}
                  <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <CheckCircle className="h-3 w-3" /> +{r.points_awarded} points
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setActive(null)}>
          <div className="w-full max-w-md rounded-xl bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground">Rate {active.name}</h3>
            <div className="mt-3 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`h-8 w-8 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience (optional)"
              className="mt-3 h-24 w-full resize-none rounded-md border border-border bg-background p-2 text-sm text-foreground"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setActive(null)}
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
