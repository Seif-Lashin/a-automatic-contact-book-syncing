import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRestaurantWithVendors = createServerFn({ method: "GET" })
  .inputValidator((data: { restaurantId: string }) =>
    z.object({ restaurantId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: restaurant, error } = await supabaseAdmin
      .from("restaurants")
      .select("*, vendors(*)")
      .eq("id", data.restaurantId)
      .single();

    if (error || !restaurant) {
      throw new Error("Restaurant not found");
    }

    return { restaurant };
  });

export const getVendorMenu = createServerFn({ method: "GET" })
  .inputValidator((data: { vendorId: string }) =>
    z.object({ vendorId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from("vendors")
      .select("*, restaurant:restaurants(*)")
      .eq("id", data.vendorId)
      .single();

    if (vendorError || !vendor) {
      throw new Error("Vendor not found");
    }

    const { data: categories, error: catError } = await supabaseAdmin
      .from("menu_categories")
      .select("*, menu_items(*)")
      .eq("vendor_id", data.vendorId)
      .order("sort_order", { ascending: true });

    if (catError) {
      throw new Error("Could not load menu");
    }

    return { vendor, categories: categories ?? [] };
  });

export const getPopularWithFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { restaurantId: string }) =>
    z.object({ restaurantId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // Get accepted friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${context.userId},addressee_id.eq.${context.userId}`);

    const friendIds = (friendships ?? [])
      .map((f) => (f.requester_id === context.userId ? f.addressee_id : f.requester_id))
      .filter(Boolean);

    if (friendIds.length === 0) {
      return { items: [] };
    }

    const { data: items } = await supabase
      .from("reviews")
      .select(
        `
        rating,
        menu_item:menu_items(*, vendor:vendors(*), category:menu_categories(*))
      `,
      )
      .in("user_id", friendIds)
      .eq("menu_item.vendor.restaurant_id", data.restaurantId)
      .gte("rating", 4)
      .eq("is_approved", true)
      .limit(10);

    return { items: items ?? [] };
  });
