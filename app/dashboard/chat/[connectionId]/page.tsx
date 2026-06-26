import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatView } from './chat-view'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ connectionId: string }>
}) {
  const { connectionId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: connection } = await supabase
    .from('connections')
    .select(
      'id, status, seeker_id, volunteer_id, seeker:seeker_id(alias), volunteer:volunteer_id(alias)',
    )
    .eq('id', connectionId)
    .single()

  if (!connection) notFound()

  const isMember =
    connection.seeker_id === user.id || connection.volunteer_id === user.id
  if (!isMember) notFound()

  const otherAlias =
    user.id === connection.seeker_id
      ? (connection.volunteer as any)?.alias
      : (connection.seeker as any)?.alias

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true })

  return (
    <ChatView
      connectionId={connectionId}
      initialMessages={messages ?? []}
      currentUserId={user.id}
      otherAlias={otherAlias ?? 'Usuario'}
    />
  )
}
