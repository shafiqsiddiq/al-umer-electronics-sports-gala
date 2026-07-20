import Image from "next/image";
import Link from "next/link";
import { Trophy, Mail, Phone, MapPin, Award } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-zinc-200/80 bg-zinc-50 dark:border-zinc-850 dark:bg-zinc-950 py-12 md:py-16 transition-all duration-300">
      {/* Visual Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Logo & Intro Column */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 p-1.5 border border-zinc-200 dark:border-zinc-800 shadow-md">
                <Image
                  src="/al_umer_electronics_logo.png"
                  alt="Al-Umer Electronics"
                  fill
                  className="object-contain p-0.5 rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-tight uppercase tracking-wider">
                  Al-Umer
                </h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Electronics
                </span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2">
              Proud sponsors of the Season 3 Sports Gala. Bringing high-octane cricket matches and sporting excellence to our community.
            </p>
            <p className="text-[11px] text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed font-medium">
              © {currentYear} Al-Umer Electronics. All rights reserved. <br />
              Designed for Season 3 Sports Gala.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white tracking-widest mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-emerald-500" />
              Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Home (Store)
                </Link>
              </li>
              <li>
                <Link href="/tournament" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Cricket Tournament
                </Link>
              </li>
              <li>
                <Link href="/fixtures" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Fixtures
                </Link>
              </li>
              <li>
                <Link href="/live-scores" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Live Scores
                </Link>
              </li>
              <li>
                <Link href="/stats" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Stats & Rankings
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Format Links Column */}
          <div>
            <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white tracking-widest mb-4 flex items-center gap-2">
              <Award size={16} className="text-emerald-500" />
              Format Info
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/brackets/sections" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Groups
                </Link>
              </li>
              <li>
                <Link href="/brackets/loser-bracket" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Second Chance Bracket
                </Link>
              </li>
              <li>
                <Link href="/brackets/final-eight" className="text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors">
                  Final 8 Knockouts
                </Link>
              </li>
              <li>
                <span className="text-zinc-400 dark:text-zinc-650 font-medium">
                  48 Teams Total
                </span>
              </li>
            </ul>
          </div>

          {/* Contact & Support Column */}
          <div>
            <h4 className="text-sm font-bold uppercase text-zinc-900 dark:text-white tracking-widest mb-4 flex items-center gap-2">
              <Phone size={16} className="text-emerald-500" />
              Contact Store
            </h4>
            <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                <span>Al-Umer Electronics Center,<br />Bedian Rd, Heir, Lahore</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-emerald-500" />
                <a href="mailto:info@alumer.com" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  info@alumer.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-emerald-500" />
                <a href="tel:03008443856" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-semibold">
                  0300 8443856
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
