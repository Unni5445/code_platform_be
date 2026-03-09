import { Outlet } from "react-router-dom";
import { GraduationCap, Shield } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Skill & Brains</span>
          </div>

          <Outlet />

          {/* Footer */}
          <p className="mt-8 text-sm text-gray-500">
            Need help?{" "}
            <a href="#" className="text-primary-600 font-medium hover:text-primary-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>

      {/* Right - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 relative overflow-hidden items-center justify-center">
        {/* Decorative clouds */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[5%] w-32 h-16 bg-white/20 rounded-full blur-xl" />
          <div className="absolute top-[20%] right-[10%] w-40 h-20 bg-white/15 rounded-full blur-xl" />
          <div className="absolute bottom-[15%] left-[15%] w-36 h-18 bg-white/15 rounded-full blur-xl" />
          <div className="absolute bottom-[25%] right-[5%] w-28 h-14 bg-white/20 rounded-full blur-xl" />
          <div className="absolute top-[50%] left-[40%] w-24 h-12 bg-white/10 rounded-full blur-lg" />
        </div>

        {/* Center content */}
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center h-32 w-32 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 border border-white/20">
            <Shield className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto">
            Manage courses, students, and certificates. Your complete education platform control center.
          </p>

          {/* Decorative dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div className="h-2 w-8 bg-white/60 rounded-full" />
            <div className="h-2 w-2 bg-white/30 rounded-full" />
            <div className="h-2 w-2 bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute top-8 right-8 h-16 w-16 border-2 border-white/20 rounded-2xl rotate-12" />
        <div className="absolute bottom-12 left-8 h-12 w-12 border-2 border-white/20 rounded-xl -rotate-12" />
        <div className="absolute top-1/4 left-12 h-4 w-4 bg-white/30 rounded-full" />
        <div className="absolute bottom-1/3 right-16 h-6 w-6 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}
