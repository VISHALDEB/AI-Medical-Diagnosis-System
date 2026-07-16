import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BsEnvelopeFill,
  BsLockFill,
  BsPersonFill,
  BsGoogle,
  BsFacebook,
  BsApple,
  BsEye,
  BsEyeSlash,
} from "react-icons/bs";
import MedicalConstellation from "./MedicalConstellation";

const lightBg = {
  background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #ecfeff 100%)",
};
const darkBg = {
  background:
    "linear-gradient(135deg, #020d1a 0%, #041424 40%, #061e35 70%, #020d1a 100%)",
};

function Signup() {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const checkTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const validate = () => {
    if (!firstName.trim()) return (setError("Enter first name"), false);
    if (!lastName.trim()) return (setError("Enter last name"), false);
    if (!email.trim()) return (setError("Enter valid email"), false);
    if (!password.trim()) return (setError("Please enter password"), false);
    if (password.length < 8)
      return (setError("Password must be at least 8 characters"), false);
    if (!/[!@#$%^&*]/.test(password))
      return (setError("Include a special character"), false);
    if (!confirm.trim())
      return (setError("Please confirm your password"), false);
    if (password !== confirm)
      return (setError("Passwords do not match"), false);
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:5001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Registration failed");
        return;
      }

      // Registration succeeded, but token here is just for auto-provisioning.
      // Force the user through the normal login + OTP flow instead of
      // silently logging them in with a token from /register.
      navigate("/login");
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  const inputClass =
    "w-full bg-slate-50 dark:bg-black/40 border border-cyan-200/60 dark:border-cyan-500/20 rounded-xl py-2.5 px-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-hidden transition-all duration-300 font-medium focus:ring-1 focus:ring-cyan-500/40";
  const underline = (field, color = "bg-cyan-500") =>
    `absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] ${color} transition-all duration-500 rounded-full ${focusedField === field ? "w-11/12 opacity-100 shadow-[0_0_10px_#06b6d4]" : "w-0 opacity-0"}`;

  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-y-auto overflow-x-hidden relative flex items-start justify-center p-4 sm:p-6 md:p-10"
      style={isDark ? darkBg : lightBg}
    >
      <MedicalConstellation />

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 md:w-140 h-64 sm:h-96 md:h-140 rounded-full opacity-0 dark:opacity-10 blur-3xl transition-all duration-700 ease-out"
          style={{
            background:
              focusedField === "password" || focusedField === "confirm"
                ? "radial-gradient(circle, #06b6d4, transparent)"
                : "radial-gradient(circle, #0891b2, transparent)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col justify-start mt-24 sm:mt-16 md:mt-20 lg:mt-24 px-0 sm:px-2">
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white/80 dark:bg-[#020d1a]/90 backdrop-blur-xl border border-cyan-200/60 dark:border-cyan-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-10 shadow-2xl flex flex-col gap-4 sm:gap-5"
        >
          <div className="text-center relative">
            <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-1">
              Create your account
            </p>
            <h1 className="text-xl sm:text-3xl font-bold tracking-wide">
              <span className="bg-linear-to-r from-cyan-600 via-blue-500 to-cyan-800 bg-clip-text text-transparent dark:from-[#e5e7eb] dark:via-[#ffffff] dark:to-[#9ca3af] dark:bg-clip-text dark:text-transparent dark:drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]">
                Get Started!
              </span>
            </h1>
          </div>

          {/* INPUTS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10 w-full">
            {[
              ["firstName", "First Name", firstName, setFirstName, "text"],
              ["lastName", "Last Name", lastName, setLastName, "text"],
            ].map(([field, label, val, setter, type]) => (
              <div key={field} className="flex flex-col gap-1 relative w-full">
                <label className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BsPersonFill className="text-cyan-500/80 dark:text-cyan-400" />{" "}
                  {label}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={type}
                    placeholder={label}
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    className={inputClass}
                    required
                  />
                  <div className={underline(field)} />
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-1 relative col-span-1 sm:col-span-2 w-full">
              <label className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <BsEnvelopeFill className="text-cyan-500/80 dark:text-cyan-400" />{" "}
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={inputClass}
                  required
                />
                <div className={underline("email")} />
              </div>
            </div>

            {[
              [
                "password",
                "Password",
                password,
                setPassword,
                showPassword,
                setShowPassword,
              ],
              [
                "confirm",
                "Confirm Password",
                confirm,
                setConfirm,
                showConfirm,
                setShowConfirm,
              ],
            ].map(([field, label, val, setter, show, setShow]) => (
              <div key={field} className="flex flex-col gap-1 relative w-full">
                <label className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BsLockFill className="text-cyan-500/80 dark:text-cyan-400" />{" "}
                  {label}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={show ? "text" : "password"}
                    placeholder={label}
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField(null)}
                    className={`${inputClass} pr-10`}
                    required
                  />
                  <span
                    className="absolute right-4 cursor-pointer text-slate-400 text-base select-none"
                    onClick={() => setShow(!show)}
                  >
                    {show ? <BsEyeSlash /> : <BsEye />}
                  </span>
                  <div className={underline(field, "bg-cyan-400")} />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs text-center font-semibold bg-red-500/10 p-2 rounded-xl">
              {error}
            </p>
          )}

          {/* SOCIAL BUTTONS */}
          <div className="grid grid-cols-3 gap-2 relative z-10 w-full">
            <button
              type="button"
              className="h-9 px-1 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-black/30 flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-all hover:border-cyan-500 hover:bg-cyan-500/10"
              onClick={() =>
                (window.location.href = "http://localhost:5001/google/login")
              }
            >
              <BsGoogle className="text-cyan-500 text-xs shrink-0" />
              <span>Google</span>
            </button>
            <button
              type="button"
              className="h-9 px-1 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-black/30 flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-500/10"
            >
              <BsFacebook className="text-blue-500 text-xs shrink-0" />
              <span>Facebook</span>
            </button>
            <button
              type="button"
              className="h-9 px-1 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-slate-50 dark:bg-black/30 flex items-center justify-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-all hover:border-slate-400 hover:bg-slate-400/10"
            >
              <BsApple className="text-slate-400 text-xs shrink-0" />
              <span>Apple</span>
            </button>
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-cyan-200/30 dark:border-cyan-500/20">
            <span className="text-xs text-slate-400 font-medium text-center sm:text-left">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-500 dark:text-cyan-400 font-bold hover:underline inline-block"
              >
                Log in
              </Link>
            </span>
            <div className="relative group w-full sm:w-auto">
              <div
                className="absolute -inset-px rounded-xl opacity-70 group-hover:opacity-100 blur-md transition-opacity duration-300 z-0"
                style={{
                  background: "linear-gradient(135deg, #0891b2, #3b82f6)",
                }}
              />
              <button
                type="submit"
                className="relative z-10 w-full sm:w-auto px-8 py-2.5 font-bold text-xs tracking-wide text-white bg-linear-to-br from-cyan-600 via-blue-500 to-blue-700 border border-white/20 rounded-xl shadow-lg transition-all duration-300 ease-out hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center"
              >
                Sign Up
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;