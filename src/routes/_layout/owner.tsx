import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { TrendingUp, DollarSign, Users } from "lucide-react";

const getOwnerDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isOwner = (roles ?? []).some((r) => ["admin", "owner"].includes(r.role));
    if (!isOwner) {
      throw new Error("Unauthorized");
    }
    const { data: restaurants } = await supabase
      .from("restaurants")
      .select("id, name, total_orders, total_revenue, latitude, longitude");
    const { data: vendors } = await supabase.from("vendors").select("id, name, restaurant_id, total_orders, total_revenue");
    const { count: totalOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });
    return {
      restaurants: restaurants ?? [],
      vendors: vendors ?? [],
      totalOrders: totalOrders ?? 0,
    };
  });

export const Route = createFileRoute("/_layout/owner")({
  component: OwnerPage,
});

function OwnerPage() {
  const fetchDashboard = useServerFn(getOwnerDashboard);
  const { data } = useQuery({
    queryKey: ["owner-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Owner Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total orders" value={data?.totalOrders ?? 0} icon={TrendingUp} />
        <MetricCard
          label="Total revenue"
          value={`$${(
            (data?.vendors.reduce((sum: number, v) => sum + v.total_revenue, 0) ?? 0) / 100
          ).toFixed(2)}`}
          icon={DollarSign}
        />
        <MetricCard label="Restaurants" value={data?.restaurants.length ?? 0} icon={Users} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Restaurants</h2>
        <ul className="mt-3 space-y-2">
          {data?.restaurants.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
              <span className="text-sm font-medium text-foreground">{r.name}</span>
              <span className="text-xs text-muted-foreground">
                {r.total_orders} orders · ${(r.total_revenue / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Vendors</h2>
        <ul className="mt-3 space-y-2">
          {data?.vendors.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2">
              <span className="text-sm font-medium text-foreground">{v.name}</span>
              <span className="text-xs text-muted-foreground">
                {v.total_orders} orders · ${(v.total_revenue / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
