import React, { useState, useEffect, useRef } from "react";
import { FiX, FiMic, FiSend, FiMessageSquare } from "react-icons/fi";
import { BsRobot } from "react-icons/bs";
import { RiMicFill, RiMicOffFill } from "react-icons/ri";

const ChatbotWidget = ({ language }) => {
  // ✅ 1. Dynamically calculate initial message based on language prop
  const getInitialMessage = (lang) => {
    if (lang === "hi")
      return "नमस्ते 👋 मैं MediScan AI हूँ। आपकी कैसे मदद करूँ?";
    if (lang === "bn")
      return "হ্যালো 👋 আমি MediScan AI। আমি কীভাবে সাহায্য করতে পারি?";
    return "Hello 👋 I'm MediScan AI. How can I assist you today?";
  };

  const [messages, setMessages] = useState([
    { sender: "bot", text: getInitialMessage(language) },
  ]);

  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null); // ✅ 2. Ref to handle Speech Recognition safely

  // Update initial greeting if language changes and it's the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === "bot") {
      setMessages([{ sender: "bot", text: getInitialMessage(language) }]);
    }
  }, [language]);

  // Watch for dark/light mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Stop speech and voice recognition on unmount/refresh
  useEffect(() => {
    const stopAllMedia = () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    window.addEventListener("beforeunload", stopAllMedia);
    return () => {
      stopAllMedia();
      window.removeEventListener("beforeunload", stopAllMedia);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ✅ 3. CYAN THEME BACKGROUNDS & BUBBLES
  const darkBg = {
    background:
      "linear-gradient(135deg, #091115 0%, #051c24 50%, #022a35 100%)",
  };
  const lightBg = {
    background:
      "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
  };

  const botBubbleStyle = isDark
    ? {
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(6,182,212,0.15)",
        color: "#e2e8f0",
      }
    : {
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(6,182,212,0.2)",
        color: "#083344",
        boxShadow: "0 2px 12px rgba(6,182,212,0.06)",
      };

  const typingBubbleStyle = isDark
    ? {
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(6,182,212,0.15)",
      }
    : {
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(6,182,212,0.2)",
      };

  const inputWrapperStyle = isDark
    ? {
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(6,182,212,0.15)",
        backdropFilter: "blur(10px)",
      }
    : {
        background: "rgba(255,255,255,0.9)",
        borderColor: "rgba(6,182,212,0.25)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 2px 12px rgba(6,182,212,0.06)",
      };

  const inputAreaBg = isDark
    ? { background: "rgba(0,0,0,0.4)" }
    : { background: "rgba(207,250,254,0.5)" };
  const quickChipsBg = isDark
    ? { background: "rgba(255,255,255,0.01)" }
    : { background: "rgba(236,254,255,0.8)" };

  // 🔊 TEXT TO SPEECH
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // 🎤 SAFE VOICE INPUT
  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser");
      return;
    }

    if (listening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang =
      language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-US";

    setListening(true);
    recognition.start();

    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  // 📩 SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, language }),
      });

      const data = await res.json();
      setIsTyping(false);
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
      speak(data.reply);
    } catch {
      setIsTyping(false);
      const errMsg =
        language === "hi"
          ? "सर्वर त्रुटि। कृपया पुनः प्रयास करें।"
          : language === "bn"
            ? "সার্ভার ত্রুটি। আবার চেষ্টা করুন।"
            : "Server error. Please try again.";
      setMessages((prev) => [...prev, { sender: "bot", text: errMsg }]);
    }
  };

  // 🛡️ SAFE LOCAL STORAGE PARSING FOR USER AVATAR
  const getUserInitial = () => {
    try {
      const storedName = localStorage.getItem("userName");
      if (storedName) return storedName.charAt(0).toUpperCase();

      const profileData = localStorage.getItem("profile_data");
      if (profileData) {
        const parsed = JSON.parse(profileData);
        if (parsed?.name) return parsed.name.charAt(0).toUpperCase();
      }
    } catch (e) {
      console.error("Failed to parse user profile initial", e);
    }
    return "?";
  };

  const quickChips = [
    language === "hi"
      ? "लक्षण क्या हैं?"
      : language === "bn"
        ? "উপসর্গ কী?"
        : "What are symptoms?",
    language === "hi"
      ? "अपॉइंटमेंट"
      : language === "bn"
        ? "অ্যাপয়েন্টমেন্ট"
        : "Book appointment",
    language === "hi"
      ? "रिपोर्ट देखें"
      : language === "bn"
        ? "রিপোর্ট দেখুন"
        : "View reports",
    language === "hi" ? "मदद" : language === "bn" ? "সাহায্য" : "Help",
  ];

  // ── FLOATING BUTTON ──
  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 z-50 group"
      >
        <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl scale-150 group-hover:scale-[1.9] transition-all duration-700 animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-linear-to-br from-cyan-400 via-cyan-600 to-teal-700 flex items-center justify-center shadow-[0_8px_30px_rgba(6,182,212,0.5)] border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rounded-3xl active:scale-95">
          <FiMessageSquare size={24} className="text-white" />
        </div>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl overflow-hidden border shadow-[0_30px_80px_rgba(0,0,0,0.35),0_0_0_1px_rgba(6,182,212,0.15)] transition-all duration-500"
      style={{
        width: "370px",
        height: "560px",
        ...(isDark ? darkBg : lightBg),
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(6,182,212,0.2)",
      }}
    >
      {/* ── HEADER ── */}
      <div className="relative shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-cyan-500 via-cyan-600 to-teal-700 opacity-95" />
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-6 left-8 w-20 h-20 bg-cyan-300/15 rounded-full blur-xl" />

        <div className="relative px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm tracking-wide bg-linear-to-r from-gray-100 via-white to-gray-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
              MediScan AI
            </p>
            <p className="text-white/70 text-[11px] font-medium tracking-wider uppercase mt-0.5">
              Your Personal Assistant
            </p>
          </div>

          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setShowChat(false);
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all duration-200 active:scale-90"
          >
            <FiX size={15} />
          </button>
        </div>
        <div className="relative h-px bg-linear-to-r from-transparent via-cyan-300/40 to-transparent" />
      </div>

      {/* ── MESSAGES ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(6,182,212,0.3) transparent",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-xl bg-linear-to-br from-cyan-400 via-cyan-600 to-teal-700 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(6,182,212,0.4)] border border-cyan-300/20">
                <BsRobot size={13} className="text-white" />
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[76%]">
              <p
                className={`text-[10px] font-semibold tracking-wider uppercase px-1
                ${
                  msg.sender === "user"
                    ? "text-right text-cyan-600 dark:text-cyan-400"
                    : "text-left text-cyan-500/80 dark:text-slate-500"
                }`}
              >
                {msg.sender === "user"
                  ? language === "hi"
                    ? "आप"
                    : language === "bn"
                      ? "আপনি"
                      : "You"
                  : "MediScan AI"}
              </p>

              <div
                className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl
                  ${
                    msg.sender === "user"
                      ? "bg-linear-to-br from-cyan-500 via-cyan-600 to-teal-700 text-white rounded-br-sm shadow-[0_4px_16px_rgba(6,182,212,0.3)] border border-cyan-400/20"
                      : "rounded-bl-sm"
                  }`}
                style={msg.sender === "bot" ? botBubbleStyle : {}}
              >
                {msg.text}
              </div>
            </div>

            {msg.sender === "user" && (
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm border
                ${isDark ? "bg-linear-to-br from-slate-700 to-slate-800 border-slate-600/50" : "bg-linear-to-br from-cyan-50 to-cyan-100 border-cyan-200/60"}`}
              >
                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400">
                  {getUserInitial()}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-7 h-7 rounded-xl bg-linear-to-br from-cyan-400 via-cyan-600 to-teal-700 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(6,182,212,0.4)] border border-cyan-300/20">
              <BsRobot size={13} className="text-white" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
              style={typingBubbleStyle}
            >
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── QUICK CHIPS ── */}
      <div
        className="shrink-0 px-3 py-2 flex gap-2 overflow-x-auto border-t transition-all duration-500 style-none"
        style={{
          ...quickChipsBg,
          borderColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(6,182,212,0.1)",
          scrollbarWidth: "none",
        }}
      >
        {quickChips.map((chip) => (
          <button
            key={chip}
            onClick={() => setInput(chip)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 border"
            style={{
              color: isDark ? "#22d3ee" : "#0e7490",
              background: isDark
                ? "rgba(6,182,212,0.1)"
                : "rgba(6,182,212,0.06)",
              borderColor: isDark
                ? "rgba(6,182,212,0.2)"
                : "rgba(6,182,212,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(6,182,212,0.2)"
                : "rgba(6,182,212,0.15)";
              e.currentTarget.style.borderColor = "rgba(6,182,212,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark
                ? "rgba(6,182,212,0.1)"
                : "rgba(6,182,212,0.06)";
              e.currentTarget.style.borderColor = isDark
                ? "rgba(6,182,212,0.2)"
                : "rgba(6,182,212,0.2)";
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* ── INPUT AREA ── */}
      <div
        className="shrink-0 px-3 pb-4 pt-2 transition-all duration-500"
        style={inputAreaBg}
      >
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all duration-300"
          style={inputWrapperStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(6,182,212,0.6)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(6,182,212,0.2)";
            e.currentTarget.style.boxShadow = isDark
              ? "none"
              : "0 2px 12px rgba(6,182,212,0.06)";
          }}
        >
          <input
            type="text"
            className={`flex-1 bg-transparent text-sm outline-none py-1.5 ${isDark ? "text-white placeholder-slate-500" : "text-cyan-950 placeholder-cyan-300"}`}
            placeholder={
              language === "hi"
                ? "कुछ पूछें..."
                : language === "bn"
                  ? "কিছু জিজ্ঞাসা করুন..."
                  : "Ask me anything..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />

          {/* Mic */}
          <button
            onClick={startListening}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 border
              ${
                listening
                  ? "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse"
                  : isDark
                    ? "bg-white/5 border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                    : "bg-cyan-50 border-cyan-200 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-100 hover:border-cyan-400"
              }`}
          >
            {listening ? <RiMicFill size={15} /> : <RiMicOffFill size={15} />}
          </button>

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: input.trim()
                ? "linear-gradient(135deg, #06b6d4, #0891b2, #0f766e)"
                : isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(6,182,212,0.1)",
              boxShadow: input.trim()
                ? "0 4px 16px rgba(6,182,212,0.4)"
                : "none",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <FiSend
              size={15}
              className={
                input.trim()
                  ? "text-white"
                  : isDark
                    ? "text-slate-500"
                    : "text-cyan-300"
              }
            />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <div
            className={`h-px flex-1 ${isDark ? "bg-linear-to-r from-transparent to-white/10" : "bg-linear-to-r from-transparent to-cyan-200/50"}`}
          />
          <p
            className={`text-[10px] font-medium text-center ${isDark ? "text-slate-600" : "text-cyan-600/80"}`}
          >
            MediScan AI can make mistakes. Double-check responses.
          </p>
          <div
            className={`h-px flex-1 ${isDark ? "bg-linear-to-l from-transparent to-white/10" : "bg-linear-to-l from-transparent to-cyan-200/50"}`}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;
