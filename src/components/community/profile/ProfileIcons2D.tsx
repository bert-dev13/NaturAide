import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export function WaveHand2DIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="11" fill="#FEF3C7" />
      <path
        d="M8.5 14.5c.8 1.2 2 1.8 3.5 1.8 1.8 0 3-1 3.5-2.2M7.5 10c0-1.5.8-2.5 2-2.5s2 1 2 2.5v2M11.5 8.5c0-1.5.8-2.5 2-2.5s2 1 2 2.5v3M15.5 10c0-1.2.7-2 1.8-2 1.2 0 1.7 1 1.7 2.2v2.8c0 2.2-1.8 4-4 4h-2c-2.2 0-4-1.8-4-4V12c0-1.1.7-2 1.8-2 .9 0 1.5.6 1.7 1.5"
        stroke="#D97706"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sparkle2DIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z"
        fill="#FBBF24"
      />
      <circle cx="19" cy="5" r="2" fill="#34D399" />
      <circle cx="5" cy="19" r="1.5" fill="#60A5FA" />
    </svg>
  );
}

export function LeafShield2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 5.5V11.5C4 16.5 7.4 21.1 12 22.5C16.6 21.1 20 16.5 20 11.5V5.5L12 2Z"
        fill="#E8F5ED"
        stroke="#1E5C44"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.5C9.5 8 8.5 11 9 14.5C10 16 12 17 14.5 16.5C15 13.5 14 10.5 12 6.5Z"
        fill="#34D399"
      />
      <path
        d="M10 14.5L14 9.5"
        stroke="#0F2C20"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserCard2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="4"
        fill="#ECFDF5"
        stroke="#059669"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="11" r="3" fill="#10B981" />
      <path
        d="M5.5 17C6.5 15 8 14.5 9 14.5C10 14.5 11.5 15 12.5 17"
        stroke="#047857"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 9.5H18M15 13H17.5"
        stroke="#10B981"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Bookmark2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4C6 2.89543 6.89543 2 8 2H16C17.1046 2 18 2.89543 18 4V21L12 17.5L6 21V4Z"
        fill="#FEF3C7"
        stroke="#D97706"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.5L11 10.5L15 6.5"
        stroke="#B45309"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Globe2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.75" />
      <path
        d="M3.6 9H20.4M3.6 15H20.4"
        stroke="#60A5FA"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse
        cx="12"
        cy="12"
        rx="4.5"
        ry="9"
        stroke="#2563EB"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Lock2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="9"
        width="16"
        height="12"
        rx="3"
        fill="#FEF3C7"
        stroke="#D97706"
        strokeWidth="1.75"
      />
      <path
        d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9"
        stroke="#B45309"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14.5" r="1.5" fill="#92400E" />
      <path d="M12 16V18" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldAlert2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 5.5V11.5C4 16.5 7.4 21.1 12 22.5C16.6 21.1 20 16.5 20 11.5V5.5L12 2Z"
        fill="#FFFBEB"
        stroke="#D97706"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.5V13"
        stroke="#B45309"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1.2" fill="#B45309" />
    </svg>
  );
}

export function PlantBook2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="3"
        fill="#F0FDF4"
        stroke="#059669"
        strokeWidth="1.75"
      />
      <path
        d="M3 18H21"
        stroke="#059669"
        strokeWidth="1.5"
      />
      <path
        d="M12 7C10.5 7 9.5 8 9.5 10C11 10 12 9 12 7ZM12 7C13.5 7 14.5 8 14.5 10C13 10 12 9 12 7Z"
        fill="#34D399"
      />
      <path
        d="M12 7V14"
        stroke="#047857"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BotChat2DIcon({ className = "", size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="4"
        fill="#F5F3FF"
        stroke="#7C3AED"
        strokeWidth="1.75"
      />
      <path
        d="M8 18L6 21V18H8Z"
        fill="#F5F3FF"
        stroke="#7C3AED"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="11" r="1.5" fill="#6D28D9" />
      <circle cx="15.5" cy="11" r="1.5" fill="#6D28D9" />
      <path
        d="M10.5 14C11 14.5 13 14.5 13.5 14"
        stroke="#7C3AED"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 2V4"
        stroke="#7C3AED"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditPencil2DIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 20H8L18.5 9.5C19.3284 8.67157 19.3284 7.32843 18.5 6.5C17.6716 5.67157 16.3284 5.67157 15.5 6.5L5 17L4 20Z"
        fill="#ECFDF5"
        stroke="#059669"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 8.5L16.5 11.5"
        stroke="#059669"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

