import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

const getPendingOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isStaff = (roles ?? []).some((r) => ["admin", "owner", "staff"].includes(r.role));
    if (!isStaff) {
      throw new Error("Unauthorized");
    }
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_item:menu_items(name)), session:table_sessions(table:tables(table_number), restaurant:restaurants(name))")
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: true });
    return { orders: data ?? [] };
  });

const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; status: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("orders")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.orderId);
    if (error) throw new Error("Could not update order");
    return { ok: true };
  });

export const Route = createFileRoute("/_layout/kds")({
  component: KdsPage,
});

function KdsPage() {
  const fetchOrders = useServerFn(getPendingOrders);
  const updateStatus = useServerFn(updateOrderStatus);
  const queryClient = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: () => fetchOrders(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("kds")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () =>
        queryClient.invalidateQueries({ queryKey: ["kds-orders"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleStatus = async (orderId: string, status: string) => {
    await updateStatus({ data: { orderId, status } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Kitchen Display System</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.orders.map((order) => {
          const session = order.session as { table: { table_number: string }; restaurant: { name: string } };
          return (
            <div key={order.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {session.restaurant.name} · Table {session.table.table_number}
                </span>
                {order.status === "pending" ? (
                  <Clock className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</p>
              <ul className="mt-3 space-y-1">
                {(order.order_items as { id: string; quantity: number; menu_item: { name: string } | null; special_instructions: string | null }[]).map((item) => (
                  <li key={item.id} className="text-sm text-foreground">
                    {item.quantity}× {item.menu_item?.name ?? "Item"}
                    {item.special_instructions && (
                      <span className="ml-2 text-xs text-muted-foreground">({item.special_instructions})</span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                {order.status === "pending" && (
                  <button
                    onClick={() => handleStatus(order.id, "confirmed")}
                    className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Confirm
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => handleStatus(order.id, "ready")}
                    className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Mark ready
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data?.orders.length === 0 && (
        <p className="text-muted-foreground">No pending orders. Great work!</p>
      )}
    </div>
  );
}
