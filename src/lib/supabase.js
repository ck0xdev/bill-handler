import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase Project credentials
const SUPABASE_URL = 'https://npqaervwrmmofpgvhxsj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wcWFlcnZ3cm1tb2ZwZ3ZoeHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzg5OTUsImV4cCI6MjA4NTYxNDk5NX0.kLzxIFuAgsujVrx8zGcd265K7wGYy14hxLTTeHN1pB8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)