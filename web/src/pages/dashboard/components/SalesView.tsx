/**
 * @file web/src/pages/dashboard/components/SalesView.tsx
 * @version 3.1.0 [2026-04-29]
 * @desc 优化4：目标金额从用户的 salesTarget 字段读取；优化5：切换维度只刷本板块（由 index.tsx 控制）
 */
import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Empty, Select, Radio, Space, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';

interface SalesUser {
  id: string;
  name: string;
  salesTarget?: number;
  hasSalesTarget?: boolean;
}

interface SalesViewProps {
  data: any;
  salesUsers: SalesUser[];
  period: string;
  selectedUser: string | undefined;
  onPeriodChange: (v: string) => void;
  onUserChange: (v: string | undefined) => void;
}

const PERIOD_OPTIONS = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

const fmtMoney = (val: number) =>
  val >= 10000 ? `¥${(val / 10000).toFixed(2)}万` : `¥${val.toLocaleString()}`;

// ── 生成平滑贝塞尔曲线路径 ────────────────────────────
const smoothPath = (pts: {x: number; y: number}[]): string => {
  if (pts.length < 2) return '';
  const tension = 0.35;
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
};

// SVG 丝滑曲线图
const TrendChart: React.FC<{ data: { label: string; revenue: number }[] }> = ({ data }) => {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; label: string; revenue: number } | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0' }}>暂无趋势数据</div>;
  }

  const W = 380; const H = 130;
  const PAD = { top: 20, right: 20, bottom: 30, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const minVal = 0;

  const pts = data.map((d, i) => ({
    x: PAD.left + (data.length > 1 ? (i / (data.length - 1)) : 0.5) * chartW,
    y: PAD.top + chartH - ((d.revenue - minVal) / (maxVal - minVal || 1)) * chartH,
    ...d,
  }));

  const linePath = smoothPath(pts);
  const areaPath = linePath
    + ` L${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)}`
    + ` L${pts[0].x.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`;

  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.25" />
          <stop offset="60%"  stopColor="#22d3ee" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#22d3ee" />
          <stop offset="50%"  stopColor="#4ade80" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* 网格线 */}
      {gridRatios.map(r => (
        <line key={r}
          x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
          x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
          stroke={r === 0 ? '#e0e0e0' : '#f5f5f5'} strokeWidth={r === 0 ? 1.5 : 1} />
      ))}

      {/* Y轴标签 */}
      {[0, 0.5, 1].map(r => (
        <text key={r} x={PAD.left - 6} y={PAD.top + chartH * (1 - r) + 4}
          textAnchor="end" fontSize={9} fill="#c0c0c0">
          {maxVal * r >= 10000 ? `${(maxVal * r / 10000).toFixed(0)}w` : (maxVal * r).toFixed(0)}
        </text>
      ))}

      {/* 面积填充 */}
      <path d={areaPath} fill="url(#trendGrad)" />

      {/* 发光效果曲线（底层） */}
      <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={4} strokeOpacity={0.15}
        strokeLinecap="round" filter="url(#glow)" />

      {/* 主曲线 */}
      <path d={linePath} fill="none" stroke="url(#lineGrad)"
        strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* 数据点 + X轴标签 */}
      {pts.map((p, i) => (
        <g key={i}
          onMouseEnter={() => setTooltip({ x: p.x, y: p.y, label: p.label, revenue: p.revenue })}
          onMouseLeave={() => setTooltip(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* 外圈光晕 */}
          <circle cx={p.x} cy={p.y} r={6} fill="white" fillOpacity={0.6} />
          {/* 主点 */}
          <circle cx={p.x} cy={p.y} r={3.5}
            fill={i === pts.length - 1 ? '#facc15' : i % 2 === 0 ? '#4ade80' : '#22d3ee'}
            stroke="white" strokeWidth={1.5} />
          {/* X轴标签 */}
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#b0b0b0">{p.label}</text>
        </g>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH}
            stroke="#e0e0e0" strokeWidth={1} strokeDasharray="3,3" />
          <rect x={tooltip.x - 44} y={tooltip.y - 36} width={88} height={28}
            rx={6} fill="rgba(30,30,40,0.85)" />
          <text x={tooltip.x} y={tooltip.y - 22} textAnchor="middle" fontSize={10} fill="#fff" fontWeight="600">
            {tooltip.label}
          </text>
          <text x={tooltip.x} y={tooltip.y - 11} textAnchor="middle" fontSize={9} fill="#4ade80">
            {tooltip.revenue >= 10000
              ? `¥${(tooltip.revenue / 10000).toFixed(2)}万`
              : `¥${tooltip.revenue.toLocaleString()}`}
          </text>
        </g>
      )}
    </svg>
  );
};

const SalesView: React.FC<SalesViewProps> = ({
  data, salesUsers, period, selectedUser, onPeriodChange, onUserChange,
}) => {
  if (!data) return null;

  const {
    periodRevenue = 0, lastRevenue = 0,
    newContractCount = 0, followUpCount = 0,
    growth = 0, trendData = [],
  } = data;

  // ✅ 优化4：目标从用户配置读取
  const targetAmount = useMemo(() => {
    if (selectedUser) {
      // 选了具体人员 → 看这个人的个人目标
      const u = salesUsers.find(u => u.id === selectedUser);
      if (u?.hasSalesTarget && u?.salesTarget) return u.salesTarget;
      return 0; // 该用户未设定目标
    } else {
      // 全体 → 公司总目标 = 所有设定了目标的人的和
      const total = salesUsers
        .filter(u => u.hasSalesTarget && u.salesTarget)
        .reduce((s, u) => s + (u.salesTarget || 0), 0);
      return total;
    }
  }, [selectedUser, salesUsers]);

  const targetProgress = targetAmount > 0
    ? Math.min(Math.round((periodRevenue / targetAmount) * 100), 100)
    : 0;

  const hasTarget   = targetAmount > 0;
  const isUp        = growth >= 0;
  const progressColor = targetProgress >= 100 ? '#52c41a' : targetProgress >= 70 ? '#71ccbc' : targetProgress >= 40 ? '#faad14' : '#ff4d4f';
  const periodLabel   = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';

  const selectedUserName = selectedUser
    ? salesUsers.find(u => u.id === selectedUser)?.name || '该销售'
    : '全公司';

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}
      title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>销售业绩看板</span></Space>}
      extra={
        <Space>
          {salesUsers.length > 0 && (
            <Select
              placeholder="全部销售"
              allowClear
              style={{ width: 120 }}
              size="small"
              value={selectedUser}
              onChange={v => onUserChange(v)}
              options={salesUsers.map(u => ({
                label: u.hasSalesTarget
                  ? `${u.name}（¥${u.salesTarget ? (u.salesTarget / 10000).toFixed(0) : 0}万）`
                  : u.name,
                value: u.id,
              }))}
            />
          )}
          <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
            options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {/* 左：业绩数字 */}
        <Col xs={24} md={10}>
          {/* 本期业绩 */}
          <div style={{ background: 'linear-gradient(135deg,#71ccbc15 0%,#f0faf8 100%)', borderRadius: 12, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              {selectedUserName} · {periodLabel}签约金额
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
              {fmtMoney(periodRevenue)}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastRevenue > 0 && (
                <Tag color={isUp ? 'success' : 'error'} icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} style={{ margin: 0 }}>
                  {isUp ? '+' : ''}{growth.toFixed(1)}% 环比
                </Tag>
              )}
              <span style={{ fontSize: 11, color: '#bbb' }}>上{periodLabel}：{fmtMoney(lastRevenue)}</span>
            </div>
          </div>

          {/* 目标进度 */}
          {hasTarget ? (
            <div style={{ background: '#fafafa', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <Row justify="space-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#595959', fontWeight: 600 }}>
                  {selectedUser ? '个人' : '公司'}{periodLabel}目标达成
                </span>
                <span style={{ fontSize: 13, color: progressColor, fontWeight: 700 }}>{targetProgress}%</span>
              </Row>
              <Progress percent={targetProgress} strokeColor={progressColor} trailColor="#f0f0f0"
                strokeWidth={8} showInfo={false} style={{ marginBottom: 4 }} />
              <Row justify="space-between">
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                  {targetProgress >= 100 ? '🎉 已完成！' : targetProgress >= 70 ? '📈 稳步推进' : '⚠️ 需加快'}
                </span>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>目标：{fmtMoney(targetAmount)}</span>
              </Row>
            </div>
          ) : (
            <div style={{ background: '#fffbe6', borderRadius: 12, padding: '10px 16px', marginBottom: 12,
              fontSize: 12, color: '#8c8c8c', border: '1px solid #ffe58f' }}>
              ⚠️ {selectedUser ? '该用户未设定业绩目标' : '暂无设定业绩目标的用户'}，请在用户管理中配置
            </div>
          )}

          <Row gutter={12}>
            <Col span={12}>
              <div style={{ background: '#fff7e6', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <FireOutlined style={{ fontSize: 16, color: '#fa8c16' }} />
                <Statistic title={<span style={{ fontSize: 11 }}>新增合同</span>} value={newContractCount}
                  suffix="单" valueStyle={{ fontSize: 16, fontWeight: 700, color: '#fa8c16' }} />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#f0f5ff', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <RiseOutlined style={{ fontSize: 16, color: '#2f54eb' }} />
                <Statistic title={<span style={{ fontSize: 11 }}>跟进客户</span>} value={followUpCount}
                  suffix="家" valueStyle={{ fontSize: 16, fontWeight: 700, color: '#2f54eb' }} />
              </div>
            </Col>
          </Row>
        </Col>

        {/* 右：趋势图 */}
        <Col xs={24} md={14}>
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 10 }}>
              业绩趋势曲线
              <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>— {selectedUserName}</span>
            </div>
            <TrendChart data={trendData} />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default SalesView;