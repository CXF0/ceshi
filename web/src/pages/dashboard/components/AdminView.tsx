/**
 * @file web/src/pages/dashboard/components/AdminView.tsx
 * @version 3.0.0 [2026-04-29]
 * @desc 管理员看板：时间维度切换、合同状态分布、认证体系占比饼图、证书预警统计
 */
import React, { useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Empty, Tooltip, Radio, Space, Progress } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, FileTextOutlined,
  DollarOutlined, PieChartOutlined, SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const CHART_COLORS = ['#71ccbc','#5ab4a4','#f6c557','#ff8c69','#7eb8e0','#b39ddb','#ef9a9a','#80cbc4'];

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

const AdminView: React.FC<AdminViewProps> = ({ data, period, onPeriodChange }) => {
  const totalAmount     = data?.totalAmount     ?? 0;
  const activeProjects  = data?.activeProjects  ?? 0;
  const draftContracts  = data?.draftContracts  ?? 0;
  const periodGrowth    = data?.periodGrowth    ?? 0;
  const distribution    = data?.institutionDistribution ?? [];
  const statusDistrib   = data?.statusDistribution ?? [];
  const certStats       = data?.certStats ?? {};

  const isGrowthPositive = periodGrowth >= 0;

  // SVG 饼图
  const pieData = useMemo(() => {
    const total = distribution.reduce((s: number, d: any) => s + d.value, 0);
    if (total === 0) return [];
    let startAngle = -Math.PI / 2;
    return distribution.map((item: any, i: number) => {
      const ratio = item.value / total;
      const angle = ratio * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const r = 70; const cx = 90; const cy = 90;
      const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);   const y2 = cy + r * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
      const result = { path, color: CHART_COLORS[i % CHART_COLORS.length], ...item, ratio };
      startAngle = endAngle;
      return result;
    });
  }, [distribution]);

  const totalPie = distribution.reduce((s: number, d: any) => s + d.value, 0);

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';

  return (
    <Row gutter={[16, 16]}>
      {/* ── 左列 ── */}
      <Col xs={24} lg={14}>
        <Row gutter={[16, 16]}>
          {/* 时间维度切换 + 合同金额 */}
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 12, background: 'linear-gradient(135deg,#71ccbc22 0%,#fff 100%)' }}>
              <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#8c8c8c' }}>累计签约合同总额（{periodLabel}）</span>
                <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
                  options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
              </Row>
              <Row align="middle" gutter={16}>
                <Col flex="auto">
                  <div style={{ fontSize: 30, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
                    ¥ {totalAmount >= 10000
                      ? `${(totalAmount / 10000).toFixed(2)} 万`
                      : totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
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

          {/* 合同数量卡片 */}
          <Col span={12}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Row align="middle" gutter={12}>
                <Col flex="40px">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </div>
                </Col>
                <Col flex="auto">
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>未完结合同</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}>{activeProjects} 个</div>
                </Col>
              </Row>
              <div style={{ marginTop: 8, fontSize: 12, color: '#fa8c16' }}>
                在签（草稿）：{draftContracts} 个
              </div>
            </Card>
          </Col>

          {/* 证书预警 */}
          <Col span={12}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Row align="middle" gutter={12}>
                <Col flex="40px">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WarningOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                  </div>
                </Col>
                <Col flex="auto">
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>证书年审预警</div>
                </Col>
              </Row>
              <Row gutter={4} style={{ marginTop: 8 }}>
                {[
                  { label: '已过期', val: certStats.expired, color: '#ff4d4f' },
                  { label: '≤30天', val: certStats.danger,  color: '#ff4d4f' },
                  { label: '≤60天', val: certStats.warning, color: '#faad14' },
                  { label: '≤120天', val: certStats.notice, color: '#1677ff' },
                ].map(s => (
                  <Col key={s.label} span={12}>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.val ?? 0}</div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* 合同状态分布 */}
          <Col span={24}>
            <Card bordered={false} size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}>合同状态分布</span>}
              style={{ borderRadius: 12 }}>
              {statusDistrib.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> : (
                <Row gutter={[8, 8]}>
                  {statusDistrib.map((s: any) => {
                    const cfg = STATUS_LABEL[s.status] || { label: s.status, color: '#d9d9d9' };
                    const total = statusDistrib.reduce((acc: number, x: any) => acc + parseInt(x.count || 0), 0);
                    const pct = total > 0 ? Math.round((parseInt(s.count) / total) * 100) : 0;
                    return (
                      <Col key={s.status} span={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color }} />
                          <span style={{ fontSize: 12 }}>{cfg.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, marginLeft: 'auto' }}>{s.count} 个</span>
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
            <Card bordered={false} size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}>认证体系分布明细</span>}
              style={{ borderRadius: 12 }}>
              {distribution.length === 0 ? (
                <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Row gutter={[8, 8]}>
                  {distribution.map((item: any, i: number) => (
                    <Col key={item.type} span={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                        <Tooltip title={item.type}>
                          <span style={{ fontSize: 12, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.type}</span>
                        </Tooltip>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>({totalPie > 0 ? ((item.value / totalPie) * 100).toFixed(0) : 0}%)</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Col>
        </Row>
      </Col>

      {/* ── 右列：饼图 ── */}
      <Col xs={24} lg={10}>
        <Card bordered={false} style={{ borderRadius: 12, minHeight: 280 }}
          title={<span style={{ fontSize: 13, fontWeight: 600 }}><PieChartOutlined style={{ marginRight: 6, color: '#71ccbc' }} />认证类型占比</span>}>
          {pieData.length === 0 ? (
            <Empty description="暂无分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg viewBox="0 0 180 180" width={180} height={180}>
                {pieData.map((seg: any, i: number) => (
                  <Tooltip key={i} title={`${seg.type}：${seg.value} 个 (${(seg.ratio * 100).toFixed(1)}%)`}>
                    <path d={seg.path} fill={seg.color} stroke="#fff" strokeWidth={2}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')} />
                  </Tooltip>
                ))}
                <text x="90" y="86" textAnchor="middle" fontSize="11" fill="#8c8c8c">合同总数</text>
                <text x="90" y="103" textAnchor="middle" fontSize="18" fontWeight="700" fill="#262626">{totalPie}</text>
              </svg>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
};

export default AdminView;