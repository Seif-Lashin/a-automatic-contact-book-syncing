import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { Bell } from "lucide-react";

const getWaiterCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isStaff = (roles ?? []).some((r) => ["admin", "owner", "waiter"].includes(r.role));
    if (!isStaff) {
      throw new Error("Unauthorized");
    }
    const { data } = await supabase
      .from("waiter_calls")
      .select("*, table:tables(table_number), session:table_sessions(restaurant:restaurants(name))")
      .eq("is_resolved", false)
      .order("created_at", { ascending: true });
    return { calls: data ?? [] };
  });

const resolveCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { callId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("waiter_calls")
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", data.callId);
    if (error) throw new Error("Could not resolve call");
    return { ok: true };
  });

export const Route = createFileRoute("/_layout/waiter")({
  component: WaiterPage,
});

function WaiterPage() {
  const fetchCalls = useServerFn(getWaiterCalls);
  const resolveCallFn = useServerFn(resolveCall);
  const queryClient = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["waiter-calls"],
    queryFn: () => fetchCalls(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("waiter-calls")
      .on("postgres_changes", { event: "*", schema: "public", table: "waiter_calls" }, () =>
        queryClient.invalidateQueries({ queryKey: ["waiter-calls"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleResolve = async (callId: string) => {
    await resolveCallFn({ data: { callId } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Waiter calls</h1>

      <div className="space-y-4">
        {data?.calls.map((call) => {
          const session = call.session as { restaurant: { name: string } };
          const table = call.table as { table_number: string };
          return (
            <div key={call.id} className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">
                    {session.restaurant.name} · Table {table.table_number}
                  </p>
                  <p className="text-sm text-muted-foreground">{call.reason || "General assistance"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(call.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
              <button
                onClick={() => handleResolve(call.id)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Resolve
              </button>
            </div>
          );
        })}
      </div>

      {data?.calls.length === 0 && <p className="text-muted-foreground">No open waiter calls.</p>}
    </div>
  );
}
