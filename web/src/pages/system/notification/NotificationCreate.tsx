import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, TreeSelect, Button, Upload, Space, message, Divider, Spin } from 'antd';
import { UploadOutlined, SendOutlined, SaveOutlined } from '@ant-design/icons';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { saveNotification } from '../../../services/notification';
import request from '../../../utils/request'; // 假设你有一个基础请求工具
import '@wangeditor/editor/dist/css/style.css';

const { Option } = Select;

const NotificationCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('');
  const [targetScope, setTargetScope] = useState('all');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  // 1. 获取组织架构树数据
  useEffect(() => {
  if (targetScope === 'custom') {
    setTreeLoading(true);
    request('/users/org-tree', { method: 'GET' })
      .then(res => {
        // 💡 关键：将 res.data 赋值给 state，而不是 res 本身
        if (res && res.data) {
          setTreeData(res.data); 
        }
      })
      .catch(err => message.error("获取组织架构失败"))
      .finally(() => setTreeLoading(false));
  }
}, [targetScope]);

  // 2. 富文本编辑器配置
  const toolbarConfig: Partial<IToolbarConfig> = {
    excludeKeys: ['fullScreen']
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入正文内容...',
    MENU_CONF: {
      uploadImage: {
        // 💡 传给你的 UploadController，存入 notice-content 目录
        server: '/api/common/upload/notice-content',
        fieldName: 'file',
        customInsert(res: any, insertFn: any) {
          if (res.url) {
            insertFn(res.url, res.name, res.url);
          } else {
            message.error('图片上传失败');
          }
        },
      }
    }
  };

  // 3. 提交前的关键转换逻辑
  const onFinish = async (values: any) => {
    if (!html || html === '<p><br></p>') {
      return message.warning('请输入通知正文内容');
    }

    setLoading(true);
    try {
      // 💡 解析 TreeSelect 的值：'dept-1' -> { targetType: 'dept', targetId: 1 }
      let targets: any[] = [];
      if (values.targetScope === 'custom' && values.targetKeys) {
        targets = values.targetKeys.map((key: string) => {
          const [type, id] = key.split('-');
          return {
            targetType: type,
            targetId: type === 'role' ? id : parseInt(id), // 角色通常是字符串key，部门/用户是ID
          };
        });
      }

      // 处理附件列表
      const attachments = values.files?.fileList?.map((item: any) => ({
        name: item.name,
        url: item.response?.url || item.url
      })) || [];

      const payload = {
        title: values.title,
        type: values.type,
        targetScope: values.targetScope,
        content: html,
        attachments,
        targets,
        status: 1, // 1表示直接发布
      };

      const res = await saveNotification(payload);
      if (res) {
        message.success('通知发布成功！');
        form.resetFields();
        setHtml('');
        setTargetScope('all');
      }
    } catch (error: any) {
      message.error(error.message || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  // 销毁编辑器
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
      <Card title="发布系统通知" bordered={false} style={{ maxWidth: 1000, margin: '0 auto', borderRadius: 8 }}>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish} 
          initialValues={{ targetScope: 'all', type: 1 }}
        >
          <Form.Item name="title" label="通知标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input size="large" placeholder="例如：关于2026年国庆节放假安排" />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="type" label="通知类型" style={{ width: 220 }}>
              <Select>
                <Option value={1}>系统公告</Option>
                <Option value={2}>任务提醒</Option>
                <Option value={3}>活动通知</Option>
              </Select>
            </Form.Item>

            <Form.Item name="targetScope" label="发布范围" style={{ width: 220 }}>
              <Select onChange={(val) => setTargetScope(val)}>
                <Option value="all">全员发布</Option>
                <Option value="custom">定向发布</Option>
              </Select>
            </Form.Item>
          </Space>

          {targetScope === 'custom' && (
            <Form.Item 
              name="targetKeys" 
              label="选择目标范围" 
              rules={[{ required: true, message: '请选择至少一个接收目标' }]}
            >
              <TreeSelect
                treeData={treeData}
                placeholder="勾选部门、人员或角色"
                treeCheckable={true}
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                loading={treeLoading}
              />
            </Form.Item>
          )}

          <Form.Item label="通知正文内容" required>
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, zIndex: 100 }}>
              <Toolbar
                editor={editor}
                defaultConfig={toolbarConfig}
                mode="default"
                style={{ borderBottom: '1px solid #d9d9d9' }}
              />
              <Editor
                defaultConfig={editorConfig}
                value={html}
                onCreated={setEditor}
                onChange={editor => setHtml(editor.getHtml())}
                mode="default"
                style={{ height: '400px', overflowY: 'hidden' }}
              />
            </div>
          </Form.Item>

          <Form.Item name="files" label="附件资料 (可选)">
            <Upload 
              action="/api/common/upload/notice-files" 
              name="file"
              multiple
            >
              <Button icon={<UploadOutlined />}>点击上传附件</Button>
            </Upload>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button size="large" onClick={() => form.resetFields()}>重置</Button>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit" 
                icon={<SendOutlined />} 
                loading={loading}
              >
                正式发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default NotificationCreate;
