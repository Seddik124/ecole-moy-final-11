import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://greqiufvqsahwovuquop.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZXFpdWZ2cXNhaHdvdnVxdW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NzAzMTQsImV4cCI6MjA5ODI0NjMxNH0.6AxFbhCa0ba6JDYrHrM64lQvzL0Nd8HEKrdl5rVbc5Y';

export const supabase = createClient(supabaseUrl, supabaseKey);
