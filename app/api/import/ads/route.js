import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function POST(request) {
  try {
    if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
      return Response.json({error:'Unauthorized'},{status:401});
    const fd = await request.formData();
    const file = fd.get('file');
    const batchName = fd.get('batch') || new Date().toISOString().slice(0,10);
    if (!file) return Response.json({error:'No file'},{status:400});
    const text = await file.text();
    const allLines = text.split('\n');
    // SP reports have a summary row at top — skip until we find the header row
    let startIdx = 0;
    for (let i=0;i<allLines.length;i++){
      if (allLines[i].includes('Advertised ASIN') || allLines[i].includes('Campaign Name')) { startIdx=i; break; }
    }
    const lines = allLines.slice(startIdx);
    const hdrs = lines[0].replace(/\r/g,'').split(',');
    const ci = (n) => hdrs.findIndex(h=>h.trim()===n);
    const rows = [];
    for (let i=1;i<lines.length;i++){
      const line=lines[i].replace(/\r/g,'');
      if(!line.trim())continue;
      const cols=[];let inQ=false,cur='';
      for(const ch of line){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){cols.push(cur);cur='';}else{cur+=ch;}}
      cols.push(cur);
      const asin=cols[ci('Advertised ASIN')]?.trim()||cols[ci('ASIN')]?.trim();
      if(!asin||asin==='--')continue;
      const n=(s)=>parseFloat(cols[s]?.replace(/[%,]/g,''))||0;
      rows.push({
        batch_name:batchName,
        asin,
        advertised_sku:cols[ci('Advertised SKU')]?.trim()||null,
        campaign_name:cols[ci('Campaign Name')]?.trim()||null,
        ad_group_name:cols[ci('Ad Group Name')]?.trim()||null,
        targeting:cols[ci('Targeting')]?.trim()||null,
        impressions:parseInt(cols[ci('Impressions')])||0,
        clicks:parseInt(cols[ci('Clicks')])||0,
        spend:n(ci('Spend')),
        sales_14d:n(ci('14 Day Total Sales')),
        orders_14d:parseInt(cols[ci('14 Day Total Orders (#')]||cols[ci('14 Day Total Orders')]||'0')||0,
        units_14d:parseInt(cols[ci('14 Day Total Units (#')]||cols[ci('14 Day Total Units')]||'0')||0,
        ctr:n(ci('Click-Thru Rate (CTR)')),
        acos:n(ci('Total Advertising Cost of Sales (ACOS) %')),
        roas:n(ci('Total Return on Advertising Spend (ROAS)')),
      });
    }
    if(rows.length===0) return Response.json({error:'No valid rows found. Check CSV format.'},{status:400});
    let inserted=0;
    for(let i=0;i<rows.length;i+=500){
      const {error}=await sb.from('bw_ad_performance').insert(rows.slice(i,i+500));
      if(!error) inserted+=Math.min(500,rows.length-i);
    }
    return Response.json({success:true,total:rows.length,inserted,batch:batchName});
  } catch(err){return Response.json({error:err.message},{status:500});}
}