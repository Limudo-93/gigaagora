import { Button } from "@/components/ui/button";
import { logout } from "@/app/logout/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button
        variant="outline"
        type="submit"
        className="border-white/30 bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all duration-200"
      >
        Sair
      </Button>
    </form>
  );
}
