import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Shield, Verified, MapPin } from "lucide-react";

interface ProfileHeaderProps {
  profile: any;
  user: any;
}

export function ProfileHeader({ profile, user }: ProfileHeaderProps) {
  const isOnline = user.presence === "online";

  return (
    <div className="relative">
      {/* Cover Image */}
      <div 
        className="h-40 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${profile.bannerUrl || '/pich.png'})` }}
      />
      
      {/* Avatar & Basic Info */}
      <div className="absolute -bottom-12 right-6 flex items-end gap-4">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-background ring-2 ring-primary/20">
            <AvatarImage src={profile.avatarUrl || '/pic.png'} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>
          
          {/* Online Indicator */}
          <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-background ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          
          {/* Frame Support */}
          {profile.avatarFrameUrl && (
            <img 
              src={profile.avatarFrameUrl} 
              alt="Frame" 
              className="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none"
            />
          )}
        </div>

        <div className="pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-foreground" style={{ color: profile.nameColor || 'inherit' }}>
              {user.displayName}
            </h2>
            {profile.documents && <Verified className="w-5 h-5 text-blue-500" />}
            {user.role === 'admin' && <Shield className="w-5 h-5 text-red-500" />}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{profile.idreg}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{user.countryCode}</span>
            </div>
            {profile.bio && (
              <>
                <span>•</span>
                <span className="italic">{profile.bio}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
