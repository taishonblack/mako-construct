import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MakoFinMark } from "@/components/MakoFinMark";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Try to see if there's a session from the recovery link
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setReady(true);
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Min 6 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else { setSuccess(true); setTimeout(() => navigate("/dashboard"), 2000); }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><MakoFinMark className="h-8" /></div>
          <h1 className="text-xl font-medium text-foreground">Reset Password</h1>
        </div>

        {success ? (
          <div className="steel-panel p-6 text-center">
            <p className="text-sm text-foreground">Password updated! Redirecting...</p>
          </div>
        ) : !ready ? (
          <div className="steel-panel p-6 text-center">
            <p className="text-sm text-muted-foreground">Invalid or expired reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="steel-panel p-6 space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">New Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Confirm Password</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 disabled:opacity-50">
              <KeyRound className="w-4 h-4" /> {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
