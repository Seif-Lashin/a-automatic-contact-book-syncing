import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { getCurrentPosition, formatLocationError } from "@/lib/location";
import { useServerFn } from "@tanstack/react-start";
import { validateLocationAndJoinSession } from "@/lib/session.functions";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_layout/scan")({
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const joinSession = useServerFn(validateLocationAndJoinSession);

  useEffect(() => {
    const scannerId = "qr-scanner";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (loading) return;
          setLoading(true);
          try {
            const position = await getCurrentPosition();
            const result = await joinSession({
              data: {
                qrCode: decodedText,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            });
            await scanner.stop();
            navigate({ to: "/session/$sessionId", params: { sessionId: result.session.id } });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not join session");
            setLoading(false);
          }
        },
        undefined,
      )
      .then(() => setScanning(true))
      .catch((err) => setError(err?.message || "Could not start camera"));

    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current?.clear();
    };
  }, [joinSession, navigate]);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Scan table QR code</h1>
        <p className="text-sm text-muted-foreground">Point your camera at the QR code on the table.</p>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-border bg-black">
        <div id="qr-scanner" className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm">Verifying location and joining...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <p>Location must be within 50m of the restaurant to join the table session.</p>
      </div>
    </div>
  );
}
