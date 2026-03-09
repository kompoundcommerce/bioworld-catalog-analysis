import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function GET(request) {
  const { searchParams: p } = new URL(request.url);
  const page=parseInt(p.get('page')||'0'), limit=48;
  try {
    let q=sb.from('products').select('seller_sku,asin,category,division,licensing,gender,item_type,property_description,image_url,licensing_status,status',{count:'exact'})
      .not('asin','is',null).range(page*limit,(page+1)*limit-1).order('property_description',{ascending:true});
    const cat=p.get('category'),lic=p.get('licensing'),prop=p.get('property'),div=p.get('division'),st=p.get('status'),srch=p.get('search');
    if(cat) q=q.eq('category',cat);
    if(lic) q=q.eq('licensing',lic);
    if(prop) q=q.eq('property_description',prop);
    if(div) q=q.eq('division',div);
    if(st) q=q.eq('status',st); else q=q.eq('status','Active');
    if(srch) q=q.or('seller_sku.ilike.%'+srch+'%,asin.ilike.%'+srch+'%,property_description.ilike.%'+srch+'%');
    const {data,count,error}=await q;
    if(error) return Response.json({error:error.message},{status:500});
    return Response.json({data,count,page,pages:Math.ceil((count||0)/limit)});
  } catch(err){return Response.json({error:err.message},{status:500});}
}