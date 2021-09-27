// 获取加密接口实例
const CryptoJS = require('../utils/crypto-js/crypto-js')

/**
 * @brief 讯飞拍照速算实现接口
 * @param {*} appid         讯飞APPID
 * @param {*} apikey        讯飞APIKEY
 * @param {*} apisecret     讯飞APISECRET
 * @param {*} imagePath     拍照速算图,格式为jpg/png/bmp
 * @returns 返回讯飞的json结果对象，详见官方文档https://www.xfyun.cn/doc/words/photo-calculate-recg/API.html
 */
async function itr(appid, apikey, apisecret, imagePath) {
    // 读取图片内容，获取body信息
    const base64Image = await new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
            filePath: imagePath,
            encoding: 'base64',
            success(res) {
                resolve(res.data)
            },
            fail(err) {
                console.error(err)
                reject(null)
            }
        })
    })
    if (!base64Image) return null

    wx.showLoading({
        title: '请求中...',
    })
    // 向讯飞服务器发起拍照速算请求
    return await new Promise((resolve, reject) => {
        // 构造请求头信息
        var body = {
            "common": {
                "app_id": appid
            },
            "business": {
                "ent": "math-arith",
                "aue": "raw"
            },
            "data": {
                "image": base64Image
            }
        }
        // 获取date
        let date = new Date().toUTCString()
        console.log(`Date:${date}`)
        // 获取digest
        let digest = 'SHA-256=' + CryptoJS.enc.Base64.stringify(CryptoJS.SHA256(JSON.stringify(body)))
        console.log(`Digest:${digest}`)
        // 获取authorization
        let signatureOrigin = `host: rest-api.xfyun.cn\ndate: ${date}\nPOST /v2/itr HTTP/1.1\ndigest: ${digest}`
        let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apisecret)
        let signature = CryptoJS.enc.Base64.stringify(signatureSha)
        let authorizationOrigin = `api_key="${apikey}", algorithm="hmac-sha256", headers="host date request-line digest", signature="${signature}"`
        console.log(`authorizationOrigin:${authorizationOrigin}`)
        wx.request({
            url: 'https://rest-api.xfyun.cn/v2/itr',
            method: 'POST',
            data: body,
            header: {
                "Date": date,
                "Digest": digest,
                "Authorization": authorizationOrigin,
                "Content-Type": "application/json",
                "Accept": "application/json,version=1.0"
            },
            success: res => {
                resolve(res.data)
            },
            fail: err => {
                console.error(err)
                reject(err)
            }
        })
    })
}

/**
 * @brief 绘制速算拍照结果
 * @param {*} res           拍照速算返回的json结果
 * @param {*} imagePath     拍照速算题
 * @param {*} canvasId      画布id
 * @returns                 Promise绘制成功的图片路径
 */
async function drawResultImage(res, imagePath, canvasId) {
    // 判断返回值是否合法
    if (!res?.data?.ITRResult?.multi_line_info?.imp_line_info) {
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
        return ;
    }
    // 解析拍照速算识别结果
    let info = res.data.ITRResult.multi_line_info.imp_line_info
    let content = res.data.ITRResult.recog_result[0].line_word_result
    for (let i = 0; i < content.length; i++) {
        if (info[i].total_score) {
            console.log('对:' + content[i].word_content.toString())
        } else {
            console.log('错:' + content[i].word_content.toString())
        }
    }

    // 绘制速算拍照结果
    const query = wx.createSelectorQuery()
    const canvasObj = await new Promise((resolve, reject) => {
        query.select(`#${canvasId}`).fields({ node: true, size: true }).exec(async (res) => {
            const canvas = res[0].node
            const ctx = canvas.getContext('2d')
            // 加载题目图片
            const mainImg = canvas.createImage();
            mainImg.src = imagePath;
            let mainImgContent = await new Promise((resolve, reject) => {
                mainImg.onload = () => {
                    resolve(mainImg)
                }
                mainImg.onerror = (e) => {
                    console.error(e)
                    reject(null)
                }
            });
            // 对号图片
            const rightImg = canvas.createImage()
            rightImg.src = '/images/right.png'
            let rightImgContent = await new Promise((resolve, reject) => {
                rightImg.onload = () => {
                    resolve(rightImg)
                }
                rightImg.onerror = (e) => {
                    console.error(e)
                    reject(null)
                }
            })
            // 错误图片
            const wrongImg = canvas.createImage()
            wrongImg.src = '/images/wrong.png'
            let wrongImgContent = await new Promise((resolve, reject) => {
                wrongImg.onload = () => {
                    resolve(wrongImg)
                }
                wrongImg.onerror = (e) => {
                    console.error(e)
                    reject(null)
                }
            })

            if (!mainImgContent || !rightImgContent || !wrongImgContent) {
                console.error("image load error, please check error info")
                return false;
            }

            // 开始绘制速算拍照结果
            canvas.width = mainImgContent.width
            canvas.height = mainImgContent.height
            ctx.drawImage(mainImgContent, 0, 0, mainImgContent.width, mainImgContent.height)
            for (let i = 0; i < info.length; i++) {
                if (0 == info[i].total_score) {
                    ctx.drawImage(wrongImgContent,
                        info[i].imp_line_rect.right_down_point_x,
                        info[i].imp_line_rect.left_up_point_y,
                        wrongImgContent.width,
                        wrongImgContent.height);
                } else {
                    ctx.drawImage(rightImgContent,
                        info[i].imp_line_rect.right_down_point_x,
                        info[i].imp_line_rect.left_up_point_y,
                        rightImgContent.width,
                        rightImgContent.height);
                }
                if (0 == info[i].total_score) {
                    ctx.strokeStyle = 'red'
                } else {
                    ctx.strokeStyle = 'green'
                }
                ctx.strokeRect(info[i].imp_line_rect.left_up_point_x,
                    info[i].imp_line_rect.left_up_point_y,
                    info[i].imp_line_rect.right_down_point_x - info[i].imp_line_rect.left_up_point_x,
                    info[i].imp_line_rect.right_down_point_y - info[i].imp_line_rect.left_up_point_y)
            }
            resolve(canvas)
        })
    })
    
    const canvasImage = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
            canvas: canvasObj,
            success: res => {
                console.log(res.tempFilePath)
                resolve(res.tempFilePath)
            },
            fail: err => {
                console.error(err)
                reject(err)
            }
        })
    })

    return canvasImage;
}

async function saveImage(canvasId) {
    const query = wx.createSelectorQuery()
    const canvasObj = await new Promise((resolve, reject) => {
        query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec(async (res) => {
                resolve(res[0].node)
            })
    })

    return await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
            canvas: canvasObj,
            success: res => {
                resolve(res.tempFilePath)
            },
            fail: err => {
                reject(err)
            }
        })
    })
}

/**
 * @brief 保存画布内容到相册
 * @param {*} canvasId 画布id
 */
async function saveToAlbum(canvasId) {
    let self = this
    const query = wx.createSelectorQuery()
    const canvasObj = await new Promise((resolve, reject) => {
        query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec(async (res) => {
                resolve(res[0].node)
            })
    })
    wx.canvasToTempFilePath({
        canvas: canvasObj,
        success: function (res) {
            //保存图片
            wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: function (data) {
                    wx.showToast({
                        title: '已保存到相册',
                        icon: 'success',
                        duration: 2000
                    })
                },
                fail: function (err) {
                    console.log(err)
                    if (err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
                        console.log("当初用户拒绝，再次发起授权")
                    } else {
                        wx.showToast({
                            title: '请截屏保存分享',
                            icon: 'fail',
                            duration: 2000
                        })
                    }
                },
                complete: function (res) {
                    console.log(res)
                }
            })
        },
        fail: function (res) {
            console.log(res)
        }
    }, this)
}

module.exports = {
    itr: itr,
    drawResultImage: drawResultImage,
    saveImage: saveImage,
    saveToAlbum: saveToAlbum,
}