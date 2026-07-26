import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cancelOrder } from "@/lib/order.functions";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, menu_item:menu_items(name))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { orders: data ?? [] };
  });

export const Route = createFileRoute("/_layout/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const fetchOrders = useServerFn(getMyOrders);
  const cancelOrderFn = useServerFn(cancelOrder);
  const { data, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => fetchOrders(),
  });

  const handleCancel = async (orderId: string) => {
    if (!confirm("Cancel this order?")) return;
    await cancelOrderFn({ data: { orderId } });
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My orders</h1>

      {data?.orders.length === 0 && (
        <p className="text-muted-foreground">You haven't placed any orders yet.</p>
      )}

      <div className="space-y-4">
        {data?.orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {order.status === "pending" && <Clock className="h-4 w-4 text-amber-500" />}
                {order.status === "confirmed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                {order.status === "cancelled" && <XCircle className="h-4 w-4 text-destructive" />}
                <span className="text-sm font-medium capitalize text-foreground">{order.status}</span>
              </div>
              <span className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {(order.order_items as { id: string; quantity: number; total_price: number; menu_item: { name: string } | null }[]).map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {item.quantity}× {item.menu_item?.name ?? "Item"}
                  </span>
                  <span className="text-foreground">${(item.total_price / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-semibold text-foreground">${(order.total / 100).toFixed(2)}</span>
            </div>
            {order.status === "pending" && (
              <button
                onClick={() => handleCancel(order.id)}
                className="mt-3 text-sm text-destructive hover:underline"
              >
                Cancel order
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
