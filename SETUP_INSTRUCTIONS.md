# Supabase Setup Instructions

## ✅ Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ujgdkuhztbtzseqotbpe
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API**
4. Scroll down to find **Project API keys**
5. Copy the **`service_role`** key (⚠️ This is secret - never expose it publicly!)
6. Paste it in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Step 2: Get Your Database Connection String

1. In Supabase Dashboard, go to **Settings** > **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string (it will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.ujgdkuhztbtzseqotbpe.supabase.co:5432/postgres`)
5. Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project)
6. Paste the complete string in `.env.local` as `DATABASE_URL`

**Note:** If you forgot your database password, you can reset it in Settings > Database > Reset database password

## ✅ Step 3: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `salon-assets`
4. Make it **Public** (so images can be accessed without auth)
5. Click **Create bucket**

## ✅ Step 4: Generate Session Secret

Run this command in your terminal to generate a secure random session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it in `.env.local` as `SESSION_SECRET`

## ✅ Step 5: Configure Resend API Key

If you already have a Resend API key, paste it in `.env.local` as `RESEND_API_KEY`

If you don't have one:
1. Go to https://resend.com
2. Sign up/login
3. Get your API key from the dashboard
4. Add it to `.env.local`

## ✅ Step 6: Set Super Admin Email

Replace `admin@example.com` in `.env.local` with the email address you want to use as super admin.

## ✅ Step 7: Test Your Setup

1. Make sure all values in `.env.local` are filled in
2. Run `npm install` to install dependencies
3. Try running the dev server: `npm run dev`

## 🔒 Security Notes

- **Never commit `.env.local` to git** - it's already in `.gitignore`
- The `service_role` key has full access to your database - keep it secret!
- The `anon` key is safe to use in client-side code
- The `SESSION_SECRET` should be a long random string

## 📝 Quick Checklist

- [ ] Service role key added to `.env.local`
- [ ] Database connection string added to `.env.local` (with password)
- [ ] Storage bucket `salon-assets` created in Supabase
- [ ] Session secret generated and added
- [ ] Resend API key added (if using email)
- [ ] Super admin email configured
- [ ] All environment variables filled in

