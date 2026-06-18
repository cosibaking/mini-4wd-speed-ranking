import type { TrackListItem } from '../../types';
import { formatDistance } from '../../utils/geo';
import { navigateWithLogin } from '../../utils/nav';

Component({
  properties: {
    track: {
      type: Object,
      value: {} as TrackListItem,
    },
    showDistance: {
      type: Boolean,
      value: true,
    },
    theme: {
      type: String,
      value: 'light',
    },
    requireLogin: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    distanceText: '',
  },

  observers: {
    track(t: TrackListItem) {
      if (t && t.distance !== undefined) {
        this.setData({ distanceText: formatDistance(t.distance) });
      }
    },
  },

  methods: {
    onTap() {
      const track = this.properties.track as TrackListItem;
      if (!track?.id) return;
      const url = `/pages/track/detail?id=${track.id}`;
      if (this.properties.requireLogin) {
        navigateWithLogin(url);
        return;
      }
      wx.navigateTo({ url });
    },
  },
});
