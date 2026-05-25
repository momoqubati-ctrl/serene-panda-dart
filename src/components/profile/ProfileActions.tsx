import { useSocket } from "../realtime/SocketProvider";
import { Button } from "../ui/button";
import { MessageCircle, UserPlus, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileActionsProps {
  profileId: string;
}

export function ProfileActions({ profileId }: ProfileActionsProps) {
  const { socket } = useSocket();

  const handleFollow = () => {
    socket?.emit("profile:follow", { profileId }, (res: any) => {
      if (res.success) {
        toast.success("تمت المتابعة بنجاح!");
      } else {
        toast.error(res.error || "حدث خطأ أثناء المتابعة");
      }
    });
  };

  return (
    <div className="flex gap-3">
      <Button 
        onClick={handleFollow} 
        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2"
      >
        <UserPlus className="w-4 h-4" />
        متابعة
      </Button>
      
      <Button variant="outline" className="flex-1 gap-2">
        <MessageCircle className="w-4 h-4" />
        مراسلة
      </Button>
      
      <Button variant="secondary" className="gap-2">
        <Heart className="w-4 h-4" />
        إعجاب
      </Button>
      
      <Button variant="ghost" size="icon">
        <Share2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
