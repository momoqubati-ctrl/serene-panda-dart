import { UserProfileDefaults } from "./userProfileDefaults";

type DbProfileRow = {
  idreg: string;
  lid: string;
  uid: string;
  profileMsg: string;
  bio: string | null;
  mood: string | null;
  customStatus: string | null;
  stealth: boolean | null;
  youtubeUrl: string | null;
  autoplayEnabled: boolean | null;
  avatarUrl: string | null;
  bannerUrl: string;
  themeId: string;
  avatarFrameUrl: string;
  giftIconUrl: string;
  profileIconUrl: string;
  nameGradient: string;
  nameEffectId: string;
  messageBubbleStyle: string;
  profileAccentColor: string;
  profileBackgroundUrl: string;
  backgroundColor: string;
  messageColor: string;
  nameColor: string;
  gradientColor: string;
  evaluation: number;
  rep: number;
  coins: number;
  wallPostLikes: number;
  giftsReceivedCount: number;
  power: string;
  icon: string;
  isLogin: string;
  muted: boolean;
  documents: boolean;
  busy: boolean;
  alerts: boolean;
  nopmcall: boolean;
  nopmvideocall: boolean;
  roomId: string;
  siteBadgeId: string;
  siteBadge: string;
  joinuser: number;
};

export const profileDefaultsToDb = (profile: UserProfileDefaults) => ({
  idreg: profile.idreg,
  lid: profile.lid,
  uid: profile.uid,
  profileMsg: profile.profileMsg,
  bio: profile.bio,
  mood: profile.mood,
  customStatus: profile.customStatus,
  stealth: profile.stealth,
  youtubeUrl: profile.youtubeUrl,
  autoplayEnabled: profile.autoplayEnabled,
  avatarUrl: profile.avatar,
  bannerUrl: profile.profileBannerUrl,
  themeId: profile.profileThemeId,
  avatarFrameUrl: profile.avatarFrameUrl,
  giftIconUrl: profile.giftIconUrl,
  profileIconUrl: profile.profileIconUrl,
  nameGradient: profile.nameGradient,
  nameEffectId: profile.nameEffectId,
  messageBubbleStyle: profile.messageBubbleStyle,
  profileAccentColor: profile.profileAccentColor,
  profileBackgroundUrl: profile.profileBackgroundUrl,
  backgroundColor: profile.backgroundColor,
  messageColor: profile.messageColor,
  nameColor: profile.nameColor,
  gradientColor: profile.gradientColor,
  evaluation: profile.evaluation,
  rep: profile.rep,
  coins: profile.coins,
  wallPostLikes: profile.wallPostLikes,
  giftsReceivedCount: profile.giftsReceivedCount,
  power: profile.power,
  icon: profile.icon,
  isLogin: profile.isLogin,
  muted: profile.muted,
  documents: profile.documents,
  busy: profile.busy,
  alerts: profile.alerts,
  nopmcall: profile.nopmcall,
  nopmvideocall: profile.nopmvideocall,
  roomId: profile.roomId,
  siteBadgeId: profile.siteBadgeId,
  siteBadge: profile.siteBadge,
  joinuser: profile.joinuser,
});

export const dbProfileToPublic = (profile: DbProfileRow): UserProfileDefaults => ({
  idreg: profile.idreg,
  lid: profile.lid,
  uid: profile.uid,
  profileMsg: profile.profileMsg,
  bio: profile.bio || "",
  mood: profile.mood || "",
  customStatus: profile.customStatus || "",
  stealth: profile.stealth ?? false,
  youtubeUrl: profile.youtubeUrl || "",
  autoplayEnabled: profile.autoplayEnabled ?? false,
  avatar: profile.avatarUrl || "",
  profileCover: profile.bannerUrl,
  profileBannerUrl: profile.bannerUrl,
  profileThemeId: profile.themeId,
  avatarFrameUrl: profile.avatarFrameUrl,
  giftIconUrl: profile.giftIconUrl,
  profileIconUrl: profile.profileIconUrl,
  nameGradient: profile.nameGradient,
  nameEffectId: profile.nameEffectId,
  messageBubbleStyle: profile.messageBubbleStyle,
  profileAccentColor: profile.profileAccentColor,
  profileBackgroundUrl: profile.profileBackgroundUrl,
  backgroundColor: profile.backgroundColor,
  messageColor: profile.messageColor,
  nameColor: profile.nameColor,
  gradientColor: profile.gradientColor,
  evaluation: profile.evaluation,
  rep: profile.rep,
  coins: profile.coins,
  wallPostLikes: profile.wallPostLikes,
  giftsReceivedCount: profile.giftsReceivedCount,
  power: profile.power,
  icon: profile.icon,
  giftIcon: profile.giftIconUrl,
  isLogin: profile.isLogin === "زائر" ? "زائر" : "عضو",
  muted: profile.muted,
  documents: profile.documents,
  busy: profile.busy,
  alerts: profile.alerts,
  nopmcall: profile.nopmcall,
  nopmvideocall: profile.nopmvideocall,
  roomId: profile.roomId,
  siteBadgeId: profile.siteBadgeId,
  siteBadge: profile.siteBadge,
  joinuser: profile.joinuser,
});
