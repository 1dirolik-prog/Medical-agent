import React from "react";

interface CategoryBadgeProps {
  category?: string;
  size?: "sm" | "md";
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Blood: { bg: "bg-red-500/10 dark:bg-red-500/20", text: "text-red-600 dark:text-red-400" },
  Urine: { bg: "bg-amber-500/10 dark:bg-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
  Biochemistry: { bg: "bg-blue-500/10 dark:bg-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  Hormones: { bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-600 dark:text-purple-400" },
  Vitamins: { bg: "bg-emerald-500/10 dark:bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
  Markers: { bg: "bg-indigo-500/10 dark:bg-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400" },
  Electrolytes: { bg: "bg-cyan-500/10 dark:bg-cyan-500/20", text: "text-cyan-600 dark:text-cyan-400" },
  Default: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category = "Other", size = "sm" }) => {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Default;
  const paddingClass = size === "sm" ? "px-2 py-0.5 text-xs font-semibold" : "px-3 py-1 text-sm font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-lg whitespace-nowrap ${style.bg} ${style.text} ${paddingClass}`}
    >
      {category}
    </span>
  );
};
