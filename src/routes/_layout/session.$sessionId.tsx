import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getSessionById, callWaiter } from "@/lib/session.functions";
import { supabase } from "@/integrations/supabase/client";
import { Users, Utensils, Bell, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_layout/session/$sessionId")({
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionById);
  const callWaiterFn = useServerFn(callWaiter);

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId } }),
  });

  const session = sessionData?.session;

  useEffect(() => {
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_sessions", filter: `id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `session_id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const restaurant = session.restaurant;
  const table = session.table;

  const handleCallWaiter = async () => {
    await callWaiterFn({ data: { sessionId, tableId: table.id } });
    alert("Waiter has been notified.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{restaurant.name}</p>
            <h1 className="text-2xl font-bold text-foreground">
              Table {table.table_number}
            </h1>
            <p className="text-sm text-muted-foreground">Session active · {session.participants.length} diners</p>
          </div>
          <button
            onClick={handleCallWaiter}
            className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Bell className="h-4 w-4" />
            Call waiter
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/menu/$vendorId"
          params={{ vendorId: restaurant.id }}
          search={{ sessionId }}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Utensils className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Browse menu</p>
              <p className="text-sm text-muted-foreground">Order from vendors</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          to="/checkout"
          search={{ sessionId }}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Split & pay</p>
              <p className="text-sm text-muted-foreground">Total due: ${(session.total_due / 100).toFixed(2)}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Diners at this table</h2>
        <ul className="mt-3 space-y-2">
          {session.participants.map((p) => {
            const profile = p.profile as unknown as { display_name: string | null; avatar_url: string | null } | null;
            return (
              <li key={p.user_id} className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-secondary" />
                <span className="text-foreground">
                  {profile?.display_name || "Anonymous"}
                  {p.is_host && <span className="ml-2 text-xs text-primary">Host</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
