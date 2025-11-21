# User Invitation Guide - Fixing Email Confirmation Links

## Problem
When sending invitation links from Supabase to user emails, the confirmation link is wrong and users can't confirm their email.

## Root Cause
The issue is that Supabase uses the **Site URL** and **Redirect URLs** configured in the Supabase Dashboard to generate confirmation links. If these are not set correctly, the links will point to the wrong domain.

## Solution

### Step 1: Configure Supabase Email Confirmation Redirect URLs

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **ujgdkuhztbtzseqotbpe**
3. Navigate to: **Authentication** → **URL Configuration**
   - Direct link: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration

4. **Set the Site URL** to your production domain:
   ```
   https://your-project-name.vercel.app
   ```
   Or for local development:
   ```
   http://localhost:5000
   ```

5. **Add Redirect URLs** for email confirmations. Add ALL of these:
   ```
   http://localhost:5000/api/callback
   http://localhost:5000/*
   https://your-project-name.vercel.app/api/callback
   https://your-project-name.vercel.app/*
   ```

   **Important:** The `/*` wildcard allows any path on your domain to receive auth callbacks, which is necessary for email confirmations.

6. **Configure Email Templates** (Optional but Recommended):
   - Go to: **Authentication** → **Email Templates**
   - Edit the "Confirm signup" template
   - The confirmation link will automatically use your configured redirect URLs

### Step 2: Use the API Endpoint to Invite Users (Recommended)

Instead of inviting users directly from Supabase Dashboard, use the new API endpoint that sets the correct redirect URL:

**API Endpoint:** `POST /api/superadmin/users/invite`

**Request Body:**
```json
{
  "email": "user@example.com",
  "role": "employee",
  "salonId": "salon-id-here",
  "redirectTo": "/admin"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

This endpoint:
- Creates the user invitation with the correct redirect URL
- Automatically uses your app's domain (from environment variables)
- Links the user to the specified salon with the correct role

### Step 3: Manual Invitation from Supabase Dashboard (Alternative)

If you prefer to invite users directly from Supabase Dashboard:

1. Go to: **Authentication** → **Users**
2. Click **"Invite user"**
3. Enter the email address
4. **Important:** The redirect URL will be automatically set based on your Site URL configuration

**However**, this method doesn't automatically:
- Link the user to a salon
- Set the user role
- You'll need to do this manually via the API after the user confirms their email

## Recommended Workflow for Adding New Users

### Option 1: Using the API Endpoint (Best Practice)

1. **As Super Admin**, use the admin panel or API to invite users:
   ```bash
   POST /api/superadmin/users/invite
   {
     "email": "employee@salon.com",
     "role": "employee",
     "salonId": "your-salon-id",
     "redirectTo": "/admin"
   }
   ```

2. The user receives an email with a confirmation link
3. The link points to: `https://your-domain.com/api/callback?token=...&type=signup`
4. After confirmation, the user is redirected to `/admin`
5. The user is automatically linked to the salon with the specified role

### Option 2: Manual Process

1. Invite user from Supabase Dashboard
2. User confirms email
3. User logs in for the first time
4. As Super Admin, assign user to salon via API:
   ```bash
   POST /api/superadmin/salon-users
   {
     "userId": "user-id-from-supabase",
     "salonId": "salon-id",
     "role": "employee"
   }
   ```

## Environment Variables Required

Make sure these are set in your `.env.local` and Vercel:

```env
SUPABASE_URL=https://ujgdkuhztbtzseqotbpe.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production  # or development
```

For production, also set:
```env
APP_URL=https://your-project-name.vercel.app
```

## Troubleshooting

### Issue: Confirmation link points to wrong domain

**Solution:**
1. Check your Supabase Site URL configuration
2. Verify redirect URLs include your production domain
3. Make sure `APP_URL` environment variable is set correctly

### Issue: "Invalid redirect URL" error

**Solution:**
1. Add your exact domain to Supabase Redirect URLs
2. Include both `/api/callback` and `/*` patterns
3. Use `https://` for production, `http://` for local development

### Issue: User can't log in after confirming email

**Solution:**
1. Verify the user was created in Supabase
2. Check if user is linked to a salon via `/api/superadmin/salon-users`
3. Ensure user has the correct role assigned

### Issue: Email not received

**Solution:**
1. Check spam folder
2. Verify email provider in Supabase is configured (Resend, SendGrid, etc.)
3. Check Supabase logs for email delivery errors

## Testing the Fix

1. **Test locally:**
   ```bash
   # Set Site URL in Supabase to: http://localhost:5000
   # Add redirect URL: http://localhost:5000/api/callback
   # Invite a test user
   # Check the confirmation link in the email
   ```

2. **Test in production:**
   ```bash
   # Set Site URL in Supabase to: https://your-domain.com
   # Add redirect URL: https://your-domain.com/api/callback
   # Invite a test user
   # Verify the confirmation link works
   ```

## Quick Reference

**Supabase Dashboard Links:**
- URL Configuration: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/url-configuration
- Email Templates: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/templates
- Users: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe/auth/users

**API Endpoints:**
- Invite User: `POST /api/superadmin/users/invite` - See `API_ENDPOINT_USAGE.md` for detailed examples
- Assign to Salon: `POST /api/superadmin/salon-users`
- Get All Users: `GET /api/superadmin/users`

**For detailed usage examples and code samples, see:** `API_ENDPOINT_USAGE.md`

