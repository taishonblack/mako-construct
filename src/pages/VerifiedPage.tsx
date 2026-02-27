import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { MakoFinMark } from "@/components/MakoFinMark";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <div className="flex justify-center mb-4">
          <MakoFinMark className="h-8" />
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="text-xl font-medium text-foreground mb-2">Email Verified</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Your account has been verified. You're all set to start using MAKO Live.
        </p>

        <Link
          to="/binders"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Enter Workspace
        </Link>
      </motion.div>
    </div>
  );
}
