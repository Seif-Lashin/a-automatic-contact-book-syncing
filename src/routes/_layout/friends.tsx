import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listFriends, sendFriendRequest, respondToFriendRequest, removeFriend } from "@/lib/friends.functions";
import { UserPlus, Check, X, Users } from "lucide-react";

export const Route = createFileRoute("/_layout/friends")({
  component: FriendsPage,
});

function FriendsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listFriends);
  const send = useServerFn(sendFriendRequest);
  const respond = useServerFn(respondToFriendRequest);
  const remove = useServerFn(removeFriend);

  const { data } = useQuery({ queryKey: ["friends"], queryFn: () => fetchList() });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["friends"] });

  const handleAdd = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await send({ data: { displayName: name.trim() } });
      setName("");
      invalidate();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Friends</h1>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <UserPlus className="h-4 w-4" /> Add a friend
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friend's display name"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            onClick={handleAdd}
            disabled={busy}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </section>

      {(data?.incoming.length ?? 0) > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Incoming requests</h2>
          <ul className="mt-3 space-y-2">
            {data?.incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm font-medium text-foreground">{r.friend.display_name ?? "User"}</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await respond({ data: { friendshipId: r.id, accept: true } });
                      invalidate();
                    }}
                    className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      await respond({ data: { friendshipId: r.id, accept: false } });
                      invalidate();
                    }}
                    className="rounded-md border border-border p-2 text-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <Users className="h-4 w-4" /> Your friends
        </h2>
        {(data?.friends.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You haven't added any friends yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data?.friends.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm font-medium text-foreground">{r.friend.display_name ?? "User"}</span>
                <button
                  onClick={async () => {
                    if (!confirm("Remove this friend?")) return;
                    await remove({ data: { friendshipId: r.id } });
                    invalidate();
                  }}
                  className="text-sm text-destructive hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(data?.outgoing.length ?? 0) > 0 && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Pending sent</h2>
          <ul className="mt-3 space-y-2">
            {data?.outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm text-muted-foreground">{r.friend.display_name ?? "User"}</span>
                <span className="text-xs text-muted-foreground">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
