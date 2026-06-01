-- Migration: Fix Chat Update RLS
-- Description: Allow participants to update message read status and room metadata.

-- 1. Allow participants to mark messages in their rooms as read
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.chat_messages;
CREATE POLICY "Users can mark messages as read" ON public.chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_messages.room_id
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    )
  );

-- 2. Allow participants to update the last message info in the room
DROP POLICY IF EXISTS "Users can update their chat rooms" ON public.chat_rooms;
CREATE POLICY "Users can update their chat rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
