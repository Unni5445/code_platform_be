import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen mc-page flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 w-full max-w-[1600px] mx-auto">
        <Header />
        <main className="p-4 sm:p-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
