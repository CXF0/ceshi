/**
 * @file AdminView.tsx
 * @desc 管理员/经理 看板视图 - 全量统计 + 认证类型分布
 * @version 2.0.0
 */
import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Tag, Empty, Tooltip } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined,
  FileTextOutlined, DollarOutlined, ClockCircleOutlined, PieChartOutlined,
} from '@ant-design/icons';

interface AdminViewProps {
  data: {
    totalAmount?: number;
    activeProjects?: number;
    monthlyGrowth?: number;
    institutionDistribution?: { type: string; value: number }[];
  };
}

// 颜色池（与主题色系搭配）
const CHART_COLORS = [
  '#71ccbc', '#5ab4a4', '#f6c557', '#ff8c69',
  '#7eb8e0', '#b39ddb', '#ef9a9a', '#80cbc4',
];

const AdminView: React.FC<AdminViewProps> = ({ data }) => {
  const totalAmount = data?.totalAmount ?? 0;
  const activeProjects = data?.activeProjects ?? 0;
  const monthlyGrowth = data?.monthlyGrowth ?? 0;
  const distribution = data?.institutionDistribution ?? [];

  // 计算饼图数据（SVG 手绘，无需引入 echarts）
  const pieData = useMemo(() => {
    const total = distribution.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    let startAngle = -Math.PI / 2;
    return distribution.map((item, i) => {
      const ratio = item.value / total;
      const angle = ratio * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const r = 70;
      const cx = 90, cy = 90;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
      // 标签中心点
      const midAngle = startAngle + angle / 2;
      const labelR = r * 0.65;
      const lx = cx + labelR * Math.cos(midAngle);
      const ly = cy + labelR * Math.sin(midAngle);
      const result = { path, color: CHART_COLORS[i % CHART_COLORS.length], ...item, ratio, lx, ly };
      startAngle = endAngle;
      return result;
    });
  }, [distribution]);

  const totalPie = distribution.reduce((s, d) => s + d.value, 0);

  const isGrowthPositive = monthlyGrowth >= 0;

  return (
    <Row gutter={[16, 16]}>
      {/* ── 左侧：3 个统计卡片 ── */}
      <Col xs={24} lg={14}>
        <Row gutter={[16, 16]}>
          {/* 卡片 1：累计合同金额 */}
          <Col span={24}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, background: 'linear-gradient(135deg, #71ccbc22 0%, #ffffff 100%)' }}
            >
              <Row align="middle" gutter={16}>
                <Col flex="48px">
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: '#71ccbc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DollarOutlined style={{ fontSize: 22, color: '#fff' }} />
                  </div>
                </Col>
                <Col flex="auto">
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>累计签约合同总额</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>
                    ¥ {totalAmount >= 10000
                      ? `${(totalAmount / 10000).toFixed(2)} 万`
                      : totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </div>
                </Col>
                <Col>
                  <Tag
                    color={isGrowthPositive ? 'success' : 'error'}
                    icon={isGrowthPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    style={{ fontSize: 13, padding: '2px 10px' }}
                  >
                    {isGrowthPositive ? '+' : ''}{monthlyGrowth.toFixed(1)}%
                  </Tag>
                  <div style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 }}>环比上月</div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 卡片 2：在办项目 */}
          <Col span={12}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <Row align="middle" gutter={12}>
                <Col flex="40px">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </div>
                </Col>
                <Col flex="auto">
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>在办项目总数</span>}
                    value={activeProjects}
                    suffix="个"
                    valueStyle={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 卡片 3：认证类型数 */}
          <Col span={12}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <Row align="middle" gutter={12}>
                <Col flex="40px">
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PieChartOutlined style={{ fontSize: 18, color: '#fa8c16' }} />
                  </div>
                </Col>
                <Col flex="auto">
                  <Statistic
                    title={<span style={{ fontSize: 12 }}>认证体系种类</span>}
                    value={distribution.length}
                    suffix="类"
                    valueStyle={{ fontSize: 24, fontWeight: 700, color: '#fa8c16' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 卡片 4：图例列表 */}
          <Col span={24}>
            <Card
              bordered={false}
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>各认证体系分布明细</span>}
              style={{ borderRadius: 12 }}
            >
              {distribution.length === 0 ? (
                <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Row gutter={[8, 8]}>
                  {distribution.map((item, i) => (
                    <Col key={item.type} span={12}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: 2,
                          background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 12, color: '#595959', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.type}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#262626' }}>
                          {item.value}
                        </span>
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                          ({totalPie > 0 ? ((item.value / totalPie) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Col>
        </Row>
      </Col>

      {/* ── 右侧：SVG 饼图 ── */}
      <Col xs={24} lg={10}>
        <Card
          bordered={false}
          style={{ borderRadius: 12, height: '100%', minHeight: 280 }}
          title={<span style={{ fontSize: 13, fontWeight: 600 }}><PieChartOutlined style={{ marginRight: 6, color: '#71ccbc' }} />认证类型占比</span>}
        >
          {pieData.length === 0 ? (
            <Empty description="暂无分布数据" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg viewBox="0 0 180 180" width={180} height={180}>
                {pieData.map((seg, i) => (
                  <Tooltip key={i} title={`${seg.type}：${seg.value} 个 (${(seg.ratio * 100).toFixed(1)}%)`}>
                    <path
                      d={seg.path}
                      fill={seg.color}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    />
                  </Tooltip>
                ))}
                {/* 中心文字 */}
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