import { createClient, getUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { canInteractWith } from '@/app/safety/actions'
import { ChatView } from './chat-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chat' }

export default async function ChatPage({
  params,
}: {
  params: Promise<{ connectionId: string }>
}) {
  const { connectionId } = await params
  const supabase = await createClient()

  const user = await getUser()
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

  const isSeeker = user.id === connection.seeker_id
  const otherAlias = isSeeker
    ? (connection.volunteer as any)?.alias
    : (connection.seeker as any)?.alias
  const reportedId = isSeeker ? connection.volunteer_id : connection.seeker_id

  // Si hay bloqueo en cualquiera de los dos sentidos, la conversación no es
  // accesible ni siquiera entrando por URL directa
  if (!(await canInteractWith(reportedId))) notFound()

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
      reportedId={reportedId}
      initialStatus={connection.status as 'pending' | 'accepted' | 'rejected'}
      volunteerId={connection.volunteer_id}
    />
  )
}
