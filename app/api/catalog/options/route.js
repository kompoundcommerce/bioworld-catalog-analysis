import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
export async function GET() {
  try {
    const [c,l,p,d]=await Promise.all([
      sb.from('products').select('category').eq('status','Active').not('category','is',null).order('category'),
      sb.from('products').select('licensing').eq('status','Active').not('licensing','is',null).not('licensing','eq','').order('licensing'),
      sb.from('products').select('property_description').eq('status','Active').not('property_description','is',null).not('property_description','eq','').order('property_description'),
      sb.from('products').select('division').eq('status','Active').not('division','is',null).order('division'),
    ]);
    return Response.json({
      categories:[...new Set(c.data?.map(r=>r.category)||[])],
      licenses:[...new Set(l.data?.map(r=>r.licensing)||[])],
      properties:[...new Set(p.data?.map(r=>r.property_description)||[])],
      divisions:[...new Set(d.data?.map(r=>r.division)||[])],
    });
  } catch(err){return Response.json({error:err.message},{status:500});}
}