/**
 * @file src/pages/homepage/AboutPage.tsx
 * @version 3.0.0 [2026-05-04]
 * 新增：联系我们区域嵌入 InquiryForm + ManagerCard 弹窗
 */
import React, { useState } from 'react';
import { Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from './useSiteConfig';
import InquiryForm from '@/components/InquiryForm';
import ManagerCard from '@/components/ManagerCard';

export default function AboutPage() {
  const navigate = useNavigate();
  const { cfg, loading } = useSiteConfig();
  const [managerOpen, setManagerOpen] = useState(false);

  const stats = [1, 2, 3, 4].map(n => ({
    value: cfg[`stat_${n}_value`],
    unit:  cfg[`stat_${n}_unit`],
    label: cfg[`stat_${n}_label`],
  }));

  const honors: string[] = Array.isArray(cfg.honor_list) ? cfg.honor_list : [
    'ISO 9001:2015 认证服务机构资质', '国家高新技术企业认定',
    '江苏省服务外包示范企业', '中国认证认可协会会员单位', 'CMMI 认证合作伙伴',
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', 'Noto Sans SC', sans-serif", background: 'white' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', gap: 24 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
          <ArrowLeftOutlined /> 返回首页
        </button>
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>关于我们</span>
      </div>

      {/* Hero */}
      <div style={{ background: '#030712', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '60%', height: '200%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: 1, background: 'linear-gradient(to right, transparent, #3b82f6, transparent)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 24 }}>ABOUT US</div>
          <h1 style={{ fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, color: 'white', marginBottom: 28, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {cfg.company_name}
          </h1>
          <p style={{ fontSize: 18, color: '#9ca3af', lineHeight: 1.75, maxWidth: 560, margin: '0 auto' }}>{cfg.company_desc}</p>
        </div>
      </div>

      {/* 统计数字 */}
      <div style={{ background: '#f9fafb', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: 2 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '40px 20px', background: i % 2 === 0 ? 'white' : '#f3f4f6', borderRadius: i === 0 ? '16px 0 0 16px' : i === stats.length - 1 ? '0 16px 16px 0' : 0 }}>
              <div style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: '0.5em' }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 使命 & 愿景 */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', borderRadius: 32, padding: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>MISSION · 使命</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a', marginBottom: 20, lineHeight: 1.3 }}>让企业认证更简单、更透明</h2>
          <p style={{ fontSize: 15, color: '#3b5998', lineHeight: 1.8 }}>{cfg.company_mission}</p>
        </div>
        <div style={{ background: '#111827', borderRadius: 32, padding: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>VISION · 愿景</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 20, lineHeight: 1.3 }}>成为中国领先的企业合规服务平台</h2>
          <p style={{ fontSize: 15, color: '#9ca3af', lineHeight: 1.8 }}>{cfg.company_vision}</p>
        </div>
      </div>

      {/* 荣誉资质 */}
      {honors.length > 0 && (
        <div style={{ background: '#f9fafb', padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>HONORS & QUALIFICATIONS</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>资质与荣誉</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {honors.map((honor, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, border: '1px solid #f3f4f6', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#bfdbfe'; el.style.boxShadow = '0 4px 16px rgba(37,99,235,0.08)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#f3f4f6'; el.style.boxShadow = 'none'; }}>
                  <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{honor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 联系我们 — 加入咨询表单 + 客户经理 */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ background: 'linear-gradient(135deg,#030712 0%,#1e3a8a 100%)', borderRadius: 32, padding: '64px 80px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
            {/* 左：联系信息 + 客户经理 */}
            <div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 20, letterSpacing: '-0.02em' }}>联系我们</h2>
              <p style={{ color: '#9ca3af', marginBottom: 40, fontSize: 15 }}>欢迎随时联系，我们的认证顾问将在 2 小时内响应您的咨询。</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                {[
                  { icon: '📞', label: '电话', value: cfg.phone },
                  { icon: '📧', label: '邮箱', value: cfg.email },
                  { icon: '📍', label: '地址', value: cfg.address },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, color: 'white' }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 客户经理入口 */}
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>EXCLUSIVE SERVICE</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>专属客户经理</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>1对1顾问，扫码立即咨询</div>
                  </div>
                  <button onClick={() => setManagerOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: 12, cursor: 'pointer', color: 'white', fontFamily: 'inherit', transition: 'background 0.2s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#2563eb')}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#60a5fa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>查看顾问</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 右：快速咨询表单 */}
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, padding: 40, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>快速咨询</div>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>留下联系方式，顾问 2 小时内回电</p>
              <InquiryForm source="about" dark={true} />
            </div>
          </div>
        </div>
      </div>

      <ManagerCard open={managerOpen} onClose={() => setManagerOpen(false)} />
    </div>
  );
}