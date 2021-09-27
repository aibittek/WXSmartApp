// index.js

// 获取应用实例
const app = getApp()

// 获取通用接口
const common = require("../../js/common.js")

Page({
    data: {
        appid: "5fc4a723",
        apisecret: "16993e14800de73c4f63926803c9f6a4",
        apikey: "b6adfb36402ceb31f86c7e3f2e0e6e24",
    },

    onLoad() {

    },

    //图库选择
    photo() {
        let self = this
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album'],
            success: res => {
                let imagePath = res.tempFilePaths[0]

                // 拍照速算得到结果
                common.itr(self.data.appid, self.data.apikey, self.data.apisecret, imagePath).then(res => {
                    common.drawResultImage(res, imagePath, 'customCanvas').then(res => {
                        console.log(res)
                        wx.navigateTo({
                            url: `/pages/result/result?image=${res}`,
                        })
                    })
                })
            }
        })
    },
    //相机拍照
    camera() {
        let self = this
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['camera'],
            success: res => {
                let imagePath = res.tempFilePaths[0]

                // 拍照速算得到结果
                common.itr(self.data.appid, self.data.apikey, self.data.apisecret, imagePath).then(res => {
                    common.drawResultImage(res, imagePath, 'customCanvas').then(res => {
                        console.log(res)
                        wx.navigateTo({
                            url: `/pages/result/result?image=${res}`,
                        })
                    })
                })
            }
        })
    },
    onShareAppMessage() {//统一分享内容
        return {
            title: '拍拍题',
            path: '/pages/index/index',
            imageUrl: '/images/welcome.png'
        }
    }
})
