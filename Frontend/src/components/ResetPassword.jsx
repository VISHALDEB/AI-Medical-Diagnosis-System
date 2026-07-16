import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BsLockFill, BsEye, BsEyeSlash, BsArrowLeft, BsCheckCircleFill } from "react-icons/bs";

const lightBg = {
  background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)",
};

const darkBg = {
  background:
    "linear-gradient(135deg, #0d1117 0%, #0f0c29 40%, #1a0533 70%, #0d1117 100%)",
};

function ResetPassword() {
  const { token } = useParams(); // Grabs the dynamic token from the URL
  const [isDark, setIsDark] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Theme observer (same as Login)
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const validate = () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch(`http://localhost:5001/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError("");
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  const inputClass = `w-full h-11 rounded-xl border border-violet-600/20 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-3 pl-10 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15`;

  return (
    <div className="min-h-screen flex items-center justify-center pt-16" style={isDark ? darkBg : lightBg}>
      <div className="relative w-full max-w-sm mx-4">
        <div className="absolute -inset-0.5 rounded-3xl opacity-70 blur-xl bg-linear-to-r from-violet-600 to-purple-700"></div>
        
        <div className="relative p-8 rounded-3xl bg-white/90 dark:bg-[#0f0c29]/80 backdrop-blur-xl border border-violet-200 dark:border-white/10 shadow-2xl">
          
          {/* Back to Login Link */}
          <Link to="/login" className="flex items-center gap-1 text-violet-500 text-xs mb-4 hover:underline">
            <BsArrowLeft /> Back to Login
          </Link>

          {success ? (
            /* --- SUCCESS VIEW --- */
            <div className="text-center flex flex-col items-center gap-4 py-6">
              <BsCheckCircleFill className="text-green-500 text-6xl drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Success!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Your password has been successfully updated. You can now use your new password to log in.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block px-8 py-3 font-semibold text-sm text-white bg-linear-to-br from-violet-600 to-indigo-700 rounded-xl shadow-lg hover:brightness-110 transition-all"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            /* --- RESET FORM VIEW --- */
            <>
              <p className="text-slate-400 text-sm mb-1">Set a new password for your account</p>
              <h2 className="text-2xl font-bold bg-linear-to-r from-violet-600 via-purple-500 to-violet-800 bg-clip-text text-transparent dark:text-white mb-6">
                Update Password
              </h2>

              <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
                
                {/* New Password Input */}
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">New Password</label>
                  <div className="relative">
                    <BsLockFill className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <BsEyeSlash /> : <BsEye />}
                    </div>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="text-slate-500 text-xs mb-1 block">Confirm New Password</label>
                  <div className="relative">
                    <BsLockFill className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                <button
                  type="submit"
                  className="mt-4 h-11 relative z-10 px-10 py-3.5 font-semibold text-sm tracking-wide cursor-pointer text-white bg-linear-to-br from-violet-600 via-purple-500 to-indigo-700 border border-white/20 rounded-xl shadow-lg transition-all duration-300 ease-out hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
                >
                  Update Password
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default ResetPassword;