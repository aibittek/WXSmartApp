// app.js

App({
  onLaunch() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.width = res.windowWidth
        this.globalData.height = res.windowHeight
        console.log("windows width:" + res.windowWidth + ",height:" + res.windowHeight)
      },
    })
  },
  globalData: {
    width: 0,
    height: 0
  }
})
