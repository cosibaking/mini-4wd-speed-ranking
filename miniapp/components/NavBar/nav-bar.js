"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navBar_1 = require("../../utils/navBar");
Component({
    properties: {
        title: { type: String, value: '' },
        background: { type: String, value: '#E85D04' },
        color: { type: String, value: '#ffffff' },
        fixed: { type: Boolean, value: true },
        placeholder: { type: Boolean, value: true },
    },
    data: {
        statusBarHeight: 0,
        navBarHeight: 0,
        totalHeight: 0,
        menuLeft: 0,
        showBack: false,
    },
    lifetimes: {
        attached() {
            const layout = (0, navBar_1.getNavBarLayout)();
            this.setData({
                statusBarHeight: layout.statusBarHeight,
                navBarHeight: layout.navBarHeight,
                totalHeight: layout.totalHeight,
                menuLeft: layout.menuLeft,
                showBack: (0, navBar_1.shouldShowNavBack)(),
            });
        },
    },
    pageLifetimes: {
        show() {
            this.setData({ showBack: (0, navBar_1.shouldShowNavBack)() });
        },
    },
    methods: {
        onBack() {
            (0, navBar_1.navigateNavBack)();
        },
    },
});
