"use client";

import { useEffect } from "react";

/** Opens the browser print dialog once the document has rendered. */
export function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, []);
  return null;
}
