import { currentUser } from "@/lib/auth";
import { getChannels, getMessages } from "./actions";
import ChatClient from "@/components/chat/ChatClient";

export default async function ChatPage() {
  const user = await currentUser();
  const channels = await getChannels();
  const firstChannel = channels[0];
  const initialMessages = firstChannel
    ? await getMessages(firstChannel.id)
    : [];

  return (
    <ChatClient
      channels={channels}
      initialMessages={initialMessages}
      initialChannelId={firstChannel?.id ?? ""}
      currentUserId={user?.id ?? null}
    />
  );
}
