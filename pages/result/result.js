// pages/result/result.js

// 获取应用实例
const app = getApp()

Page({

  data: {
    width: app.globalData.width,
    height: app.globalData.height,
    shareUrl: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let than = this
    let promise1 = new Promise(function (resolve, reject) {
      wx.getImageInfo({
        src: options.image,
        success: function (res) {
          console.log(res)
          resolve(res);
        }
      })
    });
    let promise2 = new Promise(function (resolve, reject) {
      wx.getImageInfo({
        src: '../../images/qrcode.jpg',
        success: function (res) {
          console.log(res)
          resolve(res);
        }
      })
    });
    Promise.all([
      promise1, promise2
    ]).then(res => {
      var that = this
      console.log(res)
      const ctx = wx.createCanvasContext('shareImg')
      that.setData({
        width: app.globalData.width,
        height: app.globalData.height,
      })
      //主要就是计算好各个图文的位置
      ctx.drawImage(res[0].path, 0, 0, res[0].witdh, res[0].height,
        0, 0, app.globalData.width, app.globalData.height)
      ctx.drawImage('../../' + res[1].path, app.globalData.width-res[1].witdh, app.globalData.height-res[1].height, res[1].witdh, res[1].height)

      ctx.setTextAlign('center')
      ctx.setFillStyle('#ffffff')
      ctx.setFontSize(20)
      ctx.fillText('扫描下方二维码体验题拍拍吧', 150, 50)

      ctx.stroke()
      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: res.width,
          height: res.height,
          destWidth: res.width,
          destHeight: res.height,
          canvasId: 'shareImg',
          success: function (res) {
            console.log(res.tempFilePath);
            that.setData({
              shareUrl: res.tempFilePath,
            })
          },
          fail: function (err) {
            console.log(err)
          }
        })
      })
    })
  },
  /**
   * 保存到相册
  */
  save: function () {
    var that = this
    //生产环境时 记得这里要加入获取相册授权的代码
    wx.saveImageToPhotosAlbum({
      filePath: that.data.shareUrl,
      success(res) {
        wx.showModal({
          content: '图片已保存到相册，去晒一下吧~',
          showCancel: false,
          confirmText: '好哒',
          confirmColor: '#72B9C3',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定');
            }
          }
        })
      }
    })
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