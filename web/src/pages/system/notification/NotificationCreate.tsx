/**
 * @file web/src/pages/system/notification/NotificationCreate.tsx
 * @version 2.2.0 [2026-05-04]
 * @desc 修复：
 *   1. 编辑回显：@/utils/request 返回完整 AxiosResponse，公告数据在 res.data.data
 *   2. request('/users/org-tree', {method:'GET'}) → request.get('/users/org-tree')
 *   3. navigate('/notifications/list') → navigate('/system/notification')
 */
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, TreeSelect, Button, Space, message, Divider, Spin } from 'antd';
import { SendOutlined, SaveOutlined } from '@ant-design/icons';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { saveNotification, getNotificationDetail } from '../../../services/notification';
import { useSearchParams, useNavigate } from 'react-router-dom';
import request from '../../../utils/request';
import '@wangeditor/editor/dist/css/style.css';

const { Option } = Select;

const NotificationCreate: React.FC = () => {
  const [form]         = Form.useForm();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const noticeId       = searchParams.get('id');

  const [editor, setEditor]           = useState<IDomEditor | null>(null);
  const [html, setHtml]               = useState('');
  const [targetScope, setTargetScope] = useState('all');
  const [loading, setLoading]         = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [treeData, setTreeData]       = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  const token = localStorage.getItem('token');

  // ── 编辑模式：回显数据 ─────────────────────────────────
  useEffect(() => {
    if (!noticeId) return;
    setInitLoading(true);
    getNotificationDetail(noticeId)
      .then((res: any) => {
        // @/utils/request 返回完整 AxiosResponse：
        //   res          = AxiosResponse
        //   res.data     = { code: 200, data: {...}, message: 'success' }
        //   res.data.data = 实际公告对象
        const body       = res?.data;
        const noticeData = body?.data ?? body;

        if (noticeData && body?.code === 200) {
          form.setFieldsValue({
            title:       noticeData.title,
            type:        noticeData.type,
            targetScope: noticeData.targetScope,
            targetKeys:  noticeData.targets?.map(
              (t: any) => `${t.targetType}-${t.targetId}`
            ),
          });
          setHtml(noticeData.content || '');
          setTargetScope(noticeData.targetScope || 'all');
        } else {
          message.error(body?.message || '获取详情失败');
        }
      })
      .catch(() => message.error('获取详情失败'))
      .finally(() => setInitLoading(false));
  }, [noticeId, form]);

  // ── 定向发布：加载组织架构树 ──────────────────────────
  useEffect(() => {
    if (targetScope !== 'custom') return;
    setTreeLoading(true);
    // ✅ 使用 request.get，不再用 request(url, {method})
    request.get('/users/org-tree')
      .then((res: any) => {
        // res.data = { code, data: [...] }
        const tree = res?.data?.data ?? res?.data ?? [];
        setTreeData(Array.isArray(tree) ? tree : []);
      })
      .catch(() => message.error('获取组织架构失败'))
      .finally(() => setTreeLoading(false));
  }, [targetScope]);

  const toolbarConfig: Partial<IToolbarConfig> = { excludeKeys: ['fullScreen'] };
  const editorConfig: Partial<IEditorConfig>   = {
    placeholder: '请输入正文内容...',
    MENU_CONF: {
      uploadImage: {
        server: '/api/common/upload/notice-content',
        fieldName: 'file',
        headers: { Authorization: `Bearer ${token}` },
        customInsert(res: any, insertFn: any) {
          if (res?.url) insertFn(res.url, res.name || 'image', res.url);
          else message.error('图片上传失败');
        },
      },
    },
  };

  const onFinish = async (status: number) => {
    try {
      const values = await form.validateFields();
      if (!html || html === '<p><br></p>') {
        message.warning('请输入通知正文内容');
        return;
      }

      setLoading(true);

      let targets: any[] = [];
      if (values.targetScope === 'custom' && values.targetKeys?.length) {
        targets = values.targetKeys.map((key: string) => {
          const parts  = key.split('-');
          const type   = parts[0];
          const idStr  = parts.slice(1).join('-'); // 兼容 role-key 含 '-'
          return {
            targetType: type,
            targetId:   type === 'role' ? idStr : parseInt(idStr),
          };
        });
      }

      const payload = {
        id:          noticeId ? parseInt(noticeId) : undefined,
        title:       values.title,
        type:        values.type,
        targetScope: values.targetScope,
        content:     html,
        targets,
        status,
      };

      const res: any = await saveNotification(payload);
      // res.data = { code, data, message }
      if (res?.data?.code === 200) {
        message.success(status === 0 ? '已存入草稿箱' : '通知发布成功！');
        navigate('/system/notification');   // ✅ 正确路由
      } else {
        message.error(res?.data?.message || '操作失败');
      }
    } catch (error: any) {
      if (error?.errorFields) return;
      message.error(error?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (editor) { editor.destroy(); setEditor(null); } };
  }, [editor]);

  return (
    <Spin spinning={initLoading} tip="正在加载公告数据...">
      <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
        <Card
          title={noticeId ? '编辑系统通知' : '发布系统通知'}
          bordered={false}
          style={{ maxWidth: 1000, margin: '0 auto', borderRadius: 8 }}
        >
          <Form form={form} layout="vertical" initialValues={{ targetScope: 'all', type: 1 }}>

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
              <Form.Item
                name="targetKeys"
                label="选择目标范围"
                rules={[{ required: true, message: '请选择发布对象' }]}
              >
                <TreeSelect
                  treeData={treeData}
                  treeCheckable
                  showCheckedStrategy={TreeSelect.SHOW_PARENT}
                  placeholder={treeLoading ? '加载中...' : '请选择部门、人员或角色'}
                  style={{ width: '100%' }}
                  loading={treeLoading}
                  maxTagCount={5}
                  showSearch
                  treeNodeFilterProp="title"
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
                  onChange={e => setHtml(e.getHtml())}
                  mode="default"
                  style={{ height: '400px', overflowY: 'hidden' }}
                />
              </div>
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button size="large" onClick={() => navigate('/system/notification')}>取消</Button>
                <Button icon={<SaveOutlined />} size="large" loading={loading} onClick={() => onFinish(0)}>
                  保存草稿
                </Button>
                <Button type="primary" size="large" icon={<SendOutlined />} loading={loading} onClick={() => onFinish(1)}>
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