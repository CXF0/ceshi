/**
 * @file web/src/pages/dashboard/components/SalesView.tsx
 * @version 3.4.0 [2026-04-29]
 * @desc 3. 年/季目标 = 月度目标 × 12/3（前端换算，与后端一致）
 *       4. 折线图：去掉渐变区域，改纯主题色曲线，更清晰
 */
import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Select, Radio, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';

interface SalesUser {
  id: string;
  name: string;
  salesTarget?: number;   // 月度目标
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

// ── 折线图（贝塞尔曲线，无渐变区域，主题色）──────────
const TrendChart: React.FC<{
  chartData: { label: string; revenue: number }[];
  period: string;
}> = ({ chartData, period }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!chartData || chartData.length < 2) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 140, color: '#bbb', fontSize: 13 }}>
        暂无趋势数据
      </div>
    );
  }

  const W = 380; const H = 140;
  const PAD = { top: 24, right: 20, bottom: 32, left: 48 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top  - PAD.bottom;

  const maxVal = Math.max(...chartData.map(d => d.revenue), 1);

  const pts = chartData.map((d, i) => ({
    x: PAD.left + (i / (chartData.length - 1)) * cW,
    y: PAD.top  + cH - (d.revenue / maxVal) * cH,
    ...d,
  }));

  // 贝塞尔路径
  const bezierPath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx  = (prev.x + p.x) / 2;
    return `${acc} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const fmtTick = (v: number) =>
    v >= 10000 ? `${(v / 10000).toFixed(0)}w`
    : v >= 1000 ? `${(v / 1000).toFixed(0)}k`
    : `${Math.round(v)}`;

  // 年度模式 X 轴标签间隔
  const showLabel = (i: number) =>
    !(period === 'year' && chartData.length > 8 && i % 2 !== 0);

  const labelFontSize = period === 'year' ? 7 : 9;
  const hoveredPt = hovered !== null ? pts[hovered] : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      {/* 网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map(r => (
        <line key={r}
          x1={PAD.left} y1={PAD.top + cH * (1 - r)}
          x2={PAD.left + cW} y2={PAD.top + cH * (1 - r)}
          stroke={r === 0 ? '#e8e8e8' : '#f5f5f5'}
          strokeWidth={1}
          strokeDasharray={r === 0 ? 'none' : '3,3'} />
      ))}

      {/* Y 轴标签 */}
      {[0, 0.5, 1].map(r => (
        <text key={r} x={PAD.left - 5} y={PAD.top + cH * (1 - r) + 4}
          textAnchor="end" fontSize={8} fill="#c8c8c8">
          {fmtTick(maxVal * r)}
        </text>
      ))}

      {/* ✅ 优化4：去掉渐变区域，只保留纯色曲线，更清晰 */}
      {/* 主题色曲线 */}
      <path d={bezierPath} fill="none" stroke="#71ccbc" strokeWidth={2.5}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* 热区 + hover 效果 */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={14} fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'crosshair' }} />
          {hovered === i && (
            <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke="#71ccbc" strokeWidth={2} />
          )}
          {showLabel(i) && (
            <text x={p.x} y={H - 5} textAnchor="middle"
              fontSize={labelFontSize} fill="#c0c0c0">
              {p.label}
            </text>
          )}
        </g>
      ))}

      {/* hover 气泡 */}
      {hoveredPt && (() => {
        const flip = hoveredPt.x > W * 0.65;
        const bx = hoveredPt.x + (flip ? -100 : 10);
        const by = hoveredPt.y - 28;
        const tx = bx + 45;
        return (
          <g>
            <line x1={hoveredPt.x} y1={PAD.top} x2={hoveredPt.x} y2={PAD.top + cH}
              stroke="#71ccbc" strokeWidth={1} strokeDasharray="3,2" opacity={0.4} />
            <rect x={bx} y={by} width={90} height={28} rx={6}
              fill="#1a1a2e" opacity={0.9} />
            <text x={tx} y={by + 11} textAnchor="middle" fontSize={11} fill="white" fontWeight="600">
              {fmtMoney(hoveredPt.revenue)}
            </text>
            <text x={tx} y={by + 23} textAnchor="middle" fontSize={8} fill="#8899aa">
              {hoveredPt.label}
            </text>
          </g>
        );
      })()}
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

  // ✅ 只显示配置了目标的人员
  const targetUserOptions = salesUsers
    .filter(u => u.hasSalesTarget && u.salesTarget)
    .map(u => ({
      label: `${u.name}（¥${(u.salesTarget! >= 10000 ? (u.salesTarget! / 10000).toFixed(1) + '万' : u.salesTarget)}）`,
      value: u.id,
    }));

  // ✅ 优化3：目标换算（月度目标 × 系数）
  const periodMultiplier = period === 'quarter' ? 3 : period === 'year' ? 12 : 1;

  const targetAmount = useMemo(() => {
    if (selectedUser) {
      const u = salesUsers.find(u => u.id === selectedUser);
      const monthlyTarget = (u?.hasSalesTarget && u?.salesTarget) ? u.salesTarget : 0;
      return monthlyTarget * periodMultiplier;
    }
    // 公司总目标 = 所有设定目标人员月度目标之和 × 系数
    const totalMonthly = salesUsers
      .filter(u => u.hasSalesTarget && u.salesTarget)
      .reduce((s, u) => s + (u.salesTarget || 0), 0);
    return totalMonthly * periodMultiplier;
  }, [selectedUser, salesUsers, periodMultiplier]);

  const targetProgress = targetAmount > 0
    ? Math.min(Math.round((periodRevenue / targetAmount) * 100), 100)
    : 0;

  const hasTarget     = targetAmount > 0;
  const isUp          = growth >= 0;
  const progressColor = targetProgress >= 100 ? '#52c41a'
                      : targetProgress >= 70  ? '#71ccbc'
                      : targetProgress >= 40  ? '#faad14' : '#ff4d4f';
  const periodLabel   = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';
  const selectedName  = selectedUser
    ? (salesUsers.find(u => u.id === selectedUser)?.name || '该销售')
    : '全公司';

  return (
    <Card variant="borderless" style={{ borderRadius: 12 }}
      title={<Space><TrophyOutlined style={{ color: '#faad14' }} /><span>销售业绩看板</span></Space>}
      extra={
        <Space>
          {targetUserOptions.length > 0 && (
            <Select placeholder="全公司" allowClear style={{ width: 150 }} size="small"
              value={selectedUser} onChange={v => onUserChange(v)}
              options={targetUserOptions} />
          )}
          <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
            options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {/* 左：业绩数字 */}
        <Col xs={24} md={10}>
          <div style={{ background: 'linear-gradient(135deg,#71ccbc15 0%,#f0faf8 100%)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
              {selectedName} · {periodLabel}签约金额
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
              {fmtMoney(periodRevenue)}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastRevenue > 0 && (
                <Tag color={isUp ? 'success' : 'error'}
                  icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} style={{ margin: 0 }}>
                  {isUp ? '+' : ''}{growth.toFixed(1)}% 环比
                </Tag>
              )}
              <span style={{ fontSize: 11, color: '#bbb' }}>上{periodLabel}：{fmtMoney(lastRevenue)}</span>
            </div>
          </div>

          {hasTarget ? (
            <div style={{ background: '#fafafa', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
              <Row justify="space-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#595959', fontWeight: 600 }}>
                  {selectedUser ? '个人' : '公司'}{periodLabel}目标达成
                </span>
                <span style={{ fontSize: 13, color: progressColor, fontWeight: 700 }}>{targetProgress}%</span>
              </Row>
              <Progress percent={targetProgress} strokeColor={progressColor}
                trailColor="#f0f0f0" strokeWidth={8} showInfo={false} style={{ marginBottom: 4 }} />
              <Row justify="space-between">
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                  {targetProgress >= 100 ? '🎉 已完成！' : targetProgress >= 70 ? '📈 稳步推进' : '⚠️ 需加快'}
                </span>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                  {periodLabel}目标：{fmtMoney(targetAmount)}
                </span>
              </Row>
            </div>
          ) : (
            <div style={{ background: '#fffbe6', borderRadius: 12, padding: '10px 16px', marginBottom: 12,
              fontSize: 12, color: '#8c8c8c', border: '1px solid #ffe58f' }}>
              ⚠️ 暂无设定目标，请在用户管理中配置业绩目标
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
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 10 }}>
              业绩趋势曲线
              <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>— {selectedName}</span>
            </div>
            <TrendChart chartData={trendData} period={period} />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default SalesView;