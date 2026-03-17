import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 1. 定义后端统一返回的业务数据格式
interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 2. 创建 Axios 实例
const request: AxiosInstance = axios.create({
  baseURL: '/api', 
  timeout: 10000,
});

// 3. 响应拦截器：直接提取后端返回的 body
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 获取机构列表
 * GET /api/institutions
 */
export async function getInstitutions(params?: any): Promise<ApiResponse> {
  return request.get('/institutions', { params }) as any;
}

/**
 * 保存机构（新增或修改）
 * @param data 包含表单所有字段的对象，如果是编辑需包含数字 id
 */
export async function saveInstitution(data: any): Promise<ApiResponse> {
  // 💡 重点：只在这里解构一次 id
  const { id, ...rest } = data;

  if (id) {
    // 修改模式：PUT /api/institutions/:id
    // 发送给后端的是排除掉 id 后的剩余业务字段
    return request.put(`/institutions/${id}`, rest) as any;
  }

  // 新增模式：POST /api/institutions
  return request.post('/institutions', data) as any;
}

/**
 * 删除机构
 * @param id 数据库自增的数字 ID
 */
export async function deleteInstitution(id: number | string): Promise<ApiResponse> {
  return request.delete(`/institutions/${id}`) as any;
}