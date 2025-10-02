// pages/app-link.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AppLink() {
  const router = useRouter();
  useEffect(() => {
    const token = router.query.token as string | undefined;
    const scheme = token
      ? `flexy://onboard/complete?token=${encodeURIComponent(token)}`
      : "flexy://onboard/complete";
    // try to open app
    window.location.href = scheme;
    // fallback to stores after a short delay
    const t = setTimeout(() => {
      window.location.href = "https://apps.apple.com/app/your-app-id"; // or dynamic store link
    }, 1500);
    return () => clearTimeout(t);
  }, [router.query.token]);
  return null;
}
