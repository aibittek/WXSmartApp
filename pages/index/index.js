  // index.js
  // 获取应用实例
  const app = getApp()
  const CryptoJS = require('../../utils/crypto-js/crypto-js.js')

  Page({
    data: {
      userInfo: {},
      hasUserInfo: false,
      canIUse: wx.canIUse('button.open-type.getUserInfo'),
      imageUrl: "/images/shareit.png",
      uri: "/v2/itr",
      host: "rest-api.xfyun.cn",
      hostUrl: "http://rest-api.xfyun.cn/v2/itr",
      appid: "60016549",
      apiSecret: "4f49ab1f8b4c430f3536e54d111eb705",
      apiKey: "69988d3cd6417055f6575c6e81eb2b5e",
      head: null,
      body: null,
    },

    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs'
      })
    },

    onLoad() {

      if (app.globalData.userInfo) {
        this.setData({
          userInfo: app.globalData.userInfo,
          hasUserInfo: true
        })
      } else if (this.data.canIUse) {
        // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        // 所以此处加入 callback 以防止这种情况
        app.userInfoReadyCallback = res => {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      } else {
        // 在没有 open-type=getUserInfo 版本的兼容处理
        wx.getUserInfo({
          success: res => {
            app.globalData.userInfo = res.userInfo
            this.setData({
              userInfo: res.userInfo,
              hasUserInfo: true
            })
          }
        })
      }
    },
    getUserInfo(e) {
      console.log(e)
      app.globalData.userInfo = e.detail.userInfo
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true
      })
    },
    //图库选择
    photo() {
      let than = this;
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success(res) {
          than.setData({
            imageUrl: res.tempFilePaths[0]
          })
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
          console.log(res.tempFilePaths[0]);
          than.setData({
            imageUrl: res.tempFilePaths[0]
          })
          wx.showLoading({ title: "正在处理..." })    //加载提示框
          than.ScanningImg(res.tempFilePaths[0])
            .then((result) => {
              console.log("ok");
            }).catch((err) => {
              console.log(err);
            });
          wx.hideLoading()                            //关闭提示框
        }
      })
    },

    //处理扫描
    ScanningImg(photo) {
      let than = this
      return new Promise((resolve, reject) => {//生成上传缩略图
        than.Thumbnail(photo)
          .then(result => {
            resolve()
          }).catch(err => reject(err))
      }).then(() => {
        return new Promise((resolve, reject) => {
          wx.getFileSystemManager().readFile({
            filePath: photo,
            encoding: 'base64',
            success: res => resolve(res.data),
            fail: err => reject(err)
          })
        }).then((base64) => {//判断接口,开始上传扫描
          return new Promise((resolve, reject) => {
            than.itr(base64)
              .then((res) => {
                console.log("res" + res);
              })
              .catch(err => reject(err));
          });
        })
      })
    },
    //处理缩略图
    Thumbnail(path) {
      let ctx = wx.createCanvasContext('customCanvas')
      return new Promise((resolve, reject) => {
        wx.getImageInfo({//获取图片信息
          src: path,
          success(res) {
            console.log({ w: res.width, h: res.height });
            let size = 500//目标大小

            //开始位置
            let xrp = 0
            let hrp = 0
            //原始图片的矩形
            let xux = 0

            if (res.width > res.height) {//w>h
              //矩形位置
              xrp = (res.width - res.height) / 2
              //截取矩形大小
              xux = res.height
            } else {//h>w
              //矩形位置
              hrp = (res.height - res.width) / 2
              //截取矩形大小
              xux = res.width
            }

            //置入画布，路径，矩形位置x-y , 矩形在原始图片的位置 , 画布位置x-y , 缩放到画布大小
            ctx.drawImage(path, xrp, hrp, xux, xux, 0, 0, size, size)
            console.log("path:" + path)
            ctx.draw(false, () => {
              wx.canvasToTempFilePath({
                x: 0,
                y: 0,
                width: 500,
                height: 500,
                destWidth: size,
                destHeight: size,
                fileType: 'jpg',
                canvasId: 'customCanvas',
                success(res) {
                  resolve(res.tempFilePath)
                },
                fail(err) {
                  console.log("储存画布失败");
                  console.error(err);
                  reject(err)
                }
              })
            })
          },
          fail: err => {
            console.log("获取图片信息失败");
            console.error(err);
            reject(err)
          }
        })
      })
    },
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
              var jsonArray = res.data.data.ITRResult.recog_result[0].line_word_result
              for(var i=0; i < jsonArray.length; i++) {
                console.log(jsonArray[i].word_content.toString())
              }
            }
          })
      });
    },

    // 获取请求的body内容
    getbody(photo) {
      let than = this
      new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
          filePath: photo,
          encoding: 'base64',
          success: res => resolve(res.data),
          fail: err => reject(err)
        })
      }).then(base64image => {
        than.setData({
          body: {
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
        })
      })
    },

    getHeader(body) {
      // 获取当前GMT时间
      app.globalData.Date = new Date().toUTCString()
      console.log("Date:" + app.globalData.Date)
      // 获取Digest
      let digest = 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)))
      console.log("Digest:" + digest)
      // 获取Authorization
      let signatureOrigin = `host: ${this.data.host}\ndate: ${app.globalData.Date}\nPOST ${this.data.uri} HTTP/1.1\ndigest: ${digest}`
      let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, this.data.apiSecret)
      let signature = CryptoJS.enc.Base64.stringify(signatureSha)
      let authorizationOrigin = `api_key="${this.data.apiKey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`
      console.log("authorizationOrigin:" + authorizationOrigin)
      this.setData({
        head: {
          "Date": app.globalData.Date,
          "Digest": digest,
          "Authorization": authorizationOrigin,
          "Content-Type": "application/json",
          "Accept": "application/json,version=1.0"
        }
      })
    }
  })

