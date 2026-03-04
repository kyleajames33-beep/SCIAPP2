const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log("Testing connection to:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { data, error, count } = await supabase.from('Question').select('*', { count: 'exact' });
  if (error) console.error("CONN ERROR:", error);
  else console.log("CONN SUCCESS: Question table has", count, "rows.");
}
test();
