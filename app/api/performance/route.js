import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function GET(request) {
  const { searchParams: p } = new URL(request.url);
  const batch=p.get('batch'), groupBy=p.get('groupBy')||'property_description';
  const cat=p.get('category'), lic=p.get('licensing'), prop=p.get('property');
  try {
    // Get ads data joined with catalog
    let adQ=sb.from('bw_ad_performance').select('asin,impressions,clicks,spend,sales_14d,orders_14d,units_14d,ctr,acos,roas,batch_name');
    if(batch) adQ=adQ.eq('batch_name',batch);
    const {data:ads,error:adErr}=await adQ.limit(50000);
    if(adErr) return Response.json({error:adErr.message},{status:500});
    if(!ads||ads.length===0) return Response.json({data:[],batches:[]});

    // Get distinct batches
    const {data:batches}=await sb.from('bw_ad_performance').select('batch_name').order('batch_name',{ascending:false});
    const batchList=[...new Set(batches?.map(r=>r.batch_name)||[])];

    // Get catalog for the ASINs
    const asins=[...new Set(ads.map(a=>a.asin).filter(Boolean))];
    const {data:catalog}=await sb.from('products').select('asin,category,division,licensing,property_description,image_url').in('asin',asins.slice(0,5000));
    const catMap={};
    (catalog||[]).forEach(r=>{ catMap[r.asin]=r; });

    // Join and aggregate
    const grouped={};
    for(const row of ads){
      const prod=catMap[row.asin]||{};
      if(cat && prod.category!==cat) continue;
      if(lic && prod.licensing!==lic) continue;
      if(prop && prod.property_description!==prop) continue;
      const key=prod[groupBy]||'(unknown)';
      if(!grouped[key]) grouped[key]={key,impressions:0,clicks:0,spend:0,sales:0,orders:0,units:0,asin_count:new Set(),image_url:prod.image_url||null,category:prod.category,licensing:prod.licensing,property:prod.property_description};
      grouped[key].impressions+=row.impressions||0;
      grouped[key].clicks+=row.clicks||0;
      grouped[key].spend+=row.spend||0;
      grouped[key].sales+=row.sales_14d||0;
      grouped[key].orders+=row.orders_14d||0;
      grouped[key].units+=row.units_14d||0;
      grouped[key].asin_count.add(row.asin);
    }
    const result=Object.values(grouped).map(r=>({
      ...r, asin_count:r.asin_count.size,
      acos:r.sales>0?Math.round(r.spend/r.sales*10000)/100:0,
      roas:r.spend>0?Math.round(r.sales/r.spend*100)/100:0,
      ctr:r.impressions>0?Math.round(r.clicks/r.impressions*10000)/100:0,
    })).sort((a,b)=>b.spend-a.spend);
    return Response.json({data:result,batches:batchList});
  } catch(err){return Response.json({error:err.message},{status:500});}
}