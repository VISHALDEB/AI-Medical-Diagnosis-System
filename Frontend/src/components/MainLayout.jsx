import React from "react";
import Header  from "../components/Header";
import Sidebar from "../components/Sidebar";

const lightBg = {
  background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)",
  backgroundAttachment: "fixed",
};

const darkBg = {
  background: "linear-gradient(135deg, #0d1117 0%, #0f0c29 40%, #1a0533 70%, #0d1117 100%)",
  backgroundAttachment: "fixed",
};

export default function MainLayout({
  children,
  user,
  activeView,
  setActiveView,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  darkMode,
  toggleTheme,
  language,
  setLanguage,
}) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("profile_data");
    window.location.href = "/login";
  };

  const isFullBleed = [
    "dashboard", "patient-dashboard", "upload", "reports",
    "history", "appointments", "profile", "report-details", "admin-inbox"
  ].includes(activeView);

  return (
    <div className="flex h-screen overflow-hidden relative">

      {/* ✅ MOBILE OVERLAY — tap outside sidebar to close */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ✅ SIDEBAR — drawer on mobile, fixed on desktop */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          w-64 shrink-0 h-full
        `}
      >
        <Sidebar
          user={user}
          activeView={activeView}
          setActiveView={(view) => {
            setActiveView(view);
            setIsMobileMenuOpen(false); // ✅ Close on nav
          }}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          onLogout={handleLogout}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 overflow-hidden">
        <Header
          isDarkMode={darkMode}
          toggleDarkMode={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          onMenuClick={() => setIsMobileMenuOpen(prev => !prev)}
          onLogout={handleLogout}
        />

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-500 ${
            isFullBleed ? "p-0" : "p-4 md:p-6"
          } ${darkMode ? "text-white" : "text-slate-900"}`}
          style={darkMode ? darkBg : lightBg}
        >
          <div className="w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}