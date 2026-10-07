"use client";

import { useState } from "react";
import Image from "next/image";

// Image slot with a fallback. Shows `fallback` until the file loads, and keeps showing it
// only if the file is genuinely missing/broken.
// Positioning: the wrapper is `relative` unless the caller passes `absolute`, so callers
// can use either `absolute inset-0` or an explicit size without the two utilities clashing.
export default function GameImage({
  src,
  alt = "",
  className = "",
  fit = "cover",
  position,
  sizes = "100vw",
  priority = false,
  fallback = null,
}) {
  const [status, setStatus] = useState("loading"); // loading | loaded | error
  const pos = /(^|\s)(absolute|fixed)(\s|$)/.test(className) ? "" : "relative";
  const fitClass = fit === "contain" ? "object-contain object-bottom" : "object-cover";

  return (
    <div className={`${pos} overflow-hidden ${className}`}>
      {status !== "loaded" && fallback}
      {status !== "error" && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          style={position ? { objectPosition: position } : undefined}
          className={`transition-opacity duration-500 ${fitClass} ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
