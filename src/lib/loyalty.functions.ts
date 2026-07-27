import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyLoyalty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: balances } = await supabase
      .from("loyalty_points")
      .select("*, restaurant:restaurants(name, logo_url)")
      .eq("user_id", userId);

    const { data: visits } = await supabase
      .from("visit_history")
      .select("*, restaurant:restaurants(name)")
      .eq("user_id", userId)
      .order("visited_at", { ascending: false })
      .limit(30);

    // Streak: distinct days visited recently
    const days = new Set(
      (visits ?? []).map((v) => new Date(v.visited_at).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }

    const totalPoints = (balances ?? []).reduce((s, b) => s + (b.points - b.redeemed_points), 0);
    const totalVisits = visits?.length ?? 0;

    const badges: string[] = [];
    if (totalVisits >= 1) badges.push("First Visit");
    if (totalVisits >= 5) badges.push("Regular");
    if (totalVisits >= 20) badges.push("VIP");
    if (streak >= 3) badges.push("On a Streak");
    if (totalPoints >= 100) badges.push("Century Club");

    return { balances: balances ?? [], visits: visits ?? [], streak, totalPoints, badges };
  });
