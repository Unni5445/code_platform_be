import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 mb-6">The page you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/dashboard")} leftIcon={<Home className="h-4 w-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
