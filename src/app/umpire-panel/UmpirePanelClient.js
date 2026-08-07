"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Loader2, Scale } from "lucide-react";
import { UMPIRES } from "@/lib/umpires";
import {
  generateUmpirePost,
  generateUmpirePanelPost,
} from "@/lib/umpire-post";
import { useToast } from "@/context/ToastContext";

export default function UmpirePanelClient() {
  const { toast } = useToast();
  const [generatingId, setGeneratingId] = useState(null);
  const [generatingPanel, setGeneratingPanel] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [progress, setProgress] = useState("");

  async function handleGenerateOne(umpire, index) {
    setGeneratingId(umpire.id);
    try {
      await generateUmpirePost(umpire, { index, total: UMPIRES.length });
      toast(`Downloaded post for ${umpire.name}`, "success");
    } catch (err) {
      console.error(err);
      toast(err?.message || "Failed to generate post", "error");
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleGeneratePanel() {
    setGeneratingPanel(true);
    try {
      await generateUmpirePanelPost(UMPIRES);
      toast("Umpire panel post downloaded", "success");
    } catch (err) {
      console.error(err);
      toast(err?.message || "Failed to generate panel post", "error");
    } finally {
      setGeneratingPanel(false);
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true);
    try {
      for (let i = 0; i < UMPIRES.length; i++) {
        setProgress(`Downloading ${i + 1}/${UMPIRES.length}`);
        await generateUmpirePost(UMPIRES[i], {
          index: i,
          total: UMPIRES.length,
        });
        if (i < UMPIRES.length - 1) {
          await new Promise((r) => setTimeout(r, 450));
        }
      }
      toast("All umpire posts downloaded", "success");
    } catch (err) {
      console.error(err);
      toast(err?.message || "Failed while generating posts", "error");
    } finally {
      setGeneratingAll(false);
      setProgress("");
    }
  }

  const busy = generatingPanel || generatingAll || generatingId != null;

  return (
    <div className="flex flex-col gap-4">
      {/* Action bar — outside the poster frame */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={handleGeneratePanel}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f766e] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-900/15 transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generatingPanel ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {generatingPanel ? "Generating…" : "Generate Panel Post"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleGenerateAll}
          className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#10b981] bg-white px-4 py-2.5 text-sm font-bold text-[#0f766e] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generatingAll ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {generatingAll
            ? progress || "Generating…"
            : "Generate All (one by one)"}
        </button>
      </div>

      {/* Poster frame — same format as generated panel post */}
      <section className="rounded-[1.75rem] border-[3px] border-teal-300/40 bg-gradient-to-b from-[#e6fffa] via-[#f0fdfa] to-[#fffef8] px-3 py-6 shadow-[0_16px_48px_rgba(15,118,110,0.1)] sm:rounded-[2rem] sm:px-5 sm:py-8 lg:px-8 lg:py-10">
        <header className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 flex h-[4.25rem] w-[4.25rem] items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-md sm:h-24 sm:w-24">
            <div className="relative h-full w-full">
              <Image
                src="/al_umer_electronics_logo_v2.png"
                alt="Al Umer Electronics"
                fill
                sizes="96px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          <h1 className="text-[1.35rem] font-black uppercase tracking-tight text-[#0c1a2e] sm:text-3xl md:text-4xl lg:text-[2.65rem]">
            Al Umer Electronics
          </h1>
          <p className="mt-2 text-sm font-black uppercase tracking-[0.38em] text-[#14b8a6] sm:text-lg sm:tracking-[0.45em]">
            Sports Gala S3
          </p>

          <div className="mt-4 inline-flex rounded-full bg-[#115e59] px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm sm:mt-5 sm:px-6 sm:text-sm">
            Umpire Panel
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {UMPIRES.map((umpire, i) => {
            const loading = generatingId === umpire.id;
            return (
              <article
                key={umpire.id}
                className="group relative flex aspect-[3/4] flex-col items-center rounded-[1.25rem] border-2 border-emerald-200/80 bg-white px-2.5 pb-3 pt-3.5 text-center shadow-[0_8px_24px_rgba(15,118,110,0.08)] transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_32px_rgba(15,118,110,0.14)] sm:rounded-[1.5rem] sm:px-3 sm:pb-4 sm:pt-4"
              >
                <span className="absolute left-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#10b981] text-[10px] font-black text-white shadow-md sm:left-3 sm:top-3 sm:h-8 sm:w-8 sm:text-xs">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center text-amber-600 sm:right-3 sm:top-3 sm:h-8 sm:w-8">
                  <Scale size={18} strokeWidth={2.25} />
                </span>

                {/* Large portrait + dashed rings */}
                <div className="relative mx-auto mt-1 flex w-[78%] max-w-[11.5rem] flex-1 items-center justify-center sm:mt-2 sm:max-w-[13.5rem] lg:max-w-[15rem]">
                  <span
                    className="pointer-events-none absolute inset-[2%] rounded-full border-[2.5px] border-dashed border-emerald-400/65"
                    aria-hidden="true"
                  />
                  <span
                    className="pointer-events-none absolute inset-[8%] rounded-full border border-dashed border-amber-400/45"
                    aria-hidden="true"
                  />
                  <div className="relative aspect-square w-[72%] overflow-hidden rounded-full bg-slate-100 ring-[3px] ring-[#10b981] sm:ring-4">
                    <Image
                      src={umpire.image}
                      alt={umpire.name}
                      fill
                      sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 220px"
                      className="object-cover object-top"
                      priority={i < 3}
                    />
                  </div>
                </div>

                <h3 className="mt-1 px-1 text-[13px] font-black leading-tight text-[#0c1a2e] sm:mt-2 sm:text-base lg:text-lg">
                  {umpire.name}
                </h3>

                <span className="mt-2 inline-flex rounded-full bg-[#115e59] px-3 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:mt-2.5 sm:px-4 sm:py-1.5 sm:text-[11px]">
                  Official Umpire
                </span>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleGenerateOne(umpire, i)}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#10b981] px-2 py-2 text-[11px] font-bold text-white opacity-90 transition hover:bg-[#059669] hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-3 sm:py-2.5 sm:text-xs"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {loading ? "…" : "Generate Post"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
