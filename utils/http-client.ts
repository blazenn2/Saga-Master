import axios from 'axios';
import { SearchParamOptions } from '../types';

const Axios = (url: string, token: string | null) => {
  
  const Axios = axios.create({
    baseURL: url,
    timeout: 5000000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Change request data/error here
  Axios.interceptors.request.use((config) => {

    // @ts-ignore
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token ?? ''}`,
    };
    return config;
  });

  // Change response data/error here
  Axios.interceptors.response.use(
    (response) => response,
    (error) => {
      return Promise.reject(error);
    }
  );

  return Axios;
};

export class HttpClient {
  static async get<T>(url: string, token: string | null, params?: unknown) {
    const response = await Axios(url, token).get<T>(url, { params });
    return response.data;
  }

  static async post<T>(url: string, token: string | null, data: unknown, options?: any) {
    const response = await Axios(url, token).post<T>(url, data, options);
    return response.data;
  }

  static async put<T>(url: string, token: string | null, data: unknown) {
    const response = await Axios(url, token).put<T>(url, data);
    return response.data;
  }

  static async delete<T>(url: string, token: string | null) {
    const response = await Axios(url, token).delete<T>(url);
    return response.data;
  }

  static formatSearchParams(params: Partial<SearchParamOptions>) {
    return Object.entries(params)
      .filter(([, value]) => Boolean(value))
      .map(([k, v]) =>
        ['type', 'categories', 'tags', 'author', 'manufacturer'].includes(k)
          ? `${k}.slug:${v}`
          : `${k}:${v}`
      )
      .join(';');
  }
}
