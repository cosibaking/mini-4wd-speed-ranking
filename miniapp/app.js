"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./services/auth");
const config_1 = require("./config");
const session_1 = require("./stores/session");
async function restoreSession() {
    try {
        const user = await (0, auth_1.getMe)();
        (0, session_1.setSessionUser)(user);
    }
    catch (_a) {
        (0, session_1.setSessionUser)(null);
    }
}
App({
    globalData: {
        user: null,
        apiBase: config_1.API_BASE,
    },
    onLaunch() {
        restoreSession();
    },
});
