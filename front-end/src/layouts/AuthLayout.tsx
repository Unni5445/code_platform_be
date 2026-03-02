import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CodePlatform</h1>
          <p className="text-primary-200 text-sm mt-1">Super Admin Portal</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
