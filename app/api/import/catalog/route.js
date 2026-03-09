import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function POST(request) {
  try {
    if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
      return Response.json({error:'Unauthorized'},{status:401});
    const fd = await request.formData();
    const file = fd.get('file');
    if (!file) return Response.json({error:'No file'},{status:400});
    const text = await file.text();
    const lines = text.split('\n');
    const hdrs = lines[0].replace(/\r/g,'').split(',');
    const ci = (n) => hdrs.indexOf(n);
    const rows = [];
    for (let i=1;i<lines.length;i++){
      const line=lines[i].replace(/\r/g,'');
      if(!line.trim())continue;
      const cols=[];let inQ=false,cur='';
      for(const ch of line){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){cols.push(cur);cur='';}else{cur+=ch;}}
      cols.push(cur);
      const sku=cols[ci('Seller SKU')]?.trim();
      if(!sku)continue;
      rows.push({seller_sku:sku,asin:cols[ci('ASIN')]?.trim()||null,listing_id:cols[ci('Listing ID')]?.trim()||null,
        product_id:cols[ci('Product ID')]?.trim()||null,status:cols[ci('Status')]?.trim()||null,
        category:cols[ci('Category')]?.trim()||null,division:cols[ci('Division')]?.trim()||null,
        licensing:cols[ci('Licensing')]?.trim()||null,gender:cols[ci('Gender')]?.trim()||null,
        item_type:cols[ci('Item Type')]?.trim()||null,property_description:cols[ci('Property Description')]?.trim()||null,
        image_url:cols[ci('Image')]?.trim()||null,item_type_attribute:cols[ci('Item Type Attribute')]?.trim()||null,
        licensing_status:cols[ci('LicensingStatus')]?.trim()||null,updated_at:new Date().toISOString()});
    }
    let inserted=0,errors=0;
    for(let i=0;i<rows.length;i+=500){
      const {error}=await sb.from('products').upsert(rows.slice(i,i+500),{onConflict:'seller_sku'});
      if(error){console.error(error);errors+=500;}else{inserted+=Math.min(500,rows.length-i);}
    }
    return Response.json({success:true,total:rows.length,inserted,errors});
  } catch(err){return Response.json({error:err.message},{status:500});}
}