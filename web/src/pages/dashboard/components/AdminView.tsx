/**
 * @file web/src/pages/dashboard/components/AdminView.tsx
 * @version 3.4.0 [2026-04-29]
 * @desc 1. 合同状态分布固定高度，与右侧饼图底部对齐
 *       2. 饼图：图形（左）+ 图例（右）左右分列
 *       3. 认证体系按大类统计（后端已改，前端展示无需调整）
 */
import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Tag, Empty, Tooltip, Radio, Space, Progress, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PieChartOutlined } from '@ant-design/icons';

const CHART_COLORS = [
  '#71ccbc','#f6c557','#ff8c69','#7eb8e0',
  '#b39ddb','#5ab4a4','#ef9a9a','#80cbc4','#ffb74d','#a5d6a7',
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

// ── 高度常量（统一控制，保证左右对齐）────────────────
// 签约金额卡片内容高度约 88px + Card padding 32px = 120px
// 间距 16px
// 合同状态卡片 = PIE_HEIGHT - 120 - 16 - Card header 44px = PIE_HEIGHT - 180
const AMOUNT_CARD_H  = 120; // 签约金额卡片总高
const GAP            = 16;
const PIE_CARD_H     = 430; // 饼图卡片总高（右列）
const STATUS_CARD_H  = PIE_CARD_H - AMOUNT_CARD_H - GAP; // = 294

interface AdminViewProps {
  data: any;
  period: string;
  onPeriodChange: (v: string) => void;
}

// ── 饼图组件（左：SVG圆；右：图例列表）──────────────
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
      const r = 66; const cx = 80; const cy = 80;
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
    return <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '30px 0' }} />;
  }

  return (
    // ✅ 优化2：饼图左右分列
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {/* 左：SVG 饼图 */}
      <div style={{ flexShrink: 0 }}>
        <svg viewBox="0 0 160 160" width={140} height={140} style={{ overflow: 'visible' }}>
          {pieData.segments.map((seg: any, i: number) => (
            <Tooltip key={i} title={`${seg.type}：${fmtVal(seg.val)} (${(seg.ratio * 100).toFixed(1)}%)`}>
              <path d={seg.path} fill={seg.color} stroke="#fff"
                strokeWidth={hovered === i ? 0 : 2}
                opacity={hovered !== null && hovered !== i ? 0.5 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)} />
            </Tooltip>
          ))}
          <text x="80" y="75" textAnchor="middle" fontSize="9" fill="#8c8c8c">
            {mode === 'amount' ? '总金额' : '合同数'}
          </text>
          <text x="80" y="92" textAnchor="middle" fontSize="14" fontWeight="700" fill="#262626">
            {fmtVal(pieData.total)}
          </text>
        </svg>
      </div>

      {/* 右：图例 */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
        {pieData.segments.map((seg: any, i: number) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            padding: '3px 6px', borderRadius: 4,
            background: hovered === i ? `${seg.color}18` : 'transparent',
            transition: 'background 0.15s', cursor: 'default',
          }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <Tooltip title={seg.type}>
              <span style={{ fontSize: 12, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seg.type}
              </span>
            </Tooltip>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: seg.color }}>{fmtVal(seg.val)}</span>
              <span style={{ fontSize: 10, color: '#bbb', marginLeft: 3 }}>
                {(seg.ratio * 100).toFixed(0)}%
              </span>
            </div>
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

  return (
    <Row gutter={[16, 16]} align="stretch">

      {/* ── 左列 ── */}
      <Col xs={24} lg={14}>
        <Row gutter={[0, GAP]}>
          {/* 签约金额（固定高度）*/}
          <Col span={24}>
            <Card variant="borderless"
              style={{ borderRadius: 12, height: AMOUNT_CARD_H, background: 'linear-gradient(135deg,#71ccbc15 0%,#fff 100%)' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#8c8c8c' }}>累计签约合同总额（{periodLabel}）</span>
                <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
                  options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
              </Row>
              <Row align="middle">
                <Col flex="auto">
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
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

          {/* ✅ 优化1：合同状态分布固定高度 = PIE_CARD_H - AMOUNT_CARD_H - GAP */}
          <Col span={24}>
            <Card variant="borderless" size="small"
              style={{ borderRadius: 12, height: STATUS_CARD_H }}
              styles={{ body: { height: 'calc(100% - 44px)', overflow: 'hidden' } }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>合同状态分布</span>}>
              {statusDistrib.length === 0
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                : (
                  <Row gutter={[12, 14]} style={{ marginTop: 4 }}>
                    {statusDistrib.map((s: any) => {
                      const cfg = STATUS_LABEL[s.status] || { label: s.status, color: '#d9d9d9' };
                      const total = statusDistrib.reduce((acc: number, x: any) => acc + parseInt(x.count || 0), 0);
                      const pct = total > 0 ? Math.round((parseInt(s.count) / total) * 100) : 0;
                      return (
                        <Col key={s.status} span={12}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
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

      {/* ── 右列：饼图（固定高度 = 左列总高）── */}
      <Col xs={24} lg={10}>
        <Card variant="borderless"
          style={{ borderRadius: 12, height: PIE_CARD_H }}
          styles={{ body: { height: `calc(100% - 56px)`, display: 'flex', flexDirection: 'column' } }}
          title={
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              <PieChartOutlined style={{ marginRight: 6, color: '#71ccbc' }} />认证体系占比
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <PieChart distribution={distribution} mode={pieMode} />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default AdminView;