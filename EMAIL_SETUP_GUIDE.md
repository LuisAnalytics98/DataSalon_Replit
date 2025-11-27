# Email Notification Setup Guide

## Overview
The booking system sends email notifications to both clients and admins when a booking is created. This guide helps you configure and troubleshoot email notifications.

## Required Configuration

### 1. Resend API Key
You must set the `RESEND_API_KEY` environment variable with your Resend API key.

**How to get your Resend API key:**
1. Sign up at https://resend.com
2. Go to API Keys section
3. Create a new API key
4. Copy the key and set it as `RESEND_API_KEY` in your environment variables

### 2. From Email Address (Recommended)
Set `RESEND_FROM_EMAIL` to a verified domain email address.

**Options:**
- **Option A (Recommended):** Use a verified domain (e.g., `noreply@yourdomain.com`)
  - Add and verify your domain in Resend
  - Set `RESEND_FROM_EMAIL=noreply@yourdomain.com`
  
- **Option B:** Use default Resend email (limited)
  - System will use `noreply@resend.dev` by default
  - **Note:** This has delivery limitations and may not work for all recipients

### 3. Base URL for Email Links
The system automatically detects the base URL, but you can set it explicitly:

- `VERCEL_URL` - Automatically set by Vercel
- `REPLIT_DOMAINS` - For Replit deployments
- `NEXT_PUBLIC_APP_URL` - Custom app URL

## What Emails Are Sent

### Client Email
- **Recipient:** The client who made the booking
- **Subject:** "Confirmación de Cita - [Salon Name] - [Date]"
- **Content:**
  - Booking reference number
  - Service details
  - Stylist name
  - Date and time
  - Price and reservation amount (if applicable)
  - Confirmation and cancellation links
  - Salon contact information

### Admin Email
- **Recipients:** All salon owners and admins (users with role "owner" or "admin")
- **Subject:** "🔔 Nueva Reserva - [Client Name] - [Date] [Time]"
- **Content:**
  - Notification badge
  - Complete booking details
  - Client contact information
  - Link to admin panel
  - Client notes (if any)

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**
   ```bash
   # Verify RESEND_API_KEY is set
   echo $RESEND_API_KEY
   
   # Should output your API key (not empty, not "your-resend-api-key")
   ```

2. **Check Server Logs**
   Look for these log messages:
   - `📧 Initiating email send for booking...` - Email send started
   - `📧 Resend client initialized. From email: ...` - Client initialized
   - `✅ Email sent successfully to client: ...` - Client email sent
   - `✅ Email sent successfully to admin: ...` - Admin email sent
   - `❌ Error sending confirmation email:` - Error occurred

3. **Common Issues**

   **Issue: "RESEND_API_KEY not set"**
   - **Solution:** Set the `RESEND_API_KEY` environment variable
   - **Where:** Vercel dashboard → Settings → Environment Variables

   **Issue: "Failed to initialize email service"**
   - **Solution:** Check that your Resend API key is valid and active
   - **Check:** Log into Resend dashboard and verify API key status

   **Issue: "No admin/owner emails found"**
   - **Solution:** Ensure salon users have email addresses in the database
   - **Check:** Users must have role "owner" or "admin" and a valid email

   **Issue: Emails sent but not received**
   - **Check spam folder**
   - **Verify email address is correct**
   - **Check Resend dashboard for delivery status**
   - **Ensure RESEND_FROM_EMAIL uses a verified domain (not noreply@resend.dev)**

4. **Test Email Configuration**
   
   Check server logs when creating a booking. You should see:
   ```
   📧 Initiating email send for booking [id] to client [email]
   📧 Resend client initialized. From email: [email]
   📧 Attempting to send confirmation email to client: [email]
   ✅ Email sent successfully to client: [email] (Email ID: [id])
   📧 Found X admin/owner email(s) for salon [name]
   ✅ Email sent successfully to admin: [email] (Email ID: [id])
   ```

## Environment Variables Checklist

- [ ] `RESEND_API_KEY` - Your Resend API key (REQUIRED)
- [ ] `RESEND_FROM_EMAIL` - Verified domain email (RECOMMENDED)
- [ ] `VERCEL_URL` - Automatically set by Vercel (if deployed on Vercel)
- [ ] `NEXT_PUBLIC_APP_URL` - Your app URL (optional, for custom deployments)

## Testing

1. Create a test booking through the booking flow
2. Check server logs for email sending status
3. Verify emails are received in both client and admin inboxes
4. Check spam folders if emails don't arrive
5. Verify confirmation/cancellation links work correctly

## Support

If emails still don't work after checking the above:
1. Check Resend dashboard for API usage and errors
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test with a simple email first to verify Resend configuration

