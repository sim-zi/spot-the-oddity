import { createClient } from "@liveblocks/client";
import { createLiveblocksContext, createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

// Presence - 사용자가 현재 보고 있는 것
type Presence = {
  cursor: { x: number; y: number } | null;
};

// Storage - 영구 저장 데이터 (지식 저장용)
type Storage = {
  // Liveblocks Storage는 Room 단위로 동작
  // 우리는 REST API로 저장할 예정
};

// User metadata
type UserMeta = {
  id: string;
  info: {
    name: string;
  };
};

// Room event types
type RoomEvent = {
  type: "KNOWLEDGE_CREATED";
  knowledgeId: string;
};

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useBroadcastEvent,
  useEventListener,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);

export const {
  LiveblocksProvider,
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
} = createLiveblocksContext(client);
