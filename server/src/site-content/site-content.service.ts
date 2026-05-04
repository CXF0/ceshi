import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContent } from './site-content.entity';

const DEFAULT_SITE_CONTENT = {
  brand: {
    logoText: 'ZhengDaTong',
    footerBrandText: 'ZHENGYOUKE',
  },
  header: {
    phone: '025-66090399',
    loginText: '管家登录',
    consultText: '立即咨询',
    nav: [
      { label: '首页', href: '#hero' },
      { label: '认证服务', href: '#services' },
      { label: '优证管家', href: '#digital' },
      { label: '客户案例', href: '#cases' },
      { label: '关于我们', href: '#about' },
    ],
  },
  hero: {
    badge: '深耕认证行业 · 数字化赋能',
    titleLines: ['让企业认证', '更简单、更透明'],
    highlight: '更简单、更透明',
    description:
      '正达通是专业的企业认证服务平台，为不同企业提供定制化服务。通过"人工+智能"的方式，保证您的服务品质。',
    servedText: '累计服务 10,000+ 知名企业',
    heroImageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    metric: { value: '75%', labelLines: ['平均认证', '效率提升'] },
    avatars: [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    ],
  },
  services: {
    title: '核心认证服务范围',
    subtitle: '保留原版所有明星产品：ISO、ITSS、CMMI等',
    tags: ['资质认证', '体系认证', '产品认证'],
    cards: [
      {
        icon: 'shield',
        title: 'ISO 体系认证',
        description:
          '涵盖 ISO9001、ISO14001、ISO45001、ISO27001、ISO20000 等标准化管理体系建设，助力企业建立国际化管理逻辑。',
        tags: ['高通过率', '专家下厂指导'],
        theme: 'light',
      },
      {
        icon: 'code',
        title: '软件 IT 资质',
        description:
          '专业办理 CMMI 3/5 级评估、ITSS 信息技术服务运维标准、CS 信息系统建设能力评估及涉密资质。',
        linkText: '立即咨询软件资质专员 →',
        linkHref: '#',
        theme: 'dark',
      },
      {
        icon: 'globe',
        title: '知识产权与产品认证',
        description:
          '商标注册、专利申报、软件著作权、CCC 强制性认证、CE/FCC 出口认证，全方位保护您的无形资产。',
        extraText: 'Intellectual Property',
        theme: 'light',
      },
    ],
  },
  digital: {
    title: '优证管家：\n数字化认证新标准',
    description: '将传统的"认证黑盒"变为"透明看板"，通过 SAAS 系统实时监控每一个认证节点。',
    steps: [
      { n: '1', title: '进度透明化', desc: '每个节点自动更新，申报状态随时随地在系统查阅。' },
      { n: '2', title: '智能效期预警', desc: '证书到期前 90 天自动发起多端提醒，避免断证风险。' },
      { n: '3', title: '云端文档管理', desc: '全套申报资料、证书扫描件永久加密在线存档。' },
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=800',
  },
  cases: {
    title: '标杆案例 · 见证实力',
    subtitle: '涵盖智能制造、软件信息、政府单位、医疗生物等各行各业的真实认证历程。',
    items: [
      {
        offset: false,
        cat: 'IT & 软件',
        title: '某知名云计算科技公司',
        sub: 'CMMI 5级 软件能力成熟度评估案例',
        img: 'photo-1504384308090-c894fdcc538d',
      },
      {
        offset: true,
        cat: '智能制造',
        title: '上海某航天精密设备厂',
        sub: 'ISO 9001 / ISO 27001 双体系贯标案例',
        img: 'photo-1581091226825-a6a2a5aee158',
      },
      {
        offset: false,
        cat: '政企单位',
        title: '某市行政政务中心',
        sub: 'ITSS 信息技术服务运维资质办理',
        img: 'photo-1486406146926-c627a92ad1ab',
      },
      {
        offset: true,
        cat: '生物医药',
        title: '某上市生物医药实验室',
        sub: 'ISO 13485 医疗器械质量体系认证',
        img: 'photo-1573161158365-597e0094b911',
      },
    ],
  },
  footer: {
    description:
      '正达通-专业的企业认证服务平台。深耕行业，以人工+智能的方式，保证您的认证服务品质。',
    cols: [
      { title: '热门认证', links: ['ISO 9001 认证', 'ISO 27001 认证', 'CMMI 评估办理', 'ITSS 资质申办'] },
      { title: '快捷链接', links: ['达通管家登录', '服务进度查询', '客户案例'] },
    ],
    contact: {
      title: '联系我们',
      phone: '025-66090399',
      address: '南京市建邺区江东中路 315 号中泰国际广场 6 幢 1205-2 室',
      email: 'zhengdatong@163.com',
    },
    copyright:
      '© 2026 ZHENGDA TONG PLATFORM. ALL RIGHTS RESERVED.',
    legalLinks: ['苏ICP备XXXXXXX号', '隐私权条款', '服务协议'],
  },
};

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(SiteContent)
    private readonly repo: Repository<SiteContent>,
  ) {}

  private async getOrCreate(): Promise<SiteContent> {
    const exists = await this.repo.findOne({ order: { id: 'ASC' } });
    if (exists) return exists;
    const record = this.repo.create({ content: DEFAULT_SITE_CONTENT, updatedBy: null });
    return this.repo.save(record);
  }

  async getPublic() {
    const record = await this.getOrCreate();
    return record.content;
  }

  async getAdmin() {
    const record = await this.getOrCreate();
    return record.content;
  }

  async update(content: any, updatedBy: number | null) {
    if (!content || typeof content !== 'object') {
      throw new BadRequestException('content 必须是 JSON 对象');
    }

    const record = await this.getOrCreate();
    record.content = content;
    record.updatedBy = updatedBy ?? null;
    await this.repo.save(record);
    return record.content;
  }
}

