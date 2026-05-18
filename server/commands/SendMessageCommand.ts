import { addMessage, type ChatMessage } from "../services/chatStore";

export type SendMessageCommand = {
  roomId: string;
  clientId?: string;
  user?: string;
  role?: ChatMessage["role"];
  text: string;
  avatar?: string;
  countryCode?: string;
};

export async function executeSendMessageCommand(command: SendMessageCommand): Promise<ChatMessage> {
  if (!command.roomId?.trim()) throw new Error("roomId is required");
  if (!command.text?.trim()) throw new Error("message text is required");
  return addMessage(command);
}
