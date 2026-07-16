import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BsSun, BsMoon, BsList, BsX } from "react-icons/bs";

function HeaderOne({ dark, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);

  const navLink = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "text-cyan-500"
        : "text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400"
    }`;

  // মোবাইল মেনুর ভেতরের লিংকের জন্য এক্সট্রা প্যাডিং ও সাইজ
  const mobileNavLink = ({ isActive }) =>
    `block w-full py-2.5 px-4 rounded-xl text-base font-semibold transition-all ${
      isActive
        ? "bg-cyan-500/10 text-cyan-500"
        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
    }`;

  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        px-4 md:px-8 py-4
        bg-white/85 dark:bg-[#0d1117]/90
        backdrop-blur-md
        border-b border-slate-200 dark:border-white/10
        transition-colors duration-300
      "
    >
      {/* LEFT — Logo Area */}
      <div className="flex-1 flex items-center justify-start">
        <Link
          to="/"
          className="text-lg md:text-xl font-black bg-linear-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent tracking-wider"
          onClick={() => setIsOpen(false)}
        >
          MediScan AI
        </Link>
      </div>

      {/* CENTER — Nav links (Hidden on Mobile, Flex on Desktop) */}
      <nav className="hidden md:flex items-center gap-8">
        <NavLink to="/" className={navLink}>
          Home
        </NavLink>
        <NavLink to="/about" className={navLink}>
          About
        </NavLink>
        <NavLink to="/review" className={navLink}>
          Review
        </NavLink>
        <NavLink to="/contact" className={navLink}>
          Contact
        </NavLink>
      </nav>

      {/* RIGHT — Toggle + Login + Get Started */}
      <div className="flex-1 flex items-center justify-end gap-2 md:gap-3">
        {/* Theme Toggle Button — Always visible */}
        <button
          onClick={toggleTheme}
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="
            relative w-10 h-10 md:w-11 md:h-11 flex items-center justify-center
            rounded-xl overflow-hidden shrink-0
            bg-white dark:bg-white/5
            border border-slate-200 dark:border-white/10
            shadow-sm hover:shadow-cyan-500/10 hover:scale-105 active:scale-95
            transition-all duration-300 group
          "
        >
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 transition-transform duration-500 group-hover:rotate-12">
            {dark ? (
              <BsSun
                className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                size={18}
              />
            ) : (
              <BsMoon className="text-cyan-600" size={16} />
            )}
          </div>
        </button>

        {/* Desktop Buttons (Hidden on Mobile) */}
        <Link
          to="/login"
          className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          Login
        </Link>

        <Link
          to="/signup"
          className="
            hidden md:flex items-center gap-2 px-5 py-2 font-semibold text-sm tracking-wide cursor-pointer
            text-white 
            bg-linear-to-br from-cyan-600 via-blue-500 to-cyan-800
            border border-white/20 rounded-xl
            transition-all duration-300 ease-out
            hover:brightness-110 hover:-translate-y-0.5
            active:scale-95 active:translate-y-0.5 
            shadow-[0_8px_20px_-6px_rgba(6,182,212,0.5)]
          "
        >
          Get Started →
        </Link>

        {/* Hamburger Menu Button (Visible ONLY on Mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
          className="
            md:hidden w-10 h-10 flex items-center justify-center rounded-xl
            bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300
            border border-slate-200 dark:border-white/10 text-xl transition-all
          "
        >
          {isOpen ? <BsX size={22} /> : <BsList size={22} />}
        </button>
      </div>

      {/* ── MOBILE DROPDOWN MENU ── */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 z-40 
            flex flex-col gap-2 p-5 md:hidden
            bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-lg
            border-b border-slate-200 dark:border-white/10
            shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200
          "
        >
          {/* Mobile Nav Links */}
          <NavLink
            to="/"
            className={mobileNavLink}
            onClick={() => setIsOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={mobileNavLink}
            onClick={() => setIsOpen(false)}
          >
            About
          </NavLink>
          <NavLink
            to="/review"
            className={mobileNavLink}
            onClick={() => setIsOpen(false)}
          >
            Review
          </NavLink>
          <NavLink
            to="/contact"
            className={mobileNavLink}
            onClick={() => setIsOpen(false)}
          >
            Contact
          </NavLink>

          {/* Divider */}
          <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 text-center font-semibold text-sm rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 text-center font-semibold text-sm rounded-xl text-white bg-linear-to-br from-cyan-600 via-blue-500 to-cyan-800"
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default HeaderOne;
