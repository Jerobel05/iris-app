import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Mail, Loader2, AlertCircle, CheckCircle2, Calendar, RefreshCw,
  Send, Copy, ChevronDown, ChevronUp, X, ExternalLink, Sparkles
} from "lucide-react";
import { gmailApi, suggestApi, buildGoogleCalendarUrl, ScannedEmail, SuggestionVariant } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const GMAIL_STORAGE_KEY = "iris_gmail";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return dateStr; }
}

interface GmailCreds { email: string; appPassword: string; }

export default function EmailsPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"appointments" | "all">("appointments");
  const [step, setStep] = useState<"connect" | "scanning" | "results">("connect");
  const [creds, setCreds] = useState<GmailCreds>({ email: "", appPassword: "" });
  const [scanResult, setScanResult] = useState<{ total_scanned: number; appointments_found: number; emails: ScannedEmail[] } | null>(null);
  const [error, setError] = useState("");
  const [maxEmails, setMaxEmails] = useState(30);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, SuggestionVariant[]>>({});
  const [loadingSuggest, setLoadingSuggest] = useState<string | null>(null);
  const [copiedVariant, setCopiedVariant] = useState<string | null>(null);
  const [addedCalendar, setAddedCalendar] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) { navigate("/"); return; }
    const saved = localStorage.getItem(GMAIL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GmailCreds;
        setCreds(parsed);
      } catch {}
    }
  }, [isAuthenticated]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("scanning");
    try {
      localStorage.setItem(GMAIL_STORAGE_KEY, JSON.stringify(creds));
      const result = await gmailApi.scan(creds.email, creds.appPassword, maxEmails);
      setScanResult(result);
      setStep("results");
    } catch (err: any) {
      setError(err.message || "Erreur de connexion Gmail");
      setStep("connect");
    }
  };

  const handleRescan = () => {
    setScanResult(null);
    setSuggestions({});
    setStep("connect");
  };

  const handleAddToCalendar = (email: ScannedEmail) => {
    if (!email.appointment) return;
    const appt = email.appointment;
    let startStr: string | undefined;
    if (appt.date && appt.time) {
      const dateClean = appt.date.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$2-$1");
      const timeClean = appt.time.replace(/(\d+)h(\d*)/, "$1:$2").padEnd(5, "0");
      startStr = `${dateClean}T${timeClean}:00`;
    }
    const url = buildGoogleCalendarUrl(email.subject, startStr, undefined, appt.location, email.preview);
    window.open(url, "_blank");
    setAddedCalendar((prev) => new Set([...prev, email.id]));
  };

  const handleGetSuggestions = async (email: ScannedEmail) => {
    if (suggestions[email.id]) { setExpandedId(email.id); return; }
    setLoadingSuggest(email.id);
    try {
      const result = await suggestApi.reply(email.id, email.subject, email.body || email.preview);
      setSuggestions((prev) => ({ ...prev, [email.id]: result.variants }));
      setExpandedId(email.id);
    } catch {
      const fallback: SuggestionVariant[] = [
        { style: "amical", subject: `Re: ${email.subject}`, body: `Bonjour,\n\nMerci pour votre message concernant "${email.subject}".\n\nJe confirme ma disponibilité pour ce rendez-vous.\n\nCordialement` },
        { style: "formel", subject: `Re: ${email.subject}`, body: `Madame, Monsieur,\n\nSuite à votre message relatif à "${email.subject}", je vous confirme ma participation.\n\nVeuillez agréer mes salutations distinguées.` },
        { style: "bref", subject: `Re: ${email.subject}`, body: `Bonjour,\n\nReçu, je confirme.\n\nBonne journée.` },
      ];
      setSuggestions((prev) => ({ ...prev, [email.id]: fallback }));
      setExpandedId(email.id);
    } finally {
      setLoadingSuggest(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVariant(key);
    setTimeout(() => setCopiedVariant(null), 2000);
  };

  const displayedEmails = scanResult
    ? activeTab === "appointments"
      ? scanResult.emails.filter((e) => e.is_appointment)
      : scanResult.emails
    : [];

  if (step === "connect") {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, hsl(25 85% 52%), hsl(20 90% 40%))" }}>
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connecter Gmail</h2>
            <p className="text-gray-400 text-sm">
              Utilisez un mot de passe d'application Gmail pour une connexion sécurisée
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2"
              style={{ background: "hsl(0 60% 20%)", border: "1px solid hsl(0 60% 35%)" }}>
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleScan} className="rounded-2xl p-6 space-y-4"
            style={{ background: "hsl(20 10% 18%)", border: "1px solid hsl(20 10% 25%)" }}>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse Gmail</label>
              <input
                type="email"
                value={creds.email}
                onChange={(e) => setCreds({ ...creds, email: e.target.value })}
                placeholder="votre@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ background: "hsl(20 10% 12%)", border: "1px solid hsl(20 10% 28%)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe d'application
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer"
                  className="ml-2 text-orange-400 hover:text-orange-300 inline-flex items-center gap-0.5 text-xs">
                  Générer <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="password"
                value={creds.appPassword}
                onChange={(e) => setCreds({ ...creds, appPassword: e.target.value })}
                placeholder="xxxx xxxx xxxx xxxx"
                required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                style={{ background: "hsl(20 10% 12%)", border: "1px solid hsl(20 10% 28%)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nombre d'emails à analyser: <span className="text-orange-400">{maxEmails}</span>
              </label>
              <input type="range" min={10} max={100} step={10} value={maxEmails}
                onChange={(e) => setMaxEmails(Number(e.target.value))}
                className="w-full accent-orange-500" />
            </div>
            <button type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, hsl(25 85% 52%), hsl(20 90% 40%))" }}>
              <Mail className="w-4 h-4" />
              Scanner mes emails
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Vos identifiants sont utilisés uniquement pour lire vos emails. Ils ne sont pas stockés sur nos serveurs.
          </p>
        </div>
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "hsl(25 85% 52%)" }} />
          <h3 className="text-white font-semibold text-lg mb-1">Analyse en cours...</h3>
          <p className="text-gray-400 text-sm">Scan de {maxEmails} emails dans {creds.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emails</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {scanResult?.total_scanned} emails analysés — {scanResult?.appointments_found} rendez-vous détectés
          </p>
        </div>
        <button onClick={handleRescan}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
          style={{ background: "hsl(20 10% 18%)", border: "1px solid hsl(20 10% 25%)" }}>
          <RefreshCw className="w-4 h-4" />
          Rescanner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Emails scannés", value: scanResult?.total_scanned ?? 0, color: "hsl(220 80% 60%)" },
          { label: "Rendez-vous", value: scanResult?.appointments_found ?? 0, color: "hsl(25 85% 52%)" },
          { label: "Compte Gmail", value: creds.email.split("@")[0], color: "hsl(140 60% 50%)" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background: "hsl(20 10% 18%)", border: "1px solid hsl(20 10% 25%)" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "hsl(20 10% 18%)" }}>
        {(["appointments", "all"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab
              ? { background: "hsl(25 85% 52%)", color: "white" }
              : { color: "hsl(20 5% 60%)" }}>
            {tab === "appointments" ? `📅 Rendez-vous (${scanResult?.appointments_found ?? 0})` : `📧 Tous (${scanResult?.total_scanned ?? 0})`}
          </button>
        ))}
      </div>

      {/* Email List */}
      <div className="space-y-3">
        {displayedEmails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun email trouvé dans cette catégorie</p>
          </div>
        ) : (
          displayedEmails.map((email) => {
            const isExpanded = expandedId === email.id;
            const emailSuggestions = suggestions[email.id];

            return (
              <div key={email.id} className="rounded-2xl overflow-hidden transition-all"
                style={{ background: "hsl(20 10% 18%)", border: `1px solid ${email.is_appointment ? "hsl(25 85% 40%)" : "hsl(20 10% 25%)"}` }}>
                {/* Email Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                      style={{ background: email.is_appointment ? "hsl(25 85% 45%)" : "hsl(20 10% 28%)" }}>
                      {getInitials(email.sender.name || email.sender.address || "?")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-sm truncate">{email.subject}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {email.sender.name || email.sender.address} · {formatDate(email.received_at)}
                          </p>
                        </div>
                        {email.is_appointment && (
                          <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: "hsl(25 85% 25%)", color: "hsl(25 85% 70%)" }}>
                            📅 RDV
                          </span>
                        )}
                      </div>

                      <p className="text-gray-400 text-xs mt-2 line-clamp-2">{email.preview}</p>

                      {/* Appointment Details */}
                      {email.is_appointment && email.appointment && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {email.appointment.date && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "hsl(20 10% 25%)", color: "hsl(25 85% 65%)" }}>
                              📅 {email.appointment.date}
                            </span>
                          )}
                          {email.appointment.time && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "hsl(20 10% 25%)", color: "hsl(200 80% 65%)" }}>
                              🕐 {email.appointment.time}
                            </span>
                          )}
                          {email.appointment.location && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "hsl(20 10% 25%)", color: "hsl(140 60% 60%)" }}>
                              📍 {email.appointment.location}
                            </span>
                          )}
                          {email.appointment.confidence && (
                            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "hsl(20 10% 25%)", color: "hsl(60 80% 60%)" }}>
                              ✨ {Math.round(email.appointment.confidence * 100)}% confiance
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {email.is_appointment && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleAddToCalendar(email)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                        style={{
                          background: addedCalendar.has(email.id) ? "hsl(140 60% 20%)" : "linear-gradient(135deg, hsl(25 85% 52%), hsl(20 90% 40%))",
                          color: addedCalendar.has(email.id) ? "hsl(140 60% 60%)" : "white",
                        }}>
                        {addedCalendar.has(email.id)
                          ? <><CheckCircle2 className="w-4 h-4" /> Ajouté au calendrier</>
                          : <><Calendar className="w-4 h-4" /> Ajouter au calendrier</>}
                      </button>

                      <button onClick={() => handleGetSuggestions(email)}
                        disabled={loadingSuggest === email.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "hsl(20 10% 25%)", color: "hsl(25 85% 65%)" }}>
                        {loadingSuggest === email.id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                          : <><Sparkles className="w-4 h-4" /> Répondre avec IA</>}
                      </button>

                      <button onClick={() => setExpandedId(isExpanded ? null : email.id)}
                        className="px-3 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
                        style={{ background: "hsl(20 10% 25%)" }}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Reply Suggestions Panel */}
                {isExpanded && emailSuggestions && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: "hsl(20 10% 25%)" }}>
                    <p className="text-sm font-semibold text-gray-300 mt-4 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: "hsl(25 85% 52%)" }} />
                      Réponses générées par IA
                    </p>
                    <div className="space-y-3">
                      {emailSuggestions.map((variant, idx) => {
                        const copyKey = `${email.id}-${idx}`;
                        return (
                          <div key={idx} className="rounded-xl p-4" style={{ background: "hsl(20 10% 14%)", border: "1px solid hsl(20 10% 22%)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full"
                                style={{ background: "hsl(25 85% 20%)", color: "hsl(25 85% 65%)" }}>
                                {variant.style}
                              </span>
                              <div className="flex gap-2">
                                <button onClick={() => handleCopy(`Objet: ${variant.subject}\n\n${variant.body}`, copyKey)}
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg"
                                  style={{ background: "hsl(20 10% 20%)" }}>
                                  {copiedVariant === copyKey
                                    ? <><CheckCircle2 className="w-3 h-3 text-green-400" /> Copié</>
                                    : <><Copy className="w-3 h-3" /> Copier</>}
                                </button>
                                <a href={`mailto:${email.sender.address}?subject=${encodeURIComponent(variant.subject)}&body=${encodeURIComponent(variant.body)}`}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:opacity-90"
                                  style={{ background: "hsl(25 85% 40%)", color: "white" }}>
                                  <Send className="w-3 h-3" /> Envoyer
                                </a>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">Objet: {variant.subject}</p>
                            <p className="text-sm text-gray-300 whitespace-pre-line">{variant.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
