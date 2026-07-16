import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { BsSun, BsMoon } from "react-icons/bs";

// ── Dashboard components ──
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import Appointments from "./components/Appointments";
import History from "./components/History";
import ReportDetails from "./components/ReportDetails";
import Profile from "./components/Profile";
import PatientDashboard from "./components/PatientDashboard";
import MainLayout from "./components/MainLayout";
import ChatbotWidget from "./components/ChatbotWidget";
import ContactTable from "./components/ContactTable";

// ── Homepage components ──
import Home from "./components/Home";
import About from "./components/About";
import Review from "./components/Review";
import Contact from "./components/Contact";
import Login from "./components/Login";
import Signup from "./components/Signup";
import GetStarted from "./components/GetStarted";
import HeaderOne from "./components/HeaderOne";
import ScrollToTop from "./components/ScrollToTop";
import ResetPassword from "./components/ResetPassword";

const PATH_TO_VIEW = {
  "/dashboard": "dashboard",
  "/profile": "profile",
  "/patient-dashboard": "patient-dashboard",
  "/reports": "reports",
  "/history": "history",
  "/appointments": "appointments",
  "/report-details": "report-details",
};

const VIEW_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_VIEW).map(([k, v]) => [v, k]),
);

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/review",
  "/contact",
  "/login",
  "/signup",
  "/get-started",
];

function AppRoutes({
  user,
  setUser,
  language,
  setLanguage,
  reports,
  appointments,
  setAppointments,
  setSelectedReport,
  selectedReport,
  darkMode,
  toggleTheme,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const tokenFromURL = params.get("token");
  const nameFromURL = params.get("name");

  if (tokenFromURL) {
    localStorage.setItem("token", tokenFromURL);
    if (nameFromURL) localStorage.setItem("userName", nameFromURL);
    window.history.replaceState({}, document.title, location.pathname);
  }

  const token = localStorage.getItem("token");

  const isResetPath = location.pathname.startsWith("/reset-password/");
  const isPublicPath = PUBLIC_PATHS.includes(location.pathname) || isResetPath;
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    isResetPath;

  if (!isPublicPath && !token) {
    return <Navigate to="/login" replace />;
  }

  const activeView = PATH_TO_VIEW[location.pathname] ?? "dashboard";

  const setActiveView = (view) => {
    const path = VIEW_TO_PATH[view] ?? "/dashboard";
    navigate(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const shared = { darkMode, language };

  // ── PUBLIC LAYOUT ──
  if (isPublicPath) {
    return (
      <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-[#0d1117] transition-colors duration-300">
        <ScrollToTop />
        {!isAuthPage ? (
          <HeaderOne dark={darkMode} toggleTheme={toggleTheme} />
        ) : (
          <div className="fixed top-0 left-0 w-full px-4 md:px-8 py-4 md:py-6 flex justify-between items-center z-50">
            <Link
              to="/"
              className="text-lg md:text-xl font-bold text-cyan-500 dark:text-cyan-400 tracking-tight"
            >
              ← Back
            </Link>
            <button
              onClick={toggleTheme}
              className="relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl overflow-hidden bg-white dark:bg-white/3 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-violet-500/20 hover:scale-105 active:scale-95 transition-all duration-500 group"
            >
              <div className="absolute inset-0 bg-linear-to-br from-violet-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 transition-transform duration-500 group-hover:rotate-12">
                {darkMode ? (
                  <BsSun
                    className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                    size={20}
                  />
                ) : (
                  <BsMoon className="text-violet-600" size={18} />
                )}
              </div>
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/review" element={<Review />} />
            <Route path="/get-started" element={<GetStarted />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        </main>
      </div>
    );
  }

  // ── DASHBOARD LAYOUT ──
  return (
    <MainLayout
      user={user}
      activeView={activeView}
      setActiveView={setActiveView}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      language={language}
      setLanguage={setLanguage}
    >
      <Routes>
        <Route
          path="/dashboard"
          element={
            <Dashboard
              {...shared}
              user={user}
              setActiveView={setActiveView}
              setSelectedReport={setSelectedReport}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <Profile
              {...shared}
              user={user}
              setUser={setUser}
              setActiveView={setActiveView}
            />
          }
        />
        {/*
          ── KEY FIX ──
          PatientDashboard now receives setActiveView so that when the
          user taps "Back / Dashboard" inside ReportDetails (which is
          rendered *inside* PatientDashboard), the call chain is:

            ReportDetails.handleBack()
              → onDashboard()            (passed from PatientDashboard)
                → setActiveView("dashboard")   (from AppRouter)
                  → navigate("/dashboard")
        */}
        <Route
          path="/patient-dashboard"
          element={
            <PatientDashboard {...shared} setActiveView={setActiveView} />
          }
        />
        <Route
          path="/reports"
          element={<Reports {...shared} reports={reports} />}
        />
        <Route
          path="/history"
          element={<History {...shared} reports={reports} />}
        />
        <Route
          path="/appointments"
          element={
            <Appointments
              {...shared}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          }
        />
        {/*
          ── KEY FIX ──
          ReportDetails (opened from Dashboard's "View Details" button)
          also receives setActiveView directly so its back button works
          from this route path too.
        */}
        <Route
          path="/report-details"
          element={
            selectedReport ? (
              <ReportDetails
                {...shared}
                report={selectedReport}
                setActiveView={setActiveView}
                // ✅ এই তিনটা prop add করো
                onBack={() => setActiveView("dashboard")}
                onDashboard={() => setActiveView("dashboard")}
                onNewAssessment={() => setActiveView("patient-dashboard")}
                onGoToXray={() => setActiveView("patient-dashboard")}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="text-4xl mb-2">⚠️</span>
                <p className="font-bold uppercase tracking-widest text-xs">
                  No report selected
                </p>
              </div>
            )
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Chatbot — hidden on very small screens to avoid overlap */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <ChatbotWidget language={language} />
      </div>
    </MainLayout>
  );
}

function AppRouter(props) {
  return (
    <Router>
      <AppRoutes {...props} />
    </Router>
  );
}

export default AppRouter;
