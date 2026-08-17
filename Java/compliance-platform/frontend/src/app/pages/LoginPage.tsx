import { useState } from "react";
import { Shield, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { login } from "../lib/apiClient";

export function LoginPage({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Enter both username and password.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      onLogin(username.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "radial-gradient(circle at 50% 0%, #16213e 0%, #0d1526 60%, #0a0f1c 100%)",
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Shield size={22} className="text-white" />
          </div>
          <div className="text-center">
            <div className="text-white font-bold text-lg leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ComplianceIQ
            </div>
            <div className="text-white/30 text-xs mt-1.5">Risk &amp; Monitoring Platform</div>
          </div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-xl shadow-2xl shadow-black/30 p-7 flex flex-col gap-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Sign in</h1>
            <p className="text-xs text-gray-400 mt-0.5">Enter your credentials to access the platform</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Username</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <User size={15} className="text-gray-300 flex-shrink-0" />
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 text-sm outline-none placeholder-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500">Password</label>
              <button type="button" className="text-xs text-blue-600 hover:underline font-medium">Forgot password?</button>
            </div>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <Lock size={15} className="text-gray-300 flex-shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 text-sm outline-none placeholder-gray-300"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-gray-300 accent-blue-600" />
            Keep me signed in
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

          <div className="text-center text-[11px] text-gray-300">
            or <button type="button" className="text-blue-600 hover:underline font-medium">sign in with SSO</button>
          </div>
        </form>

        <div className="text-white/20 text-[11px] mt-6">© 2026 ComplianceIQ. All rights reserved.</div>
      </div>
    </div>
  );
}