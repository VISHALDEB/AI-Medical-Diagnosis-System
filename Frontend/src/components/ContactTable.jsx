import { useEffect, useState } from "react";
import {
  BsTrash,
  BsEnvelope,
  BsClock,
  BsPersonCircle,
  BsReplyFill,
  BsTrash3,
} from "react-icons/bs";

function ContactTable({ isDark }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:5001/admin/messages", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await response.json();
      if (response.ok) setMessages(data);
    } catch (err) {
      console.error("Error fetching messages");
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Delete this inquiry permanently?")) return;
    try {
      const response = await fetch(
        `http://localhost:5001/admin/messages/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (response.ok) setMessages(messages.filter((m) => m.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <div className="p-8 pt-16">
      {/* HEADER SECTION - Matches Reports Page */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500">
            <BsEnvelope size={28} />
          </div>
          <h2 className="text-3xl font-bold dark:text-white text-slate-800 tracking-tight">
            User Inquiries
          </h2>
        </div>
        <div className="px-5 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 font-bold text-sm">
          {messages.length} Messages
        </div>
      </div>

      {/* CARD LIST SECTION - Matches Reports Item Style */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="group flex flex-col md:flex-row items-center justify-between p-6 bg-white/5 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-xl"
          >
            <div className="flex items-center gap-6 w-full">
              {/* Avatar - Matches Reports Icon Style */}
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <BsPersonCircle size={28} />
              </div>

              <div className="flex-1">
                <h4 className="text-xl font-bold dark:text-white text-slate-800">
                  {msg.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                  <span className="text-cyan-500 font-medium">
                    {msg.email}
                  </span>
                </div>
                <p className="mt-3 text-slate-600 dark:text-slate-400 italic text-sm line-clamp-1 group-hover:line-clamp-none transition-all">
                  "{msg.message}"
                </p>
              </div>
            </div>

            {/* Actions - Matches Reports Button Layout */}
            <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto">
              <button
                onClick={() => (window.location.href = `mailto:${msg.email}`)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-cyan-500 hover:text-white transition-all font-bold text-sm"
              >
                <BsReplyFill size={18} />
                Reply
              </button>

              <button
                onClick={() => deleteMessage(msg.id)}
                className="p-3.5 rounded-2xl bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 hover:border-red-500/50 transition-all"
              >
                <BsTrash3 size={18} />
              </button>
            </div>
          </div>
        ))}

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <BsEnvelope size={48} className="opacity-20 mb-4" />
            <p className="italic">No messages in your inbox.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactTable;
