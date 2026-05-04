/**
 * @file src/pages/homepage/useSiteConfig.ts
 * @desc 官网配置 Hook — 所有官网子页面共享，一次 fetch，合并默认值
 *
 * 后端接口：GET /api/site/config
 * 返回结构：{ code: 200, data: { hero_title_black, hero_title_blue, ... } }
 * fetch（非 axios）直接拿 res.data
 */
import { useState, useEffect } from 'react';

export const SITE_DEFAULTS = {
  // Hero 标题：黑色部分 + 蓝色部分（换行）
  hero_title_black:   '让企业认证',
  hero_title_blue:    '更简单、更透明',
  hero_badge_text:    '深耕认证行业 · 数字化赋能',
  hero_subtitle:      '正达通是专业的企业认证服务平台，为不同企业提供定制化服务。通过"人工+智能"的方式，保证您的服务品质。',
  hero_primary_btn:   '立即咨询',
  hero_secondary_btn: '了解更多',
  // 统计数字
  stat_1_value: '2000', stat_1_unit: '+',  stat_1_label: '服务企业数',
  stat_2_value: '98',   stat_2_unit: '%',  stat_2_label: '认证通过率',
  stat_3_value: '10',   stat_3_unit: '年', stat_3_label: '行业经验',
  stat_4_value: '50',   stat_4_unit: '+',  stat_4_label: '专业顾问',
  // 公司信息
  company_name:    '正达通认证服务',
  company_desc:    '深耕认证行业十余年，以专业服务帮助 2000+ 企业完成体系认证与资质申报，是您可信赖的认证合作伙伴。',
  company_mission: '通过"人工+智能"的服务模式，将复杂的认证流程标准化、透明化，让每一家企业都能高效地完成资质建设，聚焦自身核心业务发展。',
  company_vision:  '致力于构建覆盖全国的认证服务网络，以数字化技术驱动服务升级，帮助更多企业建立完善的管理体系与合规能力。',
  phone:   '025-66090399',
  email:   'zhengdatong@163.com',
  address: '南京市建邺区江东中路 315 号中泰国际广场 6 幢 1205-2 室',
  // 子页面文案
  services_page_title:    '全方位认证服务',
  services_page_subtitle: '从体系认证到资质申报，覆盖企业全生命周期需求',
};

export type SiteConfig = typeof SITE_DEFAULTS & Record<string, any>;

let _cache: SiteConfig | null = null; // 模块级缓存，避免多个页面重复请求

export function useSiteConfig(): { cfg: SiteConfig; loading: boolean } {
  const [cfg, setCfg] = useState<SiteConfig>(_cache ?? { ...SITE_DEFAULTS });
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) return; // 已有缓存直接用
    fetch('/api/site/config')
      .then(r => r.json())
      .then(res => {
        const data: Record<string, any> = res?.data ?? {};
        const merged = { ...SITE_DEFAULTS } as SiteConfig;
        // 后端值非空时覆盖默认值
        Object.entries(data).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') merged[k] = v;
        });
        _cache = merged;
        setCfg(merged);
      })
      .catch(() => {/* 网络失败静默使用默认值 */})
      .finally(() => setLoading(false));
  }, []);

  return { cfg, loading };
}

/** 拉取服务卡片列表（含驼峰→下划线兼容） */
export async function fetchSiteServices() {
  const res = await fetch('/api/site/services').then(r => r.json());
  // 后端返回 { code, data: [...] }
  const list: any[] = res?.data ?? [];
  // TypeORM Entity 返回驼峰，统一转成前端使用的字段名
  return list.map(normalizeService);
}

/** 拉取客户案例列表 */
export async function fetchSiteCases() {
  const res = await fetch('/api/site/cases').then(r => r.json());
  const list: any[] = res?.data ?? [];
  return list.map(normalizeCase);
}

/** 驼峰 → 统一字段名（兼容后端返回） */
function normalizeService(item: any) {
  return {
    id:          item.id,
    title:       item.title        ?? '',
    subtitle:    item.subtitle     ?? '',
    description: item.description  ?? '',
    features:    Array.isArray(item.features) ? item.features : [],
    tags:        Array.isArray(item.tags)     ? item.tags     : [],
    icon_type:   item.iconType     ?? item.icon_type  ?? 'shield',
    theme:       item.theme        ?? 'light',
    sort_order:  item.sortOrder    ?? item.sort_order ?? 0,
    is_active:   item.isActive     ?? item.is_active  ?? 1,
  };
}

function normalizeCase(item: any) {
  return {
    id:           item.id,
    company_name: item.companyName  ?? item.company_name ?? '',
    industry:     item.industry     ?? '',
    cert_type:    item.certType     ?? item.cert_type    ?? '',
    description:  item.description  ?? '',
    result:       item.result       ?? '',
    duration:     item.duration     ?? '',
    tags:         Array.isArray(item.tags) ? item.tags : [],
    logo_text:    item.logoText     ?? item.logo_text  ?? '企',
    logo_color:   item.logoColor    ?? item.logo_color ?? '#3b82f6',
    is_featured:  item.isFeatured   ?? item.is_featured ?? 0,
    sort_order:   item.sortOrder    ?? item.sort_order  ?? 0,
    is_active:    item.isActive     ?? item.is_active   ?? 1,
  };
}