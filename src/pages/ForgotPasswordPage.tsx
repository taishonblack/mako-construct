import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MakoFinMark } from "@/components/MakoFinMark";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><MakoFinMark className="h-8" /></div>
          <h1 className="text-xl font-medium text-foreground">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="steel-panel p-6 text-center">
            <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-foreground">Check your email for a reset link.</p>
            <Link to="/login" className="text-xs text-primary hover:underline mt-3 inline-block">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="steel-panel p-6 space-y-4">
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="you@team.com" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 disabled:opacity-50">
              <Mail className="w-4 h-4" /> {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
