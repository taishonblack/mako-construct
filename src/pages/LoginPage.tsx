import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MakoFinMark } from "@/components/MakoFinMark";

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) setError(err);
    else navigate("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MakoFinMark className="h-8" />
          </div>
          <h1 className="text-xl font-medium text-foreground">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Access your MAKO workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="steel-panel p-6 space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="you@team.com" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-secondary border border-border rounded px-3 py-2 pr-10 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            <LogIn className="w-4 h-4" />
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex justify-between text-xs text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground transition-colors">Forgot password?</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Create account</Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
