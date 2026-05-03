/**
 * @file web/src/pages/dashboard/components/AdminView.tsx
 * @version 3.1.0 [2026-04-29]
 * @desc 优化：
 *   1. 整体布局左右对齐（左：金额+合同状态+认证明细；右：饼图+证书预警）
 *   2. 饼图支持金额/数量维度切换
 *   3. 去掉「未完结合同」「在签合同」独立卡片（已在 GlobalOverview 展示）
 *   6. 认证类型占比饼图支持金额/数量维度
 */
import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Tag, Empty, Tooltip, Radio, Space, Progress, Button } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined,
  PieChartOutlined, WarningOutlined, DollarOutlined, NumberOutlined,
} from '@ant-design/icons';

const CHART_COLORS = ['#71ccbc','#5ab4a4','#f6c557','#ff8c69','#7eb8e0','#b39ddb','#ef9a9a','#80cbc4','#ffb74d','#a5d6a7'];

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

// SVG 饼图
const PieChart: React.FC<{
  distribution: any[];
  mode: 'count' | 'amount';
}> = ({ distribution, mode }) => {
  // ✅ 所有 Hook 必须在顶部，不能在任何 return 之后
  const [hovered, setHovered] = useState<number | null>(null);

  const pieData = useMemo(() => {
    const getVal = (d: any) => mode === 'amount'
      ? (parseFloat(d.amount || d.totalAmount || '0'))
      : parseInt(d.value || d.count || '0');

    const total = distribution.reduce((s: number, d: any) => s + getVal(d), 0);
    if (total === 0) return { segments: [], total: 0 };

    let startAngle = -Math.PI / 2;
    const segments = distribution.map((item: any, i: number) => {
      const val   = getVal(item);
      const ratio = val / total;
      const angle = ratio * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const r = 72; const cx = 90; const cy = 90;
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

  const fmtTotal = mode === 'amount'
    ? (pieData.total >= 10000 ? `${(pieData.total / 10000).toFixed(1)}万` : pieData.total.toFixed(0))
    : String(pieData.total);

  if (pieData.segments.length === 0) {
    return <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 20 }} />;
  }

  return (
    <svg viewBox="0 0 180 180" width="100%" style={{ overflow: 'visible', maxWidth: 180 }}>
      {pieData.segments.map((seg: any, i: number) => (
        <Tooltip key={i} title={
          mode === 'amount'
            ? `${seg.type}：¥${seg.val >= 10000 ? (seg.val / 10000).toFixed(2) + '万' : seg.val.toFixed(0)} (${(seg.ratio * 100).toFixed(1)}%)`
            : `${seg.type}：${seg.val} 个 (${(seg.ratio * 100).toFixed(1)}%)`
        }>
          <path d={seg.path} fill={seg.color} stroke="#fff" strokeWidth={hovered === i ? 0 : 2}
            opacity={hovered !== null && hovered !== i ? 0.6 : 1}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        </Tooltip>
      ))}
      <text x="90" y="84" textAnchor="middle" fontSize="10" fill="#8c8c8c">
        {mode === 'amount' ? '总金额' : '合同总数'}
      </text>
      <text x="90" y="102" textAnchor="middle" fontSize="16" fontWeight="700" fill="#262626">
        {mode === 'amount' ? fmtTotal : fmtTotal}
      </text>
    </svg>
  );
};

const AdminView: React.FC<AdminViewProps> = ({ data, period, onPeriodChange }) => {
  const [pieMode, setPieMode] = useState<'count' | 'amount'>('count'); // ← 优化6

  const totalAmount   = data?.totalAmount   ?? 0;
  const periodGrowth  = data?.periodGrowth  ?? 0;
  const distribution  = data?.institutionDistribution ?? [];
  const statusDistrib = data?.statusDistribution ?? [];
  const certStats     = data?.certStats ?? {};

  const isGrowthPositive = periodGrowth >= 0;
  const periodLabel      = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';

  const totalPie = distribution.reduce((s: number, d: any) =>
    s + (pieMode === 'amount' ? parseFloat(d.amount || '0') : parseInt(d.value || '0')), 0);

  return (
    // ── 优化1：整体左14+右10 布局 ──
    <Row gutter={[16, 16]}>

      {/* ═══════════════ 左列 ═══════════════ */}
      <Col xs={24} lg={14}>
        <Row gutter={[16, 16]}>

          {/* 累计签约金额 + 时间维度切换 */}
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 12, background: 'linear-gradient(135deg,#71ccbc15 0%,#fff 100%)' }}>
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
                  <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 }}>
                    环比上{periodLabel}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 合同状态分布 */}
          <Col span={24}>
            <Card bordered={false} size="small" style={{ borderRadius: 12 }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>合同状态分布</span>}>
              {statusDistrib.length === 0
                ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                : (
                  <Row gutter={[12, 8]}>
                    {statusDistrib.map((s: any) => {
                      const cfg = STATUS_LABEL[s.status] || { label: s.status, color: '#d9d9d9' };
                      const total = statusDistrib.reduce((acc: number, x: any) => acc + parseInt(x.count || 0), 0);
                      const pct   = total > 0 ? Math.round((parseInt(s.count) / total) * 100) : 0;
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

          {/* 认证体系分布明细 */}
          <Col span={24}>
            <Card bordered={false} size="small" style={{ borderRadius: 12 }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>各认证体系分布明细</span>}>
              {distribution.length === 0
                ? <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                : (
                  <Row gutter={[8, 6]}>
                    {distribution.map((item: any, i: number) => {
                      const val = pieMode === 'amount'
                        ? parseFloat(item.amount || '0')
                        : parseInt(item.value || '0');
                      const label = pieMode === 'amount'
                        ? (val >= 10000 ? `¥${(val / 10000).toFixed(1)}万` : `¥${val}`)
                        : `${val} 个`;
                      const pct = totalPie > 0 ? ((val / totalPie) * 100).toFixed(0) : '0';
                      return (
                        <Col key={item.type} span={12}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                            <Tooltip title={item.type}>
                              <span style={{ fontSize: 12, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.type}
                              </span>
                            </Tooltip>
                            <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{label}</span>
                            <span style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }}>({pct}%)</span>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
            </Card>
          </Col>
        </Row>
      </Col>

      {/* ═══════════════ 右列：饼图 + 证书预警 ═══════════════ */}
      <Col xs={24} lg={10}>
        <Row gutter={[16, 16]} style={{ height: '100%' }}>

          {/* 认证类型占比饼图（支持金额/数量切换）*/}
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 12 }}
              title={
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <PieChartOutlined style={{ marginRight: 6, color: '#71ccbc' }} />
                  认证类型占比
                </span>
              }
              extra={
                // ✅ 优化6：金额/数量维度切换
                <Space size={0}>
                  <Button size="small" type={pieMode === 'count' ? 'primary' : 'default'} ghost={pieMode !== 'count'}
                    icon={<NumberOutlined />} onClick={() => setPieMode('count')}
                    style={{ borderRadius: '4px 0 0 4px', fontSize: 11 }}>数量</Button>
                  <Button size="small" type={pieMode === 'amount' ? 'primary' : 'default'} ghost={pieMode !== 'amount'}
                    icon={<DollarOutlined />} onClick={() => setPieMode('amount')}
                    style={{ borderRadius: '0 4px 4px 0', fontSize: 11 }}>金额</Button>
                </Space>
              }
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart distribution={distribution} mode={pieMode} />
              </div>
              {/* 图例 */}
              {distribution.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {distribution.map((item: any, i: number) => (
                    <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.type}</span>
                      <span style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0 }}>
                        {pieMode === 'amount'
                          ? (parseFloat(item.amount || '0') >= 10000 ? `¥${(parseFloat(item.amount) / 10000).toFixed(1)}万` : `¥${parseFloat(item.amount || '0').toFixed(0)}`)
                          : `${item.value}个`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>

          {/* 证书年审预警统计 */}
          <Col span={24}>
            <Card bordered={false} size="small" style={{ borderRadius: 12 }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}><WarningOutlined style={{ color: '#fa8c16', marginRight: 6 }} />证书年审预警统计</span>}>
              <Row gutter={[0, 4]}>
                {[
                  { label: '已过期',  val: certStats.expired, color: '#ff4d4f', bg: '#fff1f0' },
                  { label: '≤30天紧急',val: certStats.danger,  color: '#ff4d4f', bg: '#fff1f0' },
                  { label: '31~60天', val: certStats.warning, color: '#faad14', bg: '#fffbe6' },
                  { label: '61~120天',val: certStats.notice,  color: '#1677ff', bg: '#e6f4ff' },
                  { label: '>180天正常',val: certStats.normal, color: '#52c41a', bg: '#f6ffed' },
                ].map(s => (
                  <Col key={s.label} span={24}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '4px 10px', borderRadius: 6, background: s.bg, marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                        <span style={{ fontSize: 12, color: '#595959' }}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.val ?? 0} 张</span>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

        </Row>
      </Col>
    </Row>
  );
};

export default AdminView;