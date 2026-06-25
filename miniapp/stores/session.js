"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionUser = getSessionUser;
exports.setSessionUser = setSessionUser;
let sessionUser = null;
function getSessionUser() {
    return sessionUser;
}
function setSessionUser(user) {
    sessionUser = user;
    const app = getApp();
    if (app)
        app.globalData.user = user;
}
