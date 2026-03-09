import { Link } from "react-router-dom";
import { Button } from "@/components/ui";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard">
          <Button leftIcon={<Home className="h-4 w-4" />}>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
