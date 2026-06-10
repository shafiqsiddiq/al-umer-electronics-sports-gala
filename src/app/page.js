"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Clock,
  Flame,
  Tv,
  Wind,
  RotateCw,
  Trophy,
  Star,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  ShieldCheck,
  Truck
} from "lucide-react";

// Product Data
const PRODUCTS = [
  // ==================== COOLING (10 items) ====================
  {
    id: "cool-1",
    name: "Haier Side-by-Side Smart Refrigerator",
    category: "cooling",
    brand: "Haier",
    image: "/product_refrigerator.png",
    imageFilter: "none",
    rating: 4.8,
    reviews: 24,
    specs: [
      "600L Total Capacity",
      "Twin Inverter Technology",
      "Digital Touch Control LED Display",
      "Smart WiFi App Connectivity",
      "Sleek Black Glass Door Finish"
    ],
    badge: "Best Seller"
  },
  {
    id: "cool-2",
    name: "Dawlance Chrome Double-Door Refrigerator",
    category: "cooling",
    brand: "Dawlance",
    image: "/product_refrigerator_silver.png",
    imageFilter: "none",
    rating: 4.7,
    reviews: 18,
    specs: [
      "450L Capacity",
      "Hybrid Cooling & Vitamin Fresh Technology",
      "Low-Voltage Startup (135V)",
      "Tempered Glass Shelves",
      "Mirror Glass Exterior Design"
    ],
    badge: "Premium Choice"
  },
  {
    id: "cool-3",
    name: "Haier 1.5 Ton Inverter Air Conditioner",
    category: "cooling",
    brand: "Haier",
    image: "/product_ac.png",
    imageFilter: "none",
    rating: 4.9,
    reviews: 32,
    specs: [
      "Self Cleaning Technology",
      "UPS Enabled (Saves up to 75% electricity)",
      "T3 Inverter Compressor",
      "Heat & Cool Functionality",
      "Smart WiFi Control via App"
    ],
    badge: "Energy Saver"
  },
  {
    id: "cool-4",
    name: "Gree 2.0 Ton Heat & Cool Split AC",
    category: "cooling",
    brand: "Gree",
    image: "/product_ac_black.png",
    imageFilter: "none",
    rating: 4.8,
    reviews: 15,
    specs: [
      "100% Copper Condenser",
      "Eco-Friendly R410a Refrigerant",
      "Turbo Cooling & Heating Mode",
      "Double Deflector Air Flow",
      "Elegant Curved Panel Design"
    ],
    badge: "Trending"
  },
  {
    id: "cool-5",
    name: "Dawlance Inverter Heat & Cool Split AC",
    category: "cooling",
    brand: "Dawlance",
    image: "/product_ac.png",
    imageFilter: "hue-rotate(180deg) saturate(0.1) brightness(1.1)",
    rating: 4.6,
    reviews: 19,
    specs: [
      "Gold Fin Condenser Protection",
      "Dual Rotary Compressor",
      "4D Air Throw (All Directions)",
      "Energy Class A++ rating",
      "Low Noise Indoor Unit"
    ],
    badge: "Popular"
  },
  {
    id: "cool-6",
    name: "Al-Umer Retro Single-Door Refrigerator",
    category: "cooling",
    brand: "Al-Umer Premium",
    image: "/product_refrigerator_red.png",
    imageFilter: "none",
    rating: 4.5,
    reviews: 12,
    specs: [
      "220L Compact Capacity",
      "Classic 1950s Retro Aesthetics",
      "Direct Cool Manual Defrost",
      "Built-in Voltage Stabilizer",
      "Vibrant Red Glossy Finish"
    ],
    badge: "Vintage Style"
  },
  {
    id: "cool-7",
    name: "Haier Deep Freezer Double Door",
    category: "cooling",
    brand: "Haier",
    image: "/product_refrigerator.png",
    imageFilter: "hue-rotate(120deg) brightness(0.95)",
    rating: 4.7,
    reviews: 14,
    specs: [
      "350L Capacity",
      "Super Fast Freezing (Down to -30°C)",
      "Convertible System (Fridge or Freezer)",
      "Balanced Hinge for Hands-free Use",
      "Embossed Aluminum Inner Liner"
    ],
    badge: "Hot Seller"
  },
  {
    id: "cool-8",
    name: "Kenwood 1.0 Ton Split Inverter AC",
    category: "cooling",
    brand: "Kenwood",
    image: "/product_ac_black.png",
    imageFilter: "contrast(1.2) brightness(0.8)",
    rating: 4.5,
    reviews: 10,
    specs: [
      "Real T3 Tropical Compressor (Up to 53°C)",
      "75% Eco Energy Saving Mode",
      "Low Voltage Operation (Starts at 150V)",
      "3-in-1 Health Filter System",
      "Hidden LED Display Panel"
    ],
    badge: "Smart Choice"
  },
  {
    id: "cool-9",
    name: "Dawlance French-Door Glass Refrigerator",
    category: "cooling",
    brand: "Dawlance",
    image: "/product_refrigerator_silver.png",
    imageFilter: "hue-rotate(45deg) saturate(1.2)",
    rating: 4.8,
    reviews: 21,
    specs: [
      "520L Capacity",
      "French Door Layout with bottom drawer",
      "Vitri-Cool Fresh Meat Zone",
      "Touch Control Interface on Glass Door",
      "Premium Charcoal Gray Glass Finish"
    ],
    badge: "Luxury Choice"
  },
  {
    id: "cool-10",
    name: "Al-Umer Floor Standing AC 2.0 Ton",
    category: "cooling",
    brand: "Al-Umer Premium",
    image: "/product_ac.png",
    imageFilter: "brightness(0.9) sepia(0.2) contrast(1.1)",
    rating: 4.7,
    reviews: 11,
    specs: [
      "High Airflow Columnar Cabinet design",
      "DC Inverter Rotary Compressor",
      "Smart touch console panel",
      "Heavy duty 15m air throw",
      "Clean white aesthetic with gold trim"
    ],
    badge: "New Arrival"
  },

  // ==================== LAUNDRY (10 items) ====================
  {
    id: "wash-1",
    name: "Dawlance Front-Load Automatic Washing Machine",
    category: "laundry",
    brand: "Dawlance",
    image: "/product_washer.png",
    imageFilter: "none",
    rating: 4.9,
    reviews: 18,
    specs: [
      "9.0 kg Wash Capacity",
      "Inverter Direct Drive Motor (Super Quiet)",
      "1400 RPM Spin Speed",
      "Hygiene Steam & Allergen-Free Cycle",
      "Elegant Titanium Gray Finish"
    ],
    badge: "Premium Choice"
  },
  {
    id: "wash-2",
    name: "Haier Top-Load Auto Washing Machine",
    category: "laundry",
    brand: "Haier",
    image: "/product_top_washer.png",
    imageFilter: "none",
    rating: 4.8,
    reviews: 28,
    specs: [
      "12kg Wash Capacity",
      "Pillow Drum for Delicate Fabrics",
      "Smart Fuzzy Logic Control",
      "Anti-Bacterial Pulsator Technology",
      "Direct Drive Smart Motor"
    ],
    badge: "Best Seller"
  },
  {
    id: "wash-3",
    name: "Dawlance Top-Load Auto Washing Machine",
    category: "laundry",
    brand: "Dawlance",
    image: "/product_top_washer.png",
    imageFilter: "hue-rotate(240deg) saturate(1.2)",
    rating: 4.7,
    reviews: 14,
    specs: [
      "8.5kg Capacity",
      "Triple Waterfall Wash System",
      "Soft-Closing Tempered Glass Lid",
      "Pro-Fabric Drum Pattern",
      "Deep Clean Stain Target Cycle"
    ],
    badge: "Highly Rated"
  },
  {
    id: "wash-4",
    name: "Haier Front-Load Washer-Dryer Combo",
    category: "laundry",
    brand: "Haier",
    image: "/product_washer.png",
    imageFilter: "contrast(1.3) brightness(0.85)",
    rating: 4.9,
    reviews: 22,
    specs: [
      "10kg Wash / 6kg Condenser Dry",
      "Direct Motion Inverter Motor",
      "Air Wash odor-removal technology",
      "Smart Remote App via WiFi",
      "Premium Dark Chrome Cabinet"
    ],
    badge: "All-in-One"
  },
  {
    id: "wash-5",
    name: "Al-Umer Twin-Tub Semi-Automatic Washer",
    category: "laundry",
    brand: "Al-Umer Premium",
    image: "/product_top_washer.png",
    imageFilter: "hue-rotate(180deg) saturate(0.5)",
    rating: 4.5,
    reviews: 12,
    specs: [
      "10kg Wash / 7kg Spin Capacity",
      "Double Action Wave Pulsator",
      "Heavy-duty Rustproof Plastic Body",
      "Dual Air Dry Spin Technology",
      "High Efficiency Copper Motor"
    ],
    badge: "Budget Friendly"
  },
  {
    id: "wash-6",
    name: "Dawlance Front-Load Signature Washer",
    category: "laundry",
    brand: "Dawlance",
    image: "/product_washer_white.png",
    imageFilter: "none",
    rating: 4.6,
    reviews: 19,
    specs: [
      "8.0 kg Capacity",
      "AquaWave Drum Technology",
      "StainCare 24-program Selector",
      "Eco-Friendly Whisper Silent Wash",
      "Pure White Modern Finish"
    ],
    badge: "Popular"
  },
  {
    id: "wash-7",
    name: "Super Asia Double-Tub Washing Machine",
    category: "laundry",
    brand: "Super Asia",
    image: "/product_top_washer.png",
    imageFilter: "brightness(0.9) contrast(1.1)",
    rating: 4.6,
    reviews: 16,
    specs: [
      "12kg Large Wash Tub",
      "High-Power Waterproof Copper Motor",
      "Turbo Air Dry Spin Tub",
      "Shockproof Double Wall Cabinet",
      "2-Year Warranty"
    ],
    badge: "Classic Durability"
  },
  {
    id: "wash-8",
    name: "Haier Top-Load Super Drum Washer",
    category: "laundry",
    brand: "Haier",
    image: "/product_top_washer.png",
    imageFilter: "hue-rotate(60deg) brightness(0.8) contrast(1.2)",
    rating: 4.8,
    reviews: 15,
    specs: [
      "15kg King Size Capacity",
      "Super-wide Drum for blankets and sheets",
      "Direct Motion Motor with Lifetime Warranty",
      "One-touch Smart Auto Wash Program",
      "Elegant Black Steel body"
    ],
    badge: "Heavy Duty"
  },
  {
    id: "wash-9",
    name: "Samsung Front-Load Ecobubble Washer",
    category: "laundry",
    brand: "Samsung",
    image: "/product_washer_white.png",
    imageFilter: "hue-rotate(45deg) saturate(1.2)",
    rating: 4.9,
    reviews: 20,
    specs: [
      "9.0 kg capacity",
      "Ecobubble Active Foam Tech",
      "Hygiene Steam Sanitize Cycle",
      "Digital Inverter with Smart Check",
      "Premium Stainless steel look"
    ],
    badge: "Smart Wash"
  },
  {
    id: "wash-10",
    name: "Al-Umer Compact Auto Washing Machine",
    category: "laundry",
    brand: "Al-Umer Premium",
    image: "/product_top_washer.png",
    imageFilter: "sepia(0.2) contrast(1.2) brightness(0.9)",
    rating: 4.4,
    reviews: 8,
    specs: [
      "6.5kg Space-saving Slim cabinet",
      "Full Smart Memory Backup",
      "Tempered Glass Top Panel",
      "Stainless Steel Honeycomb Tub",
      "Low water-pressure start"
    ],
    badge: "Compact Space"
  },

  // ==================== KITCHEN (10 items) ====================
  {
    id: "kitchen-1",
    name: "Glass-Top 4-Burner Built-in Gas Hob",
    category: "kitchen",
    brand: "Al-Umer Premium",
    image: "/product_kitchen_hob.png",
    imageFilter: "none",
    rating: 4.7,
    reviews: 12,
    specs: [
      "8mm Heavy-Duty Tempered Glass Surface",
      "Auto Battery Pulse Ignition",
      "Heavy Cast Iron Pan Supports",
      "High-Flame Brass Burners",
      "Flame Failure Safety Device"
    ],
    badge: "Hot Seller"
  },
  {
    id: "kitchen-2",
    name: "Dawlance Digital Convection Microwave Oven",
    category: "kitchen",
    brand: "Dawlance",
    image: "/product_microwave.png",
    imageFilter: "none",
    rating: 4.8,
    reviews: 15,
    specs: [
      "30L Cook Cavity",
      "Convection, Grill & Solo Modes",
      "15 Built-in Auto-Cook Menus",
      "Stainless Steel Internal Cavity",
      "Sleek Mirror Glass Front Panel"
    ],
    badge: "Best Seller"
  },
  {
    id: "kitchen-3",
    name: "Haier Solo Microwave Oven",
    category: "kitchen",
    brand: "Haier",
    image: "/product_microwave.png",
    imageFilter: "hue-rotate(240deg) saturate(0.5)",
    rating: 4.6,
    reviews: 20,
    specs: [
      "20L Compact Capacity",
      "Intuitive Mechanical Dial Controls",
      "6 Power Levels for versatile cooking",
      "Speed Defrost Weight Selector",
      "Classic Glossy Black Finish"
    ],
    badge: "Simple & Durable"
  },
  {
    id: "kitchen-4",
    name: "Al-Umer Premium 5-Burner Cooking Range",
    category: "kitchen",
    brand: "Al-Umer Premium",
    image: "/product_kitchen_hob.png",
    imageFilter: "sepia(0.3) brightness(1.1)",
    rating: 4.7,
    reviews: 11,
    specs: [
      "High Grade Stainless Steel Body",
      "Double Glass Insulated Oven Door",
      "Rotisserie Grill with Electric motor",
      "Precision Gas Thermostat",
      "Tempered Glass lid cover"
    ],
    badge: "Professional Range"
  },
  {
    id: "kitchen-5",
    name: "Gaba National Air-Fryer Microwave",
    category: "kitchen",
    brand: "Gaba National",
    image: "/product_microwave.png",
    imageFilter: "hue-rotate(180deg) brightness(0.9)",
    rating: 4.5,
    reviews: 9,
    specs: [
      "25L Hybrid Cook System",
      "Built-in Air Fryer heater & fan",
      "Digital touch control panel",
      "Child safety key lock",
      "Non-stick interior baking tray"
    ],
    badge: "Convection Pro"
  },
  {
    id: "kitchen-6",
    name: "Al-Umer Glass-Top 3-Burner Gas Stove",
    category: "kitchen",
    brand: "Al-Umer Premium",
    image: "/product_kitchen_hob.png",
    imageFilter: "hue-rotate(90deg) saturate(0.6)",
    rating: 4.6,
    reviews: 14,
    specs: [
      "Countertop free-standing design",
      "Tornado flame high-efficiency burners",
      "Auto piezo ignition (no battery needed)",
      "Tempered glass easy-to-clean top",
      "Sturdy cast-iron trivets"
    ],
    badge: "Utility Choice"
  },
  {
    id: "kitchen-7",
    name: "Haier Cooker Hood / Range Hood",
    category: "kitchen",
    brand: "Haier",
    image: "/product_kitchen_hob.png",
    imageFilter: "hue-rotate(180deg) contrast(1.2)",
    rating: 4.7,
    reviews: 18,
    specs: [
      "Tempered Glass Canopy Wall mount",
      "Hand Gesture Touchless Motion Control",
      "Dual copper motors with 1200 m³/h suction",
      "Stainless steel baffle filter (dishwasher safe)",
      "Energy efficient dual LED lights"
    ],
    badge: "Modern Smart"
  },
  {
    id: "kitchen-8",
    name: "Dawlance Grill Microwave Oven",
    category: "kitchen",
    brand: "Dawlance",
    image: "/product_microwave.png",
    imageFilter: "hue-rotate(300deg) saturate(1.2)",
    rating: 4.7,
    reviews: 17,
    specs: [
      "23L Capacity",
      "Powerful Quartz Heating Grill",
      "Express cooking function",
      "Elegant mirror glass exterior",
      "Tactile touch controller buttons"
    ],
    badge: "Popular Choice"
  },
  {
    id: "kitchen-9",
    name: "Al-Umer Premium Built-in Induction Hob",
    category: "kitchen",
    brand: "Al-Umer Premium",
    image: "/product_kitchen_hob.png",
    imageFilter: "brightness(0.75) contrast(1.4)",
    rating: 4.8,
    reviews: 10,
    specs: [
      "Dual Cooking Induction Zones",
      "9 Power Level Slide touch controllers",
      "Automatic pot detection & safety shutoff",
      "Child lock & hot indicator warning lights",
      "Ultra-thin ceramic glass surface"
    ],
    badge: "Futuristic Cooking"
  },
  {
    id: "kitchen-10",
    name: "Super Asia Single Burner Stainless Stove",
    category: "kitchen",
    brand: "Super Asia",
    image: "/product_kitchen_hob.png",
    imageFilter: "sepia(0.5) hue-rotate(20deg) brightness(1.2)",
    rating: 4.4,
    reviews: 7,
    specs: [
      "Heavy duty single gas stove countertop",
      "Stainless steel anti-rust body",
      "Auto piezo ignition system",
      "High flame efficiency brass burner cap",
      "Anti-skid rubber feet support"
    ],
    badge: "Single Cook"
  },

  // ==================== ENTERTAINMENT (10 items) ====================
  {
    id: "ent-1",
    name: "55\" 4K Ultra HD QLED Smart TV",
    category: "entertainment",
    brand: "Haier",
    image: "/product_smart_tv.png",
    imageFilter: "none",
    rating: 4.9,
    reviews: 32,
    specs: [
      "55-inch QLED Display Panel",
      "4K Ultra HD (3840 x 2160) Resolution",
      "Google TV OS with Play Store & Chromecast",
      "Dolby Vision & Dolby Atmos Audio",
      "Frameless Bezel-less Metallic Design"
    ],
    badge: "Trending"
  },
  {
    id: "ent-2",
    name: "TCL 65\" 4K UHD LED Smart TV",
    category: "entertainment",
    brand: "TCL",
    image: "/product_smart_tv.png",
    imageFilter: "hue-rotate(90deg)",
    rating: 4.8,
    reviews: 40,
    specs: [
      "65-inch giant screen size",
      "Android TV OS with voice assistant remote",
      "High Dynamic Range (HDR10) processor",
      "Dolby Audio 24W Stereo speakers",
      "Thin frame minimalist aesthetics"
    ],
    badge: "Cinematic Size"
  },
  {
    id: "ent-3",
    name: "Haier 43\" Full HD Smart Android TV",
    category: "entertainment",
    brand: "Haier",
    image: "/product_smart_tv.png",
    imageFilter: "hue-rotate(180deg)",
    rating: 4.7,
    reviews: 26,
    specs: [
      "43-inch screen size (ideal for bedrooms)",
      "Full HD (1080p) native panel",
      "Official Android TV OS with Chromecast",
      "Google Assistant remote control integration",
      "Slim bezels, dual stand legs"
    ],
    badge: "Best Seller"
  },
  {
    id: "ent-4",
    name: "Samsung 75\" Crystal 4K UHD Smart TV",
    category: "entertainment",
    brand: "Samsung",
    image: "/product_smart_tv.png",
    imageFilter: "hue-rotate(240deg)",
    rating: 4.9,
    reviews: 15,
    specs: [
      "75-inch Crystal UHD display screen",
      "Samsung Tizen Smart Hub OS",
      "PurColor enhancer & Crystal Processor 4K",
      "HDR10+ with contrast enhancer",
      "Slim Fit Wall Mount compatible"
    ],
    badge: "Ultimate View"
  },
  {
    id: "ent-5",
    name: "Al-Umer 32\" Bezel-less Smart LED",
    category: "entertainment",
    brand: "Al-Umer Premium",
    image: "/product_smart_tv.png",
    imageFilter: "hue-rotate(300deg)",
    rating: 4.5,
    reviews: 14,
    specs: [
      "32-inch HD Ready screen",
      "Built-in WiFi and smart applications",
      "Netflix, YouTube and Facebook pre-loaded",
      "HDMI, USB and Audio output jacks",
      "Frameless aesthetic at budget scale"
    ],
    badge: "Value Smart"
  },
  {
    id: "ent-6",
    name: "Sony 55\" Bravia XR OLED Smart TV",
    category: "entertainment",
    brand: "Sony",
    image: "/product_smart_tv.png",
    imageFilter: "contrast(1.3) saturate(1.4) hue-rotate(45deg)",
    rating: 4.9,
    reviews: 28,
    specs: [
      "55-inch premium OLED panel (deepest blacks)",
      "Cognitive Processor XR picture chip",
      "Acoustic Surface Audio+ (screen is speaker)",
      "Google TV OS with Apple AirPlay support",
      "One-slate screen premium design"
    ],
    badge: "OLED Masterpiece"
  },
  {
    id: "ent-7",
    name: "TCL 50\" 4K QLED Google TV",
    category: "entertainment",
    brand: "TCL",
    image: "/product_smart_tv.png",
    imageFilter: "saturate(1.8) hue-rotate(120deg)",
    rating: 4.7,
    reviews: 22,
    specs: [
      "50-inch QLED quantum dot color panel",
      "120Hz Dual Line Gate high refresh rate",
      "Game Master mode with low input lag",
      "Dolby Atmos surround audio output",
      "Hands-free voice remote controls"
    ],
    badge: "Gamer Choice"
  },
  {
    id: "ent-8",
    name: "Samsung 65\" Neo QLED 8K Smart TV",
    category: "entertainment",
    brand: "Samsung",
    image: "/product_smart_tv.png",
    imageFilter: "brightness(0.9) hue-rotate(150deg)",
    rating: 4.9,
    reviews: 8,
    specs: [
      "65-inch Neo QLED display with Mini LEDs",
      "Native 8K Resolution panel",
      "Neural Quantum Processor 8K AI upscale",
      "Ultra Viewing Angle with Anti-Reflection",
      "Infinity One design (invisible frame)"
    ],
    badge: "Flagship 8K"
  },
  {
    id: "ent-9",
    name: "Al-Umer 40\" Full HD LED TV",
    category: "entertainment",
    brand: "Al-Umer Premium",
    image: "/product_smart_tv.png",
    imageFilter: "contrast(1.1) brightness(1.05) hue-rotate(200deg)",
    rating: 4.6,
    reviews: 11,
    specs: [
      "40-inch screen size",
      "Full HD native (1920x1080) panel",
      "IPS wide viewing angle panel",
      "VGA, Dual HDMI, Dual USB ports",
      "Energy efficient power draw"
    ],
    badge: "Reliable Standard"
  },
  {
    id: "ent-10",
    name: "Haier 85\" Ultra 4K QLED Theater TV",
    category: "entertainment",
    brand: "Haier",
    image: "/product_smart_tv.png",
    imageFilter: "saturate(0.6) contrast(1.1) hue-rotate(330deg)",
    rating: 4.9,
    reviews: 10,
    specs: [
      "85-inch super giant home theater screen",
      "QLED panel with wide color spectrum",
      "120Hz high refresh rate panel (MEMC)",
      "Dolby Vision IQ & Dolby Atmos surround",
      "Full Metal body and premium stand"
    ],
    badge: "Home Theater"
  }
];

// Categories Info
const CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "cooling", label: "Refrigerators & ACs" },
  { id: "laundry", label: "Washing Machines" },
  { id: "kitchen", label: "Stoves & Kitchenware" },
  { id: "entertainment", label: "Smart TVs & LEDs" }
];

export default function StorefrontHomePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [inquiryProduct, setInquiryProduct] = useState(null);

  // Filter products
  const filteredProducts = activeCategory === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  // WhatsApp Inquiry link helper
  const getWhatsAppLink = (productName) => {
    const message = encodeURIComponent(`As-salamu alaykum Al-Umer Electronics. I am interested in inquiring about the "${productName}". Please let me know its availability and current deal details.`);
    return `https://wa.me/923008443856?text=${message}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300">

      {/* 1. HERO SECTION */}
      <section className="relative h-[600px] w-full overflow-hidden bg-black md:h-[650px] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 h-full w-full">
          <Image
            src="/al_umer_storefront.png"
            alt="Al-Umer Electronics Showroom"
            fill
            priority
            className="object-cover object-center scale-105 opacity-60"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/35 dark:from-zinc-950" />
        </div>

        {/* Content */}
        <div className="relative z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-4 animate-pulse">
              <ShieldCheck size={12} />
              Official Brand Dealer
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block text-zinc-300 text-sm sm:text-base font-semibold tracking-widest uppercase mb-2">
                Welcome to Al-Umer Electronics Center
              </span>
              <span className="block bg-gradient-to-r from-white via-zinc-100 to-emerald-400 bg-clip-text text-transparent pb-1">
                Your Home, Upgraded
              </span>
            </h1>

            <p className="mt-4 text-base text-zinc-300 sm:text-lg leading-relaxed">
              Explore premium home appliances, kitchen suite setups, automatic laundry machines, air conditioners, and smart entertainment systems. Located at Bedian Road, Lahore. Trusted products with official warranties.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#products"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-500 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShoppingBag size={16} />
                Browse Products
              </a>

              <Link
                href="/tournament"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-500/35 bg-zinc-900/40 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-zinc-200 transition-all duration-300 hover:bg-zinc-800/80 hover:text-white hover:-translate-y-0.5 active:translate-y-0"
              >
                <Trophy size={16} className="text-amber-400" />
                Tournament Dashboard
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
      </section>

      {/* 2. STATS & USP SECTION */}
      <section className="relative -mt-16 z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-4 p-2">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/40 p-3 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Official Warranty</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                All products come with genuine, authorized brand warranties for complete peace of mind.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-2 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 sm:pl-6">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/40 p-3 text-emerald-600 dark:text-emerald-400">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Local Safe Delivery</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Carefully handled transportation and delivery directly to your home across Lahore and nearby areas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-2 border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 sm:pl-6">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-950/40 p-3 text-emerald-600 dark:text-emerald-400">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Dedicated Store Support</h3>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Contact our showroom at 0300 8443856 for inquiries, installations, and customized orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT SHOWCASE */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Featured Appliances
          </h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Browse our handpicked selection of top-performing, energy-efficient appliances from leading international brands.
          </p>

          {/* Interactive Categories Navigation */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition-all duration-300 ${activeCategory === category.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-900 dark:border-zinc-850 dark:text-zinc-300 dark:hover:border-zinc-700"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-300 bg-white shadow-md shadow-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none hover:shadow-xl dark:hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Badge */}
              <span className="absolute top-4 left-4 z-20 rounded-lg bg-zinc-900/90 dark:bg-zinc-950/90 text-white border border-zinc-700/50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest">
                {product.badge}
              </span>

              {/* Product Image Panel */}
              <div className="relative h-56 w-full rounded-t-2xl overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: product.imageFilter || "none" }}
                />
              </div>

              {/* Product Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                      {product.brand}
                    </span>
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{product.rating}</span>
                      <span className="text-[10px] text-zinc-400">({product.reviews})</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm tracking-tight leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>

                  {/* Bullet Specs */}
                  <ul className="mt-4 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    {product.specs.slice(0, 3).map((spec, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span className="leading-snug">{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  {/* Action buttons */}
                  <button
                    onClick={() => setInquiryProduct(product)}
                    className="w-full text-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. TOURNAMENT SPONSORSHIP PROMOTION BANNER */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/70 backdrop-blur-md shadow-2xl p-8 md:p-12 lg:flex lg:items-center lg:justify-between gap-8">
          {/* Decorative Glow */}
          <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">
              <Trophy size={12} className="animate-bounce" />
              Title Sponsor
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl leading-tight">
              Al-Umer Electronics <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                Sports Gala 2026 Season 3
              </span>
            </h2>

            <p className="mt-4 text-sm md:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We are proud to sponsor the biggest local cricket tournament of the year, featuring 48 top-tier teams competing for the ultimate championship title. Track live scores, fixtures, stats, and redemption brackets directly on our portal.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/tournament"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-500 hover:shadow-lg transition-all"
              >
                Go to Tournament Dashboard
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/fixtures"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-6 py-3 font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                View Matches & Fixtures
              </Link>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0 flex justify-center z-10 shrink-0">
            {/* Visual card mimicking a ticket or live bracket */}
            <div className="relative bg-gradient-to-br from-emerald-500/10 to-teal-600/5 dark:from-emerald-500/5 dark:to-teal-900/10 border border-emerald-500/20 rounded-2xl p-6 w-80 shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-500/25 pb-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Live Stage</span>
                <span className="text-[10px] font-extrabold uppercase bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  Active
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Total Pool</h4>
                  <p className="text-xl font-extrabold text-zinc-900 dark:text-white">48 Local Teams</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/40 dark:bg-zinc-900/40 rounded-xl p-3 border border-zinc-150 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-400">Sections</span>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white">A, B & C</p>
                  </div>
                  <div className="bg-white/40 dark:bg-zinc-900/40 rounded-xl p-3 border border-zinc-150 dark:border-zinc-850">
                    <span className="text-[10px] text-zinc-400">Format</span>
                    <p className="text-base font-bold text-zinc-900 dark:text-white">Double Chance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STORE INFO, OPENING TIMINGS & MAP */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 items-stretch">

          {/* Details column (left) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Visit Our Store
              </h2>
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Come visit the Al-Umer Electronics Center showroom to see appliances in action. Experience build quality, touch and test control panels, and consult with our friendly sales experts.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-850 shadow-sm">
                <MapPin size={22} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide">Location Address</h4>
                  <p className="mt-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Al-Umer Electronics Center
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Bedian Road, Heir, Lahore, Punjab, Pakistan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-850 shadow-sm">
                <Phone size={22} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide">Phone & Inquiry</h4>
                  <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Call showroom or text on WhatsApp for details:
                  </p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    0300 8443856
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-850 shadow-sm">
                <Clock size={22} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wide">Store Timings</h4>
                  <p className="mt-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    09:00 AM – 07:00 PM
                  </p>
                  <p className="text-[11px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                    Monday to Sunday (Closed on Friday)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Styled interactive map mock column (right) */}
          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-850 p-4 shadow-xl flex flex-col justify-between min-h-[350px]">
            {/* Map Area */}
            <div className="relative flex-1 rounded-2xl bg-zinc-100 dark:bg-zinc-950 overflow-hidden border border-zinc-200 dark:border-zinc-850 flex items-center justify-center p-6 min-h-[250px]">
              {/* Grid abstract background */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Modern styled vector representation of map */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/0 dark:to-teal-500/0 pointer-events-none" />

              {/* Map roads mock lines */}
              <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute h-0.5 w-full bg-zinc-600 top-1/3 left-0 rotate-12" />
                <div className="absolute h-0.5 w-full bg-zinc-600 top-2/3 left-0 -rotate-6" />
                <div className="absolute w-0.5 h-full bg-zinc-600 top-0 left-1/3 rotate-45" />
                <div className="absolute w-0.5 h-full bg-zinc-600 top-0 left-2/3 -rotate-12" />
              </div>

              {/* Map Locator Ping */}
              <div className="relative flex flex-col items-center justify-center text-center p-4 z-20">
                <span className="relative flex h-8 w-8 mb-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-8 w-8 bg-emerald-500 items-center justify-center text-white shadow-md">
                    <MapPin size={16} />
                  </span>
                </span>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Al-Umer Electronics Center</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                  Main Bedian Road near Heir, Lahore, Punjab, Pakistan
                </p>
                <span className="text-[10px] text-emerald-500 font-extrabold mt-2 tracking-wider uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Phone: 0300 8443856
                </span>
              </div>
            </div>

            {/* Google maps CTA */}
            <div className="mt-3.5 flex items-center justify-between gap-4 px-2">
              <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 leading-normal">
                Open location directly on Google Maps app for directions.
              </span>
              <a
                href="https://maps.google.com/?q=Al-Umer+Electronics+Center+Bedian+Rd+Heir+Lahore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 shrink-0 transition"
              >
                Get Directions
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRODUCT SPECS DETAIL MODAL (INLINE COMPONENT) */}
      {inquiryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setInquiryProduct(null)}
              className="absolute top-4 right-4 rounded-lg p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg">
                {inquiryProduct.brand}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">{inquiryProduct.badge}</span>
            </div>

            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white leading-tight">
              {inquiryProduct.name}
            </h3>

            {/* Product Image in modal */}
            <div className="relative h-48 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl my-4 flex items-center justify-center p-4">
              <Image
                src={inquiryProduct.image}
                alt={inquiryProduct.name}
                fill
                className="object-contain"
                style={{ filter: inquiryProduct.imageFilter || "none" }}
              />
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Technical Specifications</h4>
            <ul className="space-y-2 mb-6">
              {inquiryProduct.specs.map((spec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span>{spec}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-end border-t border-zinc-150 dark:border-zinc-850 pt-4 mt-4 w-full">
              <button
                onClick={() => setInquiryProduct(null)}
                className="w-full text-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
