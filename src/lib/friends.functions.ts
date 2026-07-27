import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: rows } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    const friends = (rows ?? []).filter((r) => r.status === "accepted");
    const incoming = (rows ?? []).filter(
      (r) => r.status === "pending" && r.addressee_id === userId,
    );
    const outgoing = (rows ?? []).filter(
      (r) => r.status === "pending" && r.requester_id === userId,
    );

    const otherIds = Array.from(
      new Set(
        [...friends, ...incoming, ...outgoing].map((r) =>
          r.requester_id === userId ? r.addressee_id : r.requester_id,
        ),
      ),
    );

    const { data: profiles } = otherIds.length
      ? await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", otherIds)
      : { data: [] };

    const byId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const hydrate = (r: (typeof friends)[number]) => {
      const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id;
      return { ...r, friend: byId.get(otherId) ?? { user_id: otherId, display_name: null, avatar_url: null } };
    };

    return {
      friends: friends.map(hydrate),
      incoming: incoming.map(hydrate),
      outgoing: outgoing.map(hydrate),
    };
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { displayName: string }) =>
    z.object({ displayName: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: matches } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .ilike("display_name", data.displayName)
      .limit(1);

    const target = matches?.[0];
    if (!target) throw new Error("No user found with that name");
    if (target.user_id === userId) throw new Error("You can't add yourself");

    const { error } = await supabase.from("friendships").insert({
      requester_id: userId,
      addressee_id: target.user_id,
      status: "pending",
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const respondToFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { friendshipId: string; accept: boolean }) =>
    z.object({ friendshipId: z.string().uuid(), accept: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("friendships")
      .update({
        status: data.accept ? "accepted" : "declined",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.friendshipId)
      .eq("addressee_id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { friendshipId: string }) =>
    z.object({ friendshipId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", data.friendshipId)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
