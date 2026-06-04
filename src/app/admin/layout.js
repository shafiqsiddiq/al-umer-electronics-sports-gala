import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      <AdminSidebar />
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
