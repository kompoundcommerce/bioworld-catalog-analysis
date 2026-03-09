// @ts-nocheck
"use client";
import { useState, useEffect, useRef } from "react";

const C = {
  bg:"#070a0d", surface:"#0d1117", border:"#1c2333", muted:"#263040",
  text:"#b8c9e0", dim:"#4a5a70", bright:"#ddeeff",
  accent:"#3b82f6", green:"#34d399", orange:"#f97316", red:"#f87171", yellow:"#fbbf24",
};
const fmt$ = (n) => n==null?'—':'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtN = (n) => n==null?'—':Number(n).toLocaleString();
const fmtP = (n) => n==null?'—':Number(n).toFixed(1)+'%';
const fmtX = (n) => n==null?'—':Number(n).toFixed(2)+'x';
const acosBg = (v) => v===0?C.muted:v<20?'#1a3a2a':v<30?'#2a3520':v<40?'#3a3010':'#3a1515';
const acosClr = (v) => v===0?C.dim:v<20?C.green:v<30?'#86efac':v<40?C.yellow:C.red;

function Pill({label,val,color}) {
  return <span style={{background:C.muted,borderRadius:4,padding:'2px 8px',fontSize:11,color:color||C.text,marginRight:4}}>{label}: <b>{val}</b></span>;
}

function Stat({label,val,sub,color}) {
  return (
    <div style={{background:C.surface,border:'1px solid '+C.border,borderRadius:8,padding:'14px 18px',minWidth:120}}>
      <div style={{color:C.dim,fontSize:11,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div>
      <div style={{color:color||C.bright,fontSize:22,fontWeight:700,fontFamily:"'IBM Plex Mono',monospace"}}>{val}</div>
      {sub && <div style={{color:C.dim,fontSize:11,marginTop:3}}>{sub}</div>}
    </div>
  );
}

function ImportModal({title,onClose,onImport,importing,importMsg,showBatch}) {
  const [batch,setBatch]=useState(new Date().toISOString().slice(0,10));
  const fileRef=useRef();
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.surface,border:'1px solid '+C.border,borderRadius:12,padding:28,width:420,maxWidth:'90vw'}}>
        <div style={{color:C.bright,fontWeight:700,fontSize:16,marginBottom:12}}>{title}</div>
        {showBatch && <div style={{marginBottom:14}}>
          <div style={{color:C.dim,fontSize:11,marginBottom:4}}>Batch name (date range or label)</div>
          <input value={batch} onChange={e=>setBatch(e.target.value)}
            style={{width:'100%',background:C.bg,border:'1px solid '+C.border,borderRadius:6,padding:'7px 10px',color:C.text,fontSize:13,boxSizing:'border-box'}}/>
        </div>}
        {importing ? (
          <div style={{color:C.accent,fontSize:13,textAlign:'center',padding:24}}>{importMsg||'Uploading...'}</div>
        ) : importMsg ? (
          <div style={{color:importMsg.startsWith('✓')?C.green:C.red,fontSize:13,textAlign:'center',padding:20}}>{importMsg}</div>
        ) : (
          <label style={{display:'block',border:'2px dashed '+C.muted,borderRadius:8,padding:28,textAlign:'center',cursor:'pointer',color:C.dim,fontSize:13}}>
            Click to select CSV file
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}}
              onChange={e=>onImport(e.target.files?.[0],batch)}/>
          </label>
        )}
        <button onClick={onClose} style={{marginTop:16,width:'100%',background:'transparent',border:'1px solid '+C.border,borderRadius:6,padding:8,color:C.dim,cursor:'pointer',fontSize:12}}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── CATALOG TAB ────────────────────────────────────────────────
function CatalogTab({secret}) {
  const [products,setProducts]=useState([]);
  const [count,setCount]=useState(0);
  const [pages,setPages]=useState(0);
  const [page,setPage]=useState(0);
  const [loading,setLoading]=useState(true);
  const [options,setOptions]=useState({categories:[],licenses:[],properties:[],divisions:[]});
  const [filters,setFilters]=useState({category:'',licensing:'',property:'',division:'',search:''});
  const [showImport,setShowImport]=useState(false);
  const [importing,setImporting]=useState(false);
  const [importMsg,setImportMsg]=useState('');
  const [selected,setSelected]=useState(null);

  useEffect(()=>{
    fetch('/api/catalog/options').then(r=>r.json()).then(d=>{ if(!d.error) setOptions(d); });
  },[]);

  useEffect(()=>{
    setLoading(true);
    const p=new URLSearchParams({page:String(page)});
    if(filters.category) p.set('category',filters.category);
    if(filters.licensing) p.set('licensing',filters.licensing);
    if(filters.property) p.set('property',filters.property);
    if(filters.division) p.set('division',filters.division);
    if(filters.search) p.set('search',filters.search);
    fetch('/api/catalog?'+p).then(r=>r.json()).then(d=>{setProducts(d.data||[]);setCount(d.count||0);setPages(d.pages||0);setLoading(false);});
  },[filters,page]);

  const setF=(k,v)=>{setFilters(f=>({...f,[k]:v}));setPage(0);};

  const doImport=async(file)=>{
    if(!file) return;
    setImporting(true);setImportMsg('Uploading '+file.name+'...');
    const fd=new FormData();fd.append('file',file);
    const r=await fetch('/api/import/catalog',{method:'POST',headers:{'Authorization':'Bearer '+secret},body:fd});
    const d=await r.json();
    setImportMsg(d.error?'Error: '+d.error:'✓ '+d.inserted?.toLocaleString()+' products imported');
    setImporting(false);
    setTimeout(()=>{setShowImport(false);setImportMsg('');setFilters(f=>({...f}));
      fetch('/api/catalog/options').then(r=>r.json()).then(d=>{ if(!d.error) setOptions(d); });
    },2000);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:C.bright,fontWeight:600}}>Product Catalog</span>
          <span style={{background:C.muted,borderRadius:10,padding:'2px 10px',fontSize:11,color:C.dim}}>{count.toLocaleString()} products</span>
        </div>
        <button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          ↑ Import Catalog CSV
        </button>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <input placeholder="Search SKU / ASIN / IP..." value={filters.search} onChange={e=>setF('search',e.target.value)}
          style={{flex:'1 1 200px',background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:C.text,fontSize:12}}/>
        {[['category','Category',options.categories],['licensing','Licensor',options.licenses],['property','IP / Property',options.properties],['division','Division',options.divisions]].map(([k,lbl,opts])=>(
          <select key={k} value={filters[k]} onChange={e=>setF(k,e.target.value)}
            style={{flex:'1 1 140px',background:C.surface,border:'1px solid '+(filters[k]?C.accent:C.border),borderRadius:6,padding:'6px 10px',color:filters[k]?C.bright:C.dim,fontSize:12}}>
            <option value="">{lbl}</option>
            {opts.filter(o=>o).map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {Object.values(filters).some(v=>v) && <button onClick={()=>{setFilters({category:'',licensing:'',property:'',division:'',search:''});setPage(0);}}
          style={{background:'transparent',border:'1px solid '+C.muted,borderRadius:6,padding:'6px 12px',color:C.dim,cursor:'pointer',fontSize:12}}>Clear ×</button>}
      </div>

      {loading ? <div style={{textAlign:'center',padding:60,color:C.dim}}>Loading...</div> :
       products.length===0 ? <div style={{textAlign:'center',padding:60,color:C.dim,lineHeight:2}}>
          {count===0?<>No products yet.<br/><button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'8px 20px',fontSize:13,cursor:'pointer',marginTop:8}}>Import Catalog CSV</button></>:'No products match your filters.'}
        </div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:10}}>
          {products.map(p=>(
            <div key={p.seller_sku} onClick={()=>setSelected(p)} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:8,overflow:'hidden',cursor:'pointer',transition:'border-color 0.12s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              {p.image_url
                ?<img src={p.image_url} alt="" style={{width:'100%',aspectRatio:'1',objectFit:'contain',background:'#0a0d12',padding:6}}
                   onError={e=>{e.target.style.display='none';}} />
                :<div style={{width:'100%',aspectRatio:'1',background:'#0a0d12',display:'flex',alignItems:'center',justifyContent:'center',color:C.dim,fontSize:10}}>No image</div>
              }
              <div style={{padding:'7px 9px'}}>
                <div style={{color:C.bright,fontSize:11,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.property_description||'—'}</div>
                <div style={{color:C.dim,fontSize:10,marginTop:1}}>{p.category}</div>
                <div style={{color:'#2a3a50',fontSize:9,marginTop:3,fontFamily:"'IBM Plex Mono',monospace"}}>{p.asin}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages>1&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:4}}>
        <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'5px 14px',color:page===0?C.dim:C.text,cursor:page===0?'default':'pointer',fontSize:12}}>← Prev</button>
        <span style={{color:C.dim,fontSize:12}}>Page {page+1} of {pages} · {count.toLocaleString()} total</span>
        <button disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'5px 14px',color:page>=pages-1?C.dim:C.text,cursor:page>=pages-1?'default':'pointer',fontSize:12}}>Next →</button>
      </div>}

      {showImport&&<ImportModal title="Import Product Catalog" onClose={()=>{setShowImport(false);setImportMsg('');}} onImport={doImport} importing={importing} importMsg={importMsg} showBatch={false}/>}

      {selected&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1500}}
          onClick={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
          <div style={{background:C.surface,border:'1px solid '+C.border,borderRadius:12,padding:24,width:500,maxWidth:'90vw',display:'flex',gap:20}}>
            <div style={{flex:'0 0 150px'}}>
              {selected.image_url?<img src={selected.image_url} alt="" style={{width:'100%',borderRadius:8,objectFit:'contain',background:C.bg}}/>
                :<div style={{width:150,height:150,background:C.bg,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:C.dim,fontSize:11}}>No image</div>}
            </div>
            <div style={{flex:1,overflow:'auto'}}>
              <div style={{color:C.bright,fontWeight:700,fontSize:15,marginBottom:12}}>{selected.property_description||selected.seller_sku}</div>
              {[['SKU',selected.seller_sku],['ASIN',selected.asin],['Category',selected.category],['Division',selected.division],['Licensor',selected.licensing],['Gender',selected.gender],['Item Type',selected.item_type],['Lic. Status',selected.licensing_status]].map(([k,v])=>v?(
                <div key={k} style={{display:'flex',justifyContent:'space-between',borderBottom:'1px solid '+C.border,padding:'5px 0'}}>
                  <span style={{color:C.dim,fontSize:11}}>{k}</span>
                  <span style={{color:C.text,fontSize:11,fontFamily:['SKU','ASIN'].includes(k)?"'IBM Plex Mono',monospace":'inherit'}}>{v}</span>
                </div>
              ):null)}
              <a href={'https://www.amazon.com/dp/'+selected.asin} target="_blank" rel="noreferrer"
                style={{display:'block',marginTop:14,textAlign:'center',background:C.accent,color:'#fff',borderRadius:6,padding:8,fontSize:12,fontWeight:600,textDecoration:'none'}}>
                View on Amazon ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AD PERFORMANCE TAB ──────────────────────────────────────────
function AdsTab({secret}) {
  const [data,setData]=useState([]);
  const [batches,setBatches]=useState([]);
  const [batch,setBatch]=useState('');
  const [groupBy,setGroupBy]=useState('property_description');
  const [filters,setFilters]=useState({category:'',licensing:''});
  const [options,setOptions]=useState({categories:[],licenses:[]});
  const [loading,setLoading]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [importing,setImporting]=useState(false);
  const [importMsg,setImportMsg]=useState('');
  const [sortCol,setSortCol]=useState('spend');
  const [sortDir,setSortDir]=useState(-1);

  const loadOptions=()=>fetch('/api/catalog/options').then(r=>r.json()).then(d=>{ if(!d.error) setOptions({categories:d.categories,licenses:d.licenses}); });

  useEffect(()=>{
    loadOptions();
    fetch('/api/batches').then(r=>r.json()).then(d=>{ if(d.adBatches?.length){setBatches(d.adBatches);setBatch(d.adBatches[0]);} });
  },[]);

  useEffect(()=>{
    if(batches.length===0&&!batch) return;
    setLoading(true);
    const p=new URLSearchParams({groupBy});
    if(batch) p.set('batch',batch);
    if(filters.category) p.set('category',filters.category);
    if(filters.licensing) p.set('licensing',filters.licensing);
    fetch('/api/performance?'+p).then(r=>r.json()).then(d=>{
      setData(d.data||[]);
      if(d.batches?.length&&!batch) setBatch(d.batches[0]);
      setBatches(d.batches||[]);
      setLoading(false);
    });
  },[batch,groupBy,filters]);

  const doImport=async(file,batchName)=>{
    if(!file) return;
    setImporting(true);setImportMsg('Uploading...');
    const fd=new FormData();fd.append('file',file);fd.append('batch',batchName);
    const r=await fetch('/api/import/ads',{method:'POST',headers:{'Authorization':'Bearer '+secret},body:fd});
    const d=await r.json();
    setImportMsg(d.error?'Error: '+d.error:'✓ '+d.inserted?.toLocaleString()+' rows imported (batch: '+d.batch+')');
    setImporting(false);
    setTimeout(()=>{
      setShowImport(false);setImportMsg('');
      fetch('/api/batches').then(r=>r.json()).then(d=>{if(d.adBatches?.length){setBatches(d.adBatches);setBatch(d.adBatches[0]);}});
    },2000);
  };

  const cols=[['key','Name'],['asin_count','ASINs'],['impressions','Impr.'],['clicks','Clicks'],['spend','Spend'],['sales','Sales'],['orders','Orders'],['acos','ACoS'],['roas','ROAS'],['ctr','CTR']];
  const sorted=[...data].sort((a,b)=>sortDir*(a[sortCol]<b[sortCol]?-1:a[sortCol]>b[sortCol]?1:0));
  const total=data.reduce((t,r)=>({spend:(t.spend||0)+r.spend,sales:(t.sales||0)+r.sales,orders:(t.orders||0)+r.orders,clicks:(t.clicks||0)+r.clicks,impressions:(t.impressions||0)+r.impressions}),{});

  const thStyle={color:C.dim,fontSize:11,padding:'8px 10px',textAlign:'right',cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'};
  const tdStyle={padding:'8px 10px',fontSize:12,textAlign:'right',borderTop:'1px solid '+C.border};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <span style={{color:C.bright,fontWeight:600}}>Ad Performance</span>
        <button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}>↑ Import SP Report</button>
      </div>

      {total.spend>0&&<div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <Stat label="Total Spend" val={fmt$(total.spend)}/>
        <Stat label="Total Sales" val={fmt$(total.sales)} color={C.green}/>
        <Stat label="ACoS" val={fmtP(total.sales>0?total.spend/total.sales*100:0)} color={total.sales>0&&total.spend/total.sales<0.3?C.green:C.orange}/>
        <Stat label="ROAS" val={fmtX(total.spend>0?total.sales/total.spend:0)} color={C.accent}/>
        <Stat label="Orders" val={fmtN(total.orders)}/>
        <Stat label="Clicks" val={fmtN(total.clicks)} sub={fmtP(total.impressions>0?total.clicks/total.impressions*100:0)+' CTR'}/>
      </div>}

      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <select value={batch} onChange={e=>setBatch(e.target.value)}
          style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:batch?C.bright:C.dim,fontSize:12}}>
          <option value="">All batches</option>
          {batches.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select value={groupBy} onChange={e=>setGroupBy(e.target.value)}
          style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:C.bright,fontSize:12}}>
          <option value="property_description">By IP / Property</option>
          <option value="category">By Category</option>
          <option value="licensing">By Licensor</option>
          <option value="division">By Division</option>
        </select>
        <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))}
          style={{background:C.surface,border:'1px solid '+(filters.category?C.accent:C.border),borderRadius:6,padding:'6px 10px',color:filters.category?C.bright:C.dim,fontSize:12}}>
          <option value="">All Categories</option>
          {options.categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.licensing} onChange={e=>setFilters(f=>({...f,licensing:e.target.value}))}
          style={{background:C.surface,border:'1px solid '+(filters.licensing?C.accent:C.border),borderRadius:6,padding:'6px 10px',color:filters.licensing?C.bright:C.dim,fontSize:12}}>
          <option value="">All Licensors</option>
          {options.licenses.map(l=><option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {loading?<div style={{textAlign:'center',padding:60,color:C.dim}}>Loading...</div>:
       data.length===0?<div style={{textAlign:'center',padding:60,color:C.dim,lineHeight:2}}>
          {batches.length===0?<>No ads data yet.<br/><button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'8px 20px',fontSize:13,cursor:'pointer',marginTop:8}}>Upload SP Report CSV</button></> :'No data matches your filters.'}
        </div>:(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'2px solid '+C.border}}>
                {cols.map(([k,lbl])=>(
                  <th key={k} style={{...thStyle,textAlign:k==='key'?'left':'right'}} onClick={()=>{if(sortCol===k)setSortDir(d=>-d);else{setSortCol(k);setSortDir(-1);}}}>
                    {lbl}{sortCol===k?(sortDir>0?' ↑':' ↓'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row,i)=>(
                <tr key={i} style={{background:i%2===0?'transparent':C.surface+'40'}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.muted+'60'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':C.surface+'40'}>
                  <td style={{...tdStyle,textAlign:'left',color:C.bright,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.key}</td>
                  <td style={{...tdStyle,color:C.dim}}>{row.asin_count}</td>
                  <td style={{...tdStyle,color:C.dim}}>{fmtN(row.impressions)}</td>
                  <td style={{...tdStyle}}>{fmtN(row.clicks)}</td>
                  <td style={{...tdStyle,color:C.yellow,fontWeight:600}}>{fmt$(row.spend)}</td>
                  <td style={{...tdStyle,color:C.green,fontWeight:600}}>{fmt$(row.sales)}</td>
                  <td style={{...tdStyle}}>{fmtN(row.orders)}</td>
                  <td style={{...tdStyle,background:acosBg(row.acos),color:acosClr(row.acos),fontWeight:600}}>{fmtP(row.acos)}</td>
                  <td style={{...tdStyle,color:row.roas>=3?C.green:row.roas>=2?C.yellow:C.red}}>{fmtX(row.roas)}</td>
                  <td style={{...tdStyle,color:C.dim}}>{fmtP(row.ctr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showImport&&<ImportModal title="Import Sponsored Products Report" onClose={()=>{setShowImport(false);setImportMsg('');}} onImport={doImport} importing={importing} importMsg={importMsg} showBatch={true}/>}
    </div>
  );
}

// ── SEARCH TERMS TAB ────────────────────────────────────────────
function SearchTermsTab({secret}) {
  const [data,setData]=useState([]);
  const [count,setCount]=useState(0);
  const [pages,setPages]=useState(0);
  const [page,setPage]=useState(0);
  const [batches,setBatches]=useState([]);
  const [batch,setBatch]=useState('');
  const [search,setSearch]=useState('');
  const [sortBy,setSortBy]=useState('spend');
  const [sortDir,setSortDir]=useState(-1);
  const [loading,setLoading]=useState(false);
  const [showImport,setShowImport]=useState(false);
  const [importing,setImporting]=useState(false);
  const [importMsg,setImportMsg]=useState('');

  useEffect(()=>{
    fetch('/api/batches').then(r=>r.json()).then(d=>{ if(d.stBatches?.length){setBatches(d.stBatches);setBatch(d.stBatches[0]);} });
  },[]);

  useEffect(()=>{
    setLoading(true);
    const p=new URLSearchParams({sort:sortBy,page:String(page)});
    if(batch) p.set('batch',batch);
    if(search) p.set('search',search);
    fetch('/api/searchterms?'+p).then(r=>r.json()).then(d=>{
      setData(d.data||[]);setCount(d.count||0);setPages(d.pages||0);
      if(d.batches?.length&&!batch){setBatches(d.batches);setBatch(d.batches[0]);}
      setLoading(false);
    });
  },[batch,search,sortBy,page]);

  const doImport=async(file,batchName)=>{
    if(!file) return;
    setImporting(true);setImportMsg('Uploading...');
    const fd=new FormData();fd.append('file',file);fd.append('batch',batchName);
    const r=await fetch('/api/import/searchterms',{method:'POST',headers:{'Authorization':'Bearer '+secret},body:fd});
    const d=await r.json();
    setImportMsg(d.error?'Error: '+d.error:'✓ '+d.inserted?.toLocaleString()+' terms imported');
    setImporting(false);
    setTimeout(()=>{
      setShowImport(false);setImportMsg('');
      fetch('/api/batches').then(r=>r.json()).then(d=>{if(d.stBatches?.length){setBatches(d.stBatches);setBatch(d.stBatches[0]);}});
    },2000);
  };

  const cols=[['search_term','Search Term'],['impressions','Impr.'],['clicks','Clicks'],['ctr','CTR'],['spend','Spend'],['sales_14d','Sales'],['orders_14d','Orders'],['acos','ACoS'],['roas','ROAS'],['cpc','CPC'],['match_type','Match']];
  const thStyle={color:C.dim,fontSize:11,padding:'8px 10px',textAlign:'right',cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'};
  const tdStyle={padding:'7px 10px',fontSize:12,textAlign:'right',borderTop:'1px solid '+C.border};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:C.bright,fontWeight:600}}>Search Terms</span>
          <span style={{background:C.muted,borderRadius:10,padding:'2px 10px',fontSize:11,color:C.dim}}>{count.toLocaleString()} terms</span>
        </div>
        <button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}>↑ Import Search Term Report</button>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <select value={batch} onChange={e=>{setBatch(e.target.value);setPage(0);}}
          style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:batch?C.bright:C.dim,fontSize:12}}>
          <option value="">All batches</option>
          {batches.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
        <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setPage(0);}}
          style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:C.bright,fontSize:12}}>
          <option value="spend">Sort: Spend</option>
          <option value="sales_14d">Sort: Sales</option>
          <option value="orders_14d">Sort: Orders</option>
          <option value="impressions">Sort: Impressions</option>
          <option value="roas">Sort: ROAS</option>
          <option value="acos">Sort: ACoS</option>
        </select>
        <input placeholder="Filter search terms..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}
          style={{flex:'1 1 220px',background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'6px 10px',color:C.text,fontSize:12}}/>
      </div>

      {loading?<div style={{textAlign:'center',padding:60,color:C.dim}}>Loading...</div>:
       data.length===0?<div style={{textAlign:'center',padding:60,color:C.dim,lineHeight:2}}>
          {batches.length===0?<>No search term data yet.<br/><button onClick={()=>setShowImport(true)} style={{background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:'8px 20px',fontSize:13,cursor:'pointer',marginTop:8}}>Upload Search Term Report</button></>:'No terms match your search.'}
        </div>:(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'2px solid '+C.border}}>
                {cols.map(([k,lbl])=>(
                  <th key={k} style={{...thStyle,textAlign:k==='search_term'||k==='match_type'?'left':'right'}}
                    onClick={()=>{if(k!=='search_term'&&k!=='match_type'){if(sortBy===k)setSortDir(d=>-d);else{setSortBy(k);setSortDir(-1);setPage(0);}}}}>
                    {lbl}{sortBy===k?(sortDir>0?' ↑':' ↓'):''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row,i)=>(
                <tr key={i} style={{background:i%2===0?'transparent':C.surface+'40'}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.muted+'60'}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'transparent':C.surface+'40'}>
                  <td style={{...tdStyle,textAlign:'left',color:C.bright,maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.search_term}</td>
                  <td style={{...tdStyle,color:C.dim}}>{fmtN(row.impressions)}</td>
                  <td style={{...tdStyle}}>{fmtN(row.clicks)}</td>
                  <td style={{...tdStyle,color:C.dim}}>{fmtP(row.ctr)}</td>
                  <td style={{...tdStyle,color:C.yellow,fontWeight:600}}>{fmt$(row.spend)}</td>
                  <td style={{...tdStyle,color:C.green,fontWeight:600}}>{fmt$(row.sales_14d)}</td>
                  <td style={{...tdStyle}}>{fmtN(row.orders_14d)}</td>
                  <td style={{...tdStyle,background:acosBg(row.acos),color:acosClr(row.acos),fontWeight:600}}>{fmtP(row.acos)}</td>
                  <td style={{...tdStyle,color:row.roas>=3?C.green:row.roas>=2?C.yellow:C.red}}>{fmtX(row.roas)}</td>
                  <td style={{...tdStyle,color:C.dim}}>{fmt$(row.cpc)}</td>
                  <td style={{...tdStyle,textAlign:'left',color:C.dim,fontSize:10}}>{row.match_type||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages>1&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'5px 14px',color:page===0?C.dim:C.text,cursor:page===0?'default':'pointer',fontSize:12}}>← Prev</button>
        <span style={{color:C.dim,fontSize:12}}>Page {page+1} of {pages} · {count.toLocaleString()} terms</span>
        <button disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)} style={{background:C.surface,border:'1px solid '+C.border,borderRadius:6,padding:'5px 14px',color:page>=pages-1?C.dim:C.text,cursor:page>=pages-1?'default':'pointer',fontSize:12}}>Next →</button>
      </div>}

      {showImport&&<ImportModal title="Import Search Term Report" onClose={()=>{setShowImport(false);setImportMsg('');}} onImport={doImport} importing={importing} importMsg={importMsg} showBatch={true}/>}
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState('catalog');
  const [secret,setSecret]=useState('');
  const [secretInput,setSecretInput]=useState('');
  const [authed,setAuthed]=useState(false);

  useEffect(()=>{
    const s=sessionStorage.getItem('bw_secret');
    if(s){setSecret(s);setAuthed(true);}
  },[]);

  const login=()=>{
    sessionStorage.setItem('bw_secret',secretInput);
    setSecret(secretInput);setAuthed(true);
  };

  const TABS=[['catalog','Catalog'],['ads','Ad Performance'],['searchterms','Search Terms']];

  if(!authed) return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'IBM Plex Sans','Helvetica Neue',sans-serif"}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap\');*{box-sizing:border-box;margin:0;padding:0;}'}</style>
      <div style={{background:C.surface,border:'1px solid '+C.border,borderRadius:12,padding:40,width:360,textAlign:'center'}}>
        <div style={{color:C.bright,fontSize:20,fontWeight:700,marginBottom:4}}>Bioworld Catalog</div>
        <div style={{color:C.dim,fontSize:13,marginBottom:28}}>Analysis Tool</div>
        <input type="password" placeholder="Enter access key..." value={secretInput} onChange={e=>setSecretInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&login()}
          style={{width:'100%',background:C.bg,border:'1px solid '+C.border,borderRadius:6,padding:'10px 14px',color:C.text,fontSize:14,marginBottom:12}}/>
        <button onClick={login} style={{width:'100%',background:C.accent,color:'#fff',border:'none',borderRadius:6,padding:11,fontSize:14,fontWeight:600,cursor:'pointer'}}>
          Enter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'IBM Plex Sans','Helvetica Neue',sans-serif"}}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap\');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#070a0d;}::-webkit-scrollbar-thumb{background:#1c2333;border-radius:2px;}'}</style>
      <div style={{background:C.surface,borderBottom:'1px solid '+C.border,padding:'0 24px',display:'flex',alignItems:'center',gap:0,height:50}}>
        <div style={{color:C.bright,fontWeight:700,fontSize:14,marginRight:32,whiteSpace:'nowrap'}}>⬡ Bioworld Catalog</div>
        {TABS.map(([k,lbl])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:'transparent',border:'none',borderBottom:'2px solid '+(tab===k?C.accent:'transparent'),color:tab===k?C.bright:C.dim,padding:'0 16px',height:50,cursor:'pointer',fontSize:13,fontWeight:tab===k?600:400,transition:'color 0.12s',whiteSpace:'nowrap'}}>
            {lbl}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={()=>{sessionStorage.removeItem('bw_secret');setAuthed(false);setSecret('');}} style={{background:'transparent',border:'none',color:C.dim,cursor:'pointer',fontSize:12}}>Sign out</button>
      </div>
      <div style={{padding:24,maxWidth:1600,margin:'0 auto'}}>
        {tab==='catalog'&&<CatalogTab secret={secret}/>}
        {tab==='ads'&&<AdsTab secret={secret}/>}
        {tab==='searchterms'&&<SearchTermsTab secret={secret}/>}
      </div>
    </div>
  );
}