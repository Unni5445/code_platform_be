import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center mc-page">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary-400">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-white">Page Not Found</h2>
        <p className="mb-8 text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link to="/dashboard">
          <Button leftIcon={<Home className="h-4 w-4" />}>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
