import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function GET(request) {
  const { searchParams: p } = new URL(request.url);
  const batch=p.get('batch'), srch=p.get('search'), sortBy=p.get('sort')||'spend';
  const page=parseInt(p.get('page')||'0'), limit=100;
  try {
    let q=sb.from('bw_search_terms').select('*',{count:'exact'}).range(page*limit,(page+1)*limit-1).order(sortBy,{ascending:false});
    if(batch) q=q.eq('batch_name',batch);
    if(srch) q=q.ilike('search_term','%'+srch+'%');
    const {data,count,error}=await q;
    if(error) return Response.json({error:error.message},{status:500});
    const {data:batches}=await sb.from('bw_search_terms').select('batch_name').order('batch_name',{ascending:false});
    const batchList=[...new Set(batches?.map(r=>r.batch_name)||[])];
    return Response.json({data,count,pages:Math.ceil((count||0)/limit),batches:batchList});
  } catch(err){return Response.json({error:err.message},{status:500});}
}