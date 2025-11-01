
import React from 'react';

// FIX: Update component to accept SVG props to allow passing className.
const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    {...props}
  >
    <path d="M12 3v2" />
    <path d="m18.36 5.64 1.41 1.41" />
    <path d="M21 12h-2" />
    <path d="m18.36 18.36 1.41-1.41" />
    <path d="M12 21v-2" />
    <path d="m5.64 18.36-1.41-1.41" />
    <path d="M3 12h2" />
    <path d="m5.64 5.64-1.41 1.41" />
    <path d="M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
    <path d="M12 12v9" />
  </svg>
);

export default SparklesIcon;
