import { useEffect, useState } from "react";
import AppRouter from "./AppRouter";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [language, setLanguage] = useState("en");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Note: These will eventually be updated via the /profile backend route
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@gmail.com",
    phone: "+91 98765 43210",
    avatar: null,
  });

const [reports, setReports] = useState([]);

  const [appointments, setAppointments] = useState([]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <AppRouter
      user={user}
      setUser={setUser}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      language={language}
      setLanguage={setLanguage}
      reports={reports}
      appointments={appointments}
      setAppointments={setAppointments}
      selectedReport={selectedReport}
      setSelectedReport={setSelectedReport}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
    />
  );
}

export default App;