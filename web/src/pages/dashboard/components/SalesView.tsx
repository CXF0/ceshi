/**
 * @file SalesView.tsx
 * @desc 销售业绩看板 - 本月回款、目标进度、上月对比
 * @version 2.0.0
 */
import React from 'react';
import { Card, Row, Col, Statistic, Progress, Tag, Divider, Empty } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined,
  TrophyOutlined, RiseOutlined, FallOutlined, FireOutlined,
} from '@ant-design/icons';

interface SalesViewProps {
  data: {
    monthlyRevenue?: number;       // 本月回款
    targetProgress?: number;       // 目标达成率 0-100
    targetAmount?: number;         // 月度目标金额
    lastMonthRevenue?: number;     // 上月回款（用于对比）
    followUpCount?: number;        // 跟进客户数
    newContractCount?: number;     // 本月新增合同数
  };
}

const fmtMoney = (val: number) =>
  val >= 10000 ? `¥${(val / 10000).toFixed(2)}万` : `¥${val.toLocaleString()}`;

const SalesView: React.FC<SalesViewProps> = ({ data }) => {
  const monthlyRevenue = data?.monthlyRevenue ?? 0;
  const targetProgress = data?.targetProgress ?? 0;
  const targetAmount = data?.targetAmount ?? 500000;
  const lastMonthRevenue = data?.lastMonthRevenue ?? 0;
  const followUpCount = data?.followUpCount ?? 0;
  const newContractCount = data?.newContractCount ?? 0;

  // 对比上月增减
  const revenueDiff = lastMonthRevenue > 0
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;
  const isUp = revenueDiff >= 0;

  // 进度条颜色
  const progressColor =
    targetProgress >= 100 ? '#52c41a' :
    targetProgress >= 70  ? '#71ccbc' :
    targetProgress >= 40  ? '#faad14' : '#ff4d4f';

  // 进度状态描述
  const progressLabel =
    targetProgress >= 100 ? '🎉 已完成目标！' :
    targetProgress >= 70  ? '📈 稳步推进中' :
    targetProgress >= 40  ? '⚠️ 需加快推进' : '🚨 严重落后目标';

  if (!data || Object.keys(data).length === 0) {
    return (
      <Card bordered={false} style={{ borderRadius: 12 }} title="销售业绩看板">
        <Empty description="暂无销售数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12 }}
      title={
        <span>
          <TrophyOutlined style={{ marginRight: 6, color: '#faad14' }} />
          销售业绩看板
        </span>
      }
    >
      <Row gutter={[24, 24]}>
        {/* ── 左列：核心数据 ── */}
        <Col xs={24} md={12}>
          {/* 本月回款 */}
          <div style={{
            background: 'linear-gradient(135deg, #71ccbc18 0%, #f0faf8 100%)',
            borderRadius: 12, padding: '20px 24px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 6 }}>本月实收回款</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>
              {fmtMoney(monthlyRevenue)}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              {lastMonthRevenue > 0 && (
                <Tag
                  color={isUp ? 'success' : 'error'}
                  icon={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  style={{ margin: 0 }}
                >
                  {isUp ? '+' : ''}{revenueDiff.toFixed(1)}% 环比上月
                </Tag>
              )}
              <span style={{ fontSize: 12, color: '#bbb' }}>
                上月：{fmtMoney(lastMonthRevenue)}
              </span>
            </div>
          </div>

          {/* 月度目标进度 */}
          <div style={{ background: '#fafafa', borderRadius: 12, padding: '16px 20px' }}>
            <Row justify="space-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#595959', fontWeight: 600 }}>月度目标达成</span>
              <span style={{ fontSize: 13, color: progressColor, fontWeight: 700 }}>
                {targetProgress}%
              </span>
            </Row>
            <Progress
              percent={targetProgress}
              strokeColor={progressColor}
              trailColor="#f0f0f0"
              strokeWidth={10}
              showInfo={false}
              style={{ marginBottom: 8 }}
            />
            <Row justify="space-between">
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{progressLabel}</span>
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                目标：{fmtMoney(targetAmount)}
              </span>
            </Row>
          </div>
        </Col>

        {/* ── 右列：辅助指标 ── */}
        <Col xs={24} md={12}>
          <Row gutter={[12, 12]}>
            <Col span={12}>
              <div style={{
                background: '#fff7e6', borderRadius: 10, padding: '14px 16px',
                textAlign: 'center',
              }}>
                <FireOutlined style={{ fontSize: 22, color: '#fa8c16', marginBottom: 6 }} />
                <Statistic
                  title={<span style={{ fontSize: 11 }}>本月新增合同</span>}
                  value={newContractCount}
                  suffix="单"
                  valueStyle={{ fontSize: 22, fontWeight: 700, color: '#fa8c16' }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{
                background: '#f0f5ff', borderRadius: 10, padding: '14px 16px',
                textAlign: 'center',
              }}>
                <RiseOutlined style={{ fontSize: 22, color: '#2f54eb', marginBottom: 6 }} />
                <Statistic
                  title={<span style={{ fontSize: 11 }}>跟进客户数</span>}
                  value={followUpCount}
                  suffix="家"
                  valueStyle={{ fontSize: 22, fontWeight: 700, color: '#2f54eb' }}
                />
              </div>
            </Col>

            <Col span={24}>
              <Divider style={{ margin: '4px 0' }} />
            </Col>

            {/* 进度条形图：完成度拆解 */}
            <Col span={24}>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>回款目标拆解</div>
              {[
                { label: '已回款', value: monthlyRevenue, max: targetAmount, color: '#71ccbc' },
                { label: '缺口', value: Math.max(0, targetAmount - monthlyRevenue), max: targetAmount, color: '#ffccc7' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 6 }}>
                  <Row justify="space-between" style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#595959' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#595959' }}>{fmtMoney(item.value)}</span>
                  </Row>
                  <div style={{
                    height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((item.value / (targetAmount || 1)) * 100, 100)}%`,
                      background: item.color,
                      borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default SalesView;