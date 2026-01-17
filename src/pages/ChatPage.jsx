import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, BACKEND_URL, DEBUG, ROUTES, STORAGE_KEYS } from "../lib/config";
import { httpForm, httpJson } from "../lib/api";
import { getParticipantId, getUserEmail, setParticipantId as setParticipantStorage } from "../lib/session";
import TypingIndicator from "../components/TypingIndicator";

const TYPING_INTERVAL = 32;
const TYPING_CHUNK_SIZE = 2;
const SCROLL_THRESHOLD = 24;
const ANXIETY_QUESTION = "Quel est ton niveau d’anxiété sur 10 ?";
const buildSessionId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
};

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingIntervalRef = useRef(null);
  const typingMessageIdRef = useRef(null);
  const typingFullTextRef = useRef("");
  const userAtBottomRef = useRef(true);
  const hasSentAnxietyRef = useRef(false);
  const isStandalone = location.pathname === ROUTES.CHAT_PAGE;

  const [participantId, setParticipantId] = useState(null);
  const [sessionId, setSessionId] = useState(() => buildSessionId());
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Prêt");
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState("");
  const [endNotice, setEndNotice] = useState("");
  const [anxietyStep, setAnxietyStep] = useState("intro");
  const [anxietyInput, setAnxietyInput] = useState("");
  const [anxietyValue, setAnxietyValue] = useState(null);
  const [anxietyError, setAnxietyError] = useState("");

  const userEmail = getUserEmail();

  const buildInitialMessages = () => [
    {
      role: "bot",
      text: "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?",
      ts: new Date().toISOString(),
    },
  ];

  const historyKey = useMemo(() => {
    if (!participantId) return null;
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX_LEGACY}${participantId}`;
  }, [participantId]);

  const sessionKey = useMemo(() => {
    if (!participantId) return null;
    return `${STORAGE_KEYS.CHAT_SESSION_PREFIX}${participantId}`;
  }, [participantId]);

  const anxietyKey = useMemo(() => {
    if (!participantId) return null;
    return `${STORAGE_KEYS.CHAT_ANXIETY_PREFIX}${participantId}`;
  }, [participantId]);

  useEffect(() => {
    const storedId = getParticipantId();
    const fallbackId = getUserEmail();
    const nextId = storedId || fallbackId;
    if (!nextId) {
      navigate(ROUTES.LOGIN_PAGE, { replace: true });
      return;
    }

    setParticipantStorage(nextId);
    setParticipantId(nextId);
  }, [navigate]);

  useEffect(() => {
    if (!isStandalone) return;
    document.body.classList.add("chat-standalone");
    document.body.classList.add("bg-app");
    document.body.classList.remove("bg-auth");
    return () => {
      document.body.classList.remove("chat-standalone");
      document.body.classList.remove("bg-app");
    };
  }, [isStandalone]);

  useEffect(() => {
    if (isStandalone) return;
    document.body.classList.add("bg-app");
    document.body.classList.remove("bg-auth");
    return () => {
      document.body.classList.remove("bg-app");
    };
  }, [isStandalone]);

  useEffect(() => {
    if (!historyKey || !participantId) return;
    const raw = localStorage.getItem(historyKey);
    const parsed = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(parsed) ? parsed : [];

    if (next.length === 0) {
      next.push(...buildInitialMessages());
    }

    setMessages(next);
  }, [historyKey, participantId]);

  useEffect(() => {
    if (!anxietyKey) return;
    const stored = localStorage.getItem(anxietyKey);
    const parsed = stored === null ? null : Number(stored);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 10) {
      setAnxietyValue(parsed);
      setAnxietyStep("chat");
      return;
    }
    setAnxietyStep("intro");
  }, [anxietyKey]);

  useEffect(() => {
    if (!sessionKey) return;
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      setSessionId(stored);
    } else {
      const fresh = buildSessionId();
      localStorage.setItem(sessionKey, fresh);
      setSessionId(fresh);
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!historyKey) return;
    localStorage.setItem(historyKey, JSON.stringify(messages));
  }, [messages, historyKey]);

  useEffect(() => {
    if (!messagesRef.current) return;
    if (userAtBottomRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const addMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      { role, text: String(text ?? ""), ts: new Date().toISOString() },
    ]);
  };

  const updateMessage = (id, text) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.ts === id ? { ...msg, text: String(text ?? "") } : msg))
    );
  };

  const finalizeTyping = () => {
    if (!typingMessageIdRef.current) return;
    const finalText = typingFullTextRef.current;
    updateMessage(typingMessageIdRef.current, finalText);
    typingMessageIdRef.current = null;
    typingFullTextRef.current = "";
    setIsTyping(false);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const startTyping = (text) => {
    const fullText = String(text ?? "");
    const typingId = new Date().toISOString();
    typingMessageIdRef.current = typingId;
    typingFullTextRef.current = fullText;
    setIsTyping(true);
    setMessages((prev) => [...prev, { role: "bot", text: "", ts: typingId }]);
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    let index = 0;
    const step = () => {
      index = Math.min(fullText.length, index + TYPING_CHUNK_SIZE);
      updateMessage(typingId, fullText.slice(0, index));
      if (messagesRef.current && userAtBottomRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
      if (index >= fullText.length) {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        typingMessageIdRef.current = null;
        typingFullTextRef.current = "";
        setIsTyping(false);
      }
    };
    step();
    typingIntervalRef.current = setInterval(step, TYPING_INTERVAL);
  };

  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    userAtBottomRef.current = scrollHeight - scrollTop - clientHeight <= SCROLL_THRESHOLD;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!participantId) return;

    const text = inputValue.trim();
    if (!text) return;

    finalizeTyping();
    setSending(true);
    setStatus("Envoi…");
    setIsThinking(true);
    setInputValue("");

    addMessage("user", text);

    const isFirstUserMessage = !messages.some((message) => message.role === "user");
    const shouldSendAnxiety = isFirstUserMessage && !hasSentAnxietyRef.current && anxietyValue !== null;
    if (shouldSendAnxiety) {
      hasSentAnxietyRef.current = true;
    }

    try {
      const data = await httpJson(API_ENDPOINTS.CHAT, {
        method: "POST",
        body: {
          message: text,
          userId: participantId,
          ...(shouldSendAnxiety ? { anxiety_level: anxietyValue } : {}),
        },
      });
      setIsThinking(false);
      startTyping(data.reply || "Erreur: réponse vide.");
      setStatus("Prêt");
    } catch (err) {
      setIsThinking(false);
      startTyping("Erreur: serveur inaccessible.");
      addMessage("system", String(err));
      setStatus("Erreur");
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const buildChatLogs = (items) =>
    items
      .filter((message) => message.text)
      .map((message) => ({
        user_email: userEmail,
        session_id: sessionId,
        message: JSON.stringify({ role: message.role, text: message.text }),
        created_at: message.ts || new Date().toISOString(),
      }));

  const handleEndDiscussion = async () => {
    setEndError("");
    setEndNotice("");

    if (DEBUG) {
      console.warn("[DEBUG] close discussion config", {
        hasWindowConfig: typeof window !== "undefined" && Boolean(window.CONFIG),
        backendUrl: BACKEND_URL || "missing",
      });
    }

    if (!userEmail) {
      setEndError("Impossible de récupérer l’email utilisateur.");
      return;
    }

    if (!sessionId) {
      setEndError("Session de discussion introuvable.");
      return;
    }

    const logs = buildChatLogs(messages);

    if (logs.length === 0) {
      setEndError("Aucun message à sauvegarder.");
      return;
    }

    if (!BACKEND_URL) {
      setEndError("Configuration backend manquante.");
      return;
    }

    try {
      setEnding(true);
      const res = await fetch(API_ENDPOINTS.CHAT_END, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: participantId || userEmail,
          conversation_id: sessionId,
          logs,
          meta: {
            user_email: userEmail,
            message_count: logs.length,
          },
        }),
      });

      if (DEBUG) {
        console.warn("[DEBUG] close discussion status", res.status);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erreur backend.");
      }

      const freshSession = buildSessionId();
      setSessionId(freshSession);
      if (sessionKey) {
        localStorage.setItem(sessionKey, freshSession);
      }
      setMessages(buildInitialMessages());
      hasSentAnxietyRef.current = false;
      setStatus("Prêt");
      setEndNotice("Discussion sauvegardée et réinitialisée.");
    } catch (err) {
      console.error("[DEBUG] close discussion error", err);
      setEndError(`Erreur lors de la sauvegarde: ${err.message || err}`);
    } finally {
      setEnding(false);
    }
  };

  const handleClear = () => {
    finalizeTyping();
    setIsThinking(false);
    setMessages([
      {
        role: "bot",
        text: "Conversation effacée. Recommencez quand vous voulez.",
        ts: new Date().toISOString(),
      },
    ]);
    setStatus("Prêt");
  };

  const handleChangeId = () => {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ID);
    if (anxietyKey) {
      localStorage.removeItem(anxietyKey);
    }
    navigate(ROUTES.LOGIN_PAGE, { replace: true });
  };

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setStatus("Caméra…");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;

      const mimeCandidates = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let mimeType = "";
      for (const candidate of mimeCandidates) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }

      chunksRef.current = [];
      recorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorderRef.current.onstart = () => {
        setCameraActive(true);
        setStatus("Enregistrement");
        addMessage("system", "Caméra activée (sans audio).");
      };

      recorderRef.current.onstop = async () => {
        try {
          setStatus("Upload…");

          const blob = new Blob(chunksRef.current, {
            type: recorderRef.current?.mimeType || "video/webm",
          });
          const file = new File([blob], "recording.webm", { type: blob.type });

          const formData = new FormData();
          formData.append("userId", participantId);
          formData.append("video", file);

          const data = await httpForm(API_ENDPOINTS.UPLOAD, {
            method: "POST",
            body: formData,
          });

          if (!data?.ok) {
            setStatus("Erreur upload");
            addMessage("system", "Vidéo: erreur d’envoi. Mode texte disponible.");
          } else {
            setStatus("Upload OK");
            addMessage("system", `Vidéo envoyée. Path: ${data.path}`);
          }
        } catch {
          setStatus("Erreur upload");
          addMessage("system", "Vidéo: erreur d’envoi. Mode texte disponible.");
        } finally {
          setCameraActive(false);
          stopTracks();
          recorderRef.current = null;
          chunksRef.current = [];
          setTimeout(() => setStatus("Prêt"), 1000);
        }
      };

      recorderRef.current.start(1000);
    } catch {
      setStatus("Caméra refusée");
      addMessage("system", "Caméra refusée. Mode texte seulement.");
      setCameraActive(false);
      stopTracks();
    }
  };

  const stopCamera = () => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      setStatus("Erreur caméra");
      addMessage("system", "Erreur caméra. Mode texte seulement.");
      setCameraActive(false);
      stopTracks();
    }
  };

  const parseAnxietyValue = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return null;
    if (parsed < 0 || parsed > 10) return null;
    return parsed;
  };

  const handleStart = () => {
    setAnxietyError("");
    setAnxietyStep("question");
  };

  const handleAnxietySubmit = (event) => {
    event.preventDefault();
    const parsed = parseAnxietyValue(anxietyInput);
    if (parsed === null) {
      setAnxietyError("Veuillez entrer un nombre entier entre 0 et 10.");
      return;
    }
    setAnxietyError("");
    setAnxietyValue(parsed);
    if (anxietyKey) {
      localStorage.setItem(anxietyKey, String(parsed));
    }
    setAnxietyStep("chat");
  };

  if (anxietyStep !== "chat") {
    return (
      <div className="chat-page">
        {isStandalone ? <div className="chat-standalone-overlay" aria-hidden="true"></div> : null}
        <div className="chat-card">
          <section className="chat" id="chat-screen" style={{ textAlign: "center" }}>
            <h1 style={{ marginBottom: "16px" }}>Démarrer</h1>
            {anxietyStep === "intro" ? (
              <button className="btn btn-primary" type="button" onClick={handleStart}>
                Démarrer
              </button>
            ) : (
              <form onSubmit={handleAnxietySubmit}>
                <p style={{ marginBottom: "12px" }}>{ANXIETY_QUESTION}</p>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  required
                  className="chat-input"
                  value={anxietyInput}
                  onChange={(event) => {
                    setAnxietyInput(event.target.value);
                    if (anxietyError) setAnxietyError("");
                  }}
                  style={{ maxWidth: "160px", margin: "0 auto 12px" }}
                />
                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  <button className="btn btn-primary" type="submit">
                    Continuer
                  </button>
                </div>
                {anxietyError ? <p className="status-text error">{anxietyError}</p> : null}
              </form>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="chat-page">
        {isStandalone ? <div className="chat-standalone-overlay" aria-hidden="true"></div> : null}
        <div className="chat-card">
          <section className="chat" id="chat-screen">
            <header className="chat-header">
              <div className="chat-header__left">
                <div className="chat-title">
                  <div className="chat-title__main">Patient virtuel</div>
                  <div className="chat-title__sub" id="participant-pill">
                    Participant: {participantId || "—"}
                  </div>
                </div>
              </div>

              <div className="chat-header__right" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button className="btn btn-ghost" id="cam-start" type="button" onClick={startCamera}>
                  Démarrer vidéo
                </button>
                <button
                  className="btn btn-ghost"
                  id="cam-stop"
                  type="button"
                  disabled={!cameraActive}
                  onClick={stopCamera}
                >
                  Arrêter & envoyer
                </button>
                <div className="pill" id="status-pill">
                  {status}
                </div>
              </div>
            </header>

            <main
              className="chat-messages"
              id="chat-messages"
              aria-live="polite"
              ref={messagesRef}
              onScroll={handleScroll}
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.ts}-${index}`}
                  className={`message ${
                    message.role === "user"
                      ? "user-message"
                      : message.role === "bot"
                      ? "bot-message"
                      : "system-message"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {isThinking && !isTyping ? (
                <div className="message bot-message typing-message">
                  <TypingIndicator />
                </div>
              ) : null}
            </main>

            <form className="chat-input-area" id="chat-form" action="javascript:void(0);" onSubmit={handleSubmit}>
              <input
                type="text"
                className="chat-input"
                id="chat-input"
                placeholder="Écrivez votre message…"
                autoComplete="off"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                disabled={sending}
                ref={inputRef}
              />
              <button type="submit" className="btn btn-primary" id="send-button" disabled={sending}>
                Envoyer
              </button>
            </form>

            <footer className="chat-footer">
              <button className="btn btn-ghost" id="clear-chat" type="button" onClick={handleClear}>
                Effacer la conversation
              </button>
              <button className="btn btn-ghost" id="change-id" type="button" onClick={handleChangeId}>
                Changer d’identifiant
              </button>
              <button
                className="btn btn-secondary"
                id="close-session"
                type="button"
                onClick={handleEndDiscussion}
                disabled={ending}
              >
                Fermer la discussion
              </button>
            </footer>
            {endError ? <p className="status-text error">{endError}</p> : null}
            {endNotice ? <p className="status-text success">{endNotice}</p> : null}
          </section>
        </div>
      </div>
    </>
  );
}
