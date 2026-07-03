import { getMe, requireLogin } from '../../services/auth';
import { submitOrganizerApplication } from '../../services/organizer';
import { setSessionUser } from '../../stores/session';
import { guardLogin } from '../../utils/nav';
import { isValidIdCard, isValidPhone } from '../../utils/idCard';

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
    submitting: false,
  },

  async onLoad() {
    if (!(await guardLogin('请先登录后再申请'))) return;
    const user = await requireLogin();

    if (user.isOrganizer) {
      wx.redirectTo({ url: '/pages/user/tracks' });
      return;
    }
    if (user.organizerApplication?.status === 'pending') {
      wx.redirectTo({ url: '/pages/organizer/status' });
    }
  },

  onRealNameInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.realName': e.detail.value });
  },

  onIdCardInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.idCardNumber': e.detail.value });
  },

  onPhoneInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.phone': e.detail.value });
  },

  onWechatInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.wechat': e.detail.value });
  },

  validateForm(): boolean {
    const { realName, idCardNumber, phone } = this.data.form;
    if (realName.trim().length < 2) {
      wx.showToast({ title: '请填写真实姓名', icon: 'none' });
      return false;
    }
    if (!isValidIdCard(idCardNumber)) {
      wx.showToast({ title: '身份证号不合法，请检查', icon: 'none' });
      return false;
    }
    if (!isValidPhone(phone)) {
      wx.showToast({ title: '请填写有效手机号', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    const form = this.data.form;
    this.setData({ submitting: true });
    try {
      await submitOrganizerApplication({
        realName: form.realName.trim(),
        idCardNumber: form.idCardNumber.trim(),
        phone: form.phone.trim(),
        wechat: form.wechat.trim() || undefined,
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
