/**
 * @file src/pages/homepage/ServicesPage.tsx
 * @version 2.0.0 [2026-05-04]
 */
import React, { useEffect, useState } from 'react';
import { Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig, fetchSiteServices } from './useSiteConfig';

interface ServiceItem {
  id: number; title: string; subtitle: string; description: string;
  features: string[]; tags: string[];
  icon_type: string; theme: 'light' | 'dark' | 'blue';
  sort_order: number; is_active: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  shield: <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  code:   <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
  star:   <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  award:  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-3.5 2.5 1-4L6 11l4.2-.5L12 7l1.8 3.5 4.2.5-3.5 2.5 1 4L12 15z" /></svg>,
};

const THEME_STYLE = {
  light: { bg: 'white',   color: '#111827', tagBg: 'rgba(37,99,235,0.08)', tagColor: '#2563eb', iconBg: '#eff6ff',               iconColor: '#2563eb', descColor: '#6b7280' },
  dark:  { bg: '#111827', color: 'white',   tagBg: 'rgba(255,255,255,0.1)', tagColor: '#93c5fd', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#60a5fa', descColor: '#9ca3af' },
  blue:  { bg: '#2563eb', color: 'white',   tagBg: 'rgba(255,255,255,0.15)',tagColor: 'white',   iconBg: 'rgba(255,255,255,0.15)',iconColor: 'white',   descColor: 'rgba(255,255,255,0.8)' },
};

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 1, title: 'ISO 体系认证', subtitle: '国际管理体系标准', description: '涵盖 ISO9001、ISO14001、ISO45001、ISO27001、ISO20000 等标准化管理体系建设。', features: ['专家全程驻场指导', '通过率行业领先', '一对一文件辅导', '认证后持续支持'], tags: ['高通过率', '专家指导'], icon_type: 'shield', theme: 'light', sort_order: 1, is_active: 1 },
  { id: 2, title: '软件 IT 资质', subtitle: 'CMMI · ITSS · CS', description: '专业办理 CMMI 3/5 级评估、ITSS 信息技术服务运维标准、CS 信息系统建设能力评估及涉密资质。', features: ['CMMI 3/5 级评估', 'ITSS 运维认证', '涉密资质办理', '招投标加分证书'], tags: ['软件资质', 'IT认证'], icon_type: 'code', theme: 'dark', sort_order: 2, is_active: 1 },
  { id: 3, title: '知识产权服务', subtitle: '商标 · 专利 · 著作权', description: '商标注册、专利申报、软件著作权、CCC 强制性认证、CE/FCC 出口认证，全方位保护您的无形资产。', features: ['商标注册全类别', '专利申报代理', '软件著作权登记', 'CCC/CE/FCC认证'], tags: ['知识产权', '产品认证'], icon_type: 'award', theme: 'light', sort_order: 3, is_active: 1 },
  { id: 4, title: '高新技术企业', subtitle: '政策申报 · 税收优惠', description: '高新技术企业认定、科技型中小企业评价，帮助企业享受最高 15% 所得税优惠及多项政府补贴。', features: ['高新企业认定', '科技型中小企业', '研发费用加计扣除', '政府补贴申报'], tags: ['税收优惠', '政策申报'], icon_type: 'star', theme: 'blue', sort_order: 4, is_active: 1 },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const { cfg } = useSiteConfig();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSiteServices()
      .then(list => setServices(list.length > 0 ? list : DEFAULT_SERVICES))
      .catch(() => setServices(DEFAULT_SERVICES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;

  const visible = services.filter(s => s.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}>
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', gap: 24 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
          <ArrowLeftOutlined /> 返回首页
        </button>
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>认证服务</span>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #f9fafb 100%)', padding: '80px 24px 64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, color: '#111827', marginBottom: 20, letterSpacing: '-0.03em' }}>
          {cfg.services_page_title}
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 560, margin: '0 auto' }}>{cfg.services_page_subtitle}</p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        {visible.length === 0 ? <Empty description="暂无服务内容" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
            {visible.map(s => {
              const t = THEME_STYLE[s.theme] ?? THEME_STYLE.light;
              return (
                <div key={s.id} style={{ background: t.bg, borderRadius: 32, padding: 40, border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.3s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-6px)'; el.style.boxShadow = '0 24px 48px -12px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.boxShadow = ''; }}>
                  <div style={{ width: 56, height: 56, background: t.iconBg, color: t.iconColor, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                    {ICON_MAP[s.icon_type] ?? ICON_MAP.shield}
                  </div>
                  {s.subtitle && <div style={{ fontSize: 11, fontWeight: 700, color: t.descColor, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{s.subtitle}</div>}
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: t.color, marginBottom: 16 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: t.descColor, lineHeight: 1.75, marginBottom: 28 }}>{s.description}</p>
                  {s.features.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {s.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: t.descColor }}>
                          <span style={{ width: 18, height: 18, borderRadius: '50%', background: t.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="10" height="10" fill="none" stroke={t.iconColor} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {s.tags.map(tag => <span key={tag} style={{ padding: '4px 12px', background: t.tagBg, color: t.tagColor, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{tag}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 80, background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0ea5e9 100%)', borderRadius: 32, padding: '64px 48px', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>不确定需要哪种认证？</h2>
          <p style={{ fontSize: 16, opacity: 0.8, marginBottom: 16 }}>联系我们的顾问，免费评估您的认证需求</p>
          <p style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{cfg.phone}</p>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 32 }}>{cfg.email}</p>
          <button onClick={() => navigate('/')} style={{ padding: '14px 32px', background: 'white', color: '#1d4ed8', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>返回首页</button>
        </div>
      </div>
    </div>
  );
}