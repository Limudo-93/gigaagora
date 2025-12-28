import { Button } from "@/components/ui/button";
import { logout } from "@/app/logout/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="outline" type="submit">
        Sair
      </Button>
    </form>
  );
}
