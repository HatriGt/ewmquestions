# Supabase Setup Instructions

## 1. Database Setup

1. Go to your Supabase project: https://supabase.com/dashboard/project/tftiznxajayvfripufdy
2. Navigate to the SQL Editor
3. Execute the SQL from `supabase_schema.sql` to create the table

## 2. Environment Variables

Update your `.env.local` file with the correct credentials from your Supabase project:

```bash
# Get these from: Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://tftiznxajayvfripufdy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

## 3. Getting Your Anon Key

1. Go to Project Settings > API in your Supabase dashboard
2. Copy the "anon public" key 
3. Replace the placeholder in `.env.local`

## 4. Features Implemented

### Admin Panel with Supabase Storage
- ✅ Real-time persistence to Supabase database
- ✅ Visual indicators for modified questions
- ✅ Export/Import functionality 
- ✅ Database connection testing
- ✅ Reset all modifications option

### Benefits over localStorage
- ✅ Persistent across devices and browsers
- ✅ Shared modifications between users
- ✅ Backup and restore capabilities
- ✅ Production-ready deployment on Vercel

## 5. Testing

1. Run the development server: `npm run dev`
2. Navigate to `/admin`
3. Click "Test DB" to verify Supabase connection
4. Edit a question and save it
5. Refresh the page - changes should persist!

## 6. Deployment

The Supabase integration works seamlessly with Vercel deployment. Just ensure your environment variables are set in the Vercel dashboard.