import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyLoyalty } from "@/lib/loyalty.functions";
import { Award, Flame, Trophy, Star } from "lucide-react";

export const Route = createFileRoute("/_layout/loyalty")({
  component: LoyaltyPage,
});

function LoyaltyPage() {
  const fetchLoyalty = useServerFn(getMyLoyalty);
  const { data } = useQuery({ queryKey: ["loyalty"], queryFn: () => fetchLoyalty() });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Loyalty & Rewards</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span className="text-sm">Total points</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.totalPoints ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span className="text-sm">Current streak</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.streak ?? 0}<span className="text-lg text-muted-foreground"> days</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-sm">Visits</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{data?.visits.length ?? 0}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Badges</h2>
        {(data?.badges.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Visit a restaurant to unlock badges.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {data?.badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Award className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Points by restaurant</h2>
        {(data?.balances.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No points yet. Leave a review after your next visit.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data?.balances.map((b) => {
              const r = b.restaurant as { name: string } | null;
              const available = b.points - b.redeemed_points;
              return (
                <li key={b.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <span className="text-sm font-medium text-foreground">{r?.name ?? "Restaurant"}</span>
                  <span className="text-sm font-semibold text-primary">{available} pts</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
