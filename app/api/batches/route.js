import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function GET() {
  try {
    const [a,s]=await Promise.all([
      sb.from('bw_ad_performance').select('batch_name').order('batch_name',{ascending:false}),
      sb.from('bw_search_terms').select('batch_name').order('batch_name',{ascending:false}),
    ]);
    return Response.json({
      adBatches:[...new Set(a.data?.map(r=>r.batch_name)||[])],
      stBatches:[...new Set(s.data?.map(r=>r.batch_name)||[])],
    });
  } catch(err){return Response.json({error:err.message},{status:500});}
}