import { request } from './http';
import type { PaginationResult } from '../types';

export interface AdminMe {
  isAdmin: boolean;
  adminRole?: 'admin' | 'operator';
}

export interface AdminDashboard {
  pendingApplications: number;
  trackCount: number;
  userCount: number;
}

export interface AdminApplicationItem {
  id: string;
  userId: string;
  applicantNickName: string;
  realName: string;
  idCardMasked: string;
  phone: string;
  wechat?: string;
  status: 'pending' | 'approved' | 'rejected';
  realNameVerifiedAt?: string;
  reviewNote?: string;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  nickName: string;
  avatarUrl: string;
  isOrganizer: boolean;
  adminRole?: 'admin' | 'operator';
  isSystemAdmin?: boolean;
  createdAt: string;
}

export interface AdminTrackItem {
  id: string;
  name: string;
  address: string;
  organizerName: string;
  creatorId: string;
  recordCount: number;
  createdAt: string;
}

export function getAdminMe(): Promise<AdminMe> {
  return request<AdminMe>('/admin/me');
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return request<AdminDashboard>('/admin/dashboard');
}

export function listOrganizerApplications(params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginationResult<AdminApplicationItem>> {
  return request('/admin/organizer-applications', { data: params });
}

export function approveOrganizerApplication(
  id: string,
  reviewNote?: string,
): Promise<{ success: boolean }> {
  return request(`/admin/organizer-applications/${id}/approve`, {
    method: 'POST',
    data: { reviewNote },
  });
}

export function rejectOrganizerApplication(
  id: string,
  reviewNote?: string,
): Promise<{ success: boolean }> {
  return request(`/admin/organizer-applications/${id}/reject`, {
    method: 'POST',
    data: { reviewNote },
  });
}

export function listAdminUsers(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginationResult<AdminUserItem>> {
  return request('/admin/users', { data: params });
}

export function listAdminTracks(params?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginationResult<AdminTrackItem>> {
  return request('/admin/tracks', { data: params });
}

export function grantOrganizer(userId: string): Promise<{ success: boolean }> {
  return request(`/admin/users/${userId}/grant-organizer`, { method: 'POST' });
}

export function revokeOrganizer(userId: string): Promise<{ success: boolean }> {
  return request(`/admin/users/${userId}/revoke-organizer`, { method: 'POST' });
}

export function grantAdmin(userId: string): Promise<{ success: boolean }> {
  return request(`/admin/users/${userId}/grant-admin`, { method: 'POST' });
}

export function revokeAdmin(userId: string): Promise<{ success: boolean }> {
  return request(`/admin/users/${userId}/revoke-admin`, { method: 'POST' });
}

export interface SendAdminNotificationResult {
  sent: number;
  mode: 'single' | 'broadcast';
}

export function sendAdminNotification(params: {
  title: string;
  content: string;
  userId?: string;
  userIds?: string[];
}): Promise<SendAdminNotificationResult> {
  return request('/admin/notifications/send', {
    method: 'POST',
    data: params,
  });
}

export interface AdminPostItem {
  id: string;
  title: string;
  boardName: string;
  author: { id: string; nickName: string; avatarUrl: string };
  likeCount: number;
  commentCount: number;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  coverImage: string | null;
}

export interface AdminPostDetail {
  id: string;
  boardId: string;
  boardName: string;
  title: string;
  content: string;
  imageUrls: string[];
  track?: { id: string; name: string };
  author: { id: string; nickName: string; avatarUrl: string };
  likeCount: number;
  commentCount: number;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  nickName: string;
  avatarUrl: string;
  bio: string;
  isOrganizer: boolean;
  adminRole?: 'admin' | 'operator';
  isSystemAdmin?: boolean;
  createdAt: string;
}

export function listAdminPosts(params?: {
  keyword?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginationResult<AdminPostItem>> {
  return request('/admin/posts', { data: params });
}

export function getAdminPost(id: string): Promise<AdminPostDetail> {
  return request(`/admin/posts/${id}`);
}

export function deleteAdminPost(id: string): Promise<{ success: boolean }> {
  return request(`/admin/posts/${id}/delete`, { method: 'POST' });
}

export function restoreAdminPost(id: string): Promise<{ success: boolean }> {
  return request(`/admin/posts/${id}/restore`, { method: 'POST' });
}

export function getAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  return request(`/admin/users/${userId}`);
}
