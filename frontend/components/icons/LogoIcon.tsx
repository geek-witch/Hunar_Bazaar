
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM8.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm5.5 5.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zM10 15.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4-4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
    />
  </svg>
);
