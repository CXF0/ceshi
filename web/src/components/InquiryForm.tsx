/**
 * @file src/components/InquiryForm.tsx
 * @desc 公共快速咨询表单 — 官网首页弹窗 / 关于我们页嵌入 共用
 *       POST /api/inquiries，成功后展示感谢反馈
 */
import React, { useState } from 'react';

interface Props {
  source?: string;
  dark?: boolean;        // 暗色背景模式（关于我们页深色区域）
  onSuccess?: () => void;
}

type State = 'idle' | 'loading' | 'success' | 'error';

const InquiryForm: React.FC<Props> = ({ source = 'website', dark = false, onSuccess }) => {
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [content, setContent] = useState('');
  const [state, setState]     = useState<State>('idle');
  const [errMsg, setErrMsg]   = useState('');

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    background: dark ? 'rgba(255,255,255,0.08)' : '#f8faff',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(37,99,235,0.15)'}`,
    borderRadius: 10, padding: '11px 14px',
    color: dark ? 'white' : '#111827', fontSize: 14,
    outline: 'none', marginBottom: 12,
    fontFamily: 'inherit', transition: 'border-color 0.2s',
    ...extra,
  });

  const submit = async () => {
    if (!name.trim())                        return setErrMsg('请填写姓名');
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) return setErrMsg('请填写正确的手机号');
    setErrMsg(''); setState('loading');
    try {
      const res  = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), content: content.trim(), source }),
      });
      const json = await res.json();
      if (res.ok && json.code === 200) { setState('success'); onSuccess?.(); }
      else { setErrMsg(json.message || '提交失败'); setState('error'); }
    } catch { setErrMsg('网络异常，请重试'); setState('error'); }
  };

  if (state === 'success') return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: dark ? 'white' : '#111827', marginBottom: 8 }}>
        提交成功！
      </div>
      <p style={{ fontSize: 13, color: dark ? '#9ca3af' : '#6b7280', marginBottom: 20 }}>
        顾问将在 2 小时内主动联系您
      </p>
      <button onClick={() => { setState('idle'); setName(''); setPhone(''); setContent(''); }}
        style={{ padding: '7px 18px', background: 'none', border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: dark ? '#9ca3af' : '#6b7280' }}>
        再次咨询
      </button>
    </div>
  );

  return (
    <div>
      <input placeholder="您的姓名 *" value={name} onChange={e => setName(e.target.value)} style={inp()} />
      <input placeholder="手机号码 *" type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inp()} />
      <input placeholder="咨询内容（如：需要 ISO9001 认证）" value={content} onChange={e => setContent(e.target.value)} style={inp()} />
      {errMsg && <div style={{ fontSize: 12, color: '#ef4444', marginTop: -8, marginBottom: 10 }}>{errMsg}</div>}
      <button onClick={submit} disabled={state === 'loading'}
        style={{ width: '100%', padding: 13, background: state === 'loading' ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: state === 'loading' ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
        onMouseEnter={e => { if (state !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
        onMouseLeave={e => { if (state !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'; }}>
        {state === 'loading' ? '提交中...' : '免费咨询，2小时内回电'}
      </button>
    </div>
  );
};

export default InquiryForm;