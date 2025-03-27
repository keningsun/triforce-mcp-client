"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface TriforceIconProps {
  className?: string;
  color?: string;
}

export function TriforceIcon({ className = "", color }: TriforceIconProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use provided color or theme-based color
  const iconColor =
    color || (mounted && theme === "dark" ? "#25918D" : "#1E6B68");

  return (
    <svg
      className={className}
      viewBox="0 0 46 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32.797 0.643523C40.1307 -1.68981 51.7017 0.843519 41.3013 33.6435C35.9677 23.4769 27.1968 3.44353 32.797 0.643523ZM39.5995 38.343C37.6011 45.7749 29.2182 54.1435 7.23534 27.6715C18.6721 28.6757 40.2688 32.1177 39.5995 38.343ZM3.67458 25.0177C-1.91128 19.7238 -5.28311 8.36881 28.4599 1.62948C22.1349 11.2109 8.83164 28.5684 3.67458 25.0177Z"
        fill={iconColor}
      />
    </svg>
  );
}
