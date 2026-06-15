"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, Trophy, Phone, ShieldCheck } from "lucide-react";

const SLIDES = [
  {
    imageDesktop: "/luxury_home_theater_desktop.png",
    imageMobile: "/luxury_home_theater_mobile.png",
    objectPositionDesktop: "object-center",
    objectPositionMobile: "object-center",
    title: "Immersive Entertainment",
    subtitle: "Smart LEDs & Sound Systems",
    description: "Transform your living space with our premium bezel-less QLED smart TVs and theater-grade soundbars. Experience cinema-quality entertainment at home.",
    ctaText: "Browse Smart TVs",
    ctaLink: "#products",
    badge: "Featured Tech",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    categoryFilter: "entertainment"
  },
  {
    imageDesktop: "/luxury_smart_kitchen_desktop.png",
    imageMobile: "/luxury_smart_kitchen_mobile.png",
    objectPositionDesktop: "object-center",
    objectPositionMobile: "object-center",
    title: "The Heart of Your Home",
    subtitle: "Luxury Kitchen Suites",
    description: "Discover state-of-the-art gas hobs, convection microwave ovens, and smart inverter refrigerators designed for modern culinary excellence.",
    ctaText: "Explore Kitchenware",
    ctaLink: "#products",
    badge: "Smart Cooking",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    categoryFilter: "kitchen"
  },
  {
    imageDesktop: "/luxury_laundry_room_desktop.png",
    imageMobile: "/luxury_laundry_room_mobile.png",
    objectPositionDesktop: "object-center",
    objectPositionMobile: "object-center",
    title: "Effortless Fabric Care",
    subtitle: "Premium Washers & Dryers",
    description: "Upgrade your laundry routine with quiet inverter direct-drive washing machines and energy-efficient drying systems. Gentle on clothes, smart on power.",
    ctaText: "View Washing Machines",
    ctaLink: "#products",
    badge: "Premium Laundry",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    categoryFilter: "laundry"
  }
];

export default function StorefrontCarousel({ onSelectCategory }) {
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
      autoPlayRef.current = setInterval(nextSlide, 7000);
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isHovered]);

  const handleCtaClick = (categoryFilter) => {
    if (onSelectCategory && categoryFilter) {
      onSelectCategory(categoryFilter);
    }
    const element = document.getElementById("products");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative w-full aspect-[9/16] sm:aspect-[4/3] md:aspect-[16/8] h-auto overflow-hidden bg-black"
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
            {/* Background Image - Responsive Full-Bleed Layout */}
            <div className="absolute inset-0 h-full w-full overflow-hidden">
              {/* Desktop Image */}
              <div className="hidden md:block absolute inset-0">
                <Image
                  src={slide.imageDesktop}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className={`object-cover ${slide.objectPositionDesktop} transition-transform duration-10000 ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
              {/* Mobile Image */}
              <div className="md:hidden absolute inset-0">
                <Image
                  src={slide.imageMobile}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className={`object-cover ${slide.objectPositionMobile} transition-transform duration-10000 ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
              
              {/* Premium dark gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-900/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-50 to-transparent dark:from-zinc-950" />
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
            </div>

            {/* Slide Content */}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl text-left">
                  {/* Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase transition-all duration-700 delay-300 transform ${
                      isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    } ${slide.badgeColor}`}
                  >
                    <ShieldCheck size={12} className="animate-pulse" />
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
                    <button
                      onClick={() => handleCtaClick(slide.categoryFilter)}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-500 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <ShoppingBag size={16} className="transition-transform group-hover:scale-110" />
                      {slide.ctaText}
                    </button>

                    <Link
                      href="/tournament"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-500/35 bg-zinc-900/40 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Trophy size={16} className="text-amber-400" />
                      Tournament Gala
                    </Link>

                    <a
                      href="tel:03008443856"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/10 hover:text-emerald-300 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <Phone size={16} />
                      Call Store
                    </a>
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
        className="hidden md:flex absolute left-4 top-1/2 z-30 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-950/40 p-3 text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:scale-110 active:scale-95 md:left-6"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:flex absolute right-4 top-1/2 z-30 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-950/40 p-3 text-zinc-300 backdrop-blur-sm transition-all duration-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:scale-110 active:scale-95 md:right-6"
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
                ? "w-8 bg-emerald-500 shadow-lg shadow-emerald-550/50"
                : "w-2.5 bg-zinc-650 hover:bg-zinc-400"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
