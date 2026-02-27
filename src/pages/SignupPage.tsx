import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MakoFinMark } from "@/components/MakoFinMark";

export default function SignupPage() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setLoading(true);
    const { error: err } = await signUp(email, password, displayName);
    setLoading(false);
    if (err) setError(err);
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="flex justify-center mb-4">
            <MakoFinMark className="h-8" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          >
            <Mail className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-xl font-medium text-foreground mb-2">Check Your Email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            We sent a verification link to <span className="text-foreground font-medium">{email}</span>. Click the link to activate your MAKO Live account.
          </p>
          <Link to="/login" className="text-xs text-primary hover:underline">
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top-left logo + back link */}
      <div className="flex items-center gap-3 px-6 py-4">
        <Link to="/binders" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <MakoFinMark className="h-6" />
          <span className="text-sm font-medium tracking-tight">MAKO Live</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-xl font-medium text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join your MAKO workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="steel-panel p-6 space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Display Name</label>
            <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Your name" />
          </div>
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
                placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            <UserPlus className="w-4 h-4" />
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>

          <Link to="/binders" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Binders
          </Link>
        </form>
      </motion.div>
      </div>
    </div>
  );
}
