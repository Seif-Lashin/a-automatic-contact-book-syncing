import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CartItem } from "./types";

const cartItemSchema = z.object({
  menu_item_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  name: z.string(),
  price: z.number().int(),
  quantity: z.number().int().min(1),
  special_instructions: z.string().optional(),
});

export const submitOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; vendorId: string; items: CartItem[] }) =>
    z
      .object({
        sessionId: z.string().uuid(),
        vendorId: z.string().uuid(),
        items: z.array(cartItemSchema).min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify session is active and user is participant
    const { data: session } = await supabase
      .from("table_sessions")
      .select("*, session_participants!inner(user_id)")
      .eq("id", data.sessionId)
      .eq("session_participants.user_id", userId)
      .in("status", ["active", "ordering"])
      .single();

    if (!session) {
      throw new Error("Session not active or you are not a participant");
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Math.round(subtotal * session.tax_rate);
    const serviceChargeAmount = Math.round(subtotal * session.service_charge_rate);
    const total = subtotal + taxAmount + serviceChargeAmount;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        session_id: data.sessionId,
        user_id: userId,
        vendor_id: data.vendorId,
        status: "pending",
        subtotal,
        tax_amount: taxAmount,
        service_charge_amount: serviceChargeAmount,
        total,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error("Could not create order");
    }

    const orderItems = data.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      user_id: userId,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      special_instructions: item.special_instructions,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      // Best-effort rollback; in production this should be a transaction
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error("Could not create order items");
    }

    // Update session total due
    await supabase
      .from("table_sessions")
      .update({
        total_due: session.total_due + total,
        status: "ordering",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);

    return { order };
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order } = await supabase
      .from("orders")
      .select("*, session:table_sessions(*)")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .eq("status", "pending")
      .single();

    if (!order) {
      throw new Error("Order not found or cannot be cancelled");
    }

    const session = order.session as { id: string; total_due: number };

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", data.orderId);

    if (error) {
      throw new Error("Could not cancel order");
    }

    await supabase
      .from("table_sessions")
      .update({
        total_due: Math.max(0, session.total_due - order.total),
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return { ok: true };
  });

export const updateOrderItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { orderItemId: string; quantity?: number; specialInstructions?: string }) =>
      z
        .object({
          orderItemId: z.string().uuid(),
          quantity: z.number().int().min(1).optional(),
          specialInstructions: z.string().optional(),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: orderItem } = await supabase
      .from("order_items")
      .select("*, order:orders(status, user_id)")
      .eq("id", data.orderItemId)
      .eq("order.user_id", userId)
      .eq("order.status", "pending")
      .single();

    if (!orderItem) {
      throw new Error("Order item not found or cannot be edited");
    }

    const update: { quantity?: number; total_price?: number; special_instructions?: string } = {};
    if (data.quantity !== undefined) {
      update.quantity = data.quantity;
      update.total_price = orderItem.unit_price * data.quantity;
    }
    if (data.specialInstructions !== undefined) {
      update.special_instructions = data.specialInstructions;
    }

    const { error } = await supabase
      .from("order_items")
      .update(update)
      .eq("id", data.orderItemId);

    if (error) {
      throw new Error("Could not update order item");
    }

    return { ok: true };
  });
