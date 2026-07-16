import { BsCheckCircleFill } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";

function SuccessModal({ isOpen, onClose, title, message }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#1a164d] rounded-3xl p-8 shadow-2xl border border-violet-200/50 dark:border-white/10 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <BsCheckCircleFill className="text-green-500 text-4xl animate-bounce" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {title || "Success!"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              {message || "Action completed successfully."}
            </p>

            <button
              onClick={onClose}
              className="relative z-10 w-full py-3.5 font-semibold text-sm tracking-wide cursor-pointer text-white bg-linear-to-br from-cyan-500 via-cyan-600 to-cyan-700 border border-white/20 rounded-xl shadow-lg shadow-cyan-500/30 transition-all duration-300 ease-out hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            >
              Great!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SuccessModal;