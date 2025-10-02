// pages/thank-you.tsx
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type TokenResponse = { token: string; expiresAt: string };

export default function ThankYou() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // optional: capture UTM/click ids from the URL for attribution
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // persist to your backend if you want (not shown)
    console.debug("UTMs:", {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      fbclid: params.get("fbclid"),
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Try sign in first (user may already exist), otherwise sign up.
      let { data: signIn, error: signInErr } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // If you want to use email confirmations on web:
            // emailRedirectTo: `${window.location.origin}/welcome`
          },
        });
        if (signUpErr) throw signUpErr;
        signIn = signUp;
      }

      // At this point we have a session user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No Supabase user after auth.");
      setUserId(user.id);

      // Ask your API to mint a short-lived deep-link token for this user
      const res = await fetch("/api/mint-app-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) throw new Error(`Token API failed: ${res.status}`);
      const { token: t } = (await res.json()) as TokenResponse;
      setToken(t);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
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
    <main
      style={{
        maxWidth: 520,
        margin: "40px auto",
        padding: 24,
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}>
      <h1>🎉 Payment successful</h1>
      <p>Finish setting up your account so we can unlock premium in the app.</p>

      <form
        onSubmit={handleSubmit}
        style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label>
          <div>Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>
        <label>
          <div>Password</div>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="minimum 6 characters"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "none",
            background: "#111",
            color: "white",
            fontWeight: 600,
          }}>
          {loading ? "Working…" : "Create account / Sign in"}
        </button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </form>

      {userId && token && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 12,
          }}>
          <h3>Open the app</h3>
          <p>We’ll unlock premium automatically.</p>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <a
              href={appUniversalLink!}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#0f766e",
                color: "#fff",
                textDecoration: "none",
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
  );
}
