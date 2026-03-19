// src/utils/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Space } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

interface Props {
  children?: ReactNode;
  /** 💡 可选：自定义标题 */
  title?: string;
  /** 💡 可选：自定义子标题/报错描述 */
  subTitle?: string;
  /** 💡 可选：崩溃后展示的图标，默认为 Result 的 error 状态 */
  icon?: ReactNode;
}

interface State {
  /** 💡 是否发生了错误 */
  hasError: boolean;
  /** 💡 具体的错误信息（开发环境调试用） */
  error: Error | null;
}

/**
 * ✨ 全局错误捕获边界组件
 * 用于包裹可能发生崩溃的子组件，防止整个页面白屏。
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /** * 💡 1. 静态方法：当子组件抛出错误时触发
   * 用于更新 state，从而触发重新渲染显示“错误占位图”。
   */
  public static getDerivedStateFromError(error: Error): State {
    // 更新 state 以在下一次渲染中显示降级 UI
    return { hasError: true, error };
  }

  /**
   * 💡 2. 错误捕获方法：当子组件抛出错误后调用
   * 用于将错误日志发送给后端（如 Sentry 或自定义日志接口）。
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: 在这里调用你的后端日志接口
    console.error('❌ [ErrorBoundary Captured]:', error);
    console.error('🔍 [Error Stack Trace]:', errorInfo.componentStack);
    
    // 示例：如果项目集成了 Sentry，可以在这里上报
    // Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * 💡 3. 重置错误状态
   * 允许用户通过按钮尝试“修复”崩溃，通常是刷新页面。
   */
  private handleReset = () => {
    // 这里采用最稳妥的方式：强制刷新当前页面
    window.location.reload();
    
    // 或者尝试只重置 state（如果只是数据偶发错误可以用这个）
    // this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      // ✨ 降级渲染的友好 UI
      return (
        <div style={{ padding: '50px 0', textAlign: 'center', background: '#fff', borderRadius: 8 }}>
          <Result
            status="error"
            title={this.props.title || '系统正在开小差...'}
            subTitle={
              this.props.subTitle || (
                <span>
                  非常抱歉，当前模块发生了一个未知错误。
                  {process.env.NODE_ENV === 'development' && (
                    <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: 10, marginTop: 10, color: '#ff4d4f', whiteSpace: 'pre-wrap' }}>
                      {this.state.error?.toString()}
                    </pre>
                  )}
                </span>
              )
            }
            extra={
              <Space size="middle">
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={this.handleReset}
                  size="large"
                >
                  尝试刷新页面
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button icon={<BugOutlined />} danger>
                    复制错误堆栈
                  </Button>
                )}
              </Space>
            }
          />
        </div>
      );
    }

    // 没有错误时，原样渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;