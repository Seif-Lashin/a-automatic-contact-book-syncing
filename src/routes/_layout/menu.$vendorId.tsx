import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getVendorMenu } from "@/lib/menu.functions";
import { submitOrder } from "@/lib/order.functions";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import type { CartItem } from "@/lib/types";

export const Route = createFileRoute("/_layout/menu/$vendorId")({
  component: MenuPage,
});

function MenuPage() {
  const { vendorId } = Route.useParams();
  const { sessionId } = Route.useSearch<{ sessionId: string }>();
  const fetchMenu = useServerFn(getVendorMenu);
  const submitOrderFn = useServerFn(submitOrder);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dietaryFilter, setDietaryFilter] = useState<string[]>([]);
  const [allergenFilter, setAllergenFilter] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: menuData } = useQuery({
    queryKey: ["menu", vendorId],
    queryFn: () => fetchMenu({ data: { vendorId } }),
  });

  const vendor = menuData?.vendor;
  const categories = menuData?.categories ?? [];

  const addToCart = (item: {
    id: string;
    name: string;
    price: number;
    vendor_id: string;
  }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          vendor_id: item.vendor_id,
          name: item.name,
          price: item.price,
          quantity: 1,
          special_instructions: "",
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menu_item_id === menuItemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!sessionId) return;
    setSubmitting(true);
    try {
      await submitOrderFn({
        data: {
          sessionId,
          vendorId,
          items: cart,
        },
      });
      setCart([]);
      alert("Order submitted!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFilter = (value: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(value)) {
      setList(list.filter((v) => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const allDietary = Array.from(
    new Set(categories.flatMap((c) => c.menu_items.flatMap((i) => (i as { dietary_tags?: string[] }).dietary_tags ?? []))),
  );
  const allAllergens = Array.from(
    new Set(categories.flatMap((c) => c.menu_items.flatMap((i) => (i as { allergens?: string[] }).allergens ?? []))),
  );

  const filteredCategories = categories.map((category) => ({
    ...category,
    menu_items: (category.menu_items as { id: string; name: string; price: number; vendor_id: string; dietary_tags?: string[]; allergens?: string[]; is_available: boolean; description: string | null; image_url: string | null }[]).filter(
      (item) => {
        if (dietaryFilter.length > 0 && !dietaryFilter.every((tag) => item.dietary_tags?.includes(tag))) return false;
        if (allergenFilter.length > 0 && allergenFilter.some((a) => item.allergens?.includes(a))) return false;
        return true;
      },
    ),
  }));

  if (!vendor) {
    return <p className="text-muted-foreground">Loading menu...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary">{vendor.name}</p>
          <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">${(cartTotal / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {allDietary.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag, dietaryFilter, setDietaryFilter)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              dietaryFilter.includes(tag)
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            {tag}
          </button>
        ))}
        {allAllergens.map((a) => (
          <button
            key={a}
            onClick={() => toggleFilter(a, allergenFilter, setAllergenFilter)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              allergenFilter.includes(a)
                ? "bg-destructive text-destructive-foreground"
                : "border border-border bg-card text-foreground hover:bg-accent"
            }`}
          >
            No {a}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filteredCategories.map((category) =>
          category.menu_items.length === 0 ? null : (
            <div key={category.id}>
              <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {category.menu_items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border border-border bg-card p-4 ${!item.is_available ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="mt-2 text-sm font-medium text-primary">${(item.price / 100).toFixed(2)}</p>
                      </div>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.dietary_tags?.map((tag) => (
                          <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      {item.is_available ? (
                        <div className="flex items-center gap-2">
                          {cart.find((i) => i.menu_item_id === item.id) ? (
                            <>
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="rounded-full border border-border p-1 hover:bg-accent"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium text-foreground">
                                {cart.find((i) => i.menu_item_id === item.id)?.quantity}
                              </span>
                            </>
                          ) : null}
                          <button
                            onClick={() => addToCart(item)}
                            className="rounded-full bg-primary p-1.5 text-primary-foreground hover:bg-primary/90"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {cart.length > 0 && (
        <div className="sticky bottom-4 rounded-xl border border-border bg-card p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} items · ${(cartTotal / 100).toFixed(2)}
            </span>
            <button
              onClick={handleSubmit}
              disabled={submitting || !sessionId}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {submitting ? "Submitting..." : "Place order"}
            </button>
          </div>
          {!sessionId && (
            <p className="mt-2 text-xs text-destructive">Please scan a table QR code first to start a session.</p>
          )}
        </div>
      )}
    </div>
  );
}
