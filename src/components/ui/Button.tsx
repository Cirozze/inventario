"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white shadow-sm shadow-blue-950/50 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-300/60",
  secondary:
    "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:bg-zinc-800/60 disabled:text-zinc-500",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-950/50 hover:bg-red-500 disabled:bg-red-900 disabled:text-red-300/60",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
