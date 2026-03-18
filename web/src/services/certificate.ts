import axios from 'axios';

// 假设你之前的请求封装路径是这个，如果不是请替换为你的实际 request 工具
import request from '@/utils/request'; 

export async function getCertificates(params?: any) {
  return request.get('/certificates', { params });
}

export async function saveCertificate(data: any) {
  // 注意：后端实体 id 是 uuid，如果是新增则不带 id
  if (data.id) {
    return request.put(`/certificates/${data.id}`, data);
  }
  return request.post('/certificates', data);
}

export async function deleteCertificate(id: string) {
  return request.delete(`/certificates/${id}`);
}