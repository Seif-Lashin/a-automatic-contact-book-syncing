import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ArrowRight, Store } from "lucide-react";

const getRestaurantVendors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { restaurantId: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, name")
      .eq("id", data.restaurantId)
      .single();
    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("restaurant_id", data.restaurantId);
    return { restaurant, vendors: vendors ?? [] };
  });

export const Route = createFileRoute("/_layout/restaurant/$restaurantId")({
  component: RestaurantVendorsPage,
});

function RestaurantVendorsPage() {
  const { restaurantId } = Route.useParams();
  const search = Route.useSearch() as { sessionId?: string };
  const fetchVendors = useServerFn(getRestaurantVendors);
  const { data } = useQuery({
    queryKey: ["restaurant-vendors", restaurantId],
    queryFn: () => fetchVendors({ data: { restaurantId } }),
  });

  if (!data) return <p className="text-muted-foreground">Loading vendors...</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h1 className="text-2xl font-bold text-foreground">{data.restaurant?.name ?? "Restaurant"}</h1>
        <p className="text-sm text-muted-foreground">Choose a vendor to order from</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.vendors.map((vendor) => (
          <Link
            key={vendor.id}
            to="/menu/$vendorId"
            params={{ vendorId: vendor.id }}
            search={{ sessionId: search.sessionId }}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">{vendor.name}</p>
                <p className="text-sm text-muted-foreground">{vendor.cuisine_type}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
