import RegisterForm from "@/components/RegisterForm";

export const metadata = {
  title: "Register Team | Al-Umer Sports Gala Season 3",
  description:
    "Register your captain account and team for Al-Umer Electronics Sports Gala Season 3",
};

export default function RegisterPage() {
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

      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <RegisterForm />
      </div>
    </div>
  );
}
