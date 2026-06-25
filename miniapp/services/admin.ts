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
