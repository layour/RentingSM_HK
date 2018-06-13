/**
 * 公共工具类
 * 1、图片加水印：watermark({"name":"张三","srcImage":<源图路径>,"targetImage":<目标图路径>}, successFn)
 * 2、获取当前位置：getLocation(successFn)=>北京市海淀区北清路68号
 * 3、日期时间格式化：datePattern("yyyy-MM-dd EE hh:mm:ss", date) =>2009-03-10 周二 08:09:04
 * 4、兼容获取权限：getPermission(["android.permission.ACCESS_FINE_LOCATION","android.permission.ACCESS_COARSE_LOCATION"], successFn)
 */
// 华科测试地址
window.G_COMMON_URL = "http://106.15.55.173:8080/honor/";

// 华科正式地址
// window.G_COMMON_URL = "http://47.104.88.176:8080/honor/";

function getToken() {
	var userinfo = summer.getStorage("userinfo");
	var token = userinfo ? userinfo.token : "";
	return token;
}

var CommonUtil = {
	//图片加水印
	watermark: function (params) {
		//调用定位
		var self = this;
		this.getLocation(function (args) {
			var textgroup;
			if($summer.os == "ios"){
				textgroup = [{
					text : params.name,
					style : {
						"left" : "2",
						"top" : "0",
						"right" : "0",
						"bottom" : "22",
						"font-size" : "8"
					}
				}, {
					text : (new Date()).format("yyyy-MM-dd hh:mm:ss"),
					style : {
						"left" : "2",
						"top" : "0",
						"right" : "0",
						"bottom" : "12",
						"font-size" : "8"
					}
				}, {
					text : args.address,
					style : {
						"left" : "2",
						"top" : "0",
						"right" : "0",
						"bottom" : "2",
						"font-size" : "8"
					}
				}];
			} else {
				textgroup = [{
					text : params.name,
					style : {
						"left" : "1",
						"top" : "0",
						"right" : "0",
						"bottom" : "5",
						"font-size" : "6"
					}
				}, {
					text : (new Date()).format("yyyy-MM-dd hh:mm:ss"),
					style : {
						"left" : "1",
						"top" : "0",
						"right" : "0",
						"bottom" : "3",
						"font-size" : "6"
					}
				}, {
					text : args.address,
					style : {
						"left" : "1",
						"top" : "0",
						"right" : "0",
						"bottom" : "1",
						"font-size" : "6"
					}
				}];
			}

			var data = {
				"src": params.srcImage, //源图片路径
				"target": params.targetImage, //目标图片路径
				"textGroup": textgroup,
				"callback": params.callback
			};
			summer.callService("UMGraphics.watermark", data, false);
		});
	},
	//获取当前位置
	getLocation: function (successFn) {
		summer.getNativeLocation({
			"single": "true"
		}, function (args) {
			successFn(args);
		}, function (args) {
			summer.toast({
				"msg": "获取位置信息错误：" + JSON.stringify(args)
			});
		});
	},
};

function ajaxRequest(paramObj, successCallback, errorCallback) {
	console.log('用户的token' + getToken());
	var testPath = '';
	var paramData = {};
	if (paramObj.fullUrl) {
		testPath = paramObj.url
	} else {
		testPath = G_COMMON_URL + paramObj.url;
	}

	if (paramObj.contentType) {
		header["Content-Type"] = paramObj.contentType;
	}
	//判断网络
	if (!summer.netAvailable()) {
		summer.hideProgress();
		summer.toast({
			msg: "网络异常，请检查网络"
		});
		return false;
	}
	//设置超时
	window.cordovaHTTP.settings = {
		timeout: 12000
	};
	if (getToken()) {
		var token = getToken();
		if ($summer.os == "ios") {
			if (paramObj.type == "post" || paramObj.type == "POST") {
				if(paramObj.search){
					testPath = testPath + "&TOKEN=" + token;//搜索的URL单独处理
				}else{
					testPath = testPath + "?TOKEN=" + token;
				}

			} else {
				paramObj.param.TOKEN = token;
			}
		} else {
			if(paramObj.search){//搜索的URL单独处理
				testPath = testPath + "&TOKEN=" + token;
			}else{
				testPath = testPath + "?TOKEN=" + token;
			}

		}
	}
	summer.ajax({
		type: paramObj.type,
		url: testPath,
		param: paramObj.param,
		// 考虑接口安全，每个请求都需要将这个公告header带过去
		header: {
			"Content-Type": "application/json"
		}
	}, function (response) {
		if (Object.prototype.toString.call(response.data) === '[object String]') {
			response.data = JSON.parse(response.data);
		}
		if (response.data.code == "R10002") {
            summer.hideProgress();
            summer.setStorage("userinfo", {});
            summer.toast({
                msg: "登录过期，请重新登录"
            });
			summer.openWin({
				id: 'login',
				url: 'login.html',
				isKeep: true,
				create: false,
				type: 'actionBar',
				actionBar: {
					title: "登录",
					titleColor: "#ffffff", //注意必须是6位数的颜色值。（3位数颜色值会不正常）
					backgroundColor: "#039be5",
					leftItem: {
						image: "img/opacity0.png",
						method: "none()", //返回按钮自定义事件
						text: "",
						textColor: "#ffffff" //返回文字颜色，注意必须是6位数的颜色值。（3位数颜色值会不正常）
					}
				}
			});
			return;
		}
		if (Object.prototype.toString.call(response.data) === '[object String]') {
			response.data = JSON.parse(response.data);
        }
		/* if (response.data.flag  && response.data.flag != '1') {
			summer.hideProgress();
			successCallback(response);
			summer.toast({
				msg: response.data.msg
			});
			return;
		} */
		successCallback(response);
	}, function (response) {
		summer.hideProgress();
		console.log(response);
		summer.toast({
			msg: "服务器开小差了，请重试" 			
		});
		return;
		//此处还需要和后端沟通，统一失败状态码，统一处理
		// 执行自己的其它逻辑
		errorCallback(response)
	});
}
//判断是否为空
function isEmpty(data) {
	if (data == undefined || data == null || data == "" || data == 'NULL' || data == false || data == 'false') {
		return true;
	}
	return false;
}
//当数据列表数据为空时显示空图片
function createNull(id, url, text) {
	var url = url ? url : "../../img/empty.png";
	var text = text ? text : "暂无数据";
	var html = '<div class="default-error" style="display: -webkit-box;display: flex; -webkit-box-pack: center;justify-content: center; -webkit-box-align: center;align-items: center; -webkit-box-orient: vertical; -webkit-box-direction: normal;flex-direction: column;width: 100%;height: 100%;position: fixed;">' + '<img src=' + url + ' style="width:30%;" alt=""/>' + '<p style="font-size: 14px;color: #CBCBCB;padding-top:20px;">' + text + '</p>' + '</div>';
	var curId = $summer.byId(id);
	$summer.html(curId, html);
}
