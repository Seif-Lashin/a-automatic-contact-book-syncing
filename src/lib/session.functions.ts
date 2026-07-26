import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calculateDistanceMeters } from "./location";

export const getTableByQrCode = createServerFn({ method: "GET" })
  .inputValidator((data: { qrCode: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: table, error } = await supabaseAdmin
      .from("tables")
      .select("*, restaurant:restaurants(*), vendor:vendors(*)")
      .eq("qr_code_payload", data.qrCode)
      .eq("is_active", true)
      .single();

    if (error || !table) {
      throw new Error("Invalid QR code or table not found");
    }

    return { table };
  });

export const validateLocationAndJoinSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { qrCode: string; latitude: number; longitude: number }) =>
    z
      .object({
        qrCode: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: table, error } = await supabaseAdmin
      .from("tables")
      .select("*, restaurant:restaurants(*)")
      .eq("qr_code_payload", data.qrCode)
      .eq("is_active", true)
      .single();

    if (error || !table) {
      throw new Error("Invalid QR code or table not found");
    }

    const restaurant = table.restaurant as {
      id: string;
      latitude: number;
      longitude: number;
      proximity_radius_meters: number;
      service_charge_rate: number;
      tax_rate: number;
    };

    const distance = calculateDistanceMeters(
      data.latitude,
      data.longitude,
      restaurant.latitude,
      restaurant.longitude,
    );

    if (distance > restaurant.proximity_radius_meters) {
      throw new Error(
        `You are too far from the restaurant (${Math.round(distance)}m away). Please move closer or ask a waiter to check you in.`,
      );
    }

    // Find active session or create one
    let { data: session } = await supabaseAdmin
      .from("table_sessions")
      .select("*")
      .eq("table_id", table.id)
      .in("status", ["active", "ordering"])
      .single();

    if (!session) {
      const { data: newSession, error: createError } = await supabaseAdmin
        .from("table_sessions")
        .insert({
          table_id: table.id,
          restaurant_id: restaurant.id,
          status: "active",
          service_charge_rate: restaurant.service_charge_rate,
          tax_rate: restaurant.tax_rate,
        })
        .select()
        .single();

      if (createError || !newSession) {
        throw new Error("Could not create table session");
      }
      session = newSession;
    }

    // Add participant if not already present
    const { error: participantError } = await supabaseAdmin
      .from("session_participants")
      .upsert(
        {
          session_id: session.id,
          user_id: userId,
          is_host: false,
          left_at: null,
        },
        { onConflict: "session_id, user_id" },
      );

    if (participantError) {
      throw new Error("Could not join session");
    }

    return { session, table };
  });

export const getSessionById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) =>
    z.object({ sessionId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: session, error } = await supabase
      .from("table_sessions")
      .select(
        `
        *,
        restaurant:restaurants(*),
        table:tables(*),
        participants:session_participants(
          user_id,
          is_host,
          joined_at,
          profile:profiles(user_id, display_name, avatar_url)
        )
      `,
      )
      .eq("id", data.sessionId)
      .single();

    if (error || !session) {
      throw new Error("Session not found");
    }

    return { session };
  });

export const callWaiter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; tableId: string; reason?: string }) =>
    z
      .object({
        sessionId: z.string().uuid(),
        tableId: z.string().uuid(),
        reason: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.from("waiter_calls").insert({
      session_id: data.sessionId,
      table_id: data.tableId,
      user_id: userId,
      reason: data.reason,
    });

    if (error) {
      throw new Error("Could not call waiter");
    }

    return { ok: true };
  });
