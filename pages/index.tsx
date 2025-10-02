// pages/index.tsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const mintTokenUrl = process.env.MINT_SHORT_TOKEN_URL!;

type TokenResponse = { token: string; expiresAt: string };

export default function ThankYou() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.debug("UTMs:", {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      fbclid: params.get("fbclid"),
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);
    try {
      // 1) Try sign-in
      let uid: string | undefined;
      const signIn = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signIn.error) {
        uid = signIn.data.user?.id;
      } else {
        // 2) Fallback to sign-up
        const signUp = await supabase.auth.signUp({ email, password });
        if (signUp.error) throw signUp.error;
        uid = signUp.data.user?.id;
      }

      // 3) If uid still not present, ask Supabase for current user
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id;
      }
      if (!uid) throw new Error("Could not determine user id after auth.");
      setUserId(uid);

      // 4) Mint short-lived token via Supabase Edge Function
      const res = await fetch(mintTokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid }),
      });
      if (!res.ok) throw new Error(`Token API failed: ${res.status}`);
      const { token: t } = (await res.json()) as TokenResponse;
      setToken(t);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const appUniversalLink = token
    ? `https://yourdomain.com/app-link?token=${encodeURIComponent(token)}`
    : undefined;

  const appCustomScheme = token
    ? `flexy://onboard/complete?token=${encodeURIComponent(token)}`
    : undefined;

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: 16,
        background: "#fafafa",
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}>
      <main
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>🎉 Payment successful</h1>
        <p style={{ marginTop: 8, color: "#444" }}>
          Finish setting up your account so we can unlock premium in the app.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}>
          <label style={{ display: "block" }}>
            <div style={{ marginBottom: 6 }}>Email</div>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding-top: 12,
                padding-bottom: 12,
                borderRadius: 10,
                border: "1px solid #ddd",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "block" }}>
            <div style={{ marginBottom: 6 }}>Password</div>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="minimum 6 characters"
              style={{
                width: "100%",
                padding-top: 12,
                padding-bottom: 12,
                borderRadius: 10,
                border: "1px solid #ddd",
                outline: "none",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: loading ? "#444" : "#111",
              opacity: loading ? 0.85 : 1,
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
            aria-busy={loading}>
            {loading ? "Working…" : "Create account / Sign in"}
          </button>

          {error && (
            <p style={{ color: "crimson", marginTop: 4 }} role="alert">
              {error}
            </p>
          )}
        </form>

        {userId && token && (
          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 12,
              background: "#fbfdfc",
            }}>
            <h3 style={{ marginTop: 0 }}>Open the app</h3>
            <p style={{ marginTop: 4, color: "#444" }}>
              We’ll unlock premium automatically.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 8,
                flexWrap: "wrap",
              }}>
              <a
                href={appUniversalLink!}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#0f766e",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}>
                Open in App (Universal Link)
              </a>
              <a
                href={appCustomScheme!}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#334155",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}>
                Open (Scheme Fallback)
              </a>
            </div>

            <p style={{ marginTop: 10, fontSize: 13, color: "#555" }}>
              If nothing happens, install the app from the store, then tap the
              same button again.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
