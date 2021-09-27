// pages/result/result.js

// 获取应用实例
const app = getApp()

// 获取通用接口
const common = require("../../js/common.js")

Page({

    data: {
        shareUrl: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let self = this

        wx.showLoading({
            title: '生成中...',
        })

        const query = wx.createSelectorQuery()
        query.select('#shareImg')
            .fields({ node: true, size: true }).exec(async (res) => {
                const canvas = res[0].node
                const ctx = canvas.getContext('2d')

                // 绘制底图
                const bgImage = canvas.createImage()
                bgImage.src = options.image
                let bgImageContent = await new Promise((resolve, reject) => {
                    bgImage.onload = () => {
                        resolve(bgImage)
                    }
                    bgImage.onerror = (e) => {
                        console.error(e)
                        reject(null)
                    }
                })
                canvas.width = bgImageContent.width
                canvas.height = bgImageContent.height
                ctx.drawImage(bgImageContent, 0, 0, bgImageContent.width, bgImageContent.height)

                // 绘制小程序二维码分享图
                const qrcodeImage = canvas.createImage()
                qrcodeImage.src = '/images/qrcode.jpg'
                let qrcodeImageContent = await new Promise((resolve, reject) => {
                    qrcodeImage.onload = () => {
                        resolve(qrcodeImage)
                    }
                    qrcodeImage.onerror = (e) => {
                        console.error(e)
                        reject(null)
                    }
                })
                ctx.drawImage(qrcodeImageContent, 
                    canvas.width - qrcodeImageContent.width, 
                    canvas.height - qrcodeImageContent.height, 
                    qrcodeImageContent.width, qrcodeImageContent.height)

                ctx.font = '25px bold'          // 设置字体大小，20px
                ctx.textAlign = 'center'        // 设置对齐方式，居中
                ctx.fillStyle = '#fff'          // 设置字体填充颜色，白色
                ctx.fillText('扫描下方二维码体验拍拍题吧', 200, 50)

                ctx.font = '25px bold'          // 设置字体大小，20px
                ctx.textAlign = 'center'        // 设置对齐方式，居中
                ctx.fillStyle = '#000'          // 设置字体填充颜色，白色
                ctx.fillText('扫描下方二维码体验拍拍题吧', 202, 52)

                ctx.stroke()

                wx.canvasToTempFilePath({
                    canvas: canvas,
                    success: function (res) {
                        self.setData({
                            shareUrl: res.tempFilePath,
                        })
                        wx.hideLoading({
                            success: (res) => { },
                        })
                    },
                    fail: function (err) {
                        console.log(err)
                        wx.hideLoading({
                            success: (res) => { },
                        })
                    }
                })
            })
    },
    /**
     * 保存到相册
    */
    save: function () {
        common.saveToAlbum('shareImg')
    },
})