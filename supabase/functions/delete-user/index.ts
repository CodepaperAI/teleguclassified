import { serve } from "std/http/server.ts"
import { createClient } from "supabase"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let userId: string | null = null;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create admin client to bypass RLS and delete from Auth
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the caller's JWT for authorization check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }

    const token = authHeader.replace('Bearer ', '')

    // Get target userId from body early
    const body = await req.json()
    userId = body?.userId
    
    if (!userId) {
      throw new Error('User ID is required for deletion')
    }

    // Scenario A: Request is signed with the Service Role Key (Trusted Server-to-Server)
    if (token === supabaseServiceKey) {
      console.log(`[Delete-User] Authorized via Service Role Key for target ${userId}`)
    } else {
      // Scenario B: Request is signed with a User JWT
      // Identify the caller
      const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token)

      if (callerError || !caller) {
        throw new Error('Invalid authorization token')
      }

      console.log(`[Delete-User] Request by ${caller.id} to delete ${userId}`)

      // 1. AUTHORIZATION CHECK
      let isAuthorized = false

      // Scenario B.1: User is deleting their own account
      if (caller.id === userId) {
        isAuthorized = true
      } else {
        // Scenario B.2: Caller is an admin
        const { data: adminUser, error: adminError } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('id', caller.id)
          .single()

        if (!adminError && adminUser) {
          isAuthorized = true
        }
      }

      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: 'Unauthorized: You do not have permission to delete this account.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        })
      }
    }

    // 2. COMPREHENSIVE CLEANUP
    
    // Get user details for privacy wipe (email)
    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
    const targetEmail = targetUser?.email

    console.log(`[Delete-User] Wiping data for: ${userId} (${targetEmail || 'No Email'})`)

    // Simple table deletions
    await supabaseAdmin.from('team_members').delete().eq('user_id', userId)
    await supabaseAdmin.from('payments').delete().eq('user_id', userId)
    await supabaseAdmin.from('listing_ledger').delete().eq('user_id', userId)
    await supabaseAdmin.from('user_credits').delete().eq('user_id', userId)
    await supabaseAdmin.from('admin_users').delete().eq('id', userId)
    await supabaseAdmin.from('favorites').delete().eq('user_id', userId)

    // Chat cleanup
    const { data: rooms } = await supabaseAdmin
      .from('chat_rooms')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

    if (rooms && rooms.length > 0) {
      const roomIds = rooms.map(r => r.id)
      await supabaseAdmin.from('chat_messages').delete().in('room_id', roomIds)
      await supabaseAdmin.from('chat_rooms').delete().in('id', roomIds)
    }

    // Privacy Wipe: Email Logs
    if (targetEmail) {
      // Cast the table name to bypass types since it might not be in the generated types yet
      const table = 'email_logs' as never
      await supabaseAdmin.from(table).delete().eq('recipient', targetEmail)
    }

    // Storage cleanup (Avatars and Listings)
    const buckets = ['avatars', 'listings']
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId)
        if (files && files.length > 0) {
          const filePaths = files
            .filter(f => f.name !== '.emptyFolderPlaceholder')
            .map(f => `${userId}/${f.name}`)
          
          if (filePaths.length > 0) {
            await supabaseAdmin.storage.from(bucket).remove(filePaths)
          }
        }
      } catch (err) {
        console.warn(`[Delete-User] Storage error in ${bucket}:`, err)
      }
    }

    // Delete Listings
    await supabaseAdmin.from('listings').delete().eq('user_id', userId)

    // Delete Profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    // 3. FINAL AUTH DELETE
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      throw authDeleteError
    }

    console.log(`[Delete-User] Successfully wiped user ${userId}`)

    return new Response(JSON.stringify({ success: true, message: `Account ${userId} removed.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const error = err as Error;
    console.error(`[Delete-User] Error deleting user ${userId}:`, error.message)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unknown error occurred during user deletion' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

