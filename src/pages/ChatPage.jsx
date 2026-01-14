import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ENDPOINTS, ASSETS, ROUTES, STORAGE_KEYS } from "../lib/config";
import { httpForm, httpJson } from "../lib/api";
import { getParticipantId, getUserEmail, setParticipantId as setParticipantStorage } from "../lib/session";

const typingText = "…";

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const isStandalone = location.pathname === ROUTES.CHAT_PAGE;

  const [participantId, setParticipantId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Prêt");
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const historyKey = useMemo(() => {
    if (!participantId) return null;
    return `${STORAGE_KEYS.CHAT_HISTORY_PREFIX_LEGACY}${participantId}`;
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
    document.documentElement.style.setProperty("--chat-bg", `url("${ASSETS.BG_CHAT}")`);
    return () => {
      document.body.classList.remove("chat-standalone");
    };
  }, [isStandalone]);

  useEffect(() => {
    if (!historyKey || !participantId) return;
    const raw = localStorage.getItem(historyKey);
    const parsed = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(parsed) ? parsed : [];

    if (next.length === 0) {
      next.push({
        role: "bot",
        text: "Bonjour. Je suis votre patient virtuel. Quelle est votre principale raison de consultation aujourd’hui ?",
        ts: new Date().toISOString(),
      });
    }

    setMessages(next);
  }, [historyKey, participantId]);

  useEffect(() => {
    if (!historyKey) return;
    localStorage.setItem(historyKey, JSON.stringify(messages));
  }, [messages, historyKey]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!participantId) return;

    const text = inputValue.trim();
    if (!text) return;

    setSending(true);
    setStatus("Envoi…");
    setInputValue("");

    addMessage("user", text);

    const typingId = new Date().toISOString();
    setMessages((prev) => [...prev, { role: "bot", text: typingText, ts: typingId }]);

    try {
      const data = await httpJson(API_ENDPOINTS.CHAT, {
        method: "POST",
        body: { message: text, userId: participantId },
      });

      updateMessage(typingId, data.reply || "Erreur: réponse vide.");
      setStatus("Prêt");
    } catch (err) {
      updateMessage(typingId, "Erreur: serveur inaccessible.");
      addMessage("system", String(err));
      setStatus("Erreur");
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleClear = () => {
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

            <main className="chat-messages" id="chat-messages" aria-live="polite" ref={messagesRef}>
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
            </footer>
          </section>
        </div>
      </div>
    </>
  );
}
