import type { TrackListItem } from '../../types';
import { formatDistance } from '../../utils/geo';

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
      if (track?.id) {
        wx.navigateTo({ url: `/pages/track/detail?id=${track.id}` });
      }
    },
  },
});
