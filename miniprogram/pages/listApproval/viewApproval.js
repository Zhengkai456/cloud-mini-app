// miniprogram/pages/listApproval/viewApproval.js
wx.cloud.init();
const db = wx.cloud.database();
const base64 = require("images/base64");

function toDate(d) {
  return d instanceof Date ? d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() : "";
}

function fetchDB(PAGE) {
  return db.collection('forms').doc(PAGE.data.id).get().then(res => {
    console.log(res.data);
    if (res.data) {
      let x = res.data;
      x.submitDate = toDate(x.submitDate);
      x.eventDate = toDate(new Date(x.eventDate));
      PAGE.setData({ appr: x || {} });
      if (x.check && x.check.comment) {
        PAGE.setData({ commentLength: x.check.comment.length });
      }
    }
    else {
      console.error("Cannot get data");
    }
  });
}

Page({
  data: {
    icon: base64.icon20,
    examState: ["未审批", "撤回", "未通过", "通过"],
    commentLength: 0,
    maxCommentLength: 100
  },
  onLoad: function (options) {
    // get url_get info
    console.log(options);
    if (!options.id || !(/[0-9A-Za-z]{16}/.test(options.id))) {
      wx.showToast({
        title: "无效访问",
        icon: "none",
        mask: true,
        duration: 3000,
        complete() { setTimeout(() => { wx.navigateBack({ delta: 1 }); }, 3200); }
      });
      return;
    }
    this.setData(options);
    // get database
    fetchDB(this);
  },
  /* 用户下拉动作刷新 */
  onPullDownRefresh: function () {
    fetchDB(this).then(() => { wx.stopPullDownRefresh(); });
  },
  submit: function (e) {
    const flag = Number(e.detail.target.dataset.flag);
    const value = e.detail.value;
    console.log(flag, value, this.data.id);
    const PAGE = this;
    wx.showLoading({ title: "提交中", mask: true });
    // call cloud function
    wx.cloud.callFunction({
      name: 'updateApproval',
      data: {
        updateID: this.data.id,
        check: value,
        exam: flag
      }
    }).then((res) => {
      console.log("Update success", res);
      wx.hideLoading();
      // [Boolean]res.error indicates if calling has error
      if (res.error || res.updated === 0) {
        wx.showToast({
          title: "出错了, 请稍后重试",
          icon: "none",
          duration: 2000,
          mask: true
        });
      }
      else {
        wx.showToast({
          title: "提交成功",
          icon: "success",
          duration: 2000,
          mask: true
        });
      }
      fetchDB(PAGE);
    });
  },
  //统计输入长度
  userInput: function (e) {
    console.log(e.detail.value.length);
    this.setData({
      commentLength: e.detail.value.length
    })
  }
})