import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie !");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded bg-primary flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">ALIYAH SHOP</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Gestion de Stock — Pièces Détachées
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded p-8 space-y-6">
          <div className="text-center">
            <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
            <h2 className="font-bold text-lg">{isSignUp ? "Créer un compte" : "Connexion Administrateur"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isSignUp ? "Créez votre compte administrateur" : "Accès réservé à l'administrateur"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-industrial flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                type="email"
                className="input-underline w-full mt-1"
                placeholder="admin@aliyahshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-industrial flex items-center gap-2">
                <KeyRound className="w-3 h-3" /> Mot de passe
              </label>
              <input
                type="password"
                className="input-underline w-full mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold"
          >
            {loading ? "Chargement..." : isSignUp ? "Créer le compte" : "Se connecter"}
          </Button>

          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
          >
            {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? Créer un compte"}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
          v1.0 — Système Sécurisé
        </p>
      </div>
    </div>
  );
}
