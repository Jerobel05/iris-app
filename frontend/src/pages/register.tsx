import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#fff" }}>
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col justify-center px-16 py-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-500 mb-8">Rejoignez Iris et commencez à gérer vos emails intelligemment</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean@exemple.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répétez votre mot de passe"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Vous avez déjà un compte?{" "}
            <button onClick={() => navigate("/")} className="text-orange-500 font-semibold hover:underline">
              Se connecter
            </button>
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="w-1/2 relative flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #fde8d3 0%, #f5c9a0 40%, #e8a87c 70%, #d4875a 100%)" }}
      >
        <div className="absolute top-20 right-10 w-64 h-80 rounded-3xl opacity-30"
          style={{ background: "rgba(255,255,255,0.4)", transform: "rotate(15deg)" }} />

        <div className="relative z-10 text-center px-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10">
              <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
              <circle cx="16" cy="16" r="8" fill="white" opacity="0.3" />
              <path d="M16 8 C22 12, 22 20, 16 24 C10 20, 10 12, 16 8Z" fill="white" opacity="0.8" />
              <circle cx="16" cy="16" r="3" fill="white" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Bienvenue sur Iris</h2>
          <p className="text-orange-100 text-base mb-8">
            L'assistant IA qui lit vos emails, détecte vos rendez-vous et les ajoute automatiquement à votre calendrier.
          </p>
          <div className="space-y-3 text-left">
            {[
              "✅ Scan automatique de votre Gmail",
              "✅ Détection des rendez-vous par IA",
              "✅ Ajout en 1 clic à Google Calendar",
              "✅ Génération de réponses automatiques",
            ].map((f) => (
              <div key={f} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
