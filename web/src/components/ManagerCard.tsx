/**
 * @file src/components/ManagerCard.tsx
 * @version 2.1.0 [2026-05-04]
 * 修复：
 *   1. 头像 / 二维码未居中 → 改为 Flex 居中布局
 *   2. 关闭按钮与 Tab 重叠 → 关闭按钮独立在顶部栏，Tab 另起一行
 */
import React, { useEffect, useState } from 'react';

interface Manager {
  id: number;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  qrcodeUrl?: string;
  tips: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_MANAGERS: Manager[] = [
  { id: 1, name: '李顾问', title: '高级认证顾问', bio: '10年认证行业经验，擅长 ISO 体系、CMMI 评估，服务企业 500+，通过率 98%。', tips: '扫码立即咨询' },
  { id: 2, name: '王顾问', title: 'IT资质专家',   bio: '专注软件IT资质认证，熟悉 CMMI、ITSS、涉密资质等，助力企业快速拿证。',  tips: '扫码添加微信' },
];

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#dc2626'];
const avatarColor   = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

const ManagerCard: React.FC<Props> = ({ open, onClose }) => {
  const [managers,  setManagers]  = useState<Manager[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
    fetch('/api/site/managers')
      .then(r => r.json())
      .then(res => {
        const list: any[] = res?.data ?? [];
        if (list.length > 0) {
          setManagers(list.map((m: any) => ({
            id:        m.id,
            name:      m.name,
            title:     m.title     || '',
            bio:       m.bio       || '',
            avatarUrl: m.avatarUrl || m.avatar_url  || undefined,
            qrcodeUrl: m.qrcodeUrl || m.qrcode_url  || undefined,
            tips:      m.tips      || '扫码立即咨询',
          })));
        } else {
          setManagers(DEFAULT_MANAGERS);
        }
      })
      .catch(() => setManagers(DEFAULT_MANAGERS));
  }, [open]);

  if (!open) return null;

  const mgr = managers[activeIdx] ?? DEFAULT_MANAGERS[0];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <style>{`
        @keyframes mgr-in {
          from { opacity: 0; transform: scale(0.93) translateY(14px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      <div style={{
        background: 'white', borderRadius: 24,
        width: 480, maxWidth: '92vw',
        boxShadow: '0 32px 64px -16px rgba(0,0,0,0.25)',
        animation: 'mgr-in 0.22s ease-out',
        overflow: 'hidden',         /* 确保圆角内容不溢出 */
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── 顶部栏：标题 + 关闭按钮（独立一行，不与 Tab 重叠） ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            专属客户经理
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#f3f4f6', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#6b7280', lineHeight: 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
          >
            ×
          </button>
        </div>

        {/* ── 多人切换 Tab（独立一行，关闭按钮在上方，互不干扰） ── */}
        {managers.length > 1 && (
          <div style={{
            display: 'flex', gap: 6,
            margin: '14px 20px 0',
            background: '#f3f4f6', padding: 4, borderRadius: 10,
          }}>
            {managers.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveIdx(i)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s',
                  background:  activeIdx === i ? 'white'       : 'transparent',
                  color:       activeIdx === i ? '#2563eb'      : '#6b7280',
                  boxShadow:   activeIdx === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* ── 主体内容区 ── */}
        <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* 头像 — 水平居中 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            {mgr.avatarUrl ? (
              <img
                src={mgr.avatarUrl} alt={mgr.name}
                style={{
                  width: 88, height: 88, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #eff6ff',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.18)',
                }}
              />
            ) : (
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: `linear-gradient(135deg, ${avatarColor(mgr.id)}, ${avatarColor(mgr.id + 2)})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 900, color: 'white',
                boxShadow: '0 4px 16px rgba(37,99,235,0.2)',
              }}>
                {mgr.name[0]}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, color: '#111827' }}>
              {mgr.name}
            </div>
            <div style={{
              fontSize: 12, color: '#2563eb', fontWeight: 600,
              marginTop: 5, padding: '3px 12px',
              background: '#eff6ff', borderRadius: 20, display: 'inline-block',
            }}>
              {mgr.title}
            </div>
          </div>

          {/* 简介 */}
          {mgr.bio && (
            <p style={{
              fontSize: 13, color: '#6b7280', lineHeight: 1.75,
              marginBottom: 20, textAlign: 'center',
              maxWidth: 340,
            }}>
              {mgr.bio}
            </p>
          )}

          {/* 分割线 */}
          <div style={{ width: '100%', height: 1, background: '#f3f4f6', marginBottom: 20 }} />

          {/* 二维码 — 水平居中 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {mgr.qrcodeUrl ? (
              <img
                src={mgr.qrcodeUrl} alt="微信二维码"
                style={{
                  width: 140, height: 140,
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              />
            ) : (
              <div style={{
                width: 140, height: 140, borderRadius: 14,
                border: '2px dashed #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f9fafb',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>微信二维码</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: '#374151' }}>
              {mgr.tips}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              或电话咨询：025-66090399
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerCard;