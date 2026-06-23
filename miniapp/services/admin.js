"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminMe = getAdminMe;
exports.getAdminDashboard = getAdminDashboard;
exports.listOrganizerApplications = listOrganizerApplications;
exports.approveOrganizerApplication = approveOrganizerApplication;
exports.rejectOrganizerApplication = rejectOrganizerApplication;
exports.listAdminUsers = listAdminUsers;
exports.listAdminTracks = listAdminTracks;
exports.grantOrganizer = grantOrganizer;
exports.revokeOrganizer = revokeOrganizer;
exports.grantAdmin = grantAdmin;
exports.revokeAdmin = revokeAdmin;
const http_1 = require("./http");
function getAdminMe() {
    return (0, http_1.request)('/admin/me');
}
function getAdminDashboard() {
    return (0, http_1.request)('/admin/dashboard');
}
function listOrganizerApplications(params) {
    return (0, http_1.request)('/admin/organizer-applications', { data: params });
}
function approveOrganizerApplication(id, reviewNote) {
    return (0, http_1.request)(`/admin/organizer-applications/${id}/approve`, {
        method: 'POST',
        data: { reviewNote },
    });
}
function rejectOrganizerApplication(id, reviewNote) {
    return (0, http_1.request)(`/admin/organizer-applications/${id}/reject`, {
        method: 'POST',
        data: { reviewNote },
    });
}
function listAdminUsers(params) {
    return (0, http_1.request)('/admin/users', { data: params });
}
function listAdminTracks(params) {
    return (0, http_1.request)('/admin/tracks', { data: params });
}
function grantOrganizer(userId) {
    return (0, http_1.request)(`/admin/users/${userId}/grant-organizer`, { method: 'POST' });
}
function revokeOrganizer(userId) {
    return (0, http_1.request)(`/admin/users/${userId}/revoke-organizer`, { method: 'POST' });
}
function grantAdmin(userId) {
    return (0, http_1.request)(`/admin/users/${userId}/grant-admin`, { method: 'POST' });
}
function revokeAdmin(userId) {
    return (0, http_1.request)(`/admin/users/${userId}/revoke-admin`, { method: 'POST' });
}
