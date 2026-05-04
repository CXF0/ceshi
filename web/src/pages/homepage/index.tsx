/**
 * @file src/pages/homepage/index.tsx
 * @version 4.0.0 [2026-05-04]
 * 新增：免费咨询弹窗(InquiryForm) + 案例可滑动 + 客户经理弹窗(ManagerCard)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig, fetchSiteCases } from './useSiteConfig';
import InquiryForm from '@/components/InquiryForm';
import ManagerCard from '@/components/ManagerCard';

const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&family=Noto+Sans+SC:wght@400;500;700&display=swap');
  .hp-root{font-family:'Inter','Noto Sans SC',sans-serif;scroll-behavior:smooth;}
  .hp-glass-header{background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}
  .hp-hero-mesh{background:radial-gradient(at 0% 0%,hsla(225,100%,94%,1) 0,transparent 50%),radial-gradient(at 100% 0%,hsla(190,100%,94%,1) 0,transparent 50%),white;}
  .hp-bento-card{transition:all 0.4s cubic-bezier(0.4,0,0.2,1);border:1px solid rgba(0,0,0,0.05);}
  .hp-bento-card:hover{transform:translateY(-5px);box-shadow:0 20px 40px -10px rgba(0,0,0,0.08);}
  .hp-service-tag{background:rgba(37,99,235,0.08);color:#2563eb;}
  .hp-primary-blue{color:#2563eb;}
  .hp-nav-link{font-size:13px;font-weight:600;color:#6b7280;text-decoration:none;transition:color 0.2s;cursor:pointer;background:none;border:none;padding:0;font-family:inherit;}
  .hp-nav-link:hover{color:#2563eb;}
  @keyframes hp-modal-in{from{opacity:0;transform:scale(0.95) translateY(8px);}to{opacity:1;transform:none;}}
  .hp-modal-box{animation:hp-modal-in 0.22s ease-out;}
  @keyframes ping{75%,100%{transform:scale(2);opacity:0;}}
  .case-slide-btn{width:44px;height:44px;border-radius:50%;background:white;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
  .case-slide-btn:hover{background:#2563eb;color:white;border-color:#2563eb;}
  .case-slide-btn:disabled{opacity:0.3;cursor:not-allowed;background:white;color:#6b7280;}
`;

const NAV_ITEMS=[{label:'首页',href:'#hero',route:null},{label:'认证服务',href:'#services',route:'/services'},{label:'正达管家',href:'#digital',route:null},{label:'客户案例',href:'#cases',route:'/cases'},{label:'关于我们',href:'#about',route:'/about'}];
const ICOLORS:Record<string,string>={'制造业':'#ef4444','软件IT':'#3b82f6','智能制造':'#ef4444','政企单位':'#f59e0b','建筑工程':'#f59e0b','医疗健康':'#10b981','生物医药':'#10b981','金融服务':'#8b5cf6','教育培训':'#ec4899'};

const LoginModal:React.FC<{onClose:()=>void}>=({onClose})=>{
  const nav=useNavigate();const[loading,setLoading]=useState(false);const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[onClose]);
  const onFinish=async(v:any)=>{setLoading(true);try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)});const d=await r.json();if(r.ok){localStorage.setItem('isLogin','true');localStorage.setItem('token',d.access_token);localStorage.setItem('userInfo',JSON.stringify(d.user||{nickname:v.username}));message.success(`欢迎回来，${d.user?.nickname||v.username}`);onClose();nav('/dashboard',{replace:true});}else message.error(d.message||'账号或密码错误');}catch{message.error('网络请求失败');}finally{setLoading(false);}};
  return(<div ref={ref} onClick={e=>{if(e.target===ref.current)onClose();}} style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.38)',backdropFilter:'blur(6px)'}}>
    <div className="hp-modal-box" style={{background:'white',width:'100%',maxWidth:380,borderRadius:20,boxShadow:'0 24px 60px -8px rgba(0,0,0,0.18)',padding:'28px 28px 24px',margin:'0 16px',position:'relative'}}>
      <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16,padding:4,borderRadius:6}}><CloseOutlined/></button>
      <div style={{marginBottom:22}}><h3 style={{fontSize:18,fontWeight:800,color:'#2563eb',margin:0,fontStyle:'italic'}}>账号登录</h3><p style={{fontSize:12,color:'#9ca3af',marginTop:4}}>客户管家登录后进入正达认证管理后台</p></div>
      <Form name="hp-login" onFinish={onFinish} layout="vertical" size="large">
        <Form.Item name="username" label={<span style={{fontSize:13,fontWeight:600,color:'#374151'}}>账号</span>} rules={[{required:true,message:'请输入账号'}]} style={{marginBottom:14}}><Input prefix={<UserOutlined style={{color:'#93aac9'}}/>} placeholder="请输入账号" style={{borderRadius:10,borderColor:'rgba(37,99,235,0.15)',background:'#f8faff'}}/></Form.Item>
        <Form.Item name="password" label={<span style={{fontSize:13,fontWeight:600,color:'#374151'}}>密码</span>} rules={[{required:true,message:'请输入密码'}]} style={{marginBottom:20}}><Input.Password prefix={<LockOutlined style={{color:'#93aac9'}}/>} placeholder="请输入密码" style={{borderRadius:10,borderColor:'rgba(37,99,235,0.15)',background:'#f8faff'}}/></Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading} style={{height:44,borderRadius:12,fontWeight:700,fontSize:15,background:'#2563eb',border:'none',boxShadow:'0 6px 18px rgba(37,99,235,0.28)'}}>登 录</Button>
      </Form>
    </div>
  </div>);
};

const InquiryModal:React.FC<{onClose:()=>void}>=({onClose})=>{
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:KeyboardEvent)=>e.key==='Escape'&&onClose();document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[onClose]);
  return(<div ref={ref} onClick={e=>{if(e.target===ref.current)onClose();}} style={{position:'fixed',inset:0,zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.38)',backdropFilter:'blur(6px)'}}>
    <div className="hp-modal-box" style={{background:'white',width:'100%',maxWidth:420,borderRadius:24,boxShadow:'0 24px 60px -8px rgba(0,0,0,0.18)',padding:'32px 28px',margin:'0 16px',position:'relative'}}>
      <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'none',border:'none',cursor:'pointer',color:'#9ca3af',fontSize:16,padding:4,borderRadius:6}}><CloseOutlined/></button>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:700,color:'#2563eb',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:8}}>FREE CONSULTATION</div>
        <h3 style={{fontSize:20,fontWeight:800,color:'#111827',margin:0}}>免费咨询</h3>
        <p style={{fontSize:13,color:'#6b7280',marginTop:6}}>留下联系方式，顾问将在 2 小时内主动联系您</p>
      </div>
      <InquiryForm source="homepage"/>
    </div>
  </div>);
};

const CARD_W=284;const CARD_GAP=24;const VISIBLE=4;
// ── CaseCard 独立组件（Hook 必须在组件顶层，不能在 map 里调用）──
const CaseCard: React.FC<{ data: any; onClick: () => void }> = ({ data: c, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ width: CARD_W, flexShrink: 0, padding: 16, borderRadius: 28, border: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', background: 'white', transition: 'all 0.3s', transform: hov ? 'translateY(-5px)' : '', boxShadow: hov ? '0 20px 40px -10px rgba(0,0,0,0.1)' : '' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onClick}
    >
      <div style={{ height: 148, borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: c.logo_color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {c.logo_url
          ? <img src={c.logo_url} alt={c.company_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ fontSize: 48, fontWeight: 900, color: 'white', opacity: 0.55, fontStyle: 'italic' }}>{c.logo_text || c.company_name?.slice(0, 1) || '案'}</div>
        }
      </div>
      <div style={{ padding: '0 4px' }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: ICOLORS[c.industry] || '#2563eb', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{c.industry}</span>
        <h4 style={{ fontWeight: 700, fontSize: 15, margin: '6px 0 4px', color: hov ? '#2563eb' : '#111827', transition: 'color 0.2s', fontStyle: 'italic', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.company_name}</h4>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{c.cert_type}</p>
      </div>
    </div>
  );
};

const CasesSlider: React.FC<{ cases: any[]; onViewAll: () => void }> = ({ cases, onViewAll }) => {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, cases.length - VISIBLE);
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, fontStyle: 'italic' }}>标杆案例 · 见证实力</h2>
        <p style={{ color: '#9ca3af', maxWidth: 480, margin: '0 auto' }}>涵盖智能制造、软件信息、政府单位、医疗生物等各行各业的真实认证历程。</p>
      </div>
      <div style={{ overflow: 'hidden', borderRadius: 8 }}>
        <div style={{ display: 'flex', gap: CARD_GAP, transition: 'transform 0.4s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${offset * (CARD_W + CARD_GAP)}px)`, width: cases.length * (CARD_W + CARD_GAP) }}>
          {/* ✅ 使用独立组件，Hook 在组件顶层调用，不违反 Rules of Hooks */}
          {cases.map((c, i) => <CaseCard key={c.id || i} data={c} onClick={onViewAll} />)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40 }}>
        <button className="case-slide-btn" onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}><LeftOutlined style={{ fontSize: 14 }} /></button>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: maxOffset + 1 }).map((_, i) => (
            <div key={i} onClick={() => setOffset(i)} style={{ width: i === offset ? 20 : 6, height: 6, borderRadius: 3, background: i === offset ? '#2563eb' : '#e5e7eb', transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
        <button className="case-slide-btn" onClick={() => setOffset(o => Math.min(maxOffset, o + 1))} disabled={offset >= maxOffset}><RightOutlined style={{ fontSize: 14 }} /></button>
        <button onClick={onViewAll} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginLeft: 8, boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'background 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>查看全部案例 →</button>
      </div>
    </div>
  );
};

const DEFAULT_CASES=[
  {id:1,company_name:'某知名云计算科技公司',industry:'软件IT',cert_type:'CMMI 5级 软件能力成熟度评估',logo_text:'云',logo_color:'#3b82f6',sort_order:1,is_active:1},
  {id:2,company_name:'上海某航天精密设备厂',industry:'智能制造',cert_type:'ISO 9001 / ISO 27001 双体系贯标',logo_text:'航',logo_color:'#ef4444',sort_order:2,is_active:1},
  {id:3,company_name:'某市行政政务中心',industry:'政企单位',cert_type:'ITSS 信息技术服务运维资质',logo_text:'政',logo_color:'#f59e0b',sort_order:3,is_active:1},
  {id:4,company_name:'某上市生物医药实验室',industry:'生物医药',cert_type:'ISO 13485 医疗器械质量体系认证',logo_text:'医',logo_color:'#10b981',sort_order:4,is_active:1},
  {id:5,company_name:'南京某互联网科技公司',industry:'软件IT',cert_type:'ITSS 一级 + 高新技术企业认定',logo_text:'宁',logo_color:'#8b5cf6',sort_order:5,is_active:1},
];

export default function Homepage(){
  const nav=useNavigate();const{cfg}=useSiteConfig();
  const[loginOpen,setLoginOpen]=useState(false);
  const[inquiryOpen,setInquiryOpen]=useState(false);
  const[managerOpen,setManagerOpen]=useState(false);
  const[cases,setCases]=useState<any[]>(DEFAULT_CASES);

  useEffect(()=>{document.body.style.overflow=(loginOpen||inquiryOpen||managerOpen)?'hidden':'';return()=>{document.body.style.overflow='';};},[loginOpen,inquiryOpen,managerOpen]);
  useEffect(()=>{fetchSiteCases().then(list=>{const v=list.filter((c:any)=>c.is_active).sort((a:any,b:any)=>a.sort_order-b.sort_order);if(v.length>0)setCases(v);}).catch(()=>{});},[]);

  const stats=[1,2,3,4].map(n=>({value:cfg[`stat_${n}_value`],unit:cfg[`stat_${n}_unit`],label:cfg[`stat_${n}_label`]}));
  const hn=(e:React.MouseEvent,item:typeof NAV_ITEMS[0])=>{if(item.route){e.preventDefault();nav(item.route);}};

  return(<>
    <style>{globalCss}</style>
    <div className="hp-root" style={{minHeight:'100vh',width:'100%',background:'white'}}>

      {/* Header */}
      <header className="hp-glass-header" style={{position:'fixed',top:0,width:'100%',zIndex:100,borderBottom:'1px solid #f3f4f6'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',height:80,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:48}}>
            <div style={{fontSize:22,fontWeight:900,fontStyle:'italic',letterSpacing:'-0.04em',color:'#2563eb'}}>ZhengDaTong</div>
            <nav style={{display:'flex',alignItems:'center',gap:32}}>
              {NAV_ITEMS.map(nav=>nav.route?<button key={nav.label} className="hp-nav-link" onClick={e=>hn(e,nav)}>{nav.label}</button>:<a key={nav.label} href={nav.href} className="hp-nav-link">{nav.label}</a>)}
            </nav>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>setLoginOpen(true)} style={{fontSize:13,fontWeight:700,color:'#374151',background:'none',border:'none',cursor:'pointer',padding:'8px 16px',borderRadius:12,transition:'color 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.color='#2563eb')} onMouseLeave={e=>(e.currentTarget.style.color='#374151')}>管家登录</button>
            <span style={{fontSize:13,fontWeight:700,color:'#9ca3af',letterSpacing:'0.12em',fontStyle:'italic'}}>{cfg.phone}</span>
            <button onClick={()=>setInquiryOpen(true)} style={{background:'#2563eb',color:'white',padding:'10px 28px',borderRadius:12,fontSize:13,fontWeight:700,border:'none',cursor:'pointer',boxShadow:'0 6px 16px rgba(37,99,235,0.22)',transition:'background 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.background='#1d4ed8')} onMouseLeave={e=>(e.currentTarget.style.background='#2563eb')}>立即咨询</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="hp-hero-mesh" style={{paddingTop:192,paddingBottom:96,overflow:'hidden'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}}>
          <div>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'4px 12px',background:'#eff6ff',color:'#1d4ed8',borderRadius:8,fontSize:12,fontWeight:700,marginBottom:24}}>
              <span style={{position:'relative',display:'flex',width:8,height:8}}><span style={{position:'absolute',display:'inline-flex',width:'100%',height:'100%',borderRadius:'50%',background:'#60a5fa',opacity:0.75,animation:'ping 1.5s cubic-bezier(0,0,0.2,1) infinite'}}/><span style={{position:'relative',display:'inline-flex',width:8,height:8,borderRadius:'50%',background:'#2563eb'}}/></span>
              {cfg.hero_badge_text}
            </div>
            <h1 style={{fontSize:'clamp(40px,5vw,72px)',fontWeight:700,lineHeight:1.1,marginBottom:32,letterSpacing:'-0.03em',fontStyle:'italic'}}>
              {cfg.hero_title_black}<br/><span className="hp-primary-blue">{cfg.hero_title_blue}</span>
            </h1>
            <p style={{fontSize:17,color:'#6b7280',lineHeight:1.75,marginBottom:40,maxWidth:480}}>{cfg.hero_subtitle}</p>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:48}}>
              <div style={{display:'flex',marginLeft:-12}}>{[1,2,3].map(s=><img key={s} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s}`} style={{width:40,height:40,borderRadius:'50%',border:'2px solid white',background:'#f3f4f6',marginLeft:s===1?0:-12}} alt=""/>)}</div>
              <span style={{fontSize:13,fontWeight:600,color:'#9ca3af',textDecoration:'underline',textDecorationColor:'#bfdbfe',textDecorationThickness:2,textUnderlineOffset:4}}>累计服务 {cfg.stat_1_value}{cfg.stat_1_unit} 知名企业</span>
            </div>
            <div style={{display:'flex',gap:40}}>
              {stats.map((s,i)=><div key={i}><div style={{fontSize:28,fontWeight:900,color:'#111827',letterSpacing:'-0.03em',lineHeight:1}}>{s.value}<span style={{fontSize:16}}>{s.unit}</span></div><div style={{fontSize:12,color:'#9ca3af',marginTop:4,fontWeight:600}}>{s.label}</div></div>)}
            </div>
          </div>
          <div style={{position:'relative'}}>
            <div style={{background:'rgba(255,255,255,0.4)',backdropFilter:'blur(12px)',padding:16,borderRadius:40,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.15)',border:'1px solid white'}}>
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" style={{borderRadius:32,display:'block',width:'100%'}} alt=""/>
            </div>
            <div style={{position:'absolute',bottom:-24,left:-24,background:'white',padding:24,borderRadius:16,boxShadow:'0 20px 40px -8px rgba(0,0,0,0.1)',border:'1px solid #f9fafb'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:40,height:40,background:'#f0fdf4',color:'#16a34a',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontStyle:'italic'}}>75%</div><p style={{fontSize:12,color:'#9ca3af',fontWeight:700,lineHeight:1.4,margin:0}}>平均认证<br/>效率提升</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{padding:'128px 0'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px'}}>
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'flex-end',justifyContent:'space-between',marginBottom:80,gap:32}}>
            <div><h2 style={{fontSize:36,fontWeight:700,marginBottom:16,fontStyle:'italic'}}>核心认证服务范围</h2><p style={{color:'#9ca3af'}}>保留原版所有明星产品：ISO、ITSS、CMMI等</p></div>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>
              {['资质认证','体系认证','产品认证'].map(t=><span key={t} style={{padding:'6px 16px',background:'#f3f4f6',borderRadius:8,fontSize:12,fontWeight:700,color:'#6b7280'}}>{t}</span>)}
              <button onClick={()=>nav('/services')} style={{padding:'6px 16px',background:'#eff6ff',borderRadius:8,fontSize:12,fontWeight:700,color:'#2563eb',border:'none',cursor:'pointer'}}>查看全部服务 →</button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:32}}>
            <div className="hp-bento-card" style={{background:'white',padding:40,borderRadius:40}}>
              <div style={{width:56,height:56,background:'#eff6ff',color:'#2563eb',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}><svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
              <h3 style={{fontSize:20,fontWeight:700,marginBottom:16,fontStyle:'italic'}}>ISO 体系认证</h3>
              <p style={{fontSize:14,color:'#9ca3af',lineHeight:1.7,marginBottom:32}}>涵盖 ISO9001、ISO14001、ISO45001、ISO27001、ISO20000 等标准化管理体系建设，助力企业建立国际化管理逻辑。</p>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{['高通过率','专家下厂指导'].map(t=><span key={t} className="hp-service-tag" style={{padding:'4px 12px',borderRadius:6,fontSize:10,fontWeight:700}}>{t}</span>)}</div>
            </div>
            <div className="hp-bento-card" style={{background:'#111827',padding:40,borderRadius:40,color:'white'}}>
              <div style={{width:56,height:56,background:'rgba(255,255,255,0.1)',color:'#60a5fa',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}><svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg></div>
              <h3 style={{fontSize:20,fontWeight:700,marginBottom:16,fontStyle:'italic',color:'#60a5fa'}}>软件 IT 资质</h3>
              <p style={{fontSize:14,color:'#9ca3af',lineHeight:1.7,marginBottom:32}}>专业办理 CMMI 3/5 级评估、ITSS 信息技术服务运维标准、CS 信息系统建设能力评估及涉密资质。</p>
              <button onClick={()=>nav('/services')} style={{fontSize:12,fontWeight:700,color:'white',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline',textUnderlineOffset:8}}>立即咨询软件资质专员 →</button>
            </div>
            <div className="hp-bento-card" style={{background:'white',padding:40,borderRadius:40}}>
              <div style={{width:56,height:56,background:'#fff7ed',color:'#ea580c',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}><svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-12-10h2m0 0a8.001 8.001 0 1116 0h2"/></svg></div>
              <h3 style={{fontSize:20,fontWeight:700,marginBottom:16,fontStyle:'italic'}}>知识产权与产品认证</h3>
              <p style={{fontSize:14,color:'#9ca3af',lineHeight:1.7,marginBottom:32}}>商标注册、专利申报、软件著作权、CCC 强制性认证、CE/FCC 出口认证，全方位保护您的无形资产。</p>
              <p style={{fontSize:10,color:'#d1d5db',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.15em'}}>Intellectual Property</p>
            </div>
          </div>
        </div>
      </section>

      {/* Digital */}
      <section id="digital" style={{padding:'128px 0',background:'#f9fafb',overflow:'hidden'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px'}}>
          <div style={{background:'white',borderRadius:48,padding:'64px 96px',boxShadow:'0 20px 40px -8px rgba(0,0,0,0.06)',border:'1px solid #f3f4f6',display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
            <div>
              <h2 style={{fontSize:36,fontWeight:700,marginBottom:32,lineHeight:1.3,fontStyle:'italic',textDecoration:'underline',textDecorationColor:'#2563eb',textDecorationThickness:4,textUnderlineOffset:12}}>正达管家：<br/>数字化认证新标准</h2>
              <p style={{color:'#6b7280',marginBottom:40,fontSize:16,lineHeight:1.75}}>将传统的"认证黑盒"变为"透明看板"，通过 SAAS 系统实时监控每一个认证节点。</p>
              <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:24}}>
                {[{n:'1',t:'进度透明化',d:'每个节点自动更新，申报状态随时随地在系统查阅。'},{n:'2',t:'智能效期预警',d:'证书到期前 90 天自动发起多端提醒，避免断证风险。'},{n:'3',t:'云端文档管理',d:'全套申报资料、证书扫描件永久加密在线存档。'}].map(item=>(
                  <li key={item.n} style={{display:'flex',alignItems:'flex-start',gap:16}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:'#2563eb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'white',fontWeight:700,flexShrink:0,marginTop:2}}>{item.n}</div>
                    <div><h4 style={{fontWeight:700,margin:'0 0 4px',fontSize:15}}>{item.t}</h4><p style={{fontSize:12,color:'#9ca3af',margin:0}}>{item.d}</p></div>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{position:'relative'}}>
              <div style={{padding:8,background:'#111827',borderRadius:32,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.3)',transform:'skewY(3deg)'}}><img src="https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=800" style={{borderRadius:24,display:'block',width:'100%'}} alt=""/></div>
              <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'rgba(96,165,250,0.2)',filter:'blur(80px)',borderRadius:'50%'}}/>
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section id="cases" style={{padding:'128px 0',overflow:'hidden'}}>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px'}}>
          <CasesSlider cases={cases} onViewAll={()=>nav('/cases')}/>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" style={{background:'#030712',paddingTop:128,paddingBottom:48,marginTop:128,color:'white',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'100%',height:1,background:'linear-gradient(to right,transparent,#3b82f6,transparent)'}}/>
        <div style={{maxWidth:1280,margin:'0 auto',padding:'0 24px'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:64,marginBottom:80}}>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:'#3b82f6',marginBottom:32,fontStyle:'italic'}}>ZHENGDATONG</div>
              <p style={{color:'#9ca3af',fontSize:14,lineHeight:1.75}}>正达通-专业的企业认证服务平台。深耕行业，以人工+智能的方式，保证您的认证服务品质。</p>
            </div>
            <FooterCol title="热门认证" links={[{label:'ISO 9001 认证',route:'/services'},{label:'ISO 27001 认证',route:'/services'},{label:'CMMI 评估办理',route:'/services'},{label:'ITSS 资质申办',route:'/services'}]}/>
            <FooterCol title="快捷链接" links={[{label:'达通管家登录',route:null,onClick:()=>setLoginOpen(true)},{label:'客户案例',route:'/cases'},{label:'关于我们',route:'/about'}]}/>
            <div>
              <h4 style={{fontSize:12,fontWeight:700,marginBottom:24,textTransform:'uppercase',letterSpacing:'0.15em',color:'#6b7280',fontStyle:'italic'}}>联系我们</h4>
              <p style={{fontSize:20,fontWeight:700,color:'white',marginBottom:8,fontStyle:'italic',letterSpacing:'-0.02em'}}>{cfg.phone}</p>
              <p style={{fontSize:12,color:'#6b7280',lineHeight:1.75,marginTop:12}}>地址：{cfg.address}<br/>邮箱：{cfg.email}</p>
            </div>
          </div>

          {/* 客户经理入口 */}
          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:40,marginBottom:32,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
            <div>
              <div style={{fontSize:12,color:'#6b7280',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>EXCLUSIVE SERVICE</div>
              <div style={{fontSize:18,fontWeight:800,color:'white',marginBottom:4}}>专属客户经理</div>
              <div style={{fontSize:13,color:'#9ca3af'}}>1对1顾问服务，快速了解您的认证需求</div>
            </div>
            <button onClick={()=>setManagerOpen(true)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'14px 28px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:16,cursor:'pointer',transition:'all 0.2s',color:'white',fontFamily:'inherit'}}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.background='#2563eb';el.style.borderColor='#2563eb';}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLButtonElement;el.style.background='rgba(255,255,255,0.06)';el.style.borderColor='rgba(255,255,255,0.12)';}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#2563eb,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>👤</div>
              <div style={{textAlign:'left'}}><div style={{fontSize:14,fontWeight:700}}>联系客户经理</div><div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>扫码或电话咨询</div></div>
            </button>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.04)',paddingTop:32,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:24}}>
            <p style={{fontSize:10,fontWeight:700,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.15em',margin:0}}>© 2026 ZHENGDA TONG PLATFORM. ALL RIGHTS RESERVED.</p>
            <div style={{display:'flex',gap:32}}>{['苏ICP备XXXXXXX号','隐私权条款','服务协议'].map(link=><a key={link} href="#" style={{fontSize:10,fontWeight:700,color:'#4b5563',textTransform:'uppercase',letterSpacing:'0.1em',textDecoration:'none',transition:'color 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.color='white')} onMouseLeave={e=>(e.currentTarget.style.color='#4b5563')}>{link}</a>)}</div>
          </div>
        </div>
      </footer>
    </div>
    {loginOpen&&<LoginModal onClose={()=>setLoginOpen(false)}/>}
    {inquiryOpen&&<InquiryModal onClose={()=>setInquiryOpen(false)}/>}
    <ManagerCard open={managerOpen} onClose={()=>setManagerOpen(false)}/>
  </>);
}

const FooterCol:React.FC<{title:string;links:{label:string;route:string|null;onClick?:()=>void}[]}>=({title,links})=>{
  const nav=useNavigate();
  return(<div>
    <h4 style={{fontSize:12,fontWeight:700,marginBottom:32,textTransform:'uppercase',letterSpacing:'0.15em',color:'#6b7280',fontStyle:'italic'}}>{title}</h4>
    <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:16}}>
      {links.map(link=><li key={link.label}><button onClick={()=>{if(link.onClick){link.onClick();return;}if(link.route)nav(link.route);}} style={{fontSize:14,color:'#9ca3af',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit',transition:'color 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.color='#3b82f6')} onMouseLeave={e=>(e.currentTarget.style.color='#9ca3af')}>{link.label}</button></li>)}
    </ul>
  </div>);
};