// index.js

// 获取应用实例
const app = getApp()

// 获取加密接口实例
const CryptoJS = require('../../utils/crypto-js/crypto-js.js')

Page({
  data: {
    imageUrl: "/images/welcome.png",
    appid: "60016549",
    apiSecret: "4f49ab1f8b4c430f3536e54d111eb705",
    apiKey: "69988d3cd6417055f6575c6e81eb2b5e",
    uri: "/v2/itr",
    host: "rest-api.xfyun.cn",
    hostUrl: "https://rest-api.xfyun.cn/v2/itr",
    head: null,
    body: null,
    imagePath: null,
    canvasWidth: 0,
    canvasHeight: 0,
  },

  onLoad() {

  },

  //图库选择
  photo() {
    let than = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: res => {
        than.imagePath = res.tempFilePaths[0]
        than.ScanningImg(res.tempFilePaths[0])
          .then((result) => {
            console.log("ok");
          }).catch((err) => {
            console.log(err);
          });
      }
    })
  },
  //相机拍照
  camera() {
    let than = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: res => {
        than.imagePath = res.tempFilePaths[0]
        than.ScanningImg(res.tempFilePaths[0])
          .then((result) => {
            console.log("ok");
          }).catch((err) => {
            console.log(err);
          });
      }
    })
  },

  //处理扫描
  ScanningImg(photo) {
    let than = this
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath: photo,
        encoding: 'base64',
        success(res) {
          resolve(res.data)
        },
        fail(err) {
          reject(err)
        }
      })
    }).then((base64) => {//判断接口,开始上传扫描
      return new Promise((resolve, reject) => {
        than.itr(base64)
          .then((res) => {
            resolve(res)
            console.log("res" + res);
          })
          .catch(err => reject(err));
      });
    })
  },
  // 拍照速算接口
  itr(base64image) {
    let than = this;
    return new Promise((reslove, reject) => {
      var body = {
        "common": {
          "app_id": than.data.appid
        },
        "business": {
          "ent": "math-arith",
          "aue": "raw"
        },
        "data": {
          "image": base64image
        }
      }
      // 获取当前GMT时间
      app.globalData.Date = new Date().toUTCString()
      console.log("Date:" + app.globalData.Date)
      // 获取Digest
      let base64body = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(body))
      let digest = 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(base64body)))
      console.log("Digest:" + digest)
      // 获取Authorization
      let signatureOrigin = `host: ${this.data.host}\ndate: ${app.globalData.Date}\nPOST ${this.data.uri} HTTP/1.1\ndigest: ${digest}`
      let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.data.apiSecret)
      let signature = CryptoJS.enc.Base64.stringify(signatureSha)
      let authorizationOrigin = `api_key="${this.data.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`
      console.log("authorizationOrigin:" + authorizationOrigin)
      wx.showLoading({
        title: '请求中...',
      })
      wx.request({
        url: than.data.hostUrl,
        method: 'POST',
        data: body,
        header: {
          "Date": app.globalData.Date,
          "Digest": digest,
          "Authorization": authorizationOrigin,
          "Content-Type": "application/json",
          "Accept": "application/json,version=1.0"
        },
        success(res) {
          if (200 != res.statusCode || !res.data || !res.data.data
            || !res.data.data.ITRResult || !res.data.data.ITRResult.multi_line_info
            || !res.data.data.ITRResult.multi_line_info.imp_line_info) {
            wx.hideLoading({
              success: (res) => {
                wx.showModal({
                  content: '失败啦(ㄒoㄒ)~~, 这啥照骗',
                  showCancel: false,
                  confirmText: '好的吧',
                  confirmColor: '#72B9C3',
                  success: function (res) {
                    if (res.confirm) {
                      console.log('用户点击确定');
                    }
                  }
                })
              },
            })
          } else {
            let obj = res.data.data.ITRResult.multi_line_info.imp_line_info
            var jsonArray = res.data.data.ITRResult.recog_result[0].line_word_result
            for (var i = 0; i < jsonArray.length; i++) {
              if (obj[i].total_score) {
                console.log('对:' + jsonArray[i].word_content.toString())
              } else {
                console.log('错:' + jsonArray[i].word_content.toString())
              }
            }
            // var jsonResult = JSON.stringify(res.data.data.ITRResult.multi_line_info.imp_line_info)
            // console.log(jsonResult)
            // var obj = JSON.parse(jsonResult)
            // console.log(obj)
            let ctx = wx.createCanvasContext('customCanvas')
            wx.getImageInfo({//获取图片信息
              src: than.imagePath,
              success(res) {
                than.setData({
                  canvasWidth: res.width,
                  canvasHeight: res.height
                })
                ctx.drawImage(than.imagePath, 0, 0, res.width, res.height)
                for (let i = 0; i < obj.length; i++) {
                  if (0 == obj[i].total_score) {
                    ctx.setStrokeStyle('red')
                  } else {
                    ctx.setStrokeStyle('green')
                  }
                  ctx.strokeRect(obj[i].imp_line_rect.left_up_point_x,
                    obj[i].imp_line_rect.left_up_point_y,
                    obj[i].imp_line_rect.right_down_point_x - obj[i].imp_line_rect.left_up_point_x,
                    obj[i].imp_line_rect.right_down_point_y - obj[i].imp_line_rect.left_up_point_y)
                }
                ctx.draw(false, () => {
                  setTimeout(() => {
                    wx.canvasToTempFilePath({
                      x: 0,
                      y: 0,
                      width: res.width,
                      height: res.height,
                      destWidth: res.width,
                      destHeight: res.height,
                      fileType: 'jpg',
                      canvasId: 'customCanvas',
                      success(res) {
                        console.log(res.tempFilePath)
                        // than.setData({
                        //   imageUrl: res.tempFilePath
                        // })
                        wx.hideLoading({
                          success: (res) => { },
                        })
                        wx.navigateTo({
                          url: `/pages/result/result?image=${res.tempFilePath}`,
                        })
                      },
                      fail(err) {
                        console.log("res.width:" + res.width);
                        console.log("res.height:" + res.height);
                        console.log("图片绘制失败:" + err);
                        wx.hideLoading({
                          success: (res) => { },
                        })
                      }
                    })
                  }, 500);
                })
              },
              fail: err => {
                console.error("获取图片信息失败:" + err);
                wx.hideLoading({
                  success: (res) => { },
                })
              }
            })
            
          }
        },
        fail(err) {
          console.log(err.errMsg);
          wx.hideLoading({
            success: (res) => {
              wx.showModal({
                content: '请求失败啦:( ' + err.errMsg,
                showCancel: false,
                confirmText: '好吧',
                confirmColor: '#72B9C3',
                success: function (res) {
                  if (res.confirm) {
                    console.log('用户点击确定');
                  }
                }
              })
            },
          })
        }
      })
    });
  },
  onShareAppMessage() {//统一分享内容
    return {
      title: '题拍拍',
      path: '/pages/index/index',
      imageUrl: '/images/welcome.png'
    }
  }
})
