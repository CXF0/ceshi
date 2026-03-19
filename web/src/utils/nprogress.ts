import nprogress from 'nprogress';
import 'nprogress/nprogress.css'; // 必须导入 CSS

// 全局配置
nprogress.configure({
  easing: 'ease', // 动画方式
  speed: 500,     // 递增速度
  showSpinner: false, // 是否显示右上角螺旋加载图标
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3,   // 初始化时的最小百分比
});

export default nprogress;