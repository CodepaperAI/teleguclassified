import { serve } from "std/http/server.ts"
import { createClient as _createClient } from "supabase"
import { 
  getWelcomeEmail, 
  getAdApprovedEmail, 
  getAdBlockedEmail, 
  getAdExpirationReminderEmail as _getAdExpirationReminderEmail, 
  getAdExpiredEmail as _getAdExpiredEmail, 
  getInquiryEmail, 
  getPaymentConfirmationEmail,
  getAccountBlockedEmail,
  getAccountUnblockedEmail,
  getBoostActivatedEmail
} from "../_shared/templates.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const INTERNAL_EMAIL_KEY = Deno.env.get('INTERNAL_EMAIL_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const body = await req.json()
    console.log('Received email request body:', JSON.stringify(body, null, 2))

    // Basic Authentication (Internal Key OR Supabase JWT)
    const authHeader = req.headers.get('Authorization')
    const internalKey = req.headers.get('x-internal-key')
    const _apiKeyHeader = req.headers.get('apikey')

    console.log('Environment checks:', {
      hasResendKey: !!RESEND_API_KEY,
      hasInternalKeyEnv: !!INTERNAL_EMAIL_KEY,
    })

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Resend API Key' }), { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      })
    }

    console.log('Auth header check:', { 
      hasInternalKey: !!internalKey, 
      internalMatch: INTERNAL_EMAIL_KEY && internalKey === INTERNAL_EMAIL_KEY,
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length || 0
    })

    const isAuthorized = (INTERNAL_EMAIL_KEY && internalKey === INTERNAL_EMAIL_KEY) || 
                       (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7)

    if (!isAuthorized) {
      console.error('Unauthorized request: Invalid credentials')
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid or missing authentication.'
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 401,
      })
    }

    // Handle both event/type and payload structure vs flat structure
    const event = body.event || body.type
    const payload = body.payload || body
    // Get 'to' from top level or from inside payload
    const to = body.to || payload.to
    
    let htmlContent = payload.html
    let subject = payload.subject

    if (!event) {
      throw new Error('Event type is missing in request body')
    }

    if (!to) {
      throw new Error('Recipient email (to) is missing in request')
    }

    // Set default subjects if missing
    if (!subject) {
      switch (event) {
        case 'welcome': subject = 'Welcome to Canada Telugu Classifieds!'; break
        case 'ad_status_change': subject = 'Ad Status Update'; break
        case 'new_inquiry': subject = 'New Inquiry Received'; break
        case 'payment_confirmation': subject = 'Payment Confirmation'; break
        case 'account_block': subject = 'Account Status Update'; break
        case 'listing_boosted': subject = 'Listing Boost Activated'; break
        default: subject = 'Notification from Canada Telugu Classifieds';
      }
    }

    switch (event) {
      case 'welcome':
        htmlContent = getWelcomeEmail(payload.name || 'User')
        break
      case 'ad_status_change': {
        const adStatus = payload.status || payload.new_status
        if (adStatus === 'active') {
          subject = 'Your Ad is Live!'
          htmlContent = getAdApprovedEmail(payload.title || 'Your Ad', payload.listingId || payload.id)
        } else {
          subject = 'Your Ad has been Blocked'
          htmlContent = getAdBlockedEmail(payload.title || 'Your Ad', payload.reason || 'Violation of terms')
        }
        break
      }
      case 'new_inquiry':
        htmlContent = getInquiryEmail(payload.listing_title || 'Your Listing', payload.sender_name || 'Someone', payload.message || 'No message content')
        break
      case 'payment_confirmation':
        htmlContent = getPaymentConfirmationEmail(
          payload.order_id || 'N/A', 
          payload.amount || '0.00', 
          payload.plan || 'Service',
          payload.metadata || {}
        )
        break
      case 'account_block':
        htmlContent = payload.action === 'unblock'
          ? getAccountUnblockedEmail(payload.name || 'User')
          : getAccountBlockedEmail(payload.name || 'User', payload.is_blocked || false, payload.block_features || {})
        break
      case 'listing_boosted':
        htmlContent = getBoostActivatedEmail(payload.title || 'Your Ad', payload.plan_label || 'Premium')
        break
    }

    console.log(`Attempting to send ${event} email via Resend:`, {
      to: to,
      subject: subject,
      from: 'notifications@canadateluguclassifieds.com'
    })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Canada Telugu Classifieds <notifications@canadateluguclassifieds.com>',
        to: to,
        subject: subject,
        html: htmlContent,
      }),
    })

    const resData = await res.json()
    console.log('Resend API Response:', JSON.stringify(resData))

    if (!res.ok) {
      console.error('Resend API Error:', JSON.stringify(resData))
      throw new Error(resData.message || `Resend API returned ${res.status}`)
    }

    return new Response(JSON.stringify(resData), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 400,
    })
  }
})
