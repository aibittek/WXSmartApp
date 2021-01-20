// pages/result/result.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bgImageUrl: 'https://cdn.jsdelivr.net/gh/aibittek/ImageHost/img/1.jpg',    //海报背景图片，固定地址的网络图片
    qrCodeUrl: "",

    imagePath_bg: undefined,       //wx.getImageInfo转化的图片地址；cavas不能直接用网络地址。
    imagePath_qrcode: undefined,    ////wx.getImageInfo转化的图片地址 ;网络动态请求，小程序码网络图片

    tempSavedImageURL: '',  //cavas绘制图片临时保存路径

    //注意，背景图片时固定大小600x1067，所以canvasStyle宽高比例必须也一致！否则画出来的图片会有多余的一片空白。
    canvasStyle: 'width: 600px;height:1067px;position: fixed;top: -10000px;',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.ctx = wx.createCanvasContext('myCanvas', this);
    //创建ctx耗时较长，延时500毫秒再请求url
        setTimeout(res => {
          this.requestMyIQRCodeUrl()
        }, 500)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  
})