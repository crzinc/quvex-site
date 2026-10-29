import type { SVGProps } from "react";
import { MARK_PATH, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "./paths";

/** The circular Q-monogram. Inherits text colour, so it works in both themes. */
export function QuvexMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={MARK_VIEWBOX} fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}

/** The spaced lowercase "quvex" wordmark. */
export function QuvexWordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} fill="currentColor" aria-hidden="true" {...props}>
      <path fillRule="evenodd" d={WORDMARK_PATH} />
    </svg>
  );
}
