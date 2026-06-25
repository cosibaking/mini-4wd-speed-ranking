"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSessionUser = exports.getSessionUser = void 0;
let sessionUser = null;
function getSessionUser() {
    return sessionUser;
}
exports.getSessionUser = getSessionUser;
function setSessionUser(user) {
    sessionUser = user;
    const app = getApp();
    if (app)
        app.globalData.user = user;
}
exports.setSessionUser = setSessionUser;
