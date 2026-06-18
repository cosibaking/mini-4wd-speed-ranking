import { isValidLapTimeInput } from '../../utils/lapTime';

Component({
  properties: {
    value: { type: String, value: '' },
    placeholder: { type: String, value: '0:32.580' },
  },

  data: {
    valid: true,
  },

  methods: {
    onInput(e: WechatMiniprogram.Input) {
      const val = e.detail.value;
      const valid = !val || isValidLapTimeInput(val);
      this.setData({ valid });
      this.triggerEvent('change', { value: val, valid });
    },
  },
});
