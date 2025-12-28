import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LogoutButton from "@/app/dashboard/LogoutButton";


export default function ProfileHeader() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src="" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>

        <div>
          <h2 className="text-lg font-semibold">João Silva</h2>
          <p className="text-sm text-muted-foreground">São Paulo, SP</p>
          <div className="mt-1">
            <Badge variant="secondary">Músico</Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
  <Button variant="outline">Alternar Papel</Button>
  <Button>Editar Perfil</Button>
  <LogoutButton />
</div>
    
    </div>
  );
}
