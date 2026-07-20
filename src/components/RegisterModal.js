"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCnic, validateCnic } from "@/lib/cnic";
import { compressImage } from "@/lib/compress-image";
import { User, Phone, MapPin, Users, Shield, Image as ImageIcon, CreditCard, UploadCloud, X } from "lucide-react";

export default function RegisterModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    captainName: "",
    fatherName: "",
    cnic: "",
    whatsapp: "",
    villageOrCity: "",
    password: "",
    confirmPassword: "",
    teamName: "",
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [cnicImage, setCnicImage] = useState(null);
  const [entryFeeImage, setEntryFeeImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-register", handleOpen);
    window.addEventListener("close-register", handleClose);

    return () => {
      window.removeEventListener("open-register", handleOpen);
      window.removeEventListener("close-register", handleClose);
    };
  }, []);

  if (!isOpen) return null;

  function handleCnicChange(e) {
    setForm({ ...form, cnic: formatCnic(e.target.value) });
    if (errors.cnic) setErrors({ ...errors, cnic: "" });
  }

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  }

  function handleWhatsappChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    handleChange("whatsapp", digits);
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.captainName || form.captainName.length < 3) {
      newErrors.captainName = "Captain Name must be at least 3 characters";
    }
    if (!form.fatherName || form.fatherName.length < 3) {
      newErrors.fatherName = "Father Name must be at least 3 characters";
    }
    if (!validateCnic(form.cnic)) {
      newErrors.cnic = "CNIC must be in format 35201-8511102-5";
    }
    if (!form.whatsapp || form.whatsapp.length !== 11 || !form.whatsapp.startsWith("03")) {
      newErrors.whatsapp = "Enter valid 11-digit WhatsApp (e.g. 03001234567)";
    }
    if (!form.villageOrCity || form.villageOrCity.length < 2) {
      newErrors.villageOrCity = "Village/City Name is required";
    }
    if (!form.teamName || form.teamName.length < 3) {
      newErrors.teamName = "Team Name must be at least 3 characters";
    }
    if (!profilePicture) {
      newErrors.profilePicture = "Profile picture is required";
    } else if (profilePicture.size > 5 * 1024 * 1024) {
      newErrors.profilePicture = "Image size must be less than 5MB";
    }
    if (!cnicImage) {
      newErrors.cnicImage = "CNIC upload is required";
    } else if (cnicImage.size > 5 * 1024 * 1024) {
      newErrors.cnicImage = "Image size must be less than 5MB";
    }
    if (!entryFeeImage) {
      newErrors.entryFeeImage = "Entry fee receipt is required";
    } else if (entryFeeImage.size > 5 * 1024 * 1024) {
      newErrors.entryFeeImage = "Image size must be less than 5MB";
    }
    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoadingStep("Compressing images...");
    try {
      const [profileOut, cnicOut, entryOut] = await Promise.all([
        compressImage(profilePicture),
        compressImage(cnicImage),
        compressImage(entryFeeImage),
      ]);

      const formData = new FormData();
      formData.append("captainName", form.captainName);
      formData.append("fatherName", form.fatherName);
      formData.append("cnic", form.cnic);
      formData.append("whatsapp", form.whatsapp);
      formData.append("villageOrCity", form.villageOrCity);
      formData.append("password", form.password);
      formData.append("teamName", form.teamName);
      formData.append("profilePicture", profileOut);
      formData.append("cnicImage", cnicOut);
      formData.append("entryFeeImage", entryOut);

      setLoadingStep("Creating your team...");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      setIsOpen(false);
      router.replace("/captain/dashboard");
      router.refresh();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 pl-11 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:focus:border-emerald-500 dark:focus:bg-zinc-900 outline-none";
  const errorInputClass = "border-red-500 focus:border-red-500 focus:ring-red-500/10";
  const labelClass = "mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Register Your Team
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Create your captain account (counts as 1 main player). <br className="hidden sm:block" />
              After login, add 6 more main + 2 reserved players.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
              <Shield className="h-5 w-5 flex-shrink-0" />
              <p>{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Info */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Captain Details
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Captain Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      value={form.captainName}
                      onChange={(e) => handleChange("captainName", e.target.value)}
                      className={`${inputClass} ${errors.captainName ? errorInputClass : ""}`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.captainName && <p className="mt-1 text-xs text-red-500">{errors.captainName}</p>}
                </div>
                <div>
                  <label className={labelClass}>Father Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      value={form.fatherName}
                      onChange={(e) => handleChange("fatherName", e.target.value)}
                      className={`${inputClass} ${errors.fatherName ? errorInputClass : ""}`}
                      placeholder="Enter father's name"
                    />
                  </div>
                  {errors.fatherName && <p className="mt-1 text-xs text-red-500">{errors.fatherName}</p>}
                </div>
                <div>
                  <label className={labelClass}>CNIC *</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      value={form.cnic}
                      onChange={handleCnicChange}
                      placeholder="35201-8511102-5"
                      maxLength={15}
                      className={`${inputClass} font-mono ${errors.cnic ? errorInputClass : ""}`}
                    />
                  </div>
                  {errors.cnic && <p className="mt-1 text-xs text-red-500">{errors.cnic}</p>}
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="03001234567"
                      maxLength={11}
                      value={form.whatsapp}
                      onChange={handleWhatsappChange}
                      className={`${inputClass} ${errors.whatsapp ? errorInputClass : ""}`}
                    />
                  </div>
                  {errors.whatsapp && <p className="mt-1 text-xs text-red-500">{errors.whatsapp}</p>}
                </div>
                <div>
                  <label className={labelClass}>Village or City Name *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      value={form.villageOrCity}
                      onChange={(e) => handleChange("villageOrCity", e.target.value)}
                      className={`${inputClass} ${errors.villageOrCity ? errorInputClass : ""}`}
                      placeholder="e.g., Lahore"
                    />
                  </div>
                  {errors.villageOrCity && <p className="mt-1 text-xs text-red-500">{errors.villageOrCity}</p>}
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Team Info */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                Team Details
              </h2>
              <div className="grid gap-5">
                <div>
                  <label className={labelClass}>Team Name *</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      value={form.teamName}
                      onChange={(e) => handleChange("teamName", e.target.value)}
                      className={`${inputClass} ${errors.teamName ? errorInputClass : ""}`}
                      placeholder="Enter your team name"
                    />
                  </div>
                  {errors.teamName && <p className="mt-1 text-xs text-red-500">{errors.teamName}</p>}
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Uploads */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-emerald-500" />
                Documents Upload
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Profile Picture *</label>
                  <div className="relative flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${errors.profilePicture ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className={`w-8 h-8 mb-2 ${errors.profilePicture ? 'text-red-400' : 'text-zinc-400'}`} />
                        <p className={`text-sm ${errors.profilePicture ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}><span className="font-semibold">Click to upload</span></p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setProfilePicture(e.target.files[0]);
                          if(errors.profilePicture) setErrors({...errors, profilePicture: ""});
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.profilePicture && <p className="mt-1 text-xs text-red-500 text-center">{errors.profilePicture}</p>}
                  {profilePicture && !errors.profilePicture && (
                    <div className="flex justify-center mt-2">
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile Preview"
                        className="h-24 w-24 object-cover rounded-full border-4 border-white shadow-lg dark:border-zinc-800"
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>CNIC Front Image *</label>
                  <div className="relative flex items-center justify-center w-full">
                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all ${errors.cnicImage ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-700'}`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CreditCard className={`w-8 h-8 mb-2 ${errors.cnicImage ? 'text-red-400' : 'text-zinc-400'}`} />
                        <p className={`text-sm ${errors.cnicImage ? 'text-red-500' : 'text-zinc-500 dark:text-zinc-400'}`}><span className="font-semibold">Click to upload</span></p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setCnicImage(e.target.files[0]);
                          if(errors.cnicImage) setErrors({...errors, cnicImage: ""});
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.cnicImage && <p className="mt-1 text-xs text-red-500 text-center">{errors.cnicImage}</p>}
                  {cnicImage && !errors.cnicImage && (
                    <div className="flex justify-center mt-2">
                      <img
                        src={URL.createObjectURL(cnicImage)}
                        alt="CNIC Preview"
                        className="h-24 w-40 object-cover rounded-lg border-4 border-white shadow-lg dark:border-zinc-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Entry Fee */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Tournament Entry Fee
              </h2>
              <div className="mb-4 rounded-lg bg-indigo-50 p-4 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-2">
                  Please submit your entry fee to the following account and upload the screenshot/receipt below.
                </p>
                <ul className="text-sm font-medium text-indigo-900 dark:text-indigo-200 space-y-1">
                  <li>Bank: <strong>Jazz Cash / Easy Paisa</strong></li>
                  <li>Account Title: <strong>Muhammad Shafiq</strong></li>
                  <li>Account Number: <strong>03047058705</strong></li>
                  <li>Amount: <strong>Rs. 5,000/-</strong></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Entry Fee Receipt <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-4 hover:border-indigo-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-500 dark:hover:bg-zinc-800">
                    <UploadCloud className="h-5 w-5 text-zinc-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {entryFeeImage ? entryFeeImage.name : "Upload Payment Screenshot"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setEntryFeeImage(e.target.files[0]);
                        if (errors.entryFeeImage) setErrors({ ...errors, entryFeeImage: "" });
                      }}
                    />
                  </label>
                </div>
                {errors.entryFeeImage && (
                  <p className="mt-1 text-xs text-red-500">{errors.entryFeeImage}</p>
                )}
              </div>
            </div>

            <hr className="border-zinc-100 dark:border-zinc-800" />

            {/* Security */}
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-500" />
                Security
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={`${inputClass} ${errors.password ? errorInputClass : ""}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className={`${inputClass} ${errors.confirmPassword ? errorInputClass : ""}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-700 hover:shadow-emerald-500/40 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? loadingStep || "Creating Account..." : "Register & Create Captain"}
              </button>
            </div>
            
            <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Already registered?{" "}
              <Link 
                href="/captain/login" 
                onClick={() => setIsOpen(false)}
                className="font-semibold text-emerald-600 hover:text-emerald-500 hover:underline"
              >
                Captain Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
