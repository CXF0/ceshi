/**
 * @file web/src/pages/dashboard/components/AdminView.tsx
 * @version 3.3.0 [2026-04-29]
 * @desc 1. 去掉「证书年审预警统计」卡片
 *       2. 左右列高度对齐：饼图卡片固定高度 = 签约金额卡片 + 合同状态卡片
 */
import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Tag, Empty, Tooltip, Radio, Space, Progress, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PieChartOutlined } from '@ant-design/icons';

const CHART_COLORS = [
  '#71ccbc','#5ab4a4','#f6c557','#ff8c69',
  '#7eb8e0','#b39ddb','#ef9a9a','#80cbc4','#ffb74d','#a5d6a7',
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  signed: { label: '已签约', color: '#fa8c16' },
  active: { label: '执行中', color: '#52c41a' },
  closed: { label: '已结项', color: '#1677ff' },
  draft:  { label: '草稿',   color: '#d9d9d9' },
};

const PERIOD_OPTIONS = [
  { label: '月度', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年度', value: 'year' },
];

interface AdminViewProps {
  data: any;
  period: string;
  onPeriodChange: (v: string) => void;
}

// ── 饼图组件 ─────────────────────────────────────────
const PieChart: React.FC<{ distribution: any[]; mode: 'count' | 'amount' }> = ({ distribution, mode }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const pieData = useMemo(() => {
    const getVal = (d: any) =>
      mode === 'amount'
        ? parseFloat(d.amount ?? d.totalAmount ?? '0')
        : parseInt(d.value ?? d.count ?? '0', 10);
    const total = distribution.reduce((s: number, d: any) => s + getVal(d), 0);
    if (total === 0) return { segments: [], total: 0 };
    let startAngle = -Math.PI / 2;
    const segments = distribution.map((item: any, i: number) => {
      const val = getVal(item);
      const ratio = val / total;
      const angle = ratio * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const r = 68; const cx = 85; const cy = 85;
      const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);   const y2 = cy + r * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
      const result = { path, color: CHART_COLORS[i % CHART_COLORS.length], ...item, val, ratio };
      startAngle = endAngle;
      return result;
    });
    return { segments, total };
  }, [distribution, mode]);

  const fmtVal = (val: number) =>
    mode === 'amount'
      ? (val >= 10000 ? `¥${(val / 10000).toFixed(1)}万` : `¥${val.toFixed(0)}`)
      : `${val}个`;

  if (pieData.segments.length === 0) {
    return <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg viewBox="0 0 170 170" width={150} height={150} style={{ overflow: 'visible' }}>
          {pieData.segments.map((seg: any, i: number) => (
            <Tooltip key={i} title={`${seg.type}：${fmtVal(seg.val)} (${(seg.ratio * 100).toFixed(1)}%)`}>
              <path d={seg.path} fill={seg.color} stroke="#fff"
                strokeWidth={hovered === i ? 0 : 2}
                opacity={hovered !== null && hovered !== i ? 0.55 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)} />
            </Tooltip>
          ))}
          <text x="85" y="80" textAnchor="middle" fontSize="9" fill="#8c8c8c">
            {mode === 'amount' ? '总金额' : '合同总数'}
          </text>
          <text x="85" y="97" textAnchor="middle" fontSize="14" fontWeight="700" fill="#262626">
            {fmtVal(pieData.total)}
          </text>
        </svg>
      </div>

      {/* 图例 */}
      <div style={{ flex: 1, marginTop: 6, overflowY: 'auto' }}>
        {pieData.segments.map((seg: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <Tooltip title={seg.type}>
              <span style={{ fontSize: 12, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seg.type}
              </span>
            </Tooltip>
            <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{fmtVal(seg.val)}</span>
            <span style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }}>({(seg.ratio * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminView: React.FC<AdminViewProps> = ({ data, period, onPeriodChange }) => {
  const [pieMode, setPieMode] = useState<'count' | 'amount'>('count');

  const totalAmount   = data?.totalAmount   ?? 0;
  const periodGrowth  = data?.periodGrowth  ?? 0;
  const distribution  = data?.institutionDistribution ?? [];
  const statusDistrib = data?.statusDistribution ?? [];
  const isGrowthPositive = periodGrowth >= 0;
  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';

  // 左列两个卡片加起来的固定高度，让右列饼图卡片等高
  // 签约金额卡片约 110px + gap 16px + 合同状态卡片约 200px = 约 326px
  const PIE_CARD_HEIGHT = 430;

  return (
    <Row gutter={[16, 16]} align="stretch">

      {/* ── 左列 ── */}
      <Col xs={24} lg={14}>
        <Row gutter={[16, 16]}>
          {/* 累计签约金额 */}
          <Col span={24}>
            <Card variant="borderless"
              style={{ borderRadius: 12, background: 'linear-gradient(135deg,#71ccbc15 0%,#fff 100%)' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#8c8c8c' }}>累计签约合同总额（{periodLabel}）</span>
                <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
                  options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
              </Row>
              <Row align="bottom" gutter={16}>
                <Col flex="auto">
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
                    {totalAmount >= 10000
                      ? `¥ ${(totalAmount / 10000).toFixed(2)} 万`
                      : `¥ ${totalAmount.toLocaleString()}`}
                  </div>
                </Col>
                <Col>
                  <Tag color={isGrowthPositive ? 'success' : 'error'}
                    icon={isGrowthPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    style={{ fontSize: 13, padding: '2px 10px' }}>
                    {isGrowthPositive ? '+' : ''}{periodGrowth.toFixed(1)}%
                  </Tag>
                  <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 }}>环比上{periodLabel}</div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 合同状态分布 */}
          <Col span={24}>
            <Card variant="borderless" size="small" style={{ borderRadius: 12 }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>合同状态分布</span>}>
              {statusDistrib.length === 0
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                : (
                  <Row gutter={[12, 12]}>
                    {statusDistrib.map((s: any) => {
                      const cfg = STATUS_LABEL[s.status] || { label: s.status, color: '#d9d9d9' };
                      const total = statusDistrib.reduce((acc: number, x: any) => acc + parseInt(x.count || 0), 0);
                      const pct = total > 0 ? Math.round((parseInt(s.count) / total) * 100) : 0;
                      return (
                        <Col key={s.status} span={12}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, flex: 1 }}>{cfg.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{s.count} 个</span>
                          </div>
                          <Progress percent={pct} strokeColor={cfg.color} showInfo={false} size="small" />
                        </Col>
                      );
                    })}
                  </Row>
                )}
            </Card>
          </Col>
        </Row>
      </Col>

      {/* ── 右列：饼图（固定高度与左列对齐）── */}
      <Col xs={24} lg={10}>
        {/* ✅ 优化2：固定高度，与左列两张卡片总高度对齐 */}
        <Card variant="borderless" style={{ borderRadius: 12, height: PIE_CARD_HEIGHT }}
          styles={{ body: { height: 'calc(100% - 56px)', display: 'flex', flexDirection: 'column' } }}
          title={
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              <PieChartOutlined style={{ marginRight: 6, color: '#71ccbc' }} />认证类型占比
            </span>
          }
          extra={
            <Space size={0}>
              <Button size="small" type={pieMode === 'count' ? 'primary' : 'default'}
                onClick={() => setPieMode('count')}
                style={{ borderRadius: '4px 0 0 4px', fontSize: 11 }}>数量</Button>
              <Button size="small" type={pieMode === 'amount' ? 'primary' : 'default'}
                onClick={() => setPieMode('amount')}
                style={{ borderRadius: '0 4px 4px 0', fontSize: 11 }}>金额</Button>
            </Space>
          }
        >
          {/* flex: 1 让饼图填满卡片剩余高度 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <PieChart distribution={distribution} mode={pieMode} />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminView;