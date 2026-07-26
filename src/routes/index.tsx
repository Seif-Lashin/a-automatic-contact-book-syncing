import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DineSmart — QR Ordering & Bill Splitting" },
      { name: "description", content: "Order, split, and pay at dine-in restaurants and food courts from your phone." },
      { property: "og:title", content: "DineSmart — QR Ordering & Bill Splitting" },
      { property: "og:description", content: "Order, split, and pay at dine-in restaurants and food courts from your phone." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="space-y-12 py-8">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Dine smarter, together.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Scan, order, split, and pay at your table — no app download needed. Built for restaurants and food courts.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/scan"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Scan a table QR
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Sign in to order
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        <FeatureCard
          title="QR Table Check-In"
          description="Scan the table QR code and verify your location before joining the session."
        />
        <FeatureCard
          title="Smart Menu & Filters"
          description="Filter by dietary needs, allergens, and see what your friends love."
        />
        <FeatureCard
          title="Split & Pay"
          description="Split itemized or equally, add tip, tip staff, and settle up instantly."
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground">For staff and owners</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/kds"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Kitchen Display
          </Link>
          <Link
            to="/waiter"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Waiter Panel
          </Link>
          <Link
            to="/owner"
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Owner Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
