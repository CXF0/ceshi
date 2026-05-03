/**
 * @file web/src/pages/dashboard/components/SalesView.tsx
 * @version 3.3.0 [2026-04-29]
 * @desc 3. 公司目标=设定目标人员之和（已有）
 *       4. 折线图：去掉固定点，hover 才显示气泡；X 轴字体缩小防重叠；人员筛选只显示有目标的
 */
import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Select, Radio, Space } from 'antd';
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

// ── 贝塞尔折线图（hover 气泡，无固定点，X轴自适应字号）──
const TrendChart: React.FC<{
  data: { label: string; revenue: number }[];
  period: string;
}> = ({ data, period }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length < 2) {
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

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const minVal = 0;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * cW,
    y: PAD.top  + cH - ((d.revenue - minVal) / (maxVal - minVal || 1)) * cH,
    ...d,
  }));

  // 贝塞尔路径
  const bezierPath = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx  = (prev.x + p.x) / 2;
    return `${acc} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const areaPath = `${bezierPath} L${pts[pts.length - 1].x},${PAD.top + cH} L${pts[0].x},${PAD.top + cH} Z`;

  const fmtTick = (v: number) =>
    v >= 10000 ? `${(v / 10000).toFixed(0)}w`
    : v >= 1000 ? `${(v / 1000).toFixed(0)}k`
    : `${v.toFixed(0)}`;

  // ✅ 优化4：年度时 X 轴标签可能重叠，自适应字号和间隔展示
  const labelFontSize = period === 'year' ? 7 : 9;
  // 年度模式下只显示偶数索引的标签，防止重叠
  const showLabel = (i: number) => {
    if (period === 'year' && data.length > 8) return i % 2 === 0;
    return true;
  };

  const hoveredPt = hovered !== null ? pts[hovered] : null;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="tg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#71ccbc" stopOpacity="0.3" />
          <stop offset="80%"  stopColor="#71ccbc" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#71ccbc" stopOpacity="0" />
        </linearGradient>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* 网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map(r => (
        <line key={r}
          x1={PAD.left} y1={PAD.top + cH * (1 - r)}
          x2={PAD.left + cW} y2={PAD.top + cH * (1 - r)}
          stroke={r === 0 ? '#e8e8e8' : '#f5f5f5'} strokeWidth={1}
          strokeDasharray={r === 0 ? 'none' : '3,3'} />
      ))}

      {/* Y 轴标签 */}
      {[0, 0.5, 1].map(r => (
        <text key={r} x={PAD.left - 5} y={PAD.top + cH * (1 - r) + 4}
          textAnchor="end" fontSize={8} fill="#c0c0c0">
          {fmtTick(maxVal * r)}
        </text>
      ))}

      {/* 面积 */}
      <path d={areaPath} fill="url(#tg2)" />

      {/* 折线（发光层） */}
      <path d={bezierPath} fill="none" stroke="#a8e6de" strokeWidth={3}
        strokeLinejoin="round" strokeLinecap="round" filter="url(#glow2)" opacity={0.6} />
      {/* 折线（清晰层） */}
      <path d={bezierPath} fill="none" stroke="#71ccbc" strokeWidth={2}
        strokeLinejoin="round" strokeLinecap="round" />

      {/* ✅ 优化4：透明热区触发 hover，不显示固定的点 */}
      {pts.map((p, i) => (
        <g key={i}>
          {/* 透明热区（比实际点大，易触发） */}
          <circle cx={p.x} cy={p.y} r={12} fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'crosshair' }} />

          {/* hover 时才显示小点 */}
          {hovered === i && (
            <circle cx={p.x} cy={p.y} r={4} fill="#71ccbc" stroke="#fff" strokeWidth={2} />
          )}

          {/* X 轴标签 */}
          {showLabel(i) && (
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize={labelFontSize} fill="#bbb">
              {p.label}
            </text>
          )}
        </g>
      ))}

      {/* ✅ hover 气泡（浮层显示，不占位） */}
      {hoveredPt && (
        <g>
          {/* 竖线 */}
          <line x1={hoveredPt.x} y1={PAD.top} x2={hoveredPt.x} y2={PAD.top + cH}
            stroke="#71ccbc" strokeWidth={1} strokeDasharray="3,2" opacity={0.5} />
          {/* 气泡背景 */}
          <rect
            x={hoveredPt.x + (hoveredPt.x > W * 0.6 ? -92 : 8)}
            y={hoveredPt.y - 20}
            width={84} height={24} rx={6}
            fill="#1a1a2e" opacity={0.88}
          />
          {/* 气泡文字 */}
          <text
            x={hoveredPt.x + (hoveredPt.x > W * 0.6 ? -50 : 50)}
            y={hoveredPt.y - 4}
            textAnchor="middle" fontSize={10} fill="white" fontWeight="600">
            {fmtMoney(hoveredPt.revenue)}
          </text>
          {/* 气泡标签 */}
          <text
            x={hoveredPt.x + (hoveredPt.x > W * 0.6 ? -50 : 50)}
            y={hoveredPt.y + 8}
            textAnchor="middle" fontSize={8} fill="#aaa">
            {hoveredPt.label}
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

  // ✅ 优化4：销售人员下拉只显示配置了目标的人员
  const targetUserOptions = salesUsers
    .filter(u => u.hasSalesTarget && u.salesTarget)
    .map(u => ({
      label: `${u.name}（¥${u.salesTarget! >= 10000 ? (u.salesTarget! / 10000).toFixed(1) + '万' : u.salesTarget}）`,
      value: u.id,
    }));

  // ✅ 优化3：公司目标 = 所有设定了目标的人员之和；个人 = 该人的目标
  const targetAmount = useMemo(() => {
    if (selectedUser) {
      const u = salesUsers.find(u => u.id === selectedUser);
      return (u?.hasSalesTarget && u?.salesTarget) ? u.salesTarget : 0;
    }
    // 公司总目标
    return salesUsers
      .filter(u => u.hasSalesTarget && u.salesTarget)
      .reduce((s, u) => s + (u.salesTarget || 0), 0);
  }, [selectedUser, salesUsers]);

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
          {/* ✅ 只显示配置了目标的人员 */}
          {targetUserOptions.length > 0 && (
            <Select
              placeholder="全公司"
              allowClear
              style={{ width: 150 }}
              size="small"
              value={selectedUser}
              onChange={v => onUserChange(v)}
              options={targetUserOptions}
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
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>目标：{fmtMoney(targetAmount)}</span>
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

        {/* 右：折线图 */}
        <Col xs={24} md={14}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#595959', marginBottom: 10 }}>
              业绩趋势曲线
              <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>— {selectedName}</span>
            </div>
            <TrendChart data={trendData} period={period} />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default SalesView;