"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lapTime_1 = require("../../utils/lapTime");
Component({
    properties: {
        value: { type: String, value: '' },
        placeholder: { type: String, value: '0:32.580' },
    },
    data: {
        valid: true,
    },
    methods: {
        onInput(e) {
            const val = e.detail.value;
            const valid = !val || (0, lapTime_1.isValidLapTimeInput)(val);
            this.setData({ valid });
            this.triggerEvent('change', { value: val, valid });
        },
    },
});
