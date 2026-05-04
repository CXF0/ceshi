/**
 * @file src/pages/homepage/CasesPage.tsx
 * @version 2.0.0 [2026-05-04]
 */
import React, { useEffect, useState } from 'react';
import { Spin, Empty } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig, fetchSiteCases } from './useSiteConfig';

interface CaseItem {
  id: number; company_name: string; industry: string; cert_type: string;
  description: string; result: string; duration: string; tags: string[];
  logo_text: string; logo_color: string; is_featured: number; sort_order: number; is_active: number;
}

const INDUSTRY_COLORS: Record<string, string> = {
  '制造业': '#ef4444', '软件IT': '#3b82f6', '建筑工程': '#f59e0b',
  '医疗健康': '#10b981', '金融服务': '#8b5cf6', '教育培训': '#ec4899',
};

const DEFAULT_CASES: CaseItem[] = [
  { id: 1, company_name: '南京智慧科技有限公司', industry: '软件IT', cert_type: 'ISO 27001 + CMMI 3', description: '参与政府采购招投标，急需 ISO27001 及 CMMI 3 级评估双认证。', result: '历时 4 个月完成双认证，成功中标价值 1.2 亿元的智慧城市项目。', duration: '4 个月', tags: ['信息安全', 'CMMI'], logo_text: '智', logo_color: '#3b82f6', is_featured: 1, sort_order: 1, is_active: 1 },
  { id: 2, company_name: '苏州精密制造集团', industry: '制造业', cert_type: 'ISO 9001 + ISO 14001 + ISO 45001', description: '三体系整合认证，为企业出口欧盟市场建立合规管理体系基础。', result: '三体系一次性通过，欧盟客户审核零不符合项，年出口额增长 35%。', duration: '6 个月', tags: ['三体系整合', '出口合规'], logo_text: '苏', logo_color: '#ef4444', is_featured: 1, sort_order: 2, is_active: 1 },
  { id: 3, company_name: '南京医疗器械有限公司', industry: '医疗健康', cert_type: 'ISO 13485 + CCC 认证', description: '医疗器械行业强制认证，同步办理 ISO 13485 质量管理体系。', result: '成功通过 CCC 强制认证，进入 3 家三甲医院采购目录。', duration: '5 个月', tags: ['医疗器械', 'CCC认证'], logo_text: '医', logo_color: '#10b981', is_featured: 0, sort_order: 3, is_active: 1 },
  { id: 4, company_name: '杭州互联网科技有限公司', industry: '软件IT', cert_type: 'ITSS 一级 + 高新技术企业', description: 'ITSS 运维服务认证满足政府项目要求，高新企业认定享受税收优惠。', result: '享受 15% 所得税优惠率，年节税超 200 万。', duration: '7 个月', tags: ['ITSS', '高新企业'], logo_text: '杭', logo_color: '#8b5cf6', is_featured: 0, sort_order: 4, is_active: 1 },
];

export default function CasesPage() {
  const navigate = useNavigate();
  const { cfg } = useSiteConfig();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState('全部');

  useEffect(() => {
    fetchSiteCases()
      .then(list => setCases(list.length > 0 ? list : DEFAULT_CASES))
      .catch(() => setCases(DEFAULT_CASES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;

  const industries = ['全部', ...Array.from(new Set(cases.map(c => c.industry)))];
  const featured = cases.filter(c => c.is_featured && c.is_active);
  const filtered = (activeIndustry === '全部' ? cases : cases.filter(c => c.industry === activeIndustry))
    .filter(c => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', 'Noto Sans SC', sans-serif", background: '#f9fafb' }}>
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', gap: 24 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
          <ArrowLeftOutlined /> 返回首页
        </button>
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>客户案例</span>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)', padding: '80px 24px 64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 900, color: '#111827', marginBottom: 20, letterSpacing: '-0.03em' }}>
          {cfg.stat_1_value}{cfg.stat_1_unit} 企业的信赖之选
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
          覆盖制造、IT、医疗、建筑等十余个行业，认证成功率 {cfg.stat_2_value}{cfg.stat_2_unit}
        </p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        {/* 精选案例 */}
        {featured.length > 0 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginBottom: 32 }}>精选案例</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(520px, 1fr))', gap: 24, marginBottom: 64 }}>
              {featured.map(c => (
                <div key={c.id} style={{ background: '#111827', borderRadius: 24, padding: 40, color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: c.logo_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', flexShrink: 0 }}>{c.logo_text}</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>{c.company_name}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, color: '#9ca3af' }}>{c.industry}</span>
                        <span style={{ padding: '2px 10px', background: 'rgba(37,99,235,0.3)', borderRadius: 6, fontSize: 11, color: '#93c5fd' }}>{c.cert_type}</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.75, marginBottom: 20 }}>{c.description}</p>
                  <div style={{ background: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: '16px 20px', borderLeft: '3px solid #10b981' }}>
                    <div style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700, marginBottom: 6 }}>✓ 服务成果</div>
                    <p style={{ fontSize: 13, color: '#d1fae5', margin: 0, lineHeight: 1.6 }}>{c.result}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 行业筛选 + 全部案例 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0 }}>全部案例</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {industries.map(ind => (
              <button key={ind} onClick={() => setActiveIndustry(ind)}
                style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: activeIndustry === ind ? '#2563eb' : 'white', color: activeIndustry === ind ? 'white' : '#6b7280', borderColor: activeIndustry === ind ? '#2563eb' : '#e5e7eb' }}>
                {ind}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? <Empty description="暂无案例" /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #f3f4f6', transition: 'all 0.25s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 12px 32px -8px rgba(0,0,0,0.1)'; el.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.transform = ''; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: c.logo_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'white', flexShrink: 0 }}>{c.logo_text}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{c.company_name}</div>
                    <div style={{ fontSize: 12, color: INDUSTRY_COLORS[c.industry] || '#6b7280', fontWeight: 600 }}>{c.industry}</div>
                  </div>
                </div>
                <div style={{ padding: '6px 12px', background: '#eff6ff', borderRadius: 8, fontSize: 12, color: '#1d4ed8', fontWeight: 700, marginBottom: 16, display: 'inline-block' }}>{c.cert_type}</div>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>{c.description}</p>
                {c.result && (
                  <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginBottom: 4 }}>服务成果</div>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.result}</p>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(c.tags || []).slice(0, 2).map(tag => <span key={tag} style={{ padding: '3px 8px', background: '#f3f4f6', borderRadius: 5, fontSize: 11, color: '#6b7280' }}>{tag}</span>)}
                  </div>
                  {c.duration && <span style={{ fontSize: 11, color: '#9ca3af' }}>⏱ {c.duration}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}