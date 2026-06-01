import { serve } from "std/http/server.ts"
import { createClient } from "supabase"
import { getAdExpirationReminderEmail, getAdExpiredEmail as _getAdExpiredEmail } from "../_shared/templates.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (_req: Request) => {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  try {
    // 1. Clean up expired boosts
    const { error: expireError } = await supabase.rpc('expire_boosts')
    if (expireError) throw expireError

    // 2. Handle Boost Expiration Reminders (5, 4, 3, 2, 1, 0 days)
    const intervals = [5, 4, 3, 2, 1, 0]
    for (const days of intervals) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + days)
      const dateString = targetDate.toISOString().split('T')[0] // Just the date part

      const { data: reminderListings, error: reminderError } = await supabase
        .rpc('get_boosts_expiring_on', { target_date: dateString })

      if (reminderError) throw reminderError

      for (const listing of reminderListings) {
        const email = listing.contact_email || listing.owner_email
        if (email) {
          const subject = days === 0 
            ? `Your Premium Boost for "${listing.title}" expires today!`
            : `Your Premium Boost for "${listing.title}" is expiring in ${days} day${days === 1 ? '' : 's'}`
          
          await sendEmail(
            email, 
            subject, 
            getAdExpirationReminderEmail(listing.title, days)
          )
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})

async function sendEmail(to: string, subject: string, html: string) {
  return await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Canada Telugu Classifieds <notifications@canadateluguclassifieds.com>',
      to,
      subject,
      html,
    }),
  })
}
