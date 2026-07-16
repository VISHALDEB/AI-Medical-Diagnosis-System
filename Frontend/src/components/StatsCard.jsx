import React from "react";

export default function StatsCard({ icon, title, value, description }) {
  return (
    <div className="p-4 md:p-6 rounded-xl shadow-lg transition-all duration-300 bg-white dark:bg-[#0F1A2A] text-black dark:text-white hover:shadow-xl">
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
        {icon}
        <div>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <h3 className="text-xl md:text-2xl font-bold">
            {value}
          </h3>
        </div>
      </div>
      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}