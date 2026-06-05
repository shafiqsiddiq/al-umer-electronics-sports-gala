"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Trophy, Calendar } from "lucide-react";

const SLIDES = [
  {
    image: "/cricket_action_shot.png",
    title: "Al-Umer Electronics Season 3",
    subtitle: "Sports Gala 2026",
    description: "Witness the ultimate battle of 48 local teams competing for the prestigious championship title. Experience high-octane matches, stellar performances, and raw cricket passion.",
    ctaText: "Register Your Team",
    ctaLink: "/register",
    secondaryCtaText: "View Fixtures",
    secondaryCtaLink: "/fixtures",
    badge: "Tournament Open",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  {
    image: "/cricket_stadium.png",
    title: "Uncompromising Stages",
    subtitle: "Double-Chance Bracket",
    description: "Every team gets their shot at redemption. With 3 knockout sections feeding into a unique double-elimination loser bracket, the drama never ends until the final ball is bowled.",
    ctaText: "Explore Sections",
    ctaLink: "/#sections",
    secondaryCtaText: "Live Scores",
    secondaryCtaLink: "/live-scores",
    badge: "Exciting Format",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  {
    image: "/cricket_trophy.png",
    title: "The Final Eight Showdown",
    subtitle: "Championship Trophy",
    description: "Only the elite survive to reach the grand finale. Who will raise the prestigious Al-Umer Championship Trophy in front of thousands of fans? The ultimate glory awaits.",
    ctaText: "View Rankings",
    ctaLink: "/stats",
    secondaryCtaText: "Rules & Info",
    secondaryCtaLink: "/#flow",
    badge: "Grand Prize",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);

  const nextSlide = () => {
    setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!isHovered) {
      autoPlayRef.current = setInterval(nextSlide, 6000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isHovered]);

  return (
    <div
      className="relative h-[550px] w-full overflow-hidden bg-black md:h-[650px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, index) => {
        const isActive = index === current;
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Background Image with Ken Burns effect */}
            <div className="absolute inset-0 h-full w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={index === 0}
                className={`object-cover object-center transition-transform duration-10000 ease-out ${
                  isActive ? "scale-105" : "scale-100"
                }`}
              />
              {/* Premium dark gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/30" />
            </div>

            {/* Slide Content */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
                <div className="max-w-2xl text-left">
                  {/* Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase transition-all duration-700 delay-300 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    } ${slide.badgeColor}`}
                  >
                    <Trophy size={12} className="animate-pulse" />
                    {slide.badge}
                  </span>

                  {/* Title */}
                  <h1
                    className={`mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl transition-all duration-700 delay-500 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    <span className="block text-emerald-400 font-semibold text-sm sm:text-base tracking-widest uppercase mb-2">
                      {slide.subtitle}
                    </span>
                    <span className="block bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent pb-1">
                      {slide.title}
                    </span>
                  </h1>

                  {/* Description */}
                  <p
                    className={`mt-4 text-base text-zinc-300 sm:text-lg transition-all duration-700 delay-700 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    {slide.description}
                  </p>

                  {/* Actions */}
                  <div
                    className={`mt-8 flex flex-wrap items-center gap-4 transition-all duration-700 delay-900 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    <Link
                      href={slide.ctaLink}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:bg-emerald-400 hover:shadow-emerald-400/35 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Play size={16} fill="white" className="transition-transform group-hover:scale-110" />
                      {slide.ctaText}
                    </Link>

                    <Link
                      href={slide.secondaryCtaLink}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-500/40 bg-zinc-900/45 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:border-zinc-400 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Calendar size={16} />
                      {slide.secondaryCtaText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-zinc-950/40 p-3 text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 hover:scale-110 active:scale-95 sm:left-6"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-zinc-700/50 bg-zinc-950/40 p-3 text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-500 hover:text-white hover:border-emerald-400 hover:scale-110 active:scale-95 sm:right-6"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Progress Dots */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2.5">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              index === current
                ? "w-8 bg-emerald-400 shadow-lg shadow-emerald-400/50"
                : "w-2.5 bg-zinc-600 hover:bg-zinc-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
