import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, TreeSelect, Button, Upload, Space, message, Divider, Spin } from 'antd';
import { UploadOutlined, SendOutlined, SaveOutlined } from '@ant-design/icons';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { saveNotification, getNotificationDetail } from '../../../services/notification';
import { useSearchParams, useNavigate } from 'react-router-dom'; 
import request from '../../../utils/request'; 
import '@wangeditor/editor/dist/css/style.css';

const { Option } = Select;

const NotificationCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const noticeId = searchParams.get('id'); // 从 URL 获取 ?id=8

  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState('');
  const [targetScope, setTargetScope] = useState('all');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false); 
  const [treeData, setTreeData] = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  const token = localStorage.getItem('token');

  // 💡 修正 1：详情回显逻辑
  useEffect(() => {
    if (noticeId) {
      setInitLoading(true);
      // 确保这里的接口调用能对应上 /api/notifications/detail/8
      getNotificationDetail(noticeId)
        .then(res => {
          // 💡 修正点：根据你发的 JSON，数据在 res.data 里面
          const noticeData = res?.data || res; 
          
          if (noticeData) {
            form.setFieldsValue({
              title: noticeData.title,
              type: noticeData.type,
              targetScope: noticeData.targetScope,
              targetKeys: noticeData.targets?.map((t: any) => `${t.targetType}-${t.targetId}`)
            });
            // 💡 修正点：强制更新富文本内容
            setHtml(noticeData.content || '');
            setTargetScope(noticeData.targetScope);
          }
        })
        .catch((err) => {
          console.error("回显报错:", err);
          message.error("获取详情失败");
        })
        .finally(() => setInitLoading(false));
    }
  }, [noticeId, form]);

  // 获取组织架构树
  useEffect(() => {
    if (targetScope === 'custom') {
      setTreeLoading(true);
      request('/users/org-tree', { method: 'GET' })
        .then(res => {
          if (res && res.data) setTreeData(res.data); 
        })
        .catch(() => message.error("获取组织架构失败"))
        .finally(() => setTreeLoading(false));
    }
  }, [targetScope]);

  const toolbarConfig: Partial<IToolbarConfig> = { excludeKeys: ['fullScreen'] };
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入正文内容...',
    MENU_CONF: {
      uploadImage: {
        server: '/api/common/upload/notice-content',
        fieldName: 'file',
        headers: { Authorization: `Bearer ${token}` },
        customInsert(res: any, insertFn: any) {
          if (res && res.url) insertFn(res.url, res.name || 'image', res.url);
          else message.error('图片上传失败');
        },
      }
    }
  };

  const onFinish = async (status: number) => {
    try {
      const values = await form.validateFields();
      if (!html || html === '<p><br></p>') return message.warning('请输入通知正文内容');

      setLoading(true);
      
      let targets: any[] = [];
      if (values.targetScope === 'custom' && values.targetKeys) {
        targets = values.targetKeys.map((key: string) => {
          const [type, id] = key.split('-');
          return {
            targetType: type,
            targetId: type === 'role' ? id : parseInt(id),
          };
        });
      }

      const payload = {
        id: noticeId ? parseInt(noticeId) : undefined,
        title: values.title,
        type: values.type,
        targetScope: values.targetScope,
        content: html,
        targets,
        status, 
      };

      const res = await saveNotification(payload);
      if (res) {
        message.success(status === 0 ? '已存入草稿箱' : '通知发布成功！');
        navigate('/notifications/list');
      }
    } catch (error: any) {
      if (error.errorFields) return; 
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  return (
    <Spin spinning={initLoading} tip="正在加载公告数据...">
      <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
        <Card title={noticeId ? "编辑系统通知" : "发布系统通知"} bordered={false} style={{ maxWidth: 1000, margin: '0 auto', borderRadius: 8 }}>
          <Form 
            form={form} 
            layout="vertical" 
            initialValues={{ targetScope: 'all', type: 1 }}
          >
            <Form.Item name="title" label="通知标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input size="large" placeholder="请输入标题" />
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
              <Form.Item name="targetKeys" label="选择目标范围" rules={[{ required: true }]}>
                <TreeSelect
                  treeData={treeData}
                  treeCheckable={true}
                  showCheckedStrategy={TreeSelect.SHOW_PARENT}
                  style={{ width: '100%' }}
                  loading={treeLoading}
                />
              </Form.Item>
            )}

            <Form.Item label="通知正文内容" required>
              <div className="editor-content-view" style={{ border: '1px solid #d9d9d9', borderRadius: 4, zIndex: 100 }}>
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

            <Divider />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button size="large" onClick={() => navigate(-1)}>取消</Button>
                <Button 
                  icon={<SaveOutlined />} 
                  size="large" 
                  loading={loading}
                  onClick={() => onFinish(0)}
                >
                  保存草稿
                </Button>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<SendOutlined />} 
                  loading={loading}
                  onClick={() => onFinish(1)}
                >
                  {noticeId ? '保存并发布' : '正式发布'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Spin>
  );
};

export default NotificationCreate;