import { defineEventHandler } from "h3";
import { listChatBots } from "../../services/adminConfigService";

export default defineEventHandler(async () => {
  const bots = (await listChatBots()).filter((bot) => bot.isActive);
  return { success: true, bots };
});
