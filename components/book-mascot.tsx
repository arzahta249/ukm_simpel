"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MESSAGES = [
  "Halo, Penulis! 👋",
  "Yuk unggah naskahmu!",
  "Aku suka baca tulisanmu ✨",
  "Satu ide, satu karya 📚",
  "Klik aku lagi dong! 😄",
];

/**
 * Maskot buku yang lucu: mata mengikuti kursor, berkedip, melambai,
 * menulis dengan pena bulu, dan melompat saat diklik.
 * (Bukan logo UKM — ini ilustrasi dekoratif.)
 */
export function BookMascot({
  className,
  showBubble = true,
}: {
  className?: string;
  showBubble?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [msg, setMsg] = useState(0);
  const [jump, setJump] = useState(0);

  // Mata mengikuti kursor (tanpa re-render, langsung ubah CSS variable)
  useEffect(() => {
    let raf = 0;
    function onMove(e: PointerEvent) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = svgRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.48;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 280);
        el.style.setProperty("--lx", `${((dx / d) * 5 * k).toFixed(2)}px`);
        el.style.setProperty("--ly", `${((dy / d) * 4 * k).toFixed(2)}px`);
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // Ganti ucapan secara berkala
  useEffect(() => {
    if (!showBubble) return;
    const t = setInterval(() => setMsg((m) => (m + 1) % MESSAGES.length), 4600);
    return () => clearInterval(t);
  }, [showBubble]);

  function onPoke() {
    setJump((j) => j + 1);
    setMsg((m) => (m + 1) % MESSAGES.length);
  }

  return (
    <div className={cn("relative mx-auto aspect-[17/15] w-full max-w-[440px]", className)}>
      {showBubble && (
        <div
          key={msg}
          className="bubble-pop absolute left-[4%] top-[-2%] z-10 max-w-[52%] rounded-2xl rounded-bl-md border border-line-strong bg-white px-3 py-2 text-[12px] font-semibold leading-snug text-forest-900 shadow-lift sm:text-[13px]"
          role="status"
          aria-live="polite"
        >
          {MESSAGES[msg]}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox="0 0 340 300"
        className="m-click h-full w-full overflow-visible"
        role="img"
        aria-label="Maskot buku yang ramah sedang menulis dengan pena bulu"
        onClick={onPoke}
      >
        <defs>
          <linearGradient id={`${uid}-cover`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1f8451" />
            <stop offset="1" stopColor="#135332" />
          </linearGradient>
          <clipPath id={`${uid}-mouth`}>
            <path d="M152 160 Q168 186 184 160 Z" />
          </clipPath>
          <path
            id={`${uid}-spark`}
            d="M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10Z"
          />
        </defs>

        {/* bayangan tanah */}
        <ellipse className="m-shadow" cx="168" cy="274" rx="76" ry="8" fill="#0d1f14" opacity="0.28" />

        {/* kertas & bintang yang melayang */}
        <g transform="translate(22 52)">
          <g className="m-drift">
            <rect width="28" height="36" rx="4" fill="#fcfbf7" stroke="#c5bfb0" strokeWidth="1.5" />
            <path d="M6 10H22M6 17H22M6 24H16" stroke="#cfa92c" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>
        <g transform="translate(296 196)">
          <g className="m-drift" style={{ animationDelay: "-3s" }}>
            <rect width="26" height="33" rx="4" fill="#fcfbf7" stroke="#c5bfb0" strokeWidth="1.5" />
            <path d="M5 9H21M5 16H21M5 23H14" stroke="#1f8451" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        {[
          { x: 90, y: 34, s: 1, d: "0s", c: "#cfa92c" },
          { x: 262, y: 22, s: 0.8, d: "-0.9s", c: "#dfc054" },
          { x: 24, y: 138, s: 0.7, d: "-1.6s", c: "#46a373" },
          { x: 312, y: 128, s: 0.9, d: "-0.4s", c: "#cfa92c" },
          { x: 300, y: 262, s: 0.7, d: "-2s", c: "#dfc054" },
          { x: 44, y: 232, s: 0.85, d: "-1.2s", c: "#cfa92c" },
        ].map((sp, i) => (
          <g key={i} transform={`translate(${sp.x} ${sp.y}) scale(${sp.s})`}>
            <g className="m-twinkle" style={{ animationDelay: sp.d }}>
              <use href={`#${uid}-spark`} fill={sp.c} />
            </g>
          </g>
        ))}

        {/* ===== Tokoh ===== */}
        <g className="m-float">
          <g key={jump} className={jump > 0 ? "m-jump" : undefined}>
            {/* kaki */}
            <g stroke="#071d12" strokeWidth="11" strokeLinecap="round">
              <path d="M140 228V250" />
              <path d="M196 228V250" />
            </g>
            <ellipse cx="136" cy="256" rx="18" ry="9" fill="#0d1f14" />
            <ellipse cx="200" cy="256" rx="18" ry="9" fill="#0d1f14" />
            <ellipse cx="131" cy="253" rx="5" ry="2.6" fill="#fff" opacity="0.28" />
            <ellipse cx="195" cy="253" rx="5" ry="2.6" fill="#fff" opacity="0.28" />

            {/* pita pembatas buku */}
            <g className="m-sway">
              <path
                d="M164 226 H174 V259 L169 253 L164 259 Z"
                fill="#cfa92c"
                stroke="#967012"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>

            {/* tebal halaman */}
            <rect x="98" y="80" width="140" height="158" rx="18" fill="#fcfbf7" stroke="#c5bfb0" strokeWidth="1.5" />
            <path d="M234 98V222M237 102V220" stroke="#e4e0d3" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M112 234H224M116 237H220" stroke="#e4e0d3" strokeWidth="1.4" strokeLinecap="round" />

            {/* punggung & sampul */}
            <rect x="90" y="72" width="40" height="158" rx="18" fill="#0c3320" />
            <rect x="106" y="72" width="124" height="158" rx="18" fill={`url(#${uid}-cover)`} />
            <path d="M100 92V210" stroke="#cfa92c" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
            <path d="M106 92V210" stroke="#cfa92c" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <rect
              x="118"
              y="84"
              width="104"
              height="134"
              rx="12"
              fill="none"
              stroke="#e2b93b"
              strokeWidth="1.4"
              strokeDasharray="3 4"
              opacity="0.7"
            />
            <path d="M120 80 Q168 70 218 80" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.14" fill="none" />

            {/* alis */}
            <g stroke="#fcfbf7" strokeWidth="3.2" strokeLinecap="round" fill="none">
              <path d="M134 121 Q146 114 158 120" />
              <path d="M178 120 Q190 114 202 121" />
            </g>

            {/* mata */}
            <g className="m-blink">
              <circle cx="146" cy="142" r="13.5" fill="#fff" stroke="#071d12" strokeWidth="1.6" />
              <g className="m-pupil">
                <circle cx="146" cy="143" r="7" fill="#0d1f14" />
                <circle cx="148.6" cy="140" r="2.4" fill="#fff" />
              </g>
            </g>
            <g className="m-blink" style={{ animationDelay: "0.04s" }}>
              <circle cx="190" cy="142" r="13.5" fill="#fff" stroke="#071d12" strokeWidth="1.6" />
              <g className="m-pupil">
                <circle cx="190" cy="143" r="7" fill="#0d1f14" />
                <circle cx="192.6" cy="140" r="2.4" fill="#fff" />
              </g>
            </g>

            {/* pipi & senyum */}
            <circle cx="126" cy="166" r="8" fill="#f4a6a0" opacity="0.6" />
            <circle cx="210" cy="166" r="8" fill="#f4a6a0" opacity="0.6" />
            <path d="M152 160 Q168 186 184 160 Z" fill="#3b1219" />
            <g clipPath={`url(#${uid}-mouth)`}>
              <ellipse cx="168" cy="176" rx="9" ry="6" fill="#f08a8a" />
            </g>
            <path d="M152 160 Q168 186 184 160" fill="none" stroke="#3b1219" strokeWidth="2.4" strokeLinecap="round" />

            {/* lengan kiri (melambai) */}
            <g className="m-wave">
              <path d="M98 168 Q66 170 58 138" fill="none" stroke="#104229" strokeWidth="10" strokeLinecap="round" />
              <circle cx="57" cy="132" r="10" fill="#fcfbf7" stroke="#104229" strokeWidth="2.2" />
            </g>

            {/* lengan kanan + pena bulu */}
            <g className="m-arm-r">
              <path d="M226 170 Q262 176 268 148" fill="none" stroke="#104229" strokeWidth="10" strokeLinecap="round" />
              <g className="m-quill">
                <path d="M270 142 L306 68" stroke="#7d7439" strokeWidth="3" strokeLinecap="round" />
                <path
                  d="M306 68 C324 66 328 46 324 36 C304 40 290 56 290 86 C296 80 300 74 306 68Z"
                  fill="#fcfbf7"
                  stroke="#cfa92c"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M306 68 L296 84" stroke="#e4e0d3" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="268" cy="143" r="10" fill="#fcfbf7" stroke="#104229" strokeWidth="2.2" />
              </g>
            </g>

            {/* topi wisuda */}
            <g className="m-cap">
              <path d="M138 64 V84 Q168 98 198 84 V64" fill="#071d12" />
              <path d="M168 34 L238 54 L168 74 L98 54 Z" fill="#0d1f14" stroke="#cfa92c" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M168 40 L226 54 L168 68" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.12" />
              <circle cx="168" cy="54" r="3.4" fill="#cfa92c" />
              <path d="M168 54 L228 60 V80" fill="none" stroke="#cfa92c" strokeWidth="2.4" strokeLinecap="round" />
              <g className="m-tassel">
                <rect x="224" y="80" width="8" height="15" rx="2.5" fill="#cfa92c" stroke="#967012" strokeWidth="1" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
