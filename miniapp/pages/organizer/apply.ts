import { ensureLogin, getMe } from '../../services/auth';
import { getClientConfig, isRealNameMockEnabled } from '../../services/clientConfig';
import {
  MOCK_REALNAME_CODE,
  extractRealNameCode,
  launchRealNameAuth,
  submitOrganizerApplication,
  verifyOrganizerRealName,
} from '../../services/organizer';
import { setSessionUser } from '../../stores/session';

interface ApplyForm {
  realName: string;
  idCardNumber: string;
  phone: string;
  wechat: string;
}

Page({
  data: {
    form: {
      realName: '',
      idCardNumber: '',
      phone: '',
      wechat: '',
    } as ApplyForm,
    realNameCode: '',
    realNameMock: false,
    launchingAuth: false,
    submitting: false,
  },

  async onLoad() {
    const [user, clientConfig] = await Promise.all([ensureLogin(), getClientConfig()]);
    this.setData({ realNameMock: isRealNameMockEnabled(clientConfig) });

    if (user.isOrganizer) {
      wx.redirectTo({ url: '/pages/user/tracks' });
      return;
    }
    if (user.organizerApplication?.status === 'pending') {
      wx.redirectTo({ url: '/pages/organizer/status' });
    }
  },

  onShow() {
    if (this.data.realNameMock) {
      return;
    }
    const code = extractRealNameCode();
    if (code && code !== this.data.realNameCode) {
      this.setData({ realNameCode: code });
      this.verifyReturnedCode(code);
    }
  },

  onRealNameInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.realName': e.detail.value, realNameCode: '' });
  },

  onIdCardInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.idCardNumber': e.detail.value, realNameCode: '' });
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.phone': e.detail.value });
  },

  onWechatInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.wechat': e.detail.value });
  },

  validateForm(): boolean {
    const { realName, idCardNumber, phone } = this.data.form;
    if (!realName.trim()) {
      wx.showToast({ title: '请填写姓名', icon: 'none' });
      return false;
    }
    if (!/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCardNumber.trim())) {
      wx.showToast({ title: '身份证号格式不正确', icon: 'none' });
      return false;
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      wx.showToast({ title: '请填写有效手机号', icon: 'none' });
      return false;
    }
    return true;
  },

  async onLaunchRealNameAuth() {
    if (!this.validateForm()) return;
    this.setData({ launchingAuth: true });
    try {
      if (this.data.realNameMock) {
        await this.verifyReturnedCode(MOCK_REALNAME_CODE);
        return;
      }
      await launchRealNameAuth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '打开实名校验失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ launchingAuth: false });
    }
  },

  async verifyReturnedCode(code: string) {
    if (!this.validateForm()) return;
    const form = this.data.form;
    try {
      wx.showLoading({ title: '校验中' });
      await verifyOrganizerRealName({
        realName: form.realName.trim(),
        idCardNumber: form.idCardNumber.trim(),
        code,
      });
      this.setData({ realNameCode: code });
      wx.showToast({ title: '实名校验通过', icon: 'success' });
    } catch (err: unknown) {
      this.setData({ realNameCode: '' });
      const msg = err instanceof Error ? err.message : '实名校验失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onSubmit() {
    if (!this.validateForm()) return;
    if (!this.data.realNameCode) {
      wx.showToast({ title: '请先完成实名校验', icon: 'none' });
      return;
    }

    const form = this.data.form;
    this.setData({ submitting: true });
    try {
      await submitOrganizerApplication({
        realName: form.realName.trim(),
        idCardNumber: form.idCardNumber.trim(),
        phone: form.phone.trim(),
        wechat: form.wechat.trim() || undefined,
        code: this.data.realNameCode,
      });
      const user = await getMe();
      setSessionUser(user);
      wx.showToast({ title: '申请已提交', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/organizer/status' });
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
