import type { LeaderboardEntry } from '../../types';

Component({
  properties: {
    entry: {
      type: Object,
      value: {} as LeaderboardEntry,
    },
    highlight: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onTap() {
      const entry = this.properties.entry as LeaderboardEntry;
      if (entry?.recordId) {
        wx.navigateTo({ url: `/pages/record/detail?id=${entry.recordId}` });
      }
    },
  },
});
