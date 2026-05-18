import { eventBus } from "../core/events/EventBus";
import { trackInteraction } from "../services/socialGraph";

export type FollowUserCommand = {
  sourceUserId: string;
  targetUserId: string;
};

export async function executeFollowUserCommand(command: FollowUserCommand): Promise<void> {
  if (!command.sourceUserId || !command.targetUserId) throw new Error("source and target are required");
  await trackInteraction(command.sourceUserId, command.targetUserId, 8);
  await eventBus.publish({
    type: "user.followed",
    stream: "social",
    actor: { id: command.sourceUserId },
    target: { id: command.targetUserId, type: "user", userId: command.targetUserId },
    payload: command,
    metadata: { source: "FollowUserCommand" },
  });
}
