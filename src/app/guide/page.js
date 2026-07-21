"use client";

import Link from "next/link";
import {
  BookOpen,
  MousePointerClick,
  UserPlus,
  CreditCard,
  Upload,
  LogIn,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  Phone,
  Shield,
  Trophy,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const FLOW = [
  { id: 1, label: "Register", icon: UserPlus, desc: "Team form" },
  { id: 2, label: "Pay Fee", icon: CreditCard, desc: "Rs. 5,000" },
  { id: 3, label: "Login", icon: LogIn, desc: "Captain" },
  { id: 4, label: "Dashboard", icon: LayoutDashboard, desc: "Manage team" },
];

const REGISTER_STEPS = [
  {
    title: "Open Register",
    detail:
      "Top menu se Register click karein, ya /register page open karein.",
    icon: MousePointerClick,
  },
  {
    title: "Captain details bharein",
    detail:
      "Name, father name, CNIC (35201-XXXXXXX-X), WhatsApp (03XXXXXXXXX), village/city, aur password (confirm ke sath).",
    icon: UserPlus,
  },
  {
    title: "Team name + photos",
    detail:
      "Apni team ka naam likhein. Profile picture aur CNIC photo upload karein (clear image).",
    icon: Shield,
  },
  {
    title: "Entry fee submit karein",
    detail:
      "Jazz Cash / Easy Paisa pe Rs. 5,000 bhejein. Receipt upload kar sakte hain ya WhatsApp pe share kar sakte hain.",
    icon: CreditCard,
  },
  {
    title: "Submit & auto login",
    detail:
      "Register & Create Captain dabayein. Success pe aap seedha Captain Dashboard pe chale jayenge.",
    icon: CheckCircle2,
  },
];

const LOGIN_STEPS = [
  {
    title: "Captain Login kholen",
    detail: "Navbar se Captain Login, ya /captain/login page open karein.",
    icon: LogIn,
  },
  {
    title: "WhatsApp number dalen",
    detail:
      "Wahi 11-digit mobile number likhein jo registration pe use kiya tha (e.g. 03001234567).",
    icon: Phone,
  },
  {
    title: "Password + Login",
    detail:
      "Apna password enter karke Login to Dashboard dabayein. Dashboard pe team profile, payment status, aur settings milengi.",
    icon: LayoutDashboard,
  },
];

export default function GuidePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-white to-teal-50/40 dark:from-emerald-950/30 dark:via-zinc-950 dark:to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(16 185 129 / 0.2) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white shadow-xl shadow-emerald-600/20 sm:p-8 dark:border-emerald-800">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur">
                <BookOpen size={13} className="text-amber-200" />
                How to join
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Registration & Login Guide
              </h1>
              <p className="mt-2 max-w-xl text-sm text-emerald-50/90">
                Al-Umer Electronics Sports Gala Season 3 — team register se le kar
                captain login aur dashboard tak, step-by-step.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm"
              >
                Register Team
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/captain/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20"
              >
                Captain Login
              </Link>
            </div>
          </div>
        </div>

        {/* Flow diagram */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-zinc-900 dark:text-white">
            <Trophy size={18} className="text-emerald-600" />
            Complete flow
          </h2>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
            {/* Desktop flow */}
            <div className="hidden items-center gap-2 md:flex">
              {FLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="flex flex-1 items-center gap-2">
                    <div className="flex w-full flex-col items-center rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-4 text-center dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-zinc-950">
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                        <Icon size={18} />
                      </span>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                        Step {step.id}
                      </p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{step.desc}</p>
                    </div>
                    {i < FLOW.length - 1 && (
                      <ArrowRight
                        size={18}
                        className="shrink-0 text-emerald-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile flow */}
            <div className="space-y-3 md:hidden">
              {FLOW.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.id}>
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                        <Icon size={18} />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-600">
                          Step {step.id}
                        </p>
                        <p className="text-sm font-black text-zinc-900 dark:text-white">
                          {step.label}
                          <span className="ml-2 text-xs font-medium text-zinc-500">
                            · {step.desc}
                          </span>
                        </p>
                      </div>
                    </div>
                    {i < FLOW.length - 1 && (
                      <div className="flex justify-center py-1">
                        <div className="h-4 w-0.5 rounded-full bg-emerald-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mermaid-style ASCII box for clarity */}
            <div className="mt-5 overflow-x-auto rounded-xl bg-zinc-900 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 sm:text-xs">
              <pre className="min-w-[520px] whitespace-pre">{`┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│ 1. REGISTER │───▶│ 2. PAY FEE  │───▶│  3. LOGIN   │───▶│ 4. DASHBOARD │
│  Team form  │    │  Rs. 5,000  │    │   Captain   │    │  Manage team │
└─────────────┘    └─────────────┘    └─────────────┘    └──────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
  Name, CNIC,      Jazz Cash / EP      WhatsApp +
  Team, Photos     03047058705         Password`}</pre>
            </div>
          </div>
        </section>

        {/* Registration steps */}
        <section>
          <h2 className="mb-4 text-lg font-black text-zinc-900 dark:text-white">
            A) Team Registration — steps
          </h2>
          <div className="space-y-3">
            {REGISTER_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                      {i + 1}
                    </span>
                    {i < REGISTER_STEPS.length - 1 && (
                      <div className="mt-2 h-full w-0.5 flex-1 bg-emerald-100 dark:bg-emerald-900/40" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Icon size={15} className="text-emerald-600" />
                      <h3 className="font-bold text-zinc-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Payment box */}
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="border-b border-amber-200/80 px-5 py-3 dark:border-amber-900/40">
            <h2 className="flex items-center gap-2 font-black text-amber-900 dark:text-amber-200">
              <CreditCard size={18} />
              Entry fee details
            </h2>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            <ul className="space-y-2 text-sm text-amber-950/90 dark:text-amber-100/90">
              <li>
                <span className="font-semibold">Bank:</span> Jazz Cash / Easy Paisa
              </li>
              <li>
                <span className="font-semibold">Account Name:</span> Muhammad Shafiq
              </li>
              <li>
                <span className="font-semibold">Account Number:</span>{" "}
                <span className="font-mono font-bold">03047058705</span>
              </li>
              <li>
                <span className="font-semibold">Amount:</span> Rs. 5,000/-
              </li>
            </ul>
            <div className="rounded-xl border border-amber-200/80 bg-white/80 p-4 text-sm dark:border-amber-900/40 dark:bg-zinc-900/60">
              <p className="mb-2 flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-100">
                <MessageCircle size={15} className="text-emerald-600" />
                Receipt WhatsApp
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Screenshot share karein:{" "}
                <a
                  href="https://wa.me/923044897377"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline"
                >
                  03044897377
                </a>
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Upload registration form pe optional hai — baad mein bhi share kar
                sakte ho.
              </p>
            </div>
          </div>
        </section>

        {/* Login steps */}
        <section>
          <h2 className="mb-4 text-lg font-black text-zinc-900 dark:text-white">
            B) Captain Login — steps
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {LOGIN_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-sm font-black text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                    {i + 1}
                  </span>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={14} className="text-teal-600" />
                    <h3 className="font-bold text-zinc-900 dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Tips */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 flex items-center gap-2 font-black text-zinc-900 dark:text-white">
            <AlertCircle size={18} className="text-emerald-600" />
            Important tips
          </h2>
          <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              WhatsApp number unique hona chahiye — yehi aapka login ID hai.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              Password yaad rakhain; login ke baad Settings se profile update ho sakti hai.
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              CNIC format: 35201-8511102-5 (dashes ke sath).
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              Rules ke liye{" "}
              <Link href="/terms" className="font-semibold text-emerald-600 hover:underline">
                Terms & Conditions
              </Link>{" "}
              padhein.
            </li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-6 py-8 text-center dark:border-emerald-900/40 dark:bg-emerald-950/30 sm:flex-row">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Ready ho? Ab register ya login karein.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/25"
            >
              <Upload size={15} />
              Register Team
            </Link>
            <Link
              href="/captain/login"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 px-5 py-2.5 text-sm font-bold text-emerald-700 hover:bg-white dark:text-emerald-300"
            >
              <LogIn size={15} />
              Captain Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
