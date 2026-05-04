/**
 * @file src/pages/homepage/index.tsx
 * @version 3.1.0 [2026-05-04]
 * @desc Hero 主标题拆为黑色（hero_title_black）+ 蓝色换行（hero_title_blue）两个字段
 */
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from './useSiteConfig';

/* ─── 样式 ─── */
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800&family=Noto+Sans+SC:wght@400;500;700&display=swap');
  .hp-root { font-family: 'Inter', 'Noto Sans SC', sans-serif; scroll-behavior: smooth; }
  .hp-glass-header { background: rgba(255,255,255,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .hp-hero-mesh {
    background:
      radial-gradient(at 0% 0%,   hsla(225,100%,94%,1) 0, transparent 50%),
      radial-gradient(at 100% 0%, hsla(190,100%,94%,1) 0, transparent 50%),
      white;
  }
  .hp-bento-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); border: 1px solid rgba(0,0,0,0.05); }
  .hp-bento-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08); }
  .hp-service-tag { background: rgba(37,99,235,0.08); color: #2563eb; }
  .hp-primary-blue { color: #2563eb; }
  .hp-nav-link { font-size: 13px; font-weight: 600; color: #6b7280; text-decoration: none; transition: color 0.2s; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; }
  .hp-nav-link:hover { color: #2563eb; }
  @keyframes hp-modal-in { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .hp-modal-box { animation: hp-modal-in 0.22s ease-out; }
  @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
`;

const NAV_ITEMS = [
  { label: '首页',     href: '#hero',     route: null        },
  { label: '认证服务', href: '#services', route: '/services' },
  { label: '正达管家', href: '#digital',  route: null        },
  { label: '客户案例', href: '#cases',    route: '/cases'    },
  { label: '关于我们', href: '#about',    route: '/about'    },
];

/* ─── 登录弹窗 ─── */
const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('isLogin', 'true');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userInfo', JSON.stringify(data.user || { nickname: values.username }));
        message.success(`欢迎回来，${data.user?.nickname || values.username}`);
        onClose();
        navigate('/dashboard', { replace: true });
      } else {
        message.error(data.message || '账号或密码错误');
      }
    } catch {
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div className="hp-modal-box" style={{ background: 'white', width: '100%', maxWidth: 380, borderRadius: 20, boxShadow: '0 24px 60px -8px rgba(0,0,0,0.18)', padding: '28px 28px 24px', margin: '0 16px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, padding: 4, borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#374151')} onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
          <CloseOutlined />
        </button>
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', margin: 0, fontStyle: 'italic' }}>账号登录</h3>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>客户管家登录后进入正达认证管理后台</p>
        </div>
        <Form name="hp-login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="username" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>账号</span>} rules={[{ required: true, message: '请输入账号' }]} style={{ marginBottom: 14 }}>
            <Input prefix={<UserOutlined style={{ color: '#93aac9' }} />} placeholder="请输入账号" style={{ borderRadius: 10, borderColor: 'rgba(37,99,235,0.15)', background: '#f8faff' }} />
          </Form.Item>
          <Form.Item name="password" label={<span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>密码</span>} rules={[{ required: true, message: '请输入密码' }]} style={{ marginBottom: 20 }}>
            <Input.Password prefix={<LockOutlined style={{ color: '#93aac9' }} />} placeholder="请输入密码" style={{ borderRadius: 10, borderColor: 'rgba(37,99,235,0.15)', background: '#f8faff' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={{ height: 44, borderRadius: 12, fontWeight: 700, fontSize: 15, background: '#2563eb', border: 'none', boxShadow: '0 6px 18px rgba(37,99,235,0.28)' }}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   主页面
══════════════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const { cfg } = useSiteConfig();

  useEffect(() => {
    document.body.style.overflow = loginOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [loginOpen]);

  const handleNav = (e: React.MouseEvent, item: typeof NAV_ITEMS[0]) => {
    if (item.route) { e.preventDefault(); navigate(item.route); }
  };

  const stats = [1, 2, 3, 4].map(n => ({
    value: cfg[`stat_${n}_value`],
    unit:  cfg[`stat_${n}_unit`],
    label: cfg[`stat_${n}_label`],
  }));

  return (
    <>
      <style>{globalCss}</style>
      <div className="hp-root bg-white text-gray-900" style={{ minHeight: '100vh', width: '100%' }}>

        {/* ══════════════ Header ══════════════ */}
        <header className="hp-glass-header" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
              <div style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.04em', color: '#2563eb' }}>ZhengDaTong</div>
              <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {NAV_ITEMS.map(nav => nav.route ? (
                  <button key={nav.label} className="hp-nav-link" onClick={e => handleNav(e, nav)}>{nav.label}</button>
                ) : (
                  <a key={nav.label} href={nav.href} className="hp-nav-link">{nav.label}</a>
                ))}
              </nav>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={() => setLoginOpen(true)}
                style={{ fontSize: 13, fontWeight: 700, color: '#374151', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: 12, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={e => (e.currentTarget.style.color = '#374151')}>
                管家登录
              </button>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.12em', fontStyle: 'italic' }}>{cfg.phone}</span>
              <button style={{ background: '#2563eb', color: 'white', padding: '10px 28px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 6px 16px rgba(37,99,235,0.22)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
                {cfg.hero_primary_btn}
              </button>
            </div>
          </div>
        </header>

        {/* ══════════════ Hero ══════════════ */}
        <section id="hero" className="hp-hero-mesh" style={{ paddingTop: 192, paddingBottom: 96, overflow: 'hidden' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              {/* 顶部标签 */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 24 }}>
                <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                  <span style={{ position: 'absolute', display: 'inline-flex', width: '100%', height: '100%', borderRadius: '50%', background: '#60a5fa', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                  <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                </span>
                {cfg.hero_badge_text}
              </div>

              {/* ★ 主标题：黑色部分 + 换行 + 蓝色部分 ★ */}
              <h1 style={{ fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 32, letterSpacing: '-0.03em', fontStyle: 'italic' }}>
                {cfg.hero_title_black}
                <br />
                <span className="hp-primary-blue">{cfg.hero_title_blue}</span>
              </h1>

              {/* 副标题 */}
              <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.75, marginBottom: 40, maxWidth: 480 }}>
                {cfg.hero_subtitle}
              </p>

              {/* 头像 + 口碑 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', marginLeft: -12 }}>
                  {[1, 2, 3].map(seed => (
                    <img key={seed} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid white', background: '#f3f4f6', marginLeft: seed === 1 ? 0 : -12 }} alt="" />
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textDecoration: 'underline', textDecorationColor: '#bfdbfe', textDecorationThickness: 2, textUnderlineOffset: 4 }}>
                  累计服务 {cfg.stat_1_value}{cfg.stat_1_unit} 知名企业
                </span>
              </div>

              {/* 统计数字行 */}
              <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {s.value}<span style={{ fontSize: 16 }}>{s.unit}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', padding: 16, borderRadius: 40, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid white' }}>
                <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
                  style={{ borderRadius: 32, display: 'block', width: '100%' }} alt="" />
              </div>
              <div style={{ position: 'absolute', bottom: -24, left: -24, background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 20px 40px -8px rgba(0,0,0,0.1)', border: '1px solid #f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#f0fdf4', color: '#16a34a', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontStyle: 'italic' }}>75%</div>
                  <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700, lineHeight: 1.4, margin: 0 }}>平均认证<br />效率提升</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ Services ══════════════ */}
        <section id="services" style={{ padding: '128px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 80, gap: 32 }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16, fontStyle: 'italic' }}>核心认证服务范围</h2>
                <p style={{ color: '#9ca3af' }}>保留原版所有明星产品：ISO、ITSS、CMMI等</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {['资质认证', '体系认证', '产品认证'].map(tag => (
                  <span key={tag} style={{ padding: '6px 16px', background: '#f3f4f6', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{tag}</span>
                ))}
                <button onClick={() => navigate('/services')} style={{ padding: '6px 16px', background: '#eff6ff', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#2563eb', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#dbeafe')} onMouseLeave={e => (e.currentTarget.style.background = '#eff6ff')}>
                  查看全部服务 →
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
              <div className="hp-bento-card" style={{ background: 'white', padding: 40, borderRadius: 40 }}>
                <div style={{ width: 56, height: 56, background: '#eff6ff', color: '#2563eb', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontStyle: 'italic' }}>ISO 体系认证</h3>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 32 }}>涵盖 ISO9001、ISO14001、ISO45001、ISO27001、ISO20000 等标准化管理体系建设，助力企业建立国际化管理逻辑。</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['高通过率', '专家下厂指导'].map(t => <span key={t} className="hp-service-tag" style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{t}</span>)}
                </div>
              </div>
              <div className="hp-bento-card" style={{ background: '#111827', padding: 40, borderRadius: 40, color: 'white' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', color: '#60a5fa', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontStyle: 'italic', color: '#60a5fa' }}>软件 IT 资质</h3>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 32 }}>专业办理 CMMI 3/5 级评估、ITSS 信息技术服务运维标准、CS 信息系统建设能力评估及涉密资质。</p>
                <button onClick={() => navigate('/services')} style={{ fontSize: 12, fontWeight: 700, color: 'white', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', textUnderlineOffset: 8 }}>
                  立即咨询软件资质专员 →
                </button>
              </div>
              <div className="hp-bento-card" style={{ background: 'white', padding: 40, borderRadius: 40 }}>
                <div style={{ width: 56, height: 56, background: '#fff7ed', color: '#ea580c', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3m0 18a10.003 10.003 0 01-12-10h2m0 0a8.001 8.001 0 1116 0h2m-2 0a10.003 10.003 0 01-12 10V11z" /></svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontStyle: 'italic' }}>知识产权与产品认证</h3>
                <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.7, marginBottom: 32 }}>商标注册、专利申报、软件著作权、CCC 强制性认证、CE/FCC 出口认证，全方位保护您的无形资产。</p>
                <p style={{ fontSize: 10, color: '#d1d5db', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Intellectual Property</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ Digital ══════════════ */}
        <section id="digital" style={{ padding: '128px 0', background: '#f9fafb', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ background: 'white', borderRadius: 48, padding: '64px 96px', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 32, lineHeight: 1.3, fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: '#2563eb', textDecorationThickness: 4, textUnderlineOffset: 12 }}>
                  优证管家：<br />数字化认证新标准
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 16, lineHeight: 1.75 }}>将传统的"认证黑盒"变为"透明看板"，通过 SAAS 系统实时监控每一个认证节点。</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {[
                    { n: '1', title: '进度透明化', desc: '每个节点自动更新，申报状态随时随地在系统查阅。' },
                    { n: '2', title: '智能效期预警', desc: '证书到期前 90 天自动发起多端提醒，避免断证风险。' },
                    { n: '3', title: '云端文档管理', desc: '全套申报资料、证书扫描件永久加密在线存档。' },
                  ].map(item => (
                    <li key={item.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{item.n}</div>
                      <div>
                        <h4 style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 15 }}>{item.title}</h4>
                        <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 10, padding: 8, background: '#111827', borderRadius: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', transform: 'skewY(3deg)' }}>
                  <img src="https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=800" style={{ borderRadius: 24, display: 'block', width: '100%' }} alt="" />
                </div>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(96,165,250,0.2)', filter: 'blur(80px)', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════ Cases ══════════════ */}
        <section id="cases" style={{ padding: '128px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 96 }}>
              <h2 style={{ fontSize: 36, fontWeight: 700, marginBottom: 24, fontStyle: 'italic' }}>标杆案例 · 见证实力</h2>
              <p style={{ color: '#9ca3af', maxWidth: 480, margin: '0 auto 32px' }}>涵盖智能制造、软件信息、政府单位、医疗生物等各行各业的真实认证历程。</p>
              <button onClick={() => navigate('/cases')} style={{ padding: '10px 28px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
                查看全部案例 →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
              {[
                { offset: false, cat: 'IT & 软件',  title: '某知名云计算科技公司', sub: 'CMMI 5级 软件能力成熟度评估案例', img: 'photo-1504384308090-c894fdcc538d' },
                { offset: true,  cat: '智能制造',   title: '上海某航天精密设备厂', sub: 'ISO 9001 / ISO 27001 双体系贯标案例', img: 'photo-1581091226825-a6a2a5aee158' },
                { offset: false, cat: '政企单位',   title: '某市行政政务中心',     sub: 'ITSS 信息技术服务运维资质办理', img: 'photo-1486406146926-c627a92ad1ab' },
                { offset: true,  cat: '生物医药',   title: '某上市生物医药实验室', sub: 'ISO 13485 医疗器械质量体系认证', img: 'photo-1573161158365-597e0094b911' },
              ].map((c, i) => <CaseCard key={i} {...c} onClick={() => navigate('/cases')} />)}
            </div>
          </div>
        </section>

        {/* ══════════════ Footer ══════════════ */}
        <footer id="about" style={{ background: '#030712', paddingTop: 128, paddingBottom: 48, marginTop: 128, color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: 1, background: 'linear-gradient(to right, transparent, #3b82f6, transparent)' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 64, marginBottom: 96 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#3b82f6', marginBottom: 32, fontStyle: 'italic' }}>ZHENGDATONG</div>
                <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.75 }}>正达通-专业的企业认证服务平台。深耕行业，以人工+智能的方式，保证您的认证服务品质。</p>
              </div>
              <FooterCol title="热门认证" links={[
                { label: 'ISO 9001 认证',  route: '/services' },
                { label: 'ISO 27001 认证', route: '/services' },
                { label: 'CMMI 评估办理',  route: '/services' },
                { label: 'ITSS 资质申办',  route: '/services' },
              ]} />
              <FooterCol title="快捷链接" links={[
                { label: '达通管家登录', route: null, onClick: () => setLoginOpen(true) },
                { label: '客户案例',     route: '/cases' },
                { label: '关于我们',     route: '/about' },
              ]} />
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', fontStyle: 'italic' }}>联系我们</h4>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8, fontStyle: 'italic', letterSpacing: '-0.02em' }}>{cfg.phone}</p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.75, marginTop: 16 }}>
                  地址：{cfg.address}<br />邮箱：{cfg.email}
                </p>
              </div>
            </div>
            <div style={{ paddingTop: 48, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                © 2026 ZHENGDA TONG PLATFORM. ALL RIGHTS RESERVED.
              </p>
              <div style={{ display: 'flex', gap: 32 }}>
                {['苏ICP备XXXXXXX号', '隐私权条款', '服务协议'].map(link => (
                  <a key={link} href="#" style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'white')} onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}>
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}

const CaseCard: React.FC<{ offset: boolean; cat: string; title: string; sub: string; img: string; onClick?: () => void }> = ({ offset, cat, title, sub, img, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="hp-bento-card" style={{ padding: 16, borderRadius: 32, cursor: 'pointer', transform: offset ? 'translateY(40px)' : 'none' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>
      <div style={{ aspectRatio: '1/1', background: '#f9fafb', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <img src={`https://images.unsplash.com/${img}?auto=format&fit=crop&q=80&w=400`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: hovered ? 'none' : 'grayscale(100%)', transition: 'filter 0.7s' }} alt="" />
      </div>
      <div style={{ padding: '0 8px' }}>
        <span style={{ fontSize: 10, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{cat}</span>
        <h4 style={{ fontWeight: 700, fontSize: 16, marginTop: 8, marginBottom: 0, color: hovered ? '#2563eb' : '#111827', transition: 'color 0.2s', fontStyle: 'italic' }}>{title}</h4>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>{sub}</p>
      </div>
    </div>
  );
};

const FooterCol: React.FC<{ title: string; links: { label: string; route: string | null; onClick?: () => void }[] }> = ({ title, links }) => {
  const navigate = useNavigate();
  return (
    <div>
      <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', fontStyle: 'italic' }}>{title}</h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {links.map(link => (
          <li key={link.label}>
            <button onClick={() => { if (link.onClick) { link.onClick(); return; } if (link.route) navigate(link.route); }}
              style={{ fontSize: 14, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')} onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
              {link.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};