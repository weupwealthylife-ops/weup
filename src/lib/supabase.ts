import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://tnkydfulsrzihlohchhc.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRua3lkZnVsc3J6aWhsb2hjaGhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzM2NjYsImV4cCI6MjA4OTYwOTY2Nn0.ZIlHCk1FtEjdUriF8ikWIEttz9G9Xk1ddzTvFJnqcLw'

export const sb = createClient(SUPA_URL, SUPA_KEY)
