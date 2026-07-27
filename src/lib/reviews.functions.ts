import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const POINTS_PER_REVIEW = 25;

export const getReviewableItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Paid orders belonging to the user
    const { data: orders } = await supabase
      .from("orders")
      .select("id, vendor_id, status, order_items(id, menu_item_id, menu_item:menu_items(id, name, image_url, vendor:vendors(restaurant_id)))")
      .eq("user_id", userId)
      .in("status", ["served", "paid"]);

    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("menu_item_id, order_id")
      .eq("user_id", userId);

    const reviewed = new Set((existingReviews ?? []).map((r) => `${r.order_id}:${r.menu_item_id}`));

    const items: {
      order_id: string;
      menu_item_id: string;
      name: string;
      image_url: string | null;
      restaurant_id: string | null;
    }[] = [];
    for (const order of orders ?? []) {
      for (const it of order.order_items ?? []) {
        if (!it.menu_item_id) continue;
        const key = `${order.id}:${it.menu_item_id}`;
        if (reviewed.has(key)) continue;
        const mi = it.menu_item as {
          name: string;
          image_url: string | null;
          vendor: { restaurant_id: string } | null;
        } | null;
        items.push({
          order_id: order.id,
          menu_item_id: it.menu_item_id,
          name: mi?.name ?? "Item",
          image_url: mi?.image_url ?? null,
          restaurant_id: mi?.vendor?.restaurant_id ?? null,
        });
      }
    }
    return { items };
  });

export const getMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("reviews")
      .select("*, menu_item:menu_items(name, image_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return { reviews: data ?? [] };
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string; menuItemId: string; rating: number; text?: string; videoUrl?: string }) =>
    z
      .object({
        orderId: z.string().uuid(),
        menuItemId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        text: z.string().max(1000).optional(),
        videoUrl: z.string().url().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify purchase — the order must belong to user and include this menu item
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, vendor:vendors(restaurant_id), order_items(menu_item_id)")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .in("status", ["served", "paid"])
      .single();

    if (!order) throw new Error("You can only review items from your completed orders");

    const owns = (order.order_items ?? []).some((it) => it.menu_item_id === data.menuItemId);
    if (!owns) throw new Error("This item was not part of that order");

    const { error } = await supabase.from("reviews").insert({
      user_id: userId,
      menu_item_id: data.menuItemId,
      order_id: data.orderId,
      rating: data.rating,
      text: data.text ?? null,
      video_url: data.videoUrl ?? null,
      points_awarded: POINTS_PER_REVIEW,
      is_approved: true,
    });

    if (error) throw new Error(error.message);

    // Award loyalty points scoped to the restaurant
    const restaurantId = (order.vendor as { restaurant_id: string } | null)?.restaurant_id;
    if (restaurantId) {
      const { data: existing } = await supabase
        .from("loyalty_points")
        .select("*")
        .eq("user_id", userId)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("loyalty_points")
          .update({
            points: existing.points + POINTS_PER_REVIEW,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("loyalty_points").insert({
          user_id: userId,
          restaurant_id: restaurantId,
          points: POINTS_PER_REVIEW,
          redeemed_points: 0,
        });
      }
    }

    return { ok: true, pointsAwarded: POINTS_PER_REVIEW };
  });
