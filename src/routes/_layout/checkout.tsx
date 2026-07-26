import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getSessionById } from "@/lib/session.functions";
import { supabase } from "@/integrations/supabase/client";
import { SplitMode } from "@/lib/types";
import { CreditCard, Wallet, Users } from "lucide-react";

export const Route = createFileRoute("/_layout/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = Route.useSearch() as { sessionId?: string };
  const sessionId = search.sessionId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchSession = useServerFn(getSessionById);
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [tipPercent, setTipPercent] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<"card" | "wallet" | "apple" | "google">("card");

  const { data: sessionData } = useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession({ data: { sessionId: sessionId! } }),
    enabled: !!sessionId,
  });

  const session = sessionData?.session;

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`checkout-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `session_id=eq.${sessionId}` },
        () => queryClient.invalidateQueries({ queryKey: ["session", sessionId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  if (!sessionId) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No active session. Scan a table QR to start.</p>
        <button
          onClick={() => navigate({ to: "/scan" })}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Scan table
        </button>
      </div>
    );
  }

  if (!session) {
    return <p className="text-muted-foreground">Loading checkout...</p>;
  }

  const allItems: { id: string; quantity: number; total_price: number; menu_item: { name: string } | null }[] =
    session.orders?.flatMap((o) =>
      (o.order_items ?? []).map((item) => ({ ...item, menu_item: item.menu_item as { name: string } | null })),
    ) ?? [];
  const subtotal = allItems.reduce((sum: number, item) => sum + item.total_price, 0);
  const tax = Math.round(subtotal * session.tax_rate);
  const serviceCharge = Math.round(subtotal * session.service_charge_rate);
  const tip = Math.round(subtotal * (tipPercent / 100));
  const total = subtotal + tax + serviceCharge + tip;

  const participantCount = session.participants.length || 1;
  const perPersonEqual = Math.round(total / participantCount);

  const selectedItemTotal = allItems
    .filter((item) => selectedItems.has(item.id))
    .reduce((sum: number, item) => sum + item.total_price, 0);
  const selectedTip = Math.round(selectedItemTotal * (tipPercent / 100));
  const selectedTax = Math.round(selectedItemTotal * session.tax_rate);
  const selectedServiceCharge = Math.round(selectedItemTotal * session.service_charge_rate);
  const selectedTotal = selectedItemTotal + selectedTax + selectedServiceCharge + selectedTip;

  const handlePay = async () => {
    // Placeholder for payment integration
    alert(`Payment of $${((splitMode === "itemized" ? selectedTotal : perPersonEqual) / 100).toFixed(2)} confirmed!`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Table {session.table.table_number} · {session.restaurant.name}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Split method</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => setSplitMode("equal")}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              splitMode === "equal"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <Users className="h-4 w-4" />
            Equal split
          </button>
          <button
            onClick={() => setSplitMode("itemized")}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              splitMode === "itemized"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Itemized
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Items</h2>
        <ul className="mt-3 space-y-3">
          {allItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {splitMode === "itemized" && (
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => {
                      const next = new Set(selectedItems);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      setSelectedItems(next);
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                )}
                <span className="text-sm text-foreground">
                  {item.quantity}× {item.menu_item?.name ?? "Item"}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">${(item.total_price / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Tip</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 10, 15, 18, 20].map((pct) => (
            <button
              key={pct}
              onClick={() => setTipPercent(pct)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                tipPercent === pct
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${(subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span>${(tax / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Service charge</span>
            <span>${(serviceCharge / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tip</span>
            <span>${(tip / 100).toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2">
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </div>
          {splitMode === "equal" && (
            <div className="flex justify-between text-sm font-medium text-primary">
              <span>Your share ({participantCount} diners)</span>
              <span>${(perPersonEqual / 100).toFixed(2)}</span>
            </div>
          )}
          {splitMode === "itemized" && (
            <div className="flex justify-between text-sm font-medium text-primary">
              <span>Your selected items</span>
              <span>${(selectedTotal / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Payment method</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { id: "card", label: "Card", icon: CreditCard },
            { id: "wallet", label: "Wallet", icon: Wallet },
            { id: "apple", label: "Apple Pay", icon: Wallet },
            { id: "google", label: "Google Pay", icon: Wallet },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedPayment(method.id as typeof selectedPayment)}
              className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                selectedPayment === method.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-foreground hover:bg-accent"
              }`}
            >
              <method.icon className="h-4 w-4" />
              {method.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handlePay}
        className="w-full rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Pay ${((splitMode === "itemized" ? selectedTotal : perPersonEqual) / 100).toFixed(2)}
      </button>
    </div>
  );
}
