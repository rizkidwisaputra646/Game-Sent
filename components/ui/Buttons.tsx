"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dota" | "mlbb";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-semibold",
    md: "px-4 py-2 text-sm font-bold",
    lg: "px-5 py-2.5 text-base font-bold",
  }[size];

  const variantClasses = {
    primary:
      "bg-[#A78BFA] text-[#171717] hover:bg-[#906CF7] border-2 border-[#202020] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]",
    secondary:
      "bg-[#FFFDFC] text-[#171717] hover:bg-[#F7F4EC] border-2 border-[#202020] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]",
    danger:
      "bg-[#FA7777] text-[#171717] hover:bg-[#F85F5F] border-2 border-[#202020] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]",
    ghost:
      "bg-transparent text-[#171717] hover:bg-[#202020]/5 border-2 border-transparent active:bg-[#202020]/10",
    dota:
      "bg-[#D94B43] text-white hover:bg-[#C23C34] border-2 border-[#202020] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]",
    mlbb:
      "bg-[#3479D4] text-white hover:bg-[#2A66B8] border-2 border-[#202020] shadow-[3px_3px_0px_#202020] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#202020] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#202020]",
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}

export function SecondaryButton(props: ButtonProps) {
  return <PrimaryButton variant="secondary" {...props} />;
}
