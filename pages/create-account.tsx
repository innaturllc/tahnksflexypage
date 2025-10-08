// // pages/index.tsx
// import { useEffect, useMemo, useState } from "react";
// import { createClient } from "@supabase/supabase-js";
// import mod from "mixpanel-browser";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// const APP_LINK_BASE =
//   "https://flexy-pilates.superwall.app/afterOnboardingPaywall";

// type TokenResponse = { token: string; expiresAt: string };

// // ───────────────────────────────────────────
// // Mixpanel (browser) - safe, lazy client init
// // ───────────────────────────────────────────

// async function ensureMixpanel() {
//   const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "";
//   if (!token) {
//     if (process.env.NODE_ENV !== "production") {
//       console.warn("[Mixpanel] Missing NEXT_PUBLIC_MIXPANEL_TOKEN");
//     }
//   }
//   mod.init(token, {
//     debug: process.env.NODE_ENV !== "production",
//     track_pageview: true,
//   });
//   return mod;
// }

// export default function ThankYou() {
//   const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [userId, setUserId] = useState<string | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [queryString, setQueryString] = useState<string>(""); // ✅ client-only query
//   const [attribution, setAttribution] = useState({
//     fbc: null as string | null,
//     fbp: null as string | null,
//     utm_source: null as string | null,
//     utm_medium: null as string | null,
//     utm_campaign: null as string | null,
//   });

//   // ── Client-only: read URL params and build attribution
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     const qs = window.location.search || "";
//     setQueryString(qs);

//     const params = new URLSearchParams(qs);
//     const fbclid = params.get("fbclid");
//     const ts = Date.now();

//     const fbc = fbclid ? `fb.1.${ts}.${fbclid}` : null;
//     const fbp = `fb.1.${ts}.${Math.floor(Math.random() * 1e16)}`;

//     setAttribution({
//       fbc,
//       fbp,
//       utm_source: params.get("utm_source"),
//       utm_medium: params.get("utm_medium"),
//       utm_campaign: params.get("utm_campaign"),
//     });

//     if (process.env.NODE_ENV !== "production") {
//       console.debug("Attribution info:", {
//         fbc,
//         fbp,
//         utm_source: params.get("utm_source"),
//         utm_medium: params.get("utm_medium"),
//         utm_campaign: params.get("utm_campaign"),
//       });
//     }
//   }, []);

//   // ── Build deep link safely (no window during SSR)
//   const startUrl = useMemo(() => {
//     const params = new URLSearchParams(queryString || "");
//     if (userId) params.set("app_user_id", userId);
//     const qs = params.toString();
//     return qs ? `${APP_LINK_BASE}?${qs}` : APP_LINK_BASE;
//   }, [queryString, userId]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!email || !password || loading) return;

//     setError(null);
//     setLoading(true);
//     try {
//       let uid: string | undefined;
//       let flow: "sign_in" | "sign_up" = "sign_in";

//       const signIn = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (!signIn.error) {
//         uid = signIn.data.user?.id;
//       } else {
//         const signUp = await supabase.auth.signUp({ email, password });
//         if (signUp.error) throw signUp.error;
//         uid = signUp.data.user?.id;
//         flow = "sign_up";
//       }

//       if (!uid) {
//         const { data } = await supabase.auth.getUser();
//         uid = data.user?.id;
//       }
//       if (!uid) throw new Error("Could not determine user id after auth.");
//       setUserId(uid);
//       await supabase.from("ad_attribution").upsert({
//         user_id: uid,
//         fbc: attribution.fbc,
//         fbp: attribution.fbp,
//         utm_source: attribution.utm_source,
//         utm_medium: attribution.utm_medium,
//         utm_campaign: attribution.utm_campaign,
//       });
//       // ── Mixpanel: identify by user_id and track Signup Attempt
//       const m = await ensureMixpanel();
//       if (m) {
//         try {
//           // distinct_id = user_id
//           m.identify(uid);
//           // optional: set people profile fields (email)
//           (m as any).people?.set?.({ $email: email });

//           m.track("Signup Attempt", {
//             flow, // "sign_in" | "sign_up"
//             email, // useful for funnels (avoid PII in events if you prefer)
//             utm_source: attribution.utm_source ?? undefined,
//             utm_medium: attribution.utm_medium ?? undefined,
//             utm_campaign: attribution.utm_campaign ?? undefined,
//             fbc: attribution.fbc ?? undefined,
//             fbp: attribution.fbp ?? undefined,
//           });
//         } catch (mpErr) {
//           if (process.env.NODE_ENV !== "production") {
//             console.warn("[Mixpanel] track error:", mpErr);
//           }
//         }
//       }

//       // // Optional token:
//       // const { data, error: fnError } = await supabase.functions.invoke(
//       //   "mint-app-link-token",
//       //   { body: { userId: uid } }
//       // );
//       // if (fnError) throw new Error(`Token API failed: ${fnError.message}`);
//       // setToken((data as TokenResponse).token);
//     } catch (err: any) {
//       setError(err?.message ?? "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.shell}>
//       <div style={styles.bgBlob} aria-hidden />
//       <main style={styles.card}>
//         <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={styles.emojiBadge} aria-hidden>
//             🎉
//           </div>
//           <div>
//             <h1 style={styles.h1}>Start Your Pilates Journey!</h1>
//             <p style={styles.subtle}>
//               {userId
//                 ? "You’re all set. Unlock is ready in the app."
//                 : "Finish setting up your account to unlock premium in the app."}
//             </p>
//           </div>
//         </header>

//         {userId ? (
//           <section style={{ marginTop: 16 }}>
//             <div style={styles.successBox}>
//               <p style={{ margin: 0 }}>
//                 Signed in as <strong>{email || "your account"}</strong>. Tap the
//                 button to jump into the app.
//               </p>
//             </div>

//             <a
//               href={startUrl}
//               style={{ ...styles.primaryBtn, marginTop: 16 }}
//               target="_blank"
//               rel="noopener noreferrer">
//               Let’s get started
//             </a>

//             <p style={styles.tinyNote}>
//               Having trouble?{" "}
//               <button
//                 type="button"
//                 onClick={() => setUserId(null)}
//                 style={styles.linkBtn}>
//                 Switch account
//               </button>
//             </p>
//           </section>
//         ) : (
//           <form onSubmit={handleSubmit} style={styles.form}>
//             <label style={styles.label}>
//               <span style={styles.labelText}>Email</span>
//               <input
//                 type="email"
//                 required
//                 autoComplete="email"
//                 inputMode="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="you@example.com"
//                 style={styles.input}
//               />
//             </label>

//             <label style={styles.label}>
//               <span style={styles.labelText}>Password</span>
//               <div style={{ position: "relative" }}>
//                 <input
//                   type={showPw ? "text" : "password"}
//                   required
//                   minLength={6}
//                   autoComplete="new-password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Minimum 6 characters"
//                   style={{ ...styles.input, paddingRight: 44 }}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPw((s) => !s)}
//                   aria-label={showPw ? "Hide password" : "Show password"}
//                   style={styles.eyeBtn}>
//                   {showPw ? "🙈" : "👁️"}
//                 </button>
//               </div>
//             </label>

//             <button
//               type="submit"
//               disabled={loading || !email || !password}
//               style={{
//                 ...styles.primaryBtn,
//                 opacity: loading ? 0.9 : 1,
//                 cursor: loading ? "not-allowed" : "pointer",
//                 marginTop: 4,
//               }}
//               aria-busy={loading}>
//               {loading ? "Preparing…" : "Create account / Sign in"}
//             </button>

//             {error && (
//               <p style={styles.error} role="alert">
//                 {error}
//               </p>
//             )}

//             <p style={styles.tinyNote}>
//               We’ll only use your email to create your account and secure
//               access. You can delete it anytime.
//             </p>
//             <p style={styles.tinyNote}>
//               Use the same account credentials to log in on all your devices.
//             </p>
//           </form>
//         )}

//         {token && (
//           <details style={{ marginTop: 12 }}>
//             <summary>Debug token</summary>
//             <code style={styles.code}>{token}</code>
//           </details>
//         )}
//       </main>

//       <footer style={styles.footer}>
//         <p style={styles.footerText}>
//           Need help?{" "}
//           <a href="mailto:support@innaturll.com">support@innaturll.com</a>
//         </p>
//       </footer>
//     </div>
//   );
// }

// // ───────────────────────────────────────────
// // Styles (unchanged)
// // ───────────────────────────────────────────
// const styles: Record<string, React.CSSProperties> = {
//   shell: {
//     minHeight: "100svh",
//     display: "grid",
//     gridTemplateRows: "1fr auto",
//     alignItems: "center",
//     justifyItems: "center",
//     padding: 16,
//     background:
//       "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,0.08), transparent), #fafafa",
//     fontFamily:
//       "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
//     boxSizing: "border-box",
//   },
//   bgBlob: {
//     position: "fixed",
//     inset: 0,
//     pointerEvents: "none",
//     background:
//       "radial-gradient(600px 300px at 90% 10%, rgba(59,130,246,0.12), transparent)",
//   },
//   card: {
//     width: "100%",
//     maxWidth: 520,
//     background: "#fff",
//     border: "1px solid #eee",
//     borderRadius: 16,
//     padding: 20,
//     boxShadow:
//       "0 1px 3px rgba(0,0,0,0.05), 0 12px 28px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
//     boxSizing: "border-box",
//     overflow: "hidden",
//   },
//   emojiBadge: {
//     display: "grid",
//     placeItems: "center",
//     width: 40,
//     height: 40,
//     borderRadius: 12,
//     background: "#f1f5f9",
//     border: "1px solid #e5e7eb",
//     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
//     flexShrink: 0,
//   },
//   h1: { margin: 0, fontSize: 24, lineHeight: 1.2 },
//   subtle: { margin: 6, marginLeft: 0, color: "#475569", fontSize: 14 },
//   form: {
//     display: "flex",
//     flexDirection: "column",
//     gap: 12,
//     marginTop: 16,
//     width: "100%",
//     boxSizing: "border-box",
//   },
//   label: { display: "block", width: "100%" },
//   labelText: {
//     display: "block",
//     marginBottom: 6,
//     fontSize: 14,
//     color: "#0f172a",
//   },
//   input: {
//     width: "100%",
//     boxSizing: "border-box",
//     padding: "12px 14px",
//     borderRadius: 12,
//     border: "1px solid #e2e8f0",
//     outline: "none",
//     fontSize: 16,
//     transition: "box-shadow 120ms ease, border 120ms ease",
//     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
//     background: "#fff",
//   },
//   eyeBtn: {
//     position: "absolute",
//     right: 6,
//     top: 6,
//     height: 32,
//     minWidth: 32,
//     padding: "0 8px",
//     border: "1px solid #e2e8f0",
//     borderRadius: 10,
//     background: "#fff",
//     cursor: "pointer",
//   },
//   primaryBtn: {
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     width: "100%",
//     padding: "14px 16px",
//     borderRadius: 14,
//     border: "none",
//     background:
//       "linear-gradient(180deg, #111827, #0b1220) padding-box, linear-gradient(180deg, #10b981, #2563eb) border-box",
//     borderImageSlice: 1,
//     color: "white",
//     fontWeight: 700,
//     fontSize: 16,
//     textDecoration: "none",
//     boxShadow: "0 8px 20px rgba(16,185,129,0.25), 0 2px 6px rgba(0,0,0,0.12)",
//     transition: "transform 120ms ease",
//     boxSizing: "border-box",
//   },
//   error: { color: "crimson", marginTop: 6, fontSize: 14 },
//   tinyNote: {
//     marginTop: 8,
//     color: "#64748b",
//     fontSize: 12,
//     textAlign: "center",
//   },
//   successBox: {
//     padding: 12,
//     borderRadius: 12,
//     background: "#f8fdfb",
//     border: "1px solid #d1fae5",
//   },
//   code: {
//     display: "block",
//     marginTop: 8,
//     padding: 8,
//     borderRadius: 8,
//     background: "#0b1220",
//     color: "#e5e7eb",
//     overflowX: "auto",
//   },
//   linkBtn: {
//     background: "none",
//     border: "none",
//     padding: 0,
//     color: "#0ea5e9",
//     textDecoration: "underline",
//     cursor: "pointer",
//     fontSize: 12,
//   },
//   footer: { marginTop: 16 },
//   footerText: { color: "#94a3b8", fontSize: 12, textAlign: "center" },
// };

// pages/index.tsx
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import mod from "mixpanel-browser";

// ✅ NEW: Meta Pixel helpers
import { initMetaPixel, trackMeta, trackPageView } from "../lib/metaPixel";
import MetaNoScript from "../components/MetaNoScript";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const APP_LINK_BASE =
  "https://flexy-pilates.superwall.app/afterOnboardingPaywall";

type TokenResponse = { token: string; expiresAt: string };

async function ensureMixpanel() {
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || "";
  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Mixpanel] Missing NEXT_PUBLIC_MIXPANEL_TOKEN");
    }
  }
  mod.init(token, {
    debug: process.env.NODE_ENV !== "production",
    track_pageview: true,
  });
  return mod;
}

export default function ThankYou() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [queryString, setQueryString] = useState<string>("");
  const [attribution, setAttribution] = useState({
    fbc: null as string | null,
    fbp: null as string | null,
    utm_source: null as string | null,
    utm_medium: null as string | null,
    utm_campaign: null as string | null,
  });

  // ✅ NEW: Init Meta Pixel + PageView (client only)
  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
    if (!pixelId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Meta Pixel] Missing NEXT_PUBLIC_META_PIXEL_ID");
      }
      return;
    }
    // If you want to use advanced matching later, pass an object as 2nd arg.
    initMetaPixel(pixelId);
    trackPageView();
  }, []);

  // ── Client-only: read URL params and build attribution
  useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = window.location.search || "";
    setQueryString(qs);

    const params = new URLSearchParams(qs);
    const fbclid = params.get("fbclid");
    const ts = Date.now();

    const fbc = fbclid ? `fb.1.${ts}.${fbclid}` : null;
    const fbp = `fb.1.${ts}.${Math.floor(Math.random() * 1e16)}`;

    setAttribution({
      fbc,
      fbp,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
    });

    if (process.env.NODE_ENV !== "production") {
      console.debug("Attribution info:", {
        fbc,
        fbp,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
      });
    }
  }, []);

  const startUrl = useMemo(() => {
    const params = new URLSearchParams(queryString || "");
    if (userId) params.set("app_user_id", userId);
    const qs = params.toString();
    return qs ? `${APP_LINK_BASE}?${qs}` : APP_LINK_BASE;
  }, [queryString, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setError(null);
    setLoading(true);
    try {
      let uid: string | undefined;
      let flow: "sign_in" | "sign_up" = "sign_in";

      const signIn = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signIn.error) {
        uid = signIn.data.user?.id;
      } else {
        const signUp = await supabase.auth.signUp({ email, password });
        if (signUp.error) throw signUp.error;
        uid = signUp.data.user?.id;
        flow = "sign_up";
      }

      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data.user?.id;
      }
      if (!uid) throw new Error("Could not determine user id after auth.");
      setUserId(uid);

      await supabase.from("ad_attribution").upsert({
        user_id: uid,
        fbc: attribution.fbc,
        fbp: attribution.fbp,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
      });

      // ── Mixpanel
      const m = await ensureMixpanel();
      if (m) {
        try {
          m.identify(uid);
          (m as any).people?.set?.({ $email: email });
          m.track("Signup Attempt", {
            flow,
            email,
            utm_source: attribution.utm_source ?? undefined,
            utm_medium: attribution.utm_medium ?? undefined,
            utm_campaign: attribution.utm_campaign ?? undefined,
            fbc: attribution.fbc ?? undefined,
            fbp: attribution.fbp ?? undefined,
          });
        } catch (mpErr) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[Mixpanel] track error:", mpErr);
          }
        }
      }

      // ✅ NEW: Meta Pixel "CompleteRegistration" *only* on sign_up
      if (flow === "sign_up") {
        // Do NOT send internal userId. Keep params generic.
        trackMeta("CompleteRegistration");
      }

      // // Optional: mint deep-link token
      // const { data, error: fnError } = await supabase.functions.invoke(
      //   "mint-app-link-token",
      //   { body: { userId: uid } }
      // );
      // if (fnError) throw new Error(`Token API failed: ${fnError.message}`);
      // setToken((data as TokenResponse).token);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

  return (
    <div style={styles.shell}>
      {/* ✅ noscript fallback for PageView */}
      {pixelId ? <MetaNoScript pixelId={pixelId} /> : null}

      <div style={styles.bgBlob} aria-hidden />
      <main style={styles.card}>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.emojiBadge} aria-hidden>
            🎉
          </div>
          <div>
            <h1 style={styles.h1}>Start Your Pilates Journey!</h1>
            <p style={styles.subtle}>
              {userId
                ? "You’re all set. Unlock is ready in the app."
                : "Finish setting up your account to unlock premium in the app."}
            </p>
          </div>
        </header>

        {userId ? (
          <section style={{ marginTop: 16 }}>
            <div style={styles.successBox}>
              <p style={{ margin: 0 }}>
                Signed in as <strong>{email || "your account"}</strong>. Tap the
                button to jump into the app.
              </p>
            </div>
            <a
              href={startUrl}
              style={{ ...styles.primaryBtn, marginTop: 16 }}
              target="_blank"
              rel="noopener noreferrer">
              Let’s get started
            </a>
            <p style={styles.tinyNote}>
              Having trouble?{" "}
              <button
                type="button"
                onClick={() => setUserId(null)}
                style={styles.linkBtn}>
                Switch account
              </button>
            </p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* ... your existing form unchanged ... */}
            <label style={styles.label}>
              <span style={styles.labelText}>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  style={{ ...styles.input, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={styles.eyeBtn}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                ...styles.primaryBtn,
                opacity: loading ? 0.9 : 1,
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
              }}
              aria-busy={loading}>
              {loading ? "Preparing…" : "Create account / Sign in"}
            </button>

            {error && (
              <p style={styles.error} role="alert">
                {error}
              </p>
            )}

            <p style={styles.tinyNote}>
              We’ll only use your email to create your account and secure
              access. You can delete it anytime.
            </p>
            <p style={styles.tinyNote}>
              Use the same account credentials to log in on all your devices.
            </p>
          </form>
        )}

        {token && (
          <details style={{ marginTop: 12 }}>
            <summary>Debug token</summary>
            <code style={styles.code}>{token}</code>
          </details>
        )}
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Need help?{" "}
          <a href="mailto:support@innaturll.com">support@innaturll.com</a>
        </p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100svh",
    display: "grid",
    gridTemplateRows: "1fr auto",
    alignItems: "center",
    justifyItems: "center",
    padding: 16,
    background:
      "radial-gradient(1200px 600px at 50% -10%, rgba(16,185,129,0.08), transparent), #fafafa",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
  },
  bgBlob: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(600px 300px at 90% 10%, rgba(59,130,246,0.12), transparent)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 20,
    boxShadow:
      "0 1px 3px rgba(0,0,0,0.05), 0 12px 28px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  emojiBadge: {
    display: "grid",
    placeItems: "center",
    width: 40,
    height: 40,
    borderRadius: 12,
    background: "#f1f5f9",
    border: "1px solid #e5e7eb",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    flexShrink: 0,
  },
  h1: { margin: 0, fontSize: 24, lineHeight: 1.2 },
  subtle: { margin: 6, marginLeft: 0, color: "#475569", fontSize: 14 },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 16,
    width: "100%",
    boxSizing: "border-box",
  },
  label: { display: "block", width: "100%" },
  labelText: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    outline: "none",
    fontSize: 16,
    transition: "box-shadow 120ms ease, border 120ms ease",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
    background: "#fff",
  },
  eyeBtn: {
    position: "absolute",
    right: 6,
    top: 6,
    height: 32,
    minWidth: 32,
    padding: "0 8px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    border: "none",
    background:
      "linear-gradient(180deg, #111827, #0b1220) padding-box, linear-gradient(180deg, #10b981, #2563eb) border-box",
    borderImageSlice: 1,
    color: "white",
    fontWeight: 700,
    fontSize: 16,
    textDecoration: "none",
    boxShadow: "0 8px 20px rgba(16,185,129,0.25), 0 2px 6px rgba(0,0,0,0.12)",
    transition: "transform 120ms ease",
    boxSizing: "border-box",
  },
  error: { color: "crimson", marginTop: 6, fontSize: 14 },
  tinyNote: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 12,
    textAlign: "center",
  },
  successBox: {
    padding: 12,
    borderRadius: 12,
    background: "#f8fdfb",
    border: "1px solid #d1fae5",
  },
  code: {
    display: "block",
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    background: "#0b1220",
    color: "#e5e7eb",
    overflowX: "auto",
  },
  linkBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#0ea5e9",
    textDecoration: "underline",
    cursor: "pointer",
    fontSize: 12,
  },
  footer: { marginTop: 16 },
  footerText: { color: "#94a3b8", fontSize: 12, textAlign: "center" },
};
