/**
 * @file web/src/pages/dashboard/components/SalesView.tsx
 * @version 3.0.0 [2026-04-29]
 * @desc 销售业绩看板：时间维度、销售人员筛选、业绩趋势折线图（SVG）
 */
import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Divider, Empty, Select, Radio, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, TrophyOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';

interface SalesViewProps {
  data: any;
  salesUsers: { id: string; name: string }[];
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

// SVG 简易折线图
const TrendChart: React.FC<{ data: { label: string; revenue: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', color: '#bbb', padding: 20 }}>暂无趋势数据</div>;

  const W = 400; const H = 120; const PAD = { top: 16, right: 20, bottom: 24, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.revenue), 1);
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - ((d.revenue - minVal) / (maxVal - minVal)) * chartH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${PAD.top + chartH} L${points[0].x},${PAD.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#71ccbc" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#71ccbc" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* 网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map(r => (
        <line key={r} x1={PAD.left} y1={PAD.top + chartH * (1 - r)}
          x2={PAD.left + chartW} y2={PAD.top + chartH * (1 - r)}
          stroke="#f0f0f0" strokeWidth={1} />
      ))}
      {/* Y轴标签 */}
      {[0, 0.5, 1].map(r => (
        <text key={r} x={PAD.left - 6} y={PAD.top + chartH * (1 - r) + 4}
          textAnchor="end" fontSize={9} fill="#bbb">
          {maxVal * r >= 10000 ? `${(maxVal * r / 10000).toFixed(0)}w` : (maxVal * r).toFixed(0)}
        </text>
      ))}
      {/* 面积 */}
      <path d={areaD} fill="url(#areaGrad)" />
      {/* 折线 */}
      <path d={pathD} fill="none" stroke="#71ccbc" strokeWidth={2} strokeLinejoin="round" />
      {/* 数据点 */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#71ccbc" stroke="#fff" strokeWidth={1.5} />
          <text x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#aaa">{p.label}</text>
        </g>
      ))}
    </svg>
  );
};

const SalesView: React.FC<SalesViewProps> = ({ data, salesUsers, period, selectedUser, onPeriodChange, onUserChange }) => {
  if (!data) return null;

  const { periodRevenue = 0, lastRevenue = 0, targetAmount = 500000, targetProgress = 0,
    newContractCount = 0, followUpCount = 0, growth = 0, trendData = [] } = data;

  const isUp = growth >= 0;
  const progressColor = targetProgress >= 100 ? '#52c41a' : targetProgress >= 70 ? '#71ccbc' : targetProgress >= 40 ? '#faad14' : '#ff4d4f';
  const periodLabel   = PERIOD_OPTIONS.find(o => o.value === period)?.label || '月度';

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}
      title={
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <span>销售业绩看板</span>
        </Space>
      }
      extra={
        <Space>
          {/* 人员筛选 */}
          {salesUsers.length > 0 && (
            <Select placeholder="全部销售" allowClear style={{ width: 120 }} size="small"
              value={selectedUser} onChange={v => onUserChange(v)}
              options={salesUsers.map(u => ({ label: u.name, value: u.id }))} />
          )}
          <Radio.Group size="small" value={period} onChange={e => onPeriodChange(e.target.value)}
            options={PERIOD_OPTIONS} optionType="button" buttonStyle="solid" />
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        {/* 左：业绩数字 */}
        <Col xs={24} md={10}>
          <div style={{ background: 'linear-gradient(135deg,#71ccbc18 0%,#f0faf8 100%)', borderRadius: 12, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>{periodLabel}签约金额</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{fmtMoney(periodRevenue)}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastRevenue > 0 && (
                <Tag color={isUp ? 'success' : 'error'} icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />} style={{ margin: 0 }}>
                  {isUp ? '+' : ''}{growth.toFixed(1)}% 环比上{periodLabel}
                </Tag>
              )}
              <span style={{ fontSize: 12, color: '#bbb' }}>上{periodLabel}：{fmtMoney(lastRevenue)}</span>
            </div>
          </div>

          {/* 目标进度 */}
          <div style={{ background: '#fafafa', borderRadius: 12, padding: '14px 16px' }}>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#595959', fontWeight: 600 }}>{periodLabel}目标达成</span>
              <span style={{ fontSize: 13, color: progressColor, fontWeight: 700 }}>{targetProgress}%</span>
            </Row>
            <Progress percent={targetProgress} strokeColor={progressColor} trailColor="#f0f0f0" strokeWidth={10} showInfo={false} style={{ marginBottom: 6 }} />
            <Row justify="space-between">
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{targetProgress >= 100 ? '🎉 已完成目标！' : targetProgress >= 70 ? '📈 稳步推进中' : '⚠️ 需加快推进'}</span>
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>目标：{fmtMoney(targetAmount)}</span>
            </Row>
          </div>

          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col span={12}>
              <div style={{ background: '#fff7e6', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <FireOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                <Statistic title={<span style={{ fontSize: 11 }}>新增合同</span>} value={newContractCount}
                  suffix="单" valueStyle={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }} />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ background: '#f0f5ff', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                <RiseOutlined style={{ fontSize: 18, color: '#2f54eb' }} />
                <Statistic title={<span style={{ fontSize: 11 }}>跟进客户</span>} value={followUpCount}
                  suffix="家" valueStyle={{ fontSize: 18, fontWeight: 700, color: '#2f54eb' }} />
              </div>
            </Col>
          </Row>
        </Col>

        {/* 右：趋势折线图 */}
        <Col xs={24} md={14}>
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 12 }}>
              业绩趋势曲线
              {selectedUser && salesUsers.length > 0 && (
                <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 8 }}>
                  — {salesUsers.find(u => u.id === selectedUser)?.name}
                </span>
              )}
            </div>
            <TrendChart data={trendData} />
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default SalesView;