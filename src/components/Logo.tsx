"use client";

import Image from "next/image";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
};

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <Image
          src="/logo.png"
          alt="Logo Chama o Músico"
          width={size === "sm" ? 32 : size === "md" ? 40 : 48}
          height={size === "sm" ? 32 : size === "md" ? 40 : 48}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <div>
          <span className={`${textSizes[size]} font-semibold font-display bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] bg-clip-text text-transparent`}>
            Chama o Músico
          </span>
          {size !== "sm" && (
            <p className="text-xs text-muted-foreground -mt-1">Conectando palcos e talentos</p>
          )}
        </div>
      )}
    </div>
  );
}

