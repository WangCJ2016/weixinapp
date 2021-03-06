angular.module('starter', ['ionic', 'starter.controllers', 'starter.filters', 'starter.services', 'starter.directives', 'ngCordova', 'ngAnimate', 'ionic-native-transitions', 'templates'])
  .constant('AJKUrl', 'http://www.live-ctrl.com/aijukex/')
  .constant('AJKIp', 'http://192.168.0.109:8100/#')
  .constant('DuplicateLogin', '你的账号在另一台手机登录,请重新登录')
  .constant('systemBusy', '系统正忙,请稍后操作')
  .run(['$ionicPlatform', '$ionicPopup', 'ApiService', '$ionicHistory', '$location', '$cordovaGeolocation', '$rootScope', '$cordovaAppVersion', function($ionicPlatform, $ionicPopup, ApiService, $ionicHistory, $location, $cordovaGeolocation, $rootScope, $cordovaAppVersion) {
    $ionicPlatform.ready(function() {
      //cordova定位
      //var convertFrom =  new AMap.convertFrom(lnglat:[120.065375,30.292008],type:"GPS",function(status,result));
      var posOptions = { timeout: 10000, enableHighAccuracy: false };
      $cordovaGeolocation
        .getCurrentPosition(posOptions)
        .then(function(position) {
          var lat = position.coords.latitude
          var long = position.coords.longitude
          ApiService.lngLat({
            locations: long + ',' + lat,
            coordsys: 'gps',
            output: 'JSON',
            key: '1cbf5e5ac9b4588d974214856a289ec6'
          }).success(function(res) {
            var lnglat = res.locations.split(',');
            new AMap.convertFrom(new AMap.LngLat(lnglat[0], lnglat[1]), 'gps', function(status, result) {
              console.log(result.locations[0].lng, result.locations[0].lat)
              sessionStorage.setItem('longitude', result.locations[0].lng);
              sessionStorage.setItem('latitude', result.locations[0].lat);
              var Geocoder = new AMap.Geocoder();
              Geocoder.getAddress(new AMap.LngLat(result.locations[0].lng, result.locations[0].lat), function(status, result) {
                if (result.info === 'ok' || result.info === 'OK') {
                  //localStorage.setItem("city", result.regeocode.addressComponent.city);
                  var city = result.regeocode.addressComponent.district;
                  if (localStorage.getItem("city") !== city) {
                    var myPopup = $ionicPopup.show({
                      template: '是否切换城市到' + city,
                      cssClass: 'ajk',
                      buttons: [{
                        text: '取消'
                      }, {
                        text: '<b>确定</b>',
                        onTap: function(e) {
                          localStorage.setItem("city", city);
                          sessionStorage.setItem("city", city);
                          sessionStorage.setItem("nowcity", city);
                          $rootScope.$broadcast('cityChange');

                        }
                      }]
                    });
                  }
                }
              })
            })
          })
        }, function(err) {
          // errorv
          var map, geolocation;
          //加载地图，调用浏览器定位服务
          map = new AMap.Map('container', {
            resizeEnable: true
          });


          map.plugin('AMap.Geolocation', function() {
            geolocation = new AMap.Geolocation({
              enableHighAccuracy: true,
              timeout: 10000,
              //buttonOffset: new AMap.Pixel(10, 20),
              zoomToAccuracy: true,
            });
            map.addControl(geolocation);
            geolocation.getCurrentPosition();
            AMap.event.addListener(geolocation, 'complete', onComplete); //返回定位信息
            AMap.event.addListener(geolocation, 'error', onError); //返回定位出错信息
            //获取当前城市信息  例如：杭州市

          });
        });

      // android 禁止字体放大缩小
      if (!ionic.Platform.isIOS()) {
        MobileAccessibility.setTextZoom(100);
      }

      
     

      function onComplete(data) {
        if (data.info === "SUCCESS") {
          // sessionStorage.setItem('_city', JSON.stringify(result))
          var cityinfo
          if (data.addressComponent.district !== '') {
            cityinfo = data.addressComponent.district
          } else {
            cityinfo = data.addressComponent.city
          }


          if (localStorage.getItem("city") !== cityinfo) {
            var myPopup = $ionicPopup.show({
              template: '是否切换城市到' + cityinfo,
              cssClass: 'ajk',
              buttons: [{
                text: '取消'
              }, {
                text: '<b>确定</b>',
                onTap: function(e) {
                  localStorage.setItem("city", cityinfo);
                  sessionStorage.setItem("city", cityinfo);
                  $rootScope.$broadcast('cityChange');
                }
              }]
            });
          }
          sessionStorage.setItem("nowcity", cityinfo);
        }
        sessionStorage.setItem("longitude", data.position.getLng());
        sessionStorage.setItem("latitude", data.position.getLat());
      }
      //解析定位错误信息
      function onError(data) {

      }



      //退出应用
      $ionicPlatform.registerBackButtonAction(function(e) {
        e.preventDefault();

        function showConfirm() {
          var confirmPopup = $ionicPopup.show({
            template: '你确定要退出应用吗?',
            buttons: [{
              text: '确定',
              onTap: function() {
                return 1;
              }
            }, {
              text: '取消'
            }],
            cssClass: 'ajk',
          });

          confirmPopup.then(function(res) {
            if (res) {
              ionic.Platform.exitApp();
            } else {
              // Don't close
            }
          });
        }

        // Is there a page to go back to?
        if ($location.path() == '/tab/home') {
          showConfirm();
        } else if ($ionicHistory.backView()) {
          $ionicHistory.goBack();
        } else {
          // This is the last page: Show confirmation popup
          showConfirm();
        }

        return false;
      }, 101);

      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);


      }
      if (window.StatusBar) {
        StatusBar.styleDefault();
      }
      //检查更新
      //checkUpdate();
      function checkUpdate() {
        var serverAppVersion = "1.0.0"; //从服务端获取最新版本
        //获取版本
        $cordovaAppVersion.getAppVersion().then(function(version) {
          //如果本地与服务端的APP版本不符合
          if (version != serverAppVersion) {
            showUpdateConfirm();
          }
        });
      }

      function onHardwareMenuKeyDown() {
        $ionicActionSheet.show({
          titleText: '检查更新',
          buttons: [
            { text: '关于' }
          ],
          destructiveText: '检查更新',
          cancelText: '取消',
          cancel: function() {
            // add cancel code..
          },
          destructiveButtonClicked: function() {
            //检查更新
            checkUpdate();
          },
          buttonClicked: function(index) {

          }
        });
        $timeout(function() {
          hideSheet();
        }, 2000);
      };
      // 显示是否更新对话框
      function showUpdateConfirm() {
        var confirmPopup = $ionicPopup.confirm({
          title: '版本升级',
          template: '1.xxxx;</br>2.xxxxxx;</br>3.xxxxxx;</br>4.xxxxxx', //从服务端获取更新的内容
          cancelText: '取消',
          okText: '升级'
        });
        confirmPopup.then(function(res) {
          if (res) {
            $ionicLoading.show({
              template: "已经下载：0%"
            });
            var url = "http://192.168.1.50/1.apk"; //可以从服务端获取更新APP的路径
            var targetPath = "file:///storage/sdcard0/Download/1.apk"; //APP下载存放的路径，可以使用cordova file插件进行相关配置
            var trustHosts = true
            var options = {};
            $cordovaFileTransfer.download(url, targetPath, options, trustHosts).then(function(result) {
              // 打开下载下来的APP
              $cordovaFileOpener2.open(targetPath, 'application/vnd.android.package-archive').then(function() {
                // 成功
              }, function(err) {
                // 错误
              });
              $ionicLoading.hide();
            }, function(err) {
              alert('下载失败');
            }, function(progress) {
              //进度，这里使用文字显示下载百分比
              $timeout(function() {
                var downloadProgress = (progress.loaded / progress.total) * 100;
                $ionicLoading.show({
                  template: "已经下载：" + Math.floor(downloadProgress) + "%"
                });
                if (downloadProgress > 99) {
                  $ionicLoading.hide();
                }
              })
            });
          } else {
            // 取消更新
          }
        });
      }
    });

  }])
  .config(['$ionicConfigProvider', '$ionicNativeTransitionsProvider', '$cordovaInAppBrowserProvider', function($ionicConfigProvider, $ionicNativeTransitionsProvider, $cordovaInAppBrowserProvider) {
    // 防止滑动白屏
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.backButton.text('');
    $ionicConfigProvider.backButton.previousTitleText(false);
    var defaultOptions = {
      location: 'no',
      clearcache: 'no',
      toolbar: 'no'
    };
    $cordovaInAppBrowserProvider.setDefaultOptions(defaultOptions);
    //$ionicConfigProvider.scrolling.jsScrolling(false);

    $ionicConfigProvider.tabs.style('standard').position('bottom');
    $ionicConfigProvider.views.transition('no');
    $ionicConfigProvider.navBar.alignTitle('center');
    $ionicNativeTransitionsProvider.setDefaultOptions({
      duration: 200, // in milliseconds (ms), default 400,
      slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
      iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
      androiddelay: -1, // same as above but for Android, default -1
      winphonedelay: -1, // same as above but for Windows Phone, default -1,
      fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
      fixedPixelsBottom: 0, // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
      triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
      backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });
    $ionicNativeTransitionsProvider.setDefaultTransition({
      type: 'slide',
      direction: 'left'
    });
  }])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

      // setup an abstract state for the tabs directive
      .state('tab', {
        url: '/tab',
        abstract: true,
        templateUrl: 'templates/tabs/tabs.html'
      })

      // Each tab has its own nav history stack:

      .state('tab.home', {
        url: '/home',
        nativeTransitions: null,
        cache: false,
        views: {
          'tab-home': {
            templateUrl: 'templates/home/home.html',
            controller: 'homeCtrl',
            resolve: {
              mainADs: ['ApiService', function(ApiService) {
                return ApiService.getHomePageBanner({
                  level: 0
                }).success(function(res) {
                  return res.result;
                });

              }]
            }
          }
        }
      })
      .state('tab.ctrl', {
        url: '/ctrl',
        //nativeTransitions: {type:'fade'},
        cache: false,
        views: {
          'tab-ctrl': {
            templateUrl: 'templates/ctrl/ctrl.html',
            controller: 'ctrl'
          }
        },
        onEnter: ['$rootScope', function($rootScope) {
          $rootScope.$broadcast('ctrlStateEnter');
        }],
        onExit: ['$rootScope', function($rootScope) {
          $rootScope.$broadcast('ctrlStateOut');
        }]
      })
      .state('tab.discover', {
        url: '/discover',
        nativeTransitions: null,
        cache: false,
        views: {
          'tab-discover': {
            templateUrl: 'templates/discover/discover.html',
            controller: 'discoverCtrl'
          }
        }
      })
      .state('tab.shopCar', {
        url: '/shopCar',
        nativeTransitions: null,
        views: {
          'tab-shopCar': {
            templateUrl: 'templates/shopCar/shopCar.html',
            controller: 'shopCarCtrl'
          }
        },
        cache: false
      })
      .state('tab.userCenter', {
        url: '/userCenter',
        nativeTransitions: null,
        cache: false,
        views: {
          'tab-userCenter': {
            templateUrl: 'templates/userCenter/userCenter.html',
            controller: 'userCenter'
          }
        }
      })
      .state('qrCode', {
        url: '/qrCode',
        params: {
          person: {}
        },
        templateUrl: 'templates/userCenter/qrCode/qrCode.html',
        controller: 'qrCodeCtrl'
      })
      .state('futrue', {
        url: '/futrue',
        cache: false,
        templateUrl: 'templates/home/futrue/futrue.html',
        controller: 'futrueCtrl'
      })
      .state('ctrlDetail', {
        url: '/ctrlDetail',
        templateUrl: 'templates/ctrl/ctrlDetail/ctrlDetail.html'
      })
      .state('inHouse', {
        url: '/inHouse',
        params: {
          data: {}
        },
        cache: false,
        templateUrl: 'templates/ctrl/inHouse/inHouse.html',
        controller: 'inHouseCtrl'
      })
      .state('checkIn', {
        url: '/checkIn',
        params: {
          data: {}
        },
        cache: false,
        templateUrl: 'templates/ctrl/CheckIn/checkIn.html',
        controller: 'checkInCtrl'
      })
      .state('light', {
        url: '/light',
        cache: false,
        templateUrl: 'templates/ctrl/light/light.html',
        controller: "lightCtrl"
      })
      .state('curtain', {
        url: '/curtain',
        cache: false,
        templateUrl: 'templates/ctrl/curtain/curtain.html',
        controller: 'curtainCtrl'
      })
      .state('readLight', {
        url: '/readLight',
        templateUrl: 'templates/ctrl/readLight/readLight.html',
        controller: 'readLightCtrl'
      })
      .state('model', {
        url: '/model',
        cache: false,
        templateUrl: 'templates/ctrl/model/model.html',
        controller: 'modelCtrl'
      })
      .state('tv', {
        url: '/tv',
        cache: false,
        templateUrl: 'templates/ctrl/tv/tv.html',
        controller: 'tvCtrl'
      })
      .state('airCondition', {
        url: '/airCondition',
        cache: false,
        templateUrl: 'templates/ctrl/airCondition/airCondition.html',
        controller: "airCtrl"
      })
      .state('lock', {
        url: '/lock/:name',
        cache: false,
        templateUrl: 'templates/ctrl/lock/lock.html',
        controller: "lockCtrl"
      })
      .state('colorPicker', {
        url: '/colorPicker',
        templateUrl: 'templates/ctrl/colorPicker/colorPicker.html',
        controller: 'colorPickerCtrl'
      })
      .state('sweepTime', {
        url: '/sweepTime/:id',
        templateUrl: 'templates/ctrl/sweepTime/sweepTime.html',
        controller: 'sweepTimeCtrl'
      })
      .state('maintain', {
        url: '/maintain/:id',
        templateUrl: 'templates/ctrl/repair/repair.html',
        controller: 'maintainCtrl'
      })
      .state('service', {
        url: '/service',
        cache: false,
        templateUrl: 'templates/ctrl/service/service.html',
        controller: 'serviceCtrl'
      })
      .state('houseDtail', {
        url: '/houseDtail/:id',
        cache: false,
        templateUrl: 'templates/home/house_detail/house_detail.html',
        controller: 'houseDetailCtrl'
      })
      .state('hotelService', {
        url: '/hotelService',
        cache: false,
        params: {
          hotelDetail: null
        },
        templateUrl: 'templates/home/hotelService/hotelService.html',
        controller: 'hotelService'
      })
      .state('picShow', {
        url: '/picShow',
        params: {
          data: {}
        },
        nativeTransitions: {
          "type": "fade",
          "duration": 500, // in milliseconds (ms), default 400
        },
        templateUrl: 'templates/home/picShow/picShow.html',
        controller: 'picShowCtrl'
      })
      .state('nearby', {
        url: '/nearby/:city',
        cache: false,
        templateUrl: 'templates/home/nearby/nearby.html',
        controller: 'nearbyCtrl'
      })
      .state('myCollect', {
        url: '/myCollect',
        cache: false,
        templateUrl: 'templates/home/my_collect/my_collect.html',
        controller: 'collectCtrl'
      })
      .state('comment', {
        url: '/comment/:id/:stars',
        templateUrl: 'templates/home/comment/comment.html',
        controller: 'commentCtrl'
      })
      .state('map', {
        url: '/map',
        params: { destination: null },
        cache: false,
        templateUrl: 'templates/home/map/map.html',
        controller: 'mapCtrl'
      })
      .state('getCity', {
        url: '/getCity',
        cache: false,
        nativeTransitions: {
          "type": "slide",
          "direction": "up"
        },
        templateUrl: 'templates/home/get_city/get_city.html',
        controller: 'getCityCtrl'
      })
      .state('selectBussiniss', {
        url: '/selectBussiniss',
        cache: false,
        nativeTransitions: {
          "type": "slide",
          "direction": "up"
        },
        templateUrl: 'templates/home/select_bussiniss/select_bussinss.html',
        controller: 'select_bussinissCtrl',
      })

      .state('selectDate', {
        url: '/selectDate',
        cache: false,
        params: { data: null },
        templateUrl: 'templates/home/select_date/select_date.html',
        controller: 'selectDateCtrl',
        resolve: {
          roomPrice: ['ApiService', '$stateParams', '$ionicLoading', '$timeout', function(ApiService, $stateParams, $ionicLoading, $timeout) {
            $ionicLoading.show({
              template: '<ion-spinner icon="ios"></ion-spinner>'
            });
            var year = new Date().getFullYear();
            var month = new Date().getMonth() + 1;
            var m1 = month > 9 ? month : '0' + month;
            var m2 = month + 1 > 9 ? month + 1 : '0' + (month + 1);
            var m3 = month + 2 > 9 ? month + 2 : '0' + (month + 2);
            return ApiService.queryRoomCalendar({
              houseId: $stateParams.data.id,
              month: year + '-' + m1 + ',' + year + '-' + m2 + ',' + year + '-' + m3
            }).success(function(res) {
              $ionicLoading.hide();
              if (res.success) {
                $timeout(function() {
                  $ionicLoading.hide();
                }, 1000);
              } else {
                if (res.msg == '非法请求') {
                  $ionicLoading.hide();
                  $state.go('login')
                }
              }
              return res.dataObject;
            });
          }]
        }
      })
      .state('beLandlord', {
        url: '/beLandlord',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/be_landlord.html',
        controller: 'beLandlord'
      })
      .state('joinUs', {
        url: '/joinUs',
        templateUrl: 'templates/userCenter/beLandlord/joinUs/join_us.html',
        controller: 'joinUsCtrl'
      })
      .state('accountDetail', {
        url: '/accountDetail',
        params: { data: null },
        templateUrl: 'templates/userCenter/beLandlord/account_detail/account_detail.html',
        controller: 'accountDetailCtrl'
      })
      .state('landlordProfit', {
        url: '/landlordProfit',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/landlord_profit/landlord_profit.html',
        controller: 'landlordProfitCtrl'
      })
      .state('waitCheck', {
        url: '/waitCheck',
        templateUrl: 'templates/userCenter/beLandlord/waitCheck/wait_check.html'
      })
      .state('myHouse', {
        url: '/myHouse',

        templateUrl: 'templates/userCenter/beLandlord/my_house/my_house.html',
        controller: 'myHouseCtrl',
        cache: false
      })
      .state('seeHouse', {
        url: '/seeHouse/:id',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/see_myhouse/see_myhouse.html',
        controller: 'seeHouseCtrl',
        resolve: {
          hotel: ['ApiService', '$stateParams', '$ionicLoading', '$state', function(ApiService, $stateParams, $ionicLoading, $state) {
            $ionicLoading.show({
              template: '<ion-spinner icon="ios"></ion-spinner>'
            });
            return ApiService.viewLandlordHotel({
              hotelId: $stateParams.id
            }).success(function(res) {
              if (res.success) {
                $ionicLoading.hide();
                return res.dataObject;
              } else {
                $ionicLoading.hide();
                //$state.go('login')
              }
            });

          }]
        }
      })
      .state('myhouseDetail', {
        url: '/myhouseDetail/:id',
        params: { houseName: '' },
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/myhouse_detail/myhouse_detail.html',
        controller: 'myHouseDetailCtrl'
      })
      .state('hotelPics', {
        url: '/hotelPics',
        params: {
          pics: [],
          id: 0
        },
        templateUrl: 'templates/home/hotel_pics/hotel_pics.html',
        controller: 'hotelPicsCtrl'
      })
      .state('myhouseIntr', {
        url: '/myhouseIntr/:id',

        templateUrl: 'templates/userCenter/beLandlord/myhouse_intr/myhouse_intr.html',
        controller: 'myhouseIntrCtrl',
        resolve: {
          house: ['ApiService', '$stateParams', function(ApiService, $stateParams) {
            var data = {
              houseId: $stateParams.id
            };
            return ApiService.viewLandlordHotelHouse(data).success(function(res) {
              return res.dataObject;
            });
          }]
        }
      })
      .state('myOrderForm', {
        url: '/myOrderForm/:id',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/my_orderform/my_orderform.html',
        controller: 'myOrderFormCtrl'
      })
      .state('orderFormDetail', {
        url: '/orderFormDetail',
        templateUrl: 'templates/userCenter/beLandlord/orderform_detail/orderform_detail.html',
        controller: 'orderFormDetail'
      })
      .state('tradeRule', {
        url: '/tradeRule',
        templateUrl: 'templates/userCenter/beLandlord/trade_rule/trade_rule.html',
        controller: 'tradeRuleCtrl'

      })
      .state('myhouseChangePrice', {
        url: '/myhouseChangePrice/:id/:name/:price',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/myhouse_changeprice/myhouse_changeprice.html',
        controller: 'myhouseChangepriceCtrl',
        resolve: {
          roomPrice: ['ApiService', '$stateParams', '$ionicLoading', '$timeout', function(ApiService, $stateParams, $ionicLoading, $timeout) {
            $ionicLoading.show({
              template: '<ion-spinner icon="ios"></ion-spinner>'
            });
            var year = new Date().getFullYear();
            var month = new Date().getMonth() + 1;
            var m1 = month > 9 ? month : '0' + month;
            var m2 = month + 1 > 9 ? month + 1 : '0' + (month + 1);
            var m3 = month + 2 > 9 ? month + 2 : '0' + (month + 2);
            return ApiService.queryRoomCalendar({
              houseId: $stateParams.id,
              month: year + '-' + m1 + ',' + year + '-' + m2 + ',' + year + '-' + m3
            }).success(function(res) {
              if (res.success) {
                $timeout(function() {
                  $ionicLoading.hide();
                }, 1000);
              } else {
                if (res.msg == '非法请求') {
                  $ionicLoading.hide();
                  $state.go('login')
                }
              }
              return res.dataObject;


            });
          }]
        }

      })
      .state('myaccount', {
        url: '/myaccount',
        cache: false,
        templateUrl: 'templates/userCenter/beLandlord/myaccount/myaccount.html',
        controller: 'myaccountCtrl'

      })
      .state('login', {
        url: '/login',
        cache: false,
        templateUrl: 'templates/userCenter/login/login.html',
        controller: 'loginCtrl'
      })
      .state('register', {
        url: '/register',
        templateUrl: 'templates/userCenter/register/register.html',
        controller: 'registerCtrl'
      })
      .state('hotelDetail', {
        url: '/hotelDetail',
        cache: false,
        params: {
          hotelDetail: null
        },
        templateUrl: 'templates/home/hotel_detail/hotel_detail.html',
        controller: 'hotelDetailCtrl'
      })
      .state('house_intr', {
        url: '/house_intr/:id',
        templateUrl: 'templates/home/house_intr/house_intr.html',
        controller: 'houseIntrCtrl',
        resolve: {
          houseIntr: ['ApiService', '$stateParams', function(ApiService, $stateParams) {
            return ApiService.getHotelHousesDetail({
              houseId: $stateParams.id
            }).success(function(res) {
              return res.dataObject;

            });

          }]
        }
      })
      .state('RetrievePwd', {
        url: '/RetrievePwd',
        cache: false,
        templateUrl: 'templates/userCenter/RetrievePwd/RetrievePwd.html',
        controller: 'RetrievePwdCtrl'
      })
      .state('ChangePwd', {
        url: '/ChangePwd',
        cache: false,
        templateUrl: 'templates/userCenter/ChangePwd/ChangePassword.html',
        controller: "ChangePwdCtrl"
      })
      .state('setPwd', {
        url: '/setPwd',
        templateUrl: 'templates/userCenter/setPwd/setPwd.html',
        controller: 'setPwdCtrl'
      })
      .state('bindingPhone', {
        url: '/bindingPhone',
        templateUrl: 'templates/userCenter/bindingPhone/bindingPhone.html',
        controller: 'bindingPhoneCtrl'
      })
      .state('setting', {
        url: '/setting',
        templateUrl: 'templates/userCenter/setting/setting.html',
        controller: 'settingCtrl'
      })
      .state('Nopay', {
        url: '/Nopay',
        cache: false,
        templateUrl: 'templates/userCenter/Nopay/Nopay.html',
        controller: 'NopayCtrl'
      })
      .state('Pay', {
        url: '/Pay',
        cache: false,
        templateUrl: 'templates/userCenter/Pay/Pay.html',
        controller: 'PayCtrl'
      })
      .state('Noevaluate', {
        url: '/Noevaluate',
        cache: false,
        templateUrl: 'templates/userCenter/Noevaluate/Noevaluate.html',
        controller: 'NoevaluateCtrl'
      })
      .state('lose-efficacy', {
        url: '/lose-efficacy',
        cache: false,
        templateUrl: 'templates/userCenter/lose-efficacy/lose-efficacy.html',
        controller: 'loseEfficacyCtrl'
      })
      .state('endOrderDetail', {
        url: '/endOrderDetail',
        cache: false,
        params: { data: null },
        templateUrl: 'templates/userCenter/endOrderDetail/endOrderDetail.html',
        controller: 'endOrderDetailCtrl'
      })
      .state('Consume', {
        url: '/Consume',
        templateUrl: 'templates/userCenter/Consume/Consume.html',
        controller: 'ConsumeCtrl'
      })
      .state('status', {
        url: '/status/:id',
        templateUrl: 'templates/userCenter/status/status.html',
        controller: "statusCtrl"
      })
      .state('Order-form', {
        url: '/Order-form/:id',
        cache: false,
        templateUrl: 'templates/userCenter/Order-form/Order-form.html',
        controller: 'OrderformCtrl'
      })
      .state('evaluate', {
        url: '/evaluate',
        params: { data: null },
        templateUrl: 'templates/userCenter/evaluate/evaluate.html',
        controller: 'evaluateCtrl'
      })
      .state('clean', {
        url: '/clean',
        params: {
          data: null
        },
        cache: false,
        templateUrl: 'templates/ctrl/clean/clean.html',
        controller: 'cleanCtrl'
      })
      .state('repair', {
        url: '/repair',
        templateUrl: 'templates/userCenter/repair/repair.html'
      })
      .state('binding', {
        url: '/binding',
        templateUrl: 'templates/userCenter/binding/binding.html',
        controller: 'bindingCtrl'
      })
      .state('orderDetail', {
        url: '/orderDetail',
        params: {
          'order': {}
        },
        cache: false,
        templateUrl: 'templates/shopCar/orderDetail/orderDetail.html',
        controller: 'orderDetailCtrl'
      })
      .state('invoice', {
        url: '/invoice',
        params: {
          order: null
        },
        templateUrl: 'templates/shopCar/invoice/invoice.html',
        controller: 'invoceCtrl'
      });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/home');


    // if none of the above states are matched, use this as the fallback
  }]);

angular.module('starter.controllers', ['endOrderDetail-controller','accountDetail-controller','orderFormDetail-controller',"futrue-controller","readLight-controller","service-controller","colorPicker-controller",'evaluate_controller','lock-controller','light-controller','model-controller','maintain-controller','sweepTime-controller','hotelService-controllers','curtain-controller','tv-controller','airCondition-controller','selectDate.controllers','tradeRule-controller','invoice-controller','hotelDetail-controllers','beLandlord-controller','qrCode-controller','picShow-controller','checkIn-controller','clean-controller','inHouse-controller','ctrl-controller', 'status-controller', 'Orderform-controller', 'myHouseIntr-controller', 'myHouseDetail-controller', 'seeHouse-controller', 'myHouse-controller', 'discover-controller', 'joinUs-controller', 'orderDetail-controller', 'landlordProfit-controller', 'Consume-controller', 'loseEfficacy-controller', 'Noevaluate-controller', 'Pay-controller', 'Nopay-controller', 'setting-controller', 'setPwd-controller', 'userCenter-controller', 'select_bussiniss-controller', 'collectCtrl-controller', 'houseIntrCtrl-controller', 'commentCtrl-controller', 'hotelPicsCtrl-controller', 'houseDetail-controller', 'home-controller', 'getCity-controller', 'myOrderForm-controller', 'myaccount-controller', 'myhouseChangePrice-controller', 'map-controller', 'nearby-controller', 'RetrievePwd-controller', 'binding-controller', 'bindingPhone-controller', 'ChangePwd-controller', 'shopCar-controller', 'register-controller', 'login-controller']);

angular.module('starter.services', [])

  .factory('ApiService', ['$http', 'AJKUrl', function($http, AJKUrl) {
    return {
      //验证码
      getREG: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_generateCheckCode',
          params: data
          // data: data
        });
      },
      //首页广告
      getHomePageBanner: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryHomePageBannerPage',
          params: data
          // data: data
        });
      },
      //首页酒店
      getHomePageHotels: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryHomePageHotelsPage',
          params: data
          // data: data
        });
      },
      //酒店详情
      getHotelDetail: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_viewHotelDetail',
          params: data
          // data: data
        });
      },
      //酒店评价列表
      getHotelFeedback: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryHotelFeedbackPage',
          params: data
          // data: data
        });
      },
      //酒店房间列表
      getHotelHouses: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryHotelHousesPage',
          params: data
          // data: data
        });
      },
      //酒店房间详情
      getHotelHousesDetail: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_viewHotelHousesDetail',
          params: data
          // data: data
        });
      },
      //收藏列表
      getCustomerCollect: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryCustomerCollectPage',
          params: data
          // data: data
        });
      },
      //添加收藏
      addCustomerCollect: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_addCustomerCollect',
          params: data
          // data: data
        });
      },
      //取消收藏
      cancelCustomerCollect: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_cancelCustomerCollect',
          params: data
          // data: data
        });
      },
      //验证码校验
      register: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_validateCheckCode',
          params: data
        });
      },
      //添加购物车
      addshopCar: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_addCustomerCart',
          params: data
        });
      },
      //购物车列表
      shopCarList: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryCustomerCartPage',
          params: data
        });
      },
      //购物车删除
      shopCardel: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_deleteCustomerCart',
          params: data
        });
      },
      //登录
      login: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_login',
          params: data
        });
      },
      //找回登录密码
      RetrievePwd: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_generateCheckCode',
          params: data
        });

      },
      //验证码校验
      verify: function(data) {
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_retrievePassword',
          params: data
        });

      },
      //身份绑定
      custom: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerIdentityBinding',
          params: data
        });

      },
      //绑定手机验证码
      bindingPhone: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_bindingTelephoneCode',
          params: data
        });

      },
      //绑定手机
      telephoneBinding: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerTelephoneBinding',
          params: data
        });
      },
      //修改密码
      changepwd: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerModifyPassword',
          params: data
        });

      },
      //修改头像
      modifyHeadPicture: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerModifyHeadPicture',
          params: data
        });
      },
      //x消费流水
      customerConsumeRecords: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerConsumeRecords',
          params: data
        });
      },
      //订单列表
      queryOrderPage: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryOrderPage',
          params: data
        });
      },
      //申请成为房东
      customerBecomeLandlord: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_customerBecomeLandlord',
          params: data
        });
      },
      //我的房子
      landlordHotels: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_landlordHotels',
          params: data
        });
      },
      //查看房子
      viewLandlordHotel: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_viewLandlordHotel',
          params: data
        });
      },
      //房东我的房子－详情
      landlordHotelHouses: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_landlordHotelHouses',
          params: data
        });
      },
      //房东我的房子－详情－房间详情
      viewLandlordHotelHouse: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_viewLandlordHotelHouse',
          params: data
        });
      },
      //房东我的房子－详情－修改价格
      landlordModifyHousePrice: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_landlordModifyHousePrice',
          params: data
        });
      },
      //房东我的房子－订单
      queryLandlordOrders: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryLandlordOrders',
          params: data
        });
      },
      //房东我的收入－月收入
      landlordDayIncome: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_landlordDayIncome',
          params: data
        });
      },
      //验证房间是否预订
      checkHouseWhetherReserve: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_checkHouseWhetherReserve',
          params: data
        });
      },
      //提交订单
      submitOrder: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_submitOrder',
          params: data
        });
      },
      //房间价格日历
      queryRoomCalendar: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_queryRoomCalendar',
          params: data
        });
      },
      //订单详情
      viewOrderDetail: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_viewOrderDetail',
          params: data
        });
      },
      //取消订单
      cancelOrder: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_cancleOrder',
          params: data
        });
      },
      //取消子订单
      cancleSubOrder: function(data) {

        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + 'op/op_cancleSubOrder',
          params: data
        });
      },
      //搜索酒店
      queryHotelsPage: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryHotelsPage",
          params: data

        });
      },
      //HOME键客户订单
      queryCustomerOrders: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryCustomerOrders",
          params: data

        });
      },
      //客户确认入住、退房
      modifySubOrdersStatus: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_modifySubOrdersStatus",
          params: data

        });
      },
      //房东月收入
      landlordMonthIncome: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_landlordMonthIncome",
          params: data

        });
      },
      //待评价列表
      queryJudgeOrders: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryJudgeOrders",
          params: data

        });
      },
      //客户评价
      customerFeedBack: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_customerFeedBack",
          params: data

        });
      },
      // 网页支付获取参数接口
      getOrderInfo: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_getOrderInfo",
          params: data
        });
      },

      //服务
      customerCallService: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_customerCallService",
          params: data
        });
      },
      //获取服务进度
      serviceHandleRecords: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_serviceHandleRecords",
          params: data
        });
      },
      //酒店条件搜索
      queryNearbySearch: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryNearbySearch",
          params: data
        });
      },
      //获取客户信息
      getCustomerInfo: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_getCustomerInfo",
          params: data
        });
      },
      queryCustomerOrders: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryCustomerOrders",
          params: data
        });
      },
      //智能控制
      //房间主机信息
      viewHouseHostInfo: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_viewHouseHostInfo",
          params: data
        });
      },
      //主机线路信息
      querySmartDeviceWays: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_querySmartDeviceWays",
          params: data
        });
      },
      // 获取窗帘
      queryCurtains: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryCurtains",
          params: data
        });
      },
      // 获取设备类型
      queryDeviceType: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryDeviceType",
          params: data
        });
      },
      //主机情景
      queryHostScenes: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_queryHostScenes",
          params: data
        });
      },
      //主机设备信息
      ctrlHostDeviceByType: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "we/we_queryHostDeviceByType",
          params: data
        });
      },
      //获取路数信息
      querySmartDeviceWays: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "we/we_querySmartDeviceWays",
          params: data
        });
      },
      // 获取电视机信息
      queryTvDevices: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "we/we_queryTvDevices",
          params: data
        });
      },
       // 退出上传灯的状态
      modifyWaysStatus: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "we/we_modifyWaysStatus",
          params: data
        });
      },
      // 空调类型
      queryHostDeviceByType: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "we/we_queryDeviceType",
          params: data
        });
      },
      //控制
      smartHostControl: function(data) {
        data.token = localStorage.getItem('token');
        return $http({　
          method: 'POST',
          url: AJKUrl + "op/op_smartHostControl",
          params: data
        });
      },
      //获取城市
      getCity: function() {
        return $http({　
          method: 'get',
          url: 'lib/city.json',
        });
      },
      //获取city-picker
      getCityPicker: function() {
        return $http({　
          method: 'get',
          url: 'lib/Area_Datas.json',
        });
      },
      //获取地铁
      getMetro: function() {
        return $http({　
          method: 'get',
          url: 'lib/metroData.json',
        });
      },
      //坐标转换
      lngLat: function(data) {
        return $http({　
          method: 'GET',
          url: 'http://restapi.amap.com/v3/assistant/coordinate/convert',
          params: data
        });
      },
      //获取商圈数据
      getBussinessArea: function() {
        return $http({　
          method: 'get',
          url: 'lib/businessArea.json',
        });
      }
    };

  }])
  .factory('hotelPics', function() {
    return { a: 1, b: 2 };
  })
  .factory('quadrant', function() {
    var quadrant =  function quadrant(x, x0, y, y0) {
      if (x <= x0 && y <= y0) {
        return 3
      }
      if (x < x0 && y > y0) {
        return 4
      }
      if (x > x0 && y < y0) {
        return 2
      }
      if (x >= x0 && y >= y0) {
        return 1
      }
    }
    return quadrant
  })
  .factory('encode64', function() {
    var encode64 = function encode64(input) {
      var keyStr = "ABCDEFGHIJKLMNOP" + "QRSTUVWXYZabcdef" + "ghijklmnopqrstuv" + "wxyz0123456789+/" + "=";
      var output = "";
      var chr1, chr2, chr3 = "";
      var enc1, enc2, enc3, enc4 = "";
      var i = 0;
      do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) + keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
      } while (i < input.length);
      return output;
    }
    return encode64
  })
  .factory('cityPickerData', function() {
    return [{
      name: "北京",
      sub: [{
        name: "东城区"
      }, {
        name: "西城区"
      }, {
        name: "崇文区"
      }, {
        name: "宣武区"
      }, {
        name: "朝阳区"
      }, {
        name: "海淀区"
      }, {
        name: "丰台区"
      }, {
        name: "石景山区"
      }, {
        name: "房山区"
      }, {
        name: "通州区"
      }, {
        name: "顺义区"
      }, {
        name: "昌平区"
      }, {
        name: "大兴区"
      }, {
        name: "怀柔区"
      }, {
        name: "平谷区"
      }, {
        name: "门头沟区"
      }, {
        name: "密云县"
      }, {
        name: "延庆县"
      }, {
        name: "其他"
      }]
    }, {
      name: "广东",
      sub: [{
        name: "广州",
        sub: [{
          name: "越秀区"
        }, {
          name: "荔湾区"
        }, {
          name: "海珠区"
        }, {
          name: "天河区"
        }, {
          name: "白云区"
        }, {
          name: "黄埔区"
        }, {
          name: "番禺区"
        }, {
          name: "花都区"
        }, {
          name: "南沙区"
        }, {
          name: "萝岗区"
        }, {
          name: "增城市"
        }, {
          name: "从化市"
        }, {
          name: "其他"
        }]
      }, {
        name: "深圳",
        sub: [{
          name: "福田区"
        }, {
          name: "罗湖区"
        }, {
          name: "南山区"
        }, {
          name: "宝安区"
        }, {
          name: "龙岗区"
        }, {
          name: "盐田区"
        }, {
          name: "其他"
        }]
      }, {
        name: "珠海",
        sub: [{
          name: "香洲区"
        }, {
          name: "斗门区"
        }, {
          name: "金湾区"
        }, {
          name: "其他"
        }]
      }, {
        name: "汕头",
        sub: [{
          name: "金平区"
        }, {
          name: "濠江区"
        }, {
          name: "龙湖区"
        }, {
          name: "潮阳区"
        }, {
          name: "潮南区"
        }, {
          name: "澄海区"
        }, {
          name: "南澳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "韶关",
        sub: [{
          name: "浈江区"
        }, {
          name: "武江区"
        }, {
          name: "曲江区"
        }, {
          name: "乐昌市"
        }, {
          name: "南雄市"
        }, {
          name: "始兴县"
        }, {
          name: "仁化县"
        }, {
          name: "翁源县"
        }, {
          name: "新丰县"
        }, {
          name: "乳源瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "佛山",
        sub: [{
          name: "禅城区"
        }, {
          name: "南海区"
        }, {
          name: "顺德区"
        }, {
          name: "三水区"
        }, {
          name: "高明区"
        }, {
          name: "其他"
        }]
      }, {
        name: "江门",
        sub: [{
          name: "蓬江区"
        }, {
          name: "江海区"
        }, {
          name: "新会区"
        }, {
          name: "恩平市"
        }, {
          name: "台山市"
        }, {
          name: "开平市"
        }, {
          name: "鹤山市"
        }, {
          name: "其他"
        }]
      }, {
        name: "湛江",
        sub: [{
          name: "赤坎区"
        }, {
          name: "霞山区"
        }, {
          name: "坡头区"
        }, {
          name: "麻章区"
        }, {
          name: "吴川市"
        }, {
          name: "廉江市"
        }, {
          name: "雷州市"
        }, {
          name: "遂溪县"
        }, {
          name: "徐闻县"
        }, {
          name: "其他"
        }]
      }, {
        name: "茂名",
        sub: [{
          name: "茂南区"
        }, {
          name: "茂港区"
        }, {
          name: "化州市"
        }, {
          name: "信宜市"
        }, {
          name: "高州市"
        }, {
          name: "电白县"
        }, {
          name: "其他"
        }]
      }, {
        name: "肇庆",
        sub: [{
          name: "端州区"
        }, {
          name: "鼎湖区"
        }, {
          name: "高要市"
        }, {
          name: "四会市"
        }, {
          name: "广宁县"
        }, {
          name: "怀集县"
        }, {
          name: "封开县"
        }, {
          name: "德庆县"
        }, {
          name: "其他"
        }]
      }, {
        name: "惠州",
        sub: [{
          name: "惠城区"
        }, {
          name: "惠阳区"
        }, {
          name: "博罗县"
        }, {
          name: "惠东县"
        }, {
          name: "龙门县"
        }, {
          name: "其他"
        }]
      }, {
        name: "梅州",
        sub: [{
          name: "梅江区"
        }, {
          name: "兴宁市"
        }, {
          name: "梅县"
        }, {
          name: "大埔县"
        }, {
          name: "丰顺县"
        }, {
          name: "五华县"
        }, {
          name: "平远县"
        }, {
          name: "蕉岭县"
        }, {
          name: "其他"
        }]
      }, {
        name: "汕尾",
        sub: [{
          name: "城区"
        }, {
          name: "陆丰市"
        }, {
          name: "海丰县"
        }, {
          name: "陆河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "河源",
        sub: [{
          name: "源城区"
        }, {
          name: "紫金县"
        }, {
          name: "龙川县"
        }, {
          name: "连平县"
        }, {
          name: "和平县"
        }, {
          name: "东源县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阳江",
        sub: [{
          name: "江城区"
        }, {
          name: "阳春市"
        }, {
          name: "阳西县"
        }, {
          name: "阳东县"
        }, {
          name: "其他"
        }]
      }, {
        name: "清远",
        sub: [{
          name: "清城区"
        }, {
          name: "英德市"
        }, {
          name: "连州市"
        }, {
          name: "佛冈县"
        }, {
          name: "阳山县"
        }, {
          name: "清新县"
        }, {
          name: "连山壮族瑶族自治县"
        }, {
          name: "连南瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "东莞",
        sub: []
      }, {
        name: "中山",
        sub: []
      }, {
        name: "潮州",
        sub: [{
          name: "湘桥区"
        }, {
          name: "潮安县"
        }, {
          name: "饶平县"
        }, {
          name: "其他"
        }]
      }, {
        name: "揭阳",
        sub: [{
          name: "榕城区"
        }, {
          name: "普宁市"
        }, {
          name: "揭东县"
        }, {
          name: "揭西县"
        }, {
          name: "惠来县"
        }, {
          name: "其他"
        }]
      }, {
        name: "云浮",
        sub: [{
          name: "云城区"
        }, {
          name: "罗定市"
        }, {
          name: "云安县"
        }, {
          name: "新兴县"
        }, {
          name: "郁南县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "上海",
      sub: [{
        name: "黄浦区"
      }, {
        name: "卢湾区"
      }, {
        name: "徐汇区"
      }, {
        name: "长宁区"
      }, {
        name: "静安区"
      }, {
        name: "普陀区"
      }, {
        name: "闸北区"
      }, {
        name: "虹口区"
      }, {
        name: "杨浦区"
      }, {
        name: "宝山区"
      }, {
        name: "闵行区"
      }, {
        name: "嘉定区"
      }, {
        name: "松江区"
      }, {
        name: "金山区"
      }, {
        name: "青浦区"
      }, {
        name: "南汇区"
      }, {
        name: "奉贤区"
      }, {
        name: "浦东新区"
      }, {
        name: "崇明县"
      }, {
        name: "其他"
      }]
    }, {
      name: "天津",
      sub: [{
        name: "和平区"
      }, {
        name: "河东区"
      }, {
        name: "河西区"
      }, {
        name: "南开区"
      }, {
        name: "河北区"
      }, {
        name: "红桥区"
      }, {
        name: "塘沽区"
      }, {
        name: "汉沽区"
      }, {
        name: "大港区"
      }, {
        name: "东丽区"
      }, {
        name: "西青区"
      }, {
        name: "北辰区"
      }, {
        name: "津南区"
      }, {
        name: "武清区"
      }, {
        name: "宝坻区"
      }, {
        name: "静海县"
      }, {
        name: "宁河县"
      }, {
        name: "蓟县"
      }, {
        name: "其他"
      }]
    }, {
      name: "重庆",
      sub: [{
        name: "渝中区"
      }, {
        name: "大渡口区"
      }, {
        name: "江北区"
      }, {
        name: "南岸区"
      }, {
        name: "北碚区"
      }, {
        name: "渝北区"
      }, {
        name: "巴南区"
      }, {
        name: "长寿区"
      }, {
        name: "双桥区"
      }, {
        name: "沙坪坝区"
      }, {
        name: "万盛区"
      }, {
        name: "万州区"
      }, {
        name: "涪陵区"
      }, {
        name: "黔江区"
      }, {
        name: "永川区"
      }, {
        name: "合川区"
      }, {
        name: "江津区"
      }, {
        name: "九龙坡区"
      }, {
        name: "南川区"
      }, {
        name: "綦江县"
      }, {
        name: "潼南县"
      }, {
        name: "荣昌县"
      }, {
        name: "璧山县"
      }, {
        name: "大足县"
      }, {
        name: "铜梁县"
      }, {
        name: "梁平县"
      }, {
        name: "开县"
      }, {
        name: "忠县"
      }, {
        name: "城口县"
      }, {
        name: "垫江县"
      }, {
        name: "武隆县"
      }, {
        name: "丰都县"
      }, {
        name: "奉节县"
      }, {
        name: "云阳县"
      }, {
        name: "巫溪县"
      }, {
        name: "巫山县"
      }, {
        name: "石柱土家族自治县"
      }, {
        name: "秀山土家族苗族自治县"
      }, {
        name: "酉阳土家族苗族自治县"
      }, {
        name: "彭水苗族土家族自治县"
      }, {
        name: "其他"
      }]
    }, {
      name: "辽宁",
      sub: [{
        name: "沈阳",
        sub: [{
          name: "沈河区"
        }, {
          name: "皇姑区"
        }, {
          name: "和平区"
        }, {
          name: "大东区"
        }, {
          name: "铁西区"
        }, {
          name: "苏家屯区"
        }, {
          name: "东陵区"
        }, {
          name: "于洪区"
        }, {
          name: "新民市"
        }, {
          name: "法库县"
        }, {
          name: "辽中县"
        }, {
          name: "康平县"
        }, {
          name: "新城子区"
        }, {
          name: "其他"
        }]
      }, {
        name: "大连",
        sub: [{
          name: "西岗区"
        }, {
          name: "中山区"
        }, {
          name: "沙河口区"
        }, {
          name: "甘井子区"
        }, {
          name: "旅顺口区"
        }, {
          name: "金州区"
        }, {
          name: "瓦房店市"
        }, {
          name: "普兰店市"
        }, {
          name: "庄河市"
        }, {
          name: "长海县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鞍山",
        sub: [{
          name: "铁东区"
        }, {
          name: "铁西区"
        }, {
          name: "立山区"
        }, {
          name: "千山区"
        }, {
          name: "海城市"
        }, {
          name: "台安县"
        }, {
          name: "岫岩满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "抚顺",
        sub: [{
          name: "顺城区"
        }, {
          name: "新抚区"
        }, {
          name: "东洲区"
        }, {
          name: "望花区"
        }, {
          name: "抚顺县"
        }, {
          name: "清原满族自治县"
        }, {
          name: "新宾满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "本溪",
        sub: [{
          name: "平山区"
        }, {
          name: "明山区"
        }, {
          name: "溪湖区"
        }, {
          name: "南芬区"
        }, {
          name: "本溪满族自治县"
        }, {
          name: "桓仁满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "丹东",
        sub: [{
          name: "振兴区"
        }, {
          name: "元宝区"
        }, {
          name: "振安区"
        }, {
          name: "东港市"
        }, {
          name: "凤城市"
        }, {
          name: "宽甸满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "锦州",
        sub: [{
          name: "太和区"
        }, {
          name: "古塔区"
        }, {
          name: "凌河区"
        }, {
          name: "凌海市"
        }, {
          name: "黑山县"
        }, {
          name: "义县"
        }, {
          name: "北宁市"
        }, {
          name: "其他"
        }]
      }, {
        name: "营口",
        sub: [{
          name: "站前区"
        }, {
          name: "西市区"
        }, {
          name: "鲅鱼圈区"
        }, {
          name: "老边区"
        }, {
          name: "大石桥市"
        }, {
          name: "盖州市"
        }, {
          name: "其他"
        }]
      }, {
        name: "阜新",
        sub: [{
          name: "海州区"
        }, {
          name: "新邱区"
        }, {
          name: "太平区"
        }, {
          name: "清河门区"
        }, {
          name: "细河区"
        }, {
          name: "彰武县"
        }, {
          name: "阜新蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "辽阳",
        sub: [{
          name: "白塔区"
        }, {
          name: "文圣区"
        }, {
          name: "宏伟区"
        }, {
          name: "太子河区"
        }, {
          name: "弓长岭区"
        }, {
          name: "灯塔市"
        }, {
          name: "辽阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "盘锦",
        sub: [{
          name: "双台子区"
        }, {
          name: "兴隆台区"
        }, {
          name: "盘山县"
        }, {
          name: "大洼县"
        }, {
          name: "其他"
        }]
      }, {
        name: "铁岭",
        sub: [{
          name: "银州区"
        }, {
          name: "清河区"
        }, {
          name: "调兵山市"
        }, {
          name: "开原市"
        }, {
          name: "铁岭县"
        }, {
          name: "昌图县"
        }, {
          name: "西丰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "朝阳",
        sub: [{
          name: "双塔区"
        }, {
          name: "龙城区"
        }, {
          name: "凌源市"
        }, {
          name: "北票市"
        }, {
          name: "朝阳县"
        }, {
          name: "建平县"
        }, {
          name: "喀喇沁左翼蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "葫芦岛",
        sub: [{
          name: "龙港区"
        }, {
          name: "南票区"
        }, {
          name: "连山区"
        }, {
          name: "兴城市"
        }, {
          name: "绥中县"
        }, {
          name: "建昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "江苏",
      sub: [{
        name: "南京",
        sub: [{
          name: "玄武区"
        }, {
          name: "白下区"
        }, {
          name: "秦淮区"
        }, {
          name: "建邺区"
        }, {
          name: "鼓楼区"
        }, {
          name: "下关区"
        }, {
          name: "栖霞区"
        }, {
          name: "雨花台区"
        }, {
          name: "浦口区"
        }, {
          name: "江宁区"
        }, {
          name: "六合区"
        }, {
          name: "溧水县"
        }, {
          name: "高淳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "苏州",
        sub: [{
          name: "金阊区"
        }, {
          name: "平江区"
        }, {
          name: "沧浪区"
        }, {
          name: "虎丘区"
        }, {
          name: "吴中区"
        }, {
          name: "相城区"
        }, {
          name: "常熟市"
        }, {
          name: "张家港市"
        }, {
          name: "昆山市"
        }, {
          name: "吴江市"
        }, {
          name: "太仓市"
        }, {
          name: "其他"
        }]
      }, {
        name: "无锡",
        sub: [{
          name: "崇安区"
        }, {
          name: "南长区"
        }, {
          name: "北塘区"
        }, {
          name: "滨湖区"
        }, {
          name: "锡山区"
        }, {
          name: "惠山区"
        }, {
          name: "江阴市"
        }, {
          name: "宜兴市"
        }, {
          name: "其他"
        }]
      }, {
        name: "常州",
        sub: [{
          name: "钟楼区"
        }, {
          name: "天宁区"
        }, {
          name: "戚墅堰区"
        }, {
          name: "新北区"
        }, {
          name: "武进区"
        }, {
          name: "金坛市"
        }, {
          name: "溧阳市"
        }, {
          name: "其他"
        }]
      }, {
        name: "镇江",
        sub: [{
          name: "京口区"
        }, {
          name: "润州区"
        }, {
          name: "丹徒区"
        }, {
          name: "丹阳市"
        }, {
          name: "扬中市"
        }, {
          name: "句容市"
        }, {
          name: "其他"
        }]
      }, {
        name: "南通",
        sub: [{
          name: "崇川区"
        }, {
          name: "港闸区"
        }, {
          name: "通州市"
        }, {
          name: "如皋市"
        }, {
          name: "海门市"
        }, {
          name: "启东市"
        }, {
          name: "海安县"
        }, {
          name: "如东县"
        }, {
          name: "其他"
        }]
      }, {
        name: "泰州",
        sub: [{
          name: "海陵区"
        }, {
          name: "高港区"
        }, {
          name: "姜堰市"
        }, {
          name: "泰兴市"
        }, {
          name: "靖江市"
        }, {
          name: "兴化市"
        }, {
          name: "其他"
        }]
      }, {
        name: "扬州",
        sub: [{
          name: "广陵区"
        }, {
          name: "维扬区"
        }, {
          name: "邗江区"
        }, {
          name: "江都市"
        }, {
          name: "仪征市"
        }, {
          name: "高邮市"
        }, {
          name: "宝应县"
        }, {
          name: "其他"
        }]
      }, {
        name: "盐城",
        sub: [{
          name: "亭湖区"
        }, {
          name: "盐都区"
        }, {
          name: "大丰市"
        }, {
          name: "东台市"
        }, {
          name: "建湖县"
        }, {
          name: "射阳县"
        }, {
          name: "阜宁县"
        }, {
          name: "滨海县"
        }, {
          name: "响水县"
        }, {
          name: "其他"
        }]
      }, {
        name: "连云港",
        sub: [{
          name: "新浦区"
        }, {
          name: "海州区"
        }, {
          name: "连云区"
        }, {
          name: "东海县"
        }, {
          name: "灌云县"
        }, {
          name: "赣榆县"
        }, {
          name: "灌南县"
        }, {
          name: "其他"
        }]
      }, {
        name: "徐州",
        sub: [{
          name: "云龙区"
        }, {
          name: "鼓楼区"
        }, {
          name: "九里区"
        }, {
          name: "泉山区"
        }, {
          name: "贾汪区"
        }, {
          name: "邳州市"
        }, {
          name: "新沂市"
        }, {
          name: "铜山县"
        }, {
          name: "睢宁县"
        }, {
          name: "沛县"
        }, {
          name: "丰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "淮安",
        sub: [{
          name: "清河区"
        }, {
          name: "清浦区"
        }, {
          name: "楚州区"
        }, {
          name: "淮阴区"
        }, {
          name: "涟水县"
        }, {
          name: "洪泽县"
        }, {
          name: "金湖县"
        }, {
          name: "盱眙县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宿迁",
        sub: [{
          name: "宿城区"
        }, {
          name: "宿豫区"
        }, {
          name: "沭阳县"
        }, {
          name: "泗阳县"
        }, {
          name: "泗洪县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "湖北",
      sub: [{
        name: "武汉",
        sub: [{
          name: "江岸区"
        }, {
          name: "武昌区"
        }, {
          name: "江汉区"
        }, {
          name: "硚口区"
        }, {
          name: "汉阳区"
        }, {
          name: "青山区"
        }, {
          name: "洪山区"
        }, {
          name: "东西湖区"
        }, {
          name: "汉南区"
        }, {
          name: "蔡甸区"
        }, {
          name: "江夏区"
        }, {
          name: "黄陂区"
        }, {
          name: "新洲区"
        }, {
          name: "其他"
        }]
      }, {
        name: "黄石",
        sub: [{
          name: "黄石港区"
        }, {
          name: "西塞山区"
        }, {
          name: "下陆区"
        }, {
          name: "铁山区"
        }, {
          name: "大冶市"
        }, {
          name: "阳新县"
        }, {
          name: "其他"
        }]
      }, {
        name: "十堰",
        sub: [{
          name: "张湾区"
        }, {
          name: "茅箭区"
        }, {
          name: "丹江口市"
        }, {
          name: "郧县"
        }, {
          name: "竹山县"
        }, {
          name: "房县"
        }, {
          name: "郧西县"
        }, {
          name: "竹溪县"
        }, {
          name: "其他"
        }]
      }, {
        name: "荆州",
        sub: [{
          name: "沙市区"
        }, {
          name: "荆州区"
        }, {
          name: "洪湖市"
        }, {
          name: "石首市"
        }, {
          name: "松滋市"
        }, {
          name: "监利县"
        }, {
          name: "公安县"
        }, {
          name: "江陵县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宜昌",
        sub: [{
          name: "西陵区"
        }, {
          name: "伍家岗区"
        }, {
          name: "点军区"
        }, {
          name: "猇亭区"
        }, {
          name: "夷陵区"
        }, {
          name: "宜都市"
        }, {
          name: "当阳市"
        }, {
          name: "枝江市"
        }, {
          name: "秭归县"
        }, {
          name: "远安县"
        }, {
          name: "兴山县"
        }, {
          name: "五峰土家族自治县"
        }, {
          name: "长阳土家族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "襄樊",
        sub: [{
          name: "襄城区"
        }, {
          name: "樊城区"
        }, {
          name: "襄阳区"
        }, {
          name: "老河口市"
        }, {
          name: "枣阳市"
        }, {
          name: "宜城市"
        }, {
          name: "南漳县"
        }, {
          name: "谷城县"
        }, {
          name: "保康县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鄂州",
        sub: [{
          name: "鄂城区"
        }, {
          name: "华容区"
        }, {
          name: "梁子湖区"
        }, {
          name: "其他"
        }]
      }, {
        name: "荆门",
        sub: [{
          name: "东宝区"
        }, {
          name: "掇刀区"
        }, {
          name: "钟祥市"
        }, {
          name: "京山县"
        }, {
          name: "沙洋县"
        }, {
          name: "其他"
        }]
      }, {
        name: "孝感",
        sub: [{
          name: "孝南区"
        }, {
          name: "应城市"
        }, {
          name: "安陆市"
        }, {
          name: "汉川市"
        }, {
          name: "云梦县"
        }, {
          name: "大悟县"
        }, {
          name: "孝昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黄冈",
        sub: [{
          name: "黄州区"
        }, {
          name: "麻城市"
        }, {
          name: "武穴市"
        }, {
          name: "红安县"
        }, {
          name: "罗田县"
        }, {
          name: "浠水县"
        }, {
          name: "蕲春县"
        }, {
          name: "黄梅县"
        }, {
          name: "英山县"
        }, {
          name: "团风县"
        }, {
          name: "其他"
        }]
      }, {
        name: "咸宁",
        sub: [{
          name: "咸安区"
        }, {
          name: "赤壁市"
        }, {
          name: "嘉鱼县"
        }, {
          name: "通山县"
        }, {
          name: "崇阳县"
        }, {
          name: "通城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "随州",
        sub: [{
          name: "曾都区"
        }, {
          name: "广水市"
        }, {
          name: "其他"
        }]
      }, {
        name: "恩施土家族苗族自治州",
        sub: [{
          name: "恩施市"
        }, {
          name: "利川市"
        }, {
          name: "建始县"
        }, {
          name: "来凤县"
        }, {
          name: "巴东县"
        }, {
          name: "鹤峰县"
        }, {
          name: "宣恩县"
        }, {
          name: "咸丰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "仙桃",
        sub: []
      }, {
        name: "天门",
        sub: []
      }, {
        name: "潜江",
        sub: []
      }, {
        name: "神农架林区",
        sub: []
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "四川",
      sub: [{
        name: "成都",
        sub: [{
          name: "青羊区"
        }, {
          name: "锦江区"
        }, {
          name: "金牛区"
        }, {
          name: "武侯区"
        }, {
          name: "成华区"
        }, {
          name: "龙泉驿区"
        }, {
          name: "青白江区"
        }, {
          name: "新都区"
        }, {
          name: "温江区"
        }, {
          name: "都江堰市"
        }, {
          name: "彭州市"
        }, {
          name: "邛崃市"
        }, {
          name: "崇州市"
        }, {
          name: "金堂县"
        }, {
          name: "郫县"
        }, {
          name: "新津县"
        }, {
          name: "双流县"
        }, {
          name: "蒲江县"
        }, {
          name: "大邑县"
        }, {
          name: "其他"
        }]
      }, {
        name: "自贡",
        sub: [{
          name: "大安区"
        }, {
          name: "自流井区"
        }, {
          name: "贡井区"
        }, {
          name: "沿滩区"
        }, {
          name: "荣县"
        }, {
          name: "富顺县"
        }, {
          name: "其他"
        }]
      }, {
        name: "攀枝花",
        sub: [{
          name: "仁和区"
        }, {
          name: "米易县"
        }, {
          name: "盐边县"
        }, {
          name: "东区"
        }, {
          name: "西区"
        }, {
          name: "其他"
        }]
      }, {
        name: "泸州",
        sub: [{
          name: "江阳区"
        }, {
          name: "纳溪区"
        }, {
          name: "龙马潭区"
        }, {
          name: "泸县"
        }, {
          name: "合江县"
        }, {
          name: "叙永县"
        }, {
          name: "古蔺县"
        }, {
          name: "其他"
        }]
      }, {
        name: "德阳",
        sub: [{
          name: "旌阳区"
        }, {
          name: "广汉市"
        }, {
          name: "什邡市"
        }, {
          name: "绵竹市"
        }, {
          name: "罗江县"
        }, {
          name: "中江县"
        }, {
          name: "其他"
        }]
      }, {
        name: "绵阳",
        sub: [{
          name: "涪城区"
        }, {
          name: "游仙区"
        }, {
          name: "江油市"
        }, {
          name: "盐亭县"
        }, {
          name: "三台县"
        }, {
          name: "平武县"
        }, {
          name: "安县"
        }, {
          name: "梓潼县"
        }, {
          name: "北川羌族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "广元",
        sub: [{
          name: "元坝区"
        }, {
          name: "朝天区"
        }, {
          name: "青川县"
        }, {
          name: "旺苍县"
        }, {
          name: "剑阁县"
        }, {
          name: "苍溪县"
        }, {
          name: "市中区"
        }, {
          name: "其他"
        }]
      }, {
        name: "遂宁",
        sub: [{
          name: "船山区"
        }, {
          name: "安居区"
        }, {
          name: "射洪县"
        }, {
          name: "蓬溪县"
        }, {
          name: "大英县"
        }, {
          name: "其他"
        }]
      }, {
        name: "内江",
        sub: [{
          name: "市中区"
        }, {
          name: "东兴区"
        }, {
          name: "资中县"
        }, {
          name: "隆昌县"
        }, {
          name: "威远县"
        }, {
          name: "其他"
        }]
      }, {
        name: "乐山",
        sub: [{
          name: "市中区"
        }, {
          name: "五通桥区"
        }, {
          name: "沙湾区"
        }, {
          name: "金口河区"
        }, {
          name: "峨眉山市"
        }, {
          name: "夹江县"
        }, {
          name: "井研县"
        }, {
          name: "犍为县"
        }, {
          name: "沐川县"
        }, {
          name: "马边彝族自治县"
        }, {
          name: "峨边彝族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "南充",
        sub: [{
          name: "顺庆区"
        }, {
          name: "高坪区"
        }, {
          name: "嘉陵区"
        }, {
          name: "阆中市"
        }, {
          name: "营山县"
        }, {
          name: "蓬安县"
        }, {
          name: "仪陇县"
        }, {
          name: "南部县"
        }, {
          name: "西充县"
        }, {
          name: "其他"
        }]
      }, {
        name: "眉山",
        sub: [{
          name: "东坡区"
        }, {
          name: "仁寿县"
        }, {
          name: "彭山县"
        }, {
          name: "洪雅县"
        }, {
          name: "丹棱县"
        }, {
          name: "青神县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宜宾",
        sub: [{
          name: "翠屏区"
        }, {
          name: "宜宾县"
        }, {
          name: "兴文县"
        }, {
          name: "南溪县"
        }, {
          name: "珙县"
        }, {
          name: "长宁县"
        }, {
          name: "高县"
        }, {
          name: "江安县"
        }, {
          name: "筠连县"
        }, {
          name: "屏山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "广安",
        sub: [{
          name: "广安区"
        }, {
          name: "华蓥市"
        }, {
          name: "岳池县"
        }, {
          name: "邻水县"
        }, {
          name: "武胜县"
        }, {
          name: "其他"
        }]
      }, {
        name: "达州",
        sub: [{
          name: "通川区"
        }, {
          name: "万源市"
        }, {
          name: "达县"
        }, {
          name: "渠县"
        }, {
          name: "宣汉县"
        }, {
          name: "开江县"
        }, {
          name: "大竹县"
        }, {
          name: "其他"
        }]
      }, {
        name: "雅安",
        sub: [{
          name: "雨城区"
        }, {
          name: "芦山县"
        }, {
          name: "石棉县"
        }, {
          name: "名山县"
        }, {
          name: "天全县"
        }, {
          name: "荥经县"
        }, {
          name: "宝兴县"
        }, {
          name: "汉源县"
        }, {
          name: "其他"
        }]
      }, {
        name: "巴中",
        sub: [{
          name: "巴州区"
        }, {
          name: "南江县"
        }, {
          name: "平昌县"
        }, {
          name: "通江县"
        }, {
          name: "其他"
        }]
      }, {
        name: "资阳",
        sub: [{
          name: "雁江区"
        }, {
          name: "简阳市"
        }, {
          name: "安岳县"
        }, {
          name: "乐至县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阿坝藏族羌族自治州",
        sub: [{
          name: "马尔康县"
        }, {
          name: "九寨沟县"
        }, {
          name: "红原县"
        }, {
          name: "汶川县"
        }, {
          name: "阿坝县"
        }, {
          name: "理县"
        }, {
          name: "若尔盖县"
        }, {
          name: "小金县"
        }, {
          name: "黑水县"
        }, {
          name: "金川县"
        }, {
          name: "松潘县"
        }, {
          name: "壤塘县"
        }, {
          name: "茂县"
        }, {
          name: "其他"
        }]
      }, {
        name: "甘孜藏族自治州",
        sub: [{
          name: "康定县"
        }, {
          name: "丹巴县"
        }, {
          name: "炉霍县"
        }, {
          name: "九龙县"
        }, {
          name: "甘孜县"
        }, {
          name: "雅江县"
        }, {
          name: "新龙县"
        }, {
          name: "道孚县"
        }, {
          name: "白玉县"
        }, {
          name: "理塘县"
        }, {
          name: "德格县"
        }, {
          name: "乡城县"
        }, {
          name: "石渠县"
        }, {
          name: "稻城县"
        }, {
          name: "色达县"
        }, {
          name: "巴塘县"
        }, {
          name: "泸定县"
        }, {
          name: "得荣县"
        }, {
          name: "其他"
        }]
      }, {
        name: "凉山彝族自治州",
        sub: [{
          name: "西昌市"
        }, {
          name: "美姑县"
        }, {
          name: "昭觉县"
        }, {
          name: "金阳县"
        }, {
          name: "甘洛县"
        }, {
          name: "布拖县"
        }, {
          name: "雷波县"
        }, {
          name: "普格县"
        }, {
          name: "宁南县"
        }, {
          name: "喜德县"
        }, {
          name: "会东县"
        }, {
          name: "越西县"
        }, {
          name: "会理县"
        }, {
          name: "盐源县"
        }, {
          name: "德昌县"
        }, {
          name: "冕宁县"
        }, {
          name: "木里藏族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "陕西",
      sub: [{
        name: "西安",
        sub: [{
          name: "莲湖区"
        }, {
          name: "新城区"
        }, {
          name: "碑林区"
        }, {
          name: "雁塔区"
        }, {
          name: "灞桥区"
        }, {
          name: "未央区"
        }, {
          name: "阎良区"
        }, {
          name: "临潼区"
        }, {
          name: "长安区"
        }, {
          name: "高陵县"
        }, {
          name: "蓝田县"
        }, {
          name: "户县"
        }, {
          name: "周至县"
        }, {
          name: "其他"
        }]
      }, {
        name: "铜川",
        sub: [{
          name: "耀州区"
        }, {
          name: "王益区"
        }, {
          name: "印台区"
        }, {
          name: "宜君县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宝鸡",
        sub: [{
          name: "渭滨区"
        }, {
          name: "金台区"
        }, {
          name: "陈仓区"
        }, {
          name: "岐山县"
        }, {
          name: "凤翔县"
        }, {
          name: "陇县"
        }, {
          name: "太白县"
        }, {
          name: "麟游县"
        }, {
          name: "扶风县"
        }, {
          name: "千阳县"
        }, {
          name: "眉县"
        }, {
          name: "凤县"
        }, {
          name: "其他"
        }]
      }, {
        name: "咸阳",
        sub: [{
          name: "秦都区"
        }, {
          name: "渭城区"
        }, {
          name: "杨陵区"
        }, {
          name: "兴平市"
        }, {
          name: "礼泉县"
        }, {
          name: "泾阳县"
        }, {
          name: "永寿县"
        }, {
          name: "三原县"
        }, {
          name: "彬县"
        }, {
          name: "旬邑县"
        }, {
          name: "长武县"
        }, {
          name: "乾县"
        }, {
          name: "武功县"
        }, {
          name: "淳化县"
        }, {
          name: "其他"
        }]
      }, {
        name: "渭南",
        sub: [{
          name: "临渭区"
        }, {
          name: "韩城市"
        }, {
          name: "华阴市"
        }, {
          name: "蒲城县"
        }, {
          name: "潼关县"
        }, {
          name: "白水县"
        }, {
          name: "澄城县"
        }, {
          name: "华县"
        }, {
          name: "合阳县"
        }, {
          name: "富平县"
        }, {
          name: "大荔县"
        }, {
          name: "其他"
        }]
      }, {
        name: "延安",
        sub: [{
          name: "宝塔区"
        }, {
          name: "安塞县"
        }, {
          name: "洛川县"
        }, {
          name: "子长县"
        }, {
          name: "黄陵县"
        }, {
          name: "延川县"
        }, {
          name: "富县"
        }, {
          name: "延长县"
        }, {
          name: "甘泉县"
        }, {
          name: "宜川县"
        }, {
          name: "志丹县"
        }, {
          name: "黄龙县"
        }, {
          name: "吴起县"
        }, {
          name: "其他"
        }]
      }, {
        name: "汉中",
        sub: [{
          name: "汉台区"
        }, {
          name: "留坝县"
        }, {
          name: "镇巴县"
        }, {
          name: "城固县"
        }, {
          name: "南郑县"
        }, {
          name: "洋县"
        }, {
          name: "宁强县"
        }, {
          name: "佛坪县"
        }, {
          name: "勉县"
        }, {
          name: "西乡县"
        }, {
          name: "略阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "榆林",
        sub: [{
          name: "榆阳区"
        }, {
          name: "清涧县"
        }, {
          name: "绥德县"
        }, {
          name: "神木县"
        }, {
          name: "佳县"
        }, {
          name: "府谷县"
        }, {
          name: "子洲县"
        }, {
          name: "靖边县"
        }, {
          name: "横山县"
        }, {
          name: "米脂县"
        }, {
          name: "吴堡县"
        }, {
          name: "定边县"
        }, {
          name: "其他"
        }]
      }, {
        name: "安康",
        sub: [{
          name: "汉滨区"
        }, {
          name: "紫阳县"
        }, {
          name: "岚皋县"
        }, {
          name: "旬阳县"
        }, {
          name: "镇坪县"
        }, {
          name: "平利县"
        }, {
          name: "石泉县"
        }, {
          name: "宁陕县"
        }, {
          name: "白河县"
        }, {
          name: "汉阴县"
        }, {
          name: "其他"
        }]
      }, {
        name: "商洛",
        sub: [{
          name: "商州区"
        }, {
          name: "镇安县"
        }, {
          name: "山阳县"
        }, {
          name: "洛南县"
        }, {
          name: "商南县"
        }, {
          name: "丹凤县"
        }, {
          name: "柞水县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "河北",
      sub: [{
        name: "石家庄",
        sub: [{
          name: "长安区"
        }, {
          name: "桥东区"
        }, {
          name: "桥西区"
        }, {
          name: "新华区"
        }, {
          name: "裕华区"
        }, {
          name: "井陉矿区"
        }, {
          name: "鹿泉市"
        }, {
          name: "辛集市"
        }, {
          name: "藁城市"
        }, {
          name: "晋州市"
        }, {
          name: "新乐市"
        }, {
          name: "深泽县"
        }, {
          name: "无极县"
        }, {
          name: "赵县"
        }, {
          name: "灵寿县"
        }, {
          name: "高邑县"
        }, {
          name: "元氏县"
        }, {
          name: "赞皇县"
        }, {
          name: "平山县"
        }, {
          name: "井陉县"
        }, {
          name: "栾城县"
        }, {
          name: "正定县"
        }, {
          name: "行唐县"
        }, {
          name: "其他"
        }]
      }, {
        name: "唐山",
        sub: [{
          name: "路北区"
        }, {
          name: "路南区"
        }, {
          name: "古冶区"
        }, {
          name: "开平区"
        }, {
          name: "丰南区"
        }, {
          name: "丰润区"
        }, {
          name: "遵化市"
        }, {
          name: "迁安市"
        }, {
          name: "迁西县"
        }, {
          name: "滦南县"
        }, {
          name: "玉田县"
        }, {
          name: "唐海县"
        }, {
          name: "乐亭县"
        }, {
          name: "滦县"
        }, {
          name: "其他"
        }]
      }, {
        name: "秦皇岛",
        sub: [{
          name: "海港区"
        }, {
          name: "山海关区"
        }, {
          name: "北戴河区"
        }, {
          name: "昌黎县"
        }, {
          name: "抚宁县"
        }, {
          name: "卢龙县"
        }, {
          name: "青龙满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "邯郸",
        sub: [{
          name: "邯山区"
        }, {
          name: "丛台区"
        }, {
          name: "复兴区"
        }, {
          name: "峰峰矿区"
        }, {
          name: "武安市"
        }, {
          name: "邱县"
        }, {
          name: "大名县"
        }, {
          name: "魏县"
        }, {
          name: "曲周县"
        }, {
          name: "鸡泽县"
        }, {
          name: "肥乡县"
        }, {
          name: "广平县"
        }, {
          name: "成安县"
        }, {
          name: "临漳县"
        }, {
          name: "磁县"
        }, {
          name: "涉县"
        }, {
          name: "永年县"
        }, {
          name: "馆陶县"
        }, {
          name: "邯郸县"
        }, {
          name: "其他"
        }]
      }, {
        name: "邢台",
        sub: [{
          name: "桥东区"
        }, {
          name: "桥西区"
        }, {
          name: "南宫市"
        }, {
          name: "沙河市"
        }, {
          name: "临城县"
        }, {
          name: "内丘县"
        }, {
          name: "柏乡县"
        }, {
          name: "隆尧县"
        }, {
          name: "任县"
        }, {
          name: "南和县"
        }, {
          name: "宁晋县"
        }, {
          name: "巨鹿县"
        }, {
          name: "新河县"
        }, {
          name: "广宗县"
        }, {
          name: "平乡县"
        }, {
          name: "威县"
        }, {
          name: "清河县"
        }, {
          name: "临西县"
        }, {
          name: "邢台县"
        }, {
          name: "其他"
        }]
      }, {
        name: "保定",
        sub: [{
          name: "新市区"
        }, {
          name: "北市区"
        }, {
          name: "南市区"
        }, {
          name: "定州市"
        }, {
          name: "涿州市"
        }, {
          name: "安国市"
        }, {
          name: "高碑店市"
        }, {
          name: "易县"
        }, {
          name: "徐水县"
        }, {
          name: "涞源县"
        }, {
          name: "顺平县"
        }, {
          name: "唐县"
        }, {
          name: "望都县"
        }, {
          name: "涞水县"
        }, {
          name: "高阳县"
        }, {
          name: "安新县"
        }, {
          name: "雄县"
        }, {
          name: "容城县"
        }, {
          name: "蠡县"
        }, {
          name: "曲阳县"
        }, {
          name: "阜平县"
        }, {
          name: "博野县"
        }, {
          name: "满城县"
        }, {
          name: "清苑县"
        }, {
          name: "定兴县"
        }, {
          name: "其他"
        }]
      }, {
        name: "张家口",
        sub: [{
          name: "桥东区"
        }, {
          name: "桥西区"
        }, {
          name: "宣化区"
        }, {
          name: "下花园区"
        }, {
          name: "张北县"
        }, {
          name: "康保县"
        }, {
          name: "沽源县"
        }, {
          name: "尚义县"
        }, {
          name: "蔚县"
        }, {
          name: "阳原县"
        }, {
          name: "怀安县"
        }, {
          name: "万全县"
        }, {
          name: "怀来县"
        }, {
          name: "赤城县"
        }, {
          name: "崇礼县"
        }, {
          name: "宣化县"
        }, {
          name: "涿鹿县"
        }, {
          name: "其他"
        }]
      }, {
        name: "承德",
        sub: [{
          name: "双桥区"
        }, {
          name: "双滦区"
        }, {
          name: "鹰手营子矿区"
        }, {
          name: "兴隆县"
        }, {
          name: "平泉县"
        }, {
          name: "滦平县"
        }, {
          name: "隆化县"
        }, {
          name: "承德县"
        }, {
          name: "丰宁满族自治县"
        }, {
          name: "宽城满族自治县"
        }, {
          name: "围场满族蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "沧州",
        sub: [{
          name: "新华区"
        }, {
          name: "运河区"
        }, {
          name: "泊头市"
        }, {
          name: "任丘市"
        }, {
          name: "黄骅市"
        }, {
          name: "河间市"
        }, {
          name: "献县"
        }, {
          name: "吴桥县"
        }, {
          name: "沧县"
        }, {
          name: "东光县"
        }, {
          name: "肃宁县"
        }, {
          name: "南皮县"
        }, {
          name: "盐山县"
        }, {
          name: "青县"
        }, {
          name: "海兴县"
        }, {
          name: "孟村回族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "廊坊",
        sub: [{
          name: "安次区"
        }, {
          name: "广阳区"
        }, {
          name: "霸州市"
        }, {
          name: "三河市"
        }, {
          name: "香河县"
        }, {
          name: "永清县"
        }, {
          name: "固安县"
        }, {
          name: "文安县"
        }, {
          name: "大城县"
        }, {
          name: "大厂回族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "衡水",
        sub: [{
          name: "桃城区"
        }, {
          name: "冀州市"
        }, {
          name: "深州市"
        }, {
          name: "枣强县"
        }, {
          name: "武邑县"
        }, {
          name: "武强县"
        }, {
          name: "饶阳县"
        }, {
          name: "安平县"
        }, {
          name: "故城县"
        }, {
          name: "景县"
        }, {
          name: "阜城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "山西",
      sub: [{
        name: "太原",
        sub: [{
          name: "杏花岭区"
        }, {
          name: "小店区"
        }, {
          name: "迎泽区"
        }, {
          name: "尖草坪区"
        }, {
          name: "万柏林区"
        }, {
          name: "晋源区"
        }, {
          name: "古交市"
        }, {
          name: "阳曲县"
        }, {
          name: "清徐县"
        }, {
          name: "娄烦县"
        }, {
          name: "其他"
        }]
      }, {
        name: "大同",
        sub: [{
          name: "城区"
        }, {
          name: "矿区"
        }, {
          name: "南郊区"
        }, {
          name: "新荣区"
        }, {
          name: "大同县"
        }, {
          name: "天镇县"
        }, {
          name: "灵丘县"
        }, {
          name: "阳高县"
        }, {
          name: "左云县"
        }, {
          name: "广灵县"
        }, {
          name: "浑源县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阳泉",
        sub: [{
          name: "城区"
        }, {
          name: "矿区"
        }, {
          name: "郊区"
        }, {
          name: "平定县"
        }, {
          name: "盂县"
        }, {
          name: "其他"
        }]
      }, {
        name: "长治",
        sub: [{
          name: "城区"
        }, {
          name: "郊区"
        }, {
          name: "潞城市"
        }, {
          name: "长治县"
        }, {
          name: "长子县"
        }, {
          name: "平顺县"
        }, {
          name: "襄垣县"
        }, {
          name: "沁源县"
        }, {
          name: "屯留县"
        }, {
          name: "黎城县"
        }, {
          name: "武乡县"
        }, {
          name: "沁县"
        }, {
          name: "壶关县"
        }, {
          name: "其他"
        }]
      }, {
        name: "晋城",
        sub: [{
          name: "城区"
        }, {
          name: "高平市"
        }, {
          name: "泽州县"
        }, {
          name: "陵川县"
        }, {
          name: "阳城县"
        }, {
          name: "沁水县"
        }, {
          name: "其他"
        }]
      }, {
        name: "朔州",
        sub: [{
          name: "朔城区"
        }, {
          name: "平鲁区"
        }, {
          name: "山阴县"
        }, {
          name: "右玉县"
        }, {
          name: "应县"
        }, {
          name: "怀仁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "晋中",
        sub: [{
          name: "榆次区"
        }, {
          name: "介休市"
        }, {
          name: "昔阳县"
        }, {
          name: "灵石县"
        }, {
          name: "祁县"
        }, {
          name: "左权县"
        }, {
          name: "寿阳县"
        }, {
          name: "太谷县"
        }, {
          name: "和顺县"
        }, {
          name: "平遥县"
        }, {
          name: "榆社县"
        }, {
          name: "其他"
        }]
      }, {
        name: "运城",
        sub: [{
          name: "盐湖区"
        }, {
          name: "河津市"
        }, {
          name: "永济市"
        }, {
          name: "闻喜县"
        }, {
          name: "新绛县"
        }, {
          name: "平陆县"
        }, {
          name: "垣曲县"
        }, {
          name: "绛县"
        }, {
          name: "稷山县"
        }, {
          name: "芮城县"
        }, {
          name: "夏县"
        }, {
          name: "万荣县"
        }, {
          name: "临猗县"
        }, {
          name: "其他"
        }]
      }, {
        name: "忻州",
        sub: [{
          name: "忻府区"
        }, {
          name: "原平市"
        }, {
          name: "代县"
        }, {
          name: "神池县"
        }, {
          name: "五寨县"
        }, {
          name: "五台县"
        }, {
          name: "偏关县"
        }, {
          name: "宁武县"
        }, {
          name: "静乐县"
        }, {
          name: "繁峙县"
        }, {
          name: "河曲县"
        }, {
          name: "保德县"
        }, {
          name: "定襄县"
        }, {
          name: "岢岚县"
        }, {
          name: "其他"
        }]
      }, {
        name: "临汾",
        sub: [{
          name: "尧都区"
        }, {
          name: "侯马市"
        }, {
          name: "霍州市"
        }, {
          name: "汾西县"
        }, {
          name: "吉县"
        }, {
          name: "安泽县"
        }, {
          name: "大宁县"
        }, {
          name: "浮山县"
        }, {
          name: "古县"
        }, {
          name: "隰县"
        }, {
          name: "襄汾县"
        }, {
          name: "翼城县"
        }, {
          name: "永和县"
        }, {
          name: "乡宁县"
        }, {
          name: "曲沃县"
        }, {
          name: "洪洞县"
        }, {
          name: "蒲县"
        }, {
          name: "其他"
        }]
      }, {
        name: "吕梁",
        sub: [{
          name: "离石区"
        }, {
          name: "孝义市"
        }, {
          name: "汾阳市"
        }, {
          name: "文水县"
        }, {
          name: "中阳县"
        }, {
          name: "兴县"
        }, {
          name: "临县"
        }, {
          name: "方山县"
        }, {
          name: "柳林县"
        }, {
          name: "岚县"
        }, {
          name: "交口县"
        }, {
          name: "交城县"
        }, {
          name: "石楼县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "河南",
      sub: [{
        name: "郑州",
        sub: [{
          name: "中原区"
        }, {
          name: "金水区"
        }, {
          name: "二七区"
        }, {
          name: "管城回族区"
        }, {
          name: "上街区"
        }, {
          name: "惠济区"
        }, {
          name: "巩义市"
        }, {
          name: "新郑市"
        }, {
          name: "新密市"
        }, {
          name: "登封市"
        }, {
          name: "荥阳市"
        }, {
          name: "中牟县"
        }, {
          name: "其他"
        }]
      }, {
        name: "开封",
        sub: [{
          name: "鼓楼区"
        }, {
          name: "龙亭区"
        }, {
          name: "顺河回族区"
        }, {
          name: "禹王台区"
        }, {
          name: "金明区"
        }, {
          name: "开封县"
        }, {
          name: "尉氏县"
        }, {
          name: "兰考县"
        }, {
          name: "杞县"
        }, {
          name: "通许县"
        }, {
          name: "其他"
        }]
      }, {
        name: "洛阳",
        sub: [{
          name: "西工区"
        }, {
          name: "老城区"
        }, {
          name: "涧西区"
        }, {
          name: "瀍河回族区"
        }, {
          name: "洛龙区"
        }, {
          name: "吉利区"
        }, {
          name: "偃师市"
        }, {
          name: "孟津县"
        }, {
          name: "汝阳县"
        }, {
          name: "伊川县"
        }, {
          name: "洛宁县"
        }, {
          name: "嵩县"
        }, {
          name: "宜阳县"
        }, {
          name: "新安县"
        }, {
          name: "栾川县"
        }, {
          name: "其他"
        }]
      }, {
        name: "平顶山",
        sub: [{
          name: "新华区"
        }, {
          name: "卫东区"
        }, {
          name: "湛河区"
        }, {
          name: "石龙区"
        }, {
          name: "汝州市"
        }, {
          name: "舞钢市"
        }, {
          name: "宝丰县"
        }, {
          name: "叶县"
        }, {
          name: "郏县"
        }, {
          name: "鲁山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "安阳",
        sub: [{
          name: "北关区"
        }, {
          name: "文峰区"
        }, {
          name: "殷都区"
        }, {
          name: "龙安区"
        }, {
          name: "林州市"
        }, {
          name: "安阳县"
        }, {
          name: "滑县"
        }, {
          name: "内黄县"
        }, {
          name: "汤阴县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鹤壁",
        sub: [{
          name: "淇滨区"
        }, {
          name: "山城区"
        }, {
          name: "鹤山区"
        }, {
          name: "浚县"
        }, {
          name: "淇县"
        }, {
          name: "其他"
        }]
      }, {
        name: "新乡",
        sub: [{
          name: "卫滨区"
        }, {
          name: "红旗区"
        }, {
          name: "凤泉区"
        }, {
          name: "牧野区"
        }, {
          name: "卫辉市"
        }, {
          name: "辉县市"
        }, {
          name: "新乡县"
        }, {
          name: "获嘉县"
        }, {
          name: "原阳县"
        }, {
          name: "长垣县"
        }, {
          name: "封丘县"
        }, {
          name: "延津县"
        }, {
          name: "其他"
        }]
      }, {
        name: "焦作",
        sub: [{
          name: "解放区"
        }, {
          name: "中站区"
        }, {
          name: "马村区"
        }, {
          name: "山阳区"
        }, {
          name: "沁阳市"
        }, {
          name: "孟州市"
        }, {
          name: "修武县"
        }, {
          name: "温县"
        }, {
          name: "武陟县"
        }, {
          name: "博爱县"
        }, {
          name: "其他"
        }]
      }, {
        name: "濮阳",
        sub: [{
          name: "华龙区"
        }, {
          name: "濮阳县"
        }, {
          name: "南乐县"
        }, {
          name: "台前县"
        }, {
          name: "清丰县"
        }, {
          name: "范县"
        }, {
          name: "其他"
        }]
      }, {
        name: "许昌",
        sub: [{
          name: "魏都区"
        }, {
          name: "禹州市"
        }, {
          name: "长葛市"
        }, {
          name: "许昌县"
        }, {
          name: "鄢陵县"
        }, {
          name: "襄城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "漯河",
        sub: [{
          name: "源汇区"
        }, {
          name: "郾城区"
        }, {
          name: "召陵区"
        }, {
          name: "临颍县"
        }, {
          name: "舞阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "三门峡",
        sub: [{
          name: "湖滨区"
        }, {
          name: "义马市"
        }, {
          name: "灵宝市"
        }, {
          name: "渑池县"
        }, {
          name: "卢氏县"
        }, {
          name: "陕县"
        }, {
          name: "其他"
        }]
      }, {
        name: "南阳",
        sub: [{
          name: "卧龙区"
        }, {
          name: "宛城区"
        }, {
          name: "邓州市"
        }, {
          name: "桐柏县"
        }, {
          name: "方城县"
        }, {
          name: "淅川县"
        }, {
          name: "镇平县"
        }, {
          name: "唐河县"
        }, {
          name: "南召县"
        }, {
          name: "内乡县"
        }, {
          name: "新野县"
        }, {
          name: "社旗县"
        }, {
          name: "西峡县"
        }, {
          name: "其他"
        }]
      }, {
        name: "商丘",
        sub: [{
          name: "梁园区"
        }, {
          name: "睢阳区"
        }, {
          name: "永城市"
        }, {
          name: "宁陵县"
        }, {
          name: "虞城县"
        }, {
          name: "民权县"
        }, {
          name: "夏邑县"
        }, {
          name: "柘城县"
        }, {
          name: "睢县"
        }, {
          name: "其他"
        }]
      }, {
        name: "信阳",
        sub: [{
          name: "浉河区"
        }, {
          name: "平桥区"
        }, {
          name: "潢川县"
        }, {
          name: "淮滨县"
        }, {
          name: "息县"
        }, {
          name: "新县"
        }, {
          name: "商城县"
        }, {
          name: "固始县"
        }, {
          name: "罗山县"
        }, {
          name: "光山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "周口",
        sub: [{
          name: "川汇区"
        }, {
          name: "项城市"
        }, {
          name: "商水县"
        }, {
          name: "淮阳县"
        }, {
          name: "太康县"
        }, {
          name: "鹿邑县"
        }, {
          name: "西华县"
        }, {
          name: "扶沟县"
        }, {
          name: "沈丘县"
        }, {
          name: "郸城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "驻马店",
        sub: [{
          name: "驿城区"
        }, {
          name: "确山县"
        }, {
          name: "新蔡县"
        }, {
          name: "上蔡县"
        }, {
          name: "西平县"
        }, {
          name: "泌阳县"
        }, {
          name: "平舆县"
        }, {
          name: "汝南县"
        }, {
          name: "遂平县"
        }, {
          name: "正阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "焦作",
        sub: [{
          name: "济源市"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "吉林",
      sub: [{
        name: "长春",
        sub: [{
          name: "朝阳区"
        }, {
          name: "宽城区"
        }, {
          name: "二道区"
        }, {
          name: "南关区"
        }, {
          name: "绿园区"
        }, {
          name: "双阳区"
        }, {
          name: "九台市"
        }, {
          name: "榆树市"
        }, {
          name: "德惠市"
        }, {
          name: "农安县"
        }, {
          name: "其他"
        }]
      }, {
        name: "吉林",
        sub: [{
          name: "船营区"
        }, {
          name: "昌邑区"
        }, {
          name: "龙潭区"
        }, {
          name: "丰满区"
        }, {
          name: "舒兰市"
        }, {
          name: "桦甸市"
        }, {
          name: "蛟河市"
        }, {
          name: "磐石市"
        }, {
          name: "永吉县"
        }, {
          name: "其他"
        }]
      }, {
        name: "四平",
        sub: [{
          name: "铁西区"
        }, {
          name: "铁东区"
        }, {
          name: "公主岭市"
        }, {
          name: "双辽市"
        }, {
          name: "梨树县"
        }, {
          name: "伊通满族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "辽源",
        sub: [{
          name: "龙山区"
        }, {
          name: "西安区"
        }, {
          name: "东辽县"
        }, {
          name: "东丰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "通化",
        sub: [{
          name: "东昌区"
        }, {
          name: "二道江区"
        }, {
          name: "梅河口市"
        }, {
          name: "集安市"
        }, {
          name: "通化县"
        }, {
          name: "辉南县"
        }, {
          name: "柳河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "白山",
        sub: [{
          name: "八道江区"
        }, {
          name: "江源区"
        }, {
          name: "临江市"
        }, {
          name: "靖宇县"
        }, {
          name: "抚松县"
        }, {
          name: "长白朝鲜族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "松原",
        sub: [{
          name: "宁江区"
        }, {
          name: "乾安县"
        }, {
          name: "长岭县"
        }, {
          name: "扶余县"
        }, {
          name: "前郭尔罗斯蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "白城",
        sub: [{
          name: "洮北区"
        }, {
          name: "大安市"
        }, {
          name: "洮南市"
        }, {
          name: "镇赉县"
        }, {
          name: "通榆县"
        }, {
          name: "其他"
        }]
      }, {
        name: "延边朝鲜族自治州",
        sub: [{
          name: "延吉市"
        }, {
          name: "图们市"
        }, {
          name: "敦化市"
        }, {
          name: "龙井市"
        }, {
          name: "珲春市"
        }, {
          name: "和龙市"
        }, {
          name: "安图县"
        }, {
          name: "汪清县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "黑龙江",
      sub: [{
        name: "哈尔滨",
        sub: [{
          name: "松北区"
        }, {
          name: "道里区"
        }, {
          name: "南岗区"
        }, {
          name: "平房区"
        }, {
          name: "香坊区"
        }, {
          name: "道外区"
        }, {
          name: "呼兰区"
        }, {
          name: "阿城区"
        }, {
          name: "双城市"
        }, {
          name: "尚志市"
        }, {
          name: "五常市"
        }, {
          name: "宾县"
        }, {
          name: "方正县"
        }, {
          name: "通河县"
        }, {
          name: "巴彦县"
        }, {
          name: "延寿县"
        }, {
          name: "木兰县"
        }, {
          name: "依兰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "齐齐哈尔",
        sub: [{
          name: "龙沙区"
        }, {
          name: "昂昂溪区"
        }, {
          name: "铁锋区"
        }, {
          name: "建华区"
        }, {
          name: "富拉尔基区"
        }, {
          name: "碾子山区"
        }, {
          name: "梅里斯达斡尔族区"
        }, {
          name: "讷河市"
        }, {
          name: "富裕县"
        }, {
          name: "拜泉县"
        }, {
          name: "甘南县"
        }, {
          name: "依安县"
        }, {
          name: "克山县"
        }, {
          name: "泰来县"
        }, {
          name: "克东县"
        }, {
          name: "龙江县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鹤岗",
        sub: [{
          name: "兴山区"
        }, {
          name: "工农区"
        }, {
          name: "南山区"
        }, {
          name: "兴安区"
        }, {
          name: "向阳区"
        }, {
          name: "东山区"
        }, {
          name: "萝北县"
        }, {
          name: "绥滨县"
        }, {
          name: "其他"
        }]
      }, {
        name: "双鸭山",
        sub: [{
          name: "尖山区"
        }, {
          name: "岭东区"
        }, {
          name: "四方台区"
        }, {
          name: "宝山区"
        }, {
          name: "集贤县"
        }, {
          name: "宝清县"
        }, {
          name: "友谊县"
        }, {
          name: "饶河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鸡西",
        sub: [{
          name: "鸡冠区"
        }, {
          name: "恒山区"
        }, {
          name: "城子河区"
        }, {
          name: "滴道区"
        }, {
          name: "梨树区"
        }, {
          name: "麻山区"
        }, {
          name: "密山市"
        }, {
          name: "虎林市"
        }, {
          name: "鸡东县"
        }, {
          name: "其他"
        }]
      }, {
        name: "大庆",
        sub: [{
          name: "萨尔图区"
        }, {
          name: "红岗区"
        }, {
          name: "龙凤区"
        }, {
          name: "让胡路区"
        }, {
          name: "大同区"
        }, {
          name: "林甸县"
        }, {
          name: "肇州县"
        }, {
          name: "肇源县"
        }, {
          name: "杜尔伯特蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "伊春",
        sub: [{
          name: "伊春区"
        }, {
          name: "带岭区"
        }, {
          name: "南岔区"
        }, {
          name: "金山屯区"
        }, {
          name: "西林区"
        }, {
          name: "美溪区"
        }, {
          name: "乌马河区"
        }, {
          name: "翠峦区"
        }, {
          name: "友好区"
        }, {
          name: "上甘岭区"
        }, {
          name: "五营区"
        }, {
          name: "红星区"
        }, {
          name: "新青区"
        }, {
          name: "汤旺河区"
        }, {
          name: "乌伊岭区"
        }, {
          name: "铁力市"
        }, {
          name: "嘉荫县"
        }, {
          name: "其他"
        }]
      }, {
        name: "牡丹江",
        sub: [{
          name: "爱民区"
        }, {
          name: "东安区"
        }, {
          name: "阳明区"
        }, {
          name: "西安区"
        }, {
          name: "绥芬河市"
        }, {
          name: "宁安市"
        }, {
          name: "海林市"
        }, {
          name: "穆棱市"
        }, {
          name: "林口县"
        }, {
          name: "东宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "佳木斯",
        sub: [{
          name: "向阳区"
        }, {
          name: "前进区"
        }, {
          name: "东风区"
        }, {
          name: "郊区"
        }, {
          name: "同江市"
        }, {
          name: "富锦市"
        }, {
          name: "桦川县"
        }, {
          name: "抚远县"
        }, {
          name: "桦南县"
        }, {
          name: "汤原县"
        }, {
          name: "其他"
        }]
      }, {
        name: "七台河",
        sub: [{
          name: "桃山区"
        }, {
          name: "新兴区"
        }, {
          name: "茄子河区"
        }, {
          name: "勃利县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黑河",
        sub: [{
          name: "爱辉区"
        }, {
          name: "北安市"
        }, {
          name: "五大连池市"
        }, {
          name: "逊克县"
        }, {
          name: "嫩江县"
        }, {
          name: "孙吴县"
        }, {
          name: "其他"
        }]
      }, {
        name: "绥化",
        sub: [{
          name: "北林区"
        }, {
          name: "安达市"
        }, {
          name: "肇东市"
        }, {
          name: "海伦市"
        }, {
          name: "绥棱县"
        }, {
          name: "兰西县"
        }, {
          name: "明水县"
        }, {
          name: "青冈县"
        }, {
          name: "庆安县"
        }, {
          name: "望奎县"
        }, {
          name: "其他"
        }]
      }, {
        name: "大兴安岭地区",
        sub: [{
          name: "呼玛县"
        }, {
          name: "塔河县"
        }, {
          name: "漠河县"
        }, {
          name: "大兴安岭辖区"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "内蒙古",
      sub: [{
        name: "呼和浩特",
        sub: [{
          name: "回民区"
        }, {
          name: "玉泉区"
        }, {
          name: "新城区"
        }, {
          name: "赛罕区"
        }, {
          name: "托克托县"
        }, {
          name: "清水河县"
        }, {
          name: "武川县"
        }, {
          name: "和林格尔县"
        }, {
          name: "土默特左旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "包头",
        sub: [{
          name: "昆都仑区"
        }, {
          name: "青山区"
        }, {
          name: "东河区"
        }, {
          name: "九原区"
        }, {
          name: "石拐区"
        }, {
          name: "白云矿区"
        }, {
          name: "固阳县"
        }, {
          name: "土默特右旗"
        }, {
          name: "达尔罕茂明安联合旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "乌海",
        sub: [{
          name: "海勃湾区"
        }, {
          name: "乌达区"
        }, {
          name: "海南区"
        }, {
          name: "其他"
        }]
      }, {
        name: "赤峰",
        sub: [{
          name: "红山区"
        }, {
          name: "元宝山区"
        }, {
          name: "松山区"
        }, {
          name: "宁城县"
        }, {
          name: "林西县"
        }, {
          name: "喀喇沁旗"
        }, {
          name: "巴林左旗"
        }, {
          name: "敖汉旗"
        }, {
          name: "阿鲁科尔沁旗"
        }, {
          name: "翁牛特旗"
        }, {
          name: "克什克腾旗"
        }, {
          name: "巴林右旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "通辽",
        sub: [{
          name: "科尔沁区"
        }, {
          name: "霍林郭勒市"
        }, {
          name: "开鲁县"
        }, {
          name: "科尔沁左翼中旗"
        }, {
          name: "科尔沁左翼后旗"
        }, {
          name: "库伦旗"
        }, {
          name: "奈曼旗"
        }, {
          name: "扎鲁特旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "鄂尔多斯",
        sub: [{
          name: "东胜区"
        }, {
          name: "准格尔旗"
        }, {
          name: "乌审旗"
        }, {
          name: "伊金霍洛旗"
        }, {
          name: "鄂托克旗"
        }, {
          name: "鄂托克前旗"
        }, {
          name: "杭锦旗"
        }, {
          name: "达拉特旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "呼伦贝尔",
        sub: [{
          name: "海拉尔区"
        }, {
          name: "满洲里市"
        }, {
          name: "牙克石市"
        }, {
          name: "扎兰屯市"
        }, {
          name: "根河市"
        }, {
          name: "额尔古纳市"
        }, {
          name: "陈巴尔虎旗"
        }, {
          name: "阿荣旗"
        }, {
          name: "新巴尔虎左旗"
        }, {
          name: "新巴尔虎右旗"
        }, {
          name: "鄂伦春自治旗"
        }, {
          name: "莫力达瓦达斡尔族自治旗"
        }, {
          name: "鄂温克族自治旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "巴彦淖尔",
        sub: [{
          name: "临河区"
        }, {
          name: "五原县"
        }, {
          name: "磴口县"
        }, {
          name: "杭锦后旗"
        }, {
          name: "乌拉特中旗"
        }, {
          name: "乌拉特前旗"
        }, {
          name: "乌拉特后旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "乌兰察布",
        sub: [{
          name: "集宁区"
        }, {
          name: "丰镇市"
        }, {
          name: "兴和县"
        }, {
          name: "卓资县"
        }, {
          name: "商都县"
        }, {
          name: "凉城县"
        }, {
          name: "化德县"
        }, {
          name: "四子王旗"
        }, {
          name: "察哈尔右翼前旗"
        }, {
          name: "察哈尔右翼中旗"
        }, {
          name: "察哈尔右翼后旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "锡林郭勒盟",
        sub: [{
          name: "锡林浩特市"
        }, {
          name: "二连浩特市"
        }, {
          name: "多伦县"
        }, {
          name: "阿巴嘎旗"
        }, {
          name: "西乌珠穆沁旗"
        }, {
          name: "东乌珠穆沁旗"
        }, {
          name: "苏尼特左旗"
        }, {
          name: "苏尼特右旗"
        }, {
          name: "太仆寺旗"
        }, {
          name: "正镶白旗"
        }, {
          name: "正蓝旗"
        }, {
          name: "镶黄旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "兴安盟",
        sub: [{
          name: "乌兰浩特市"
        }, {
          name: "阿尔山市"
        }, {
          name: "突泉县"
        }, {
          name: "扎赉特旗"
        }, {
          name: "科尔沁右翼前旗"
        }, {
          name: "科尔沁右翼中旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "阿拉善盟",
        sub: [{
          name: "阿拉善左旗"
        }, {
          name: "阿拉善右旗"
        }, {
          name: "额济纳旗"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "山东",
      sub: [{
        name: "济南",
        sub: [{
          name: "市中区"
        }, {
          name: "历下区"
        }, {
          name: "天桥区"
        }, {
          name: "槐荫区"
        }, {
          name: "历城区"
        }, {
          name: "长清区"
        }, {
          name: "章丘市"
        }, {
          name: "平阴县"
        }, {
          name: "济阳县"
        }, {
          name: "商河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "青岛",
        sub: [{
          name: "市南区"
        }, {
          name: "市北区"
        }, {
          name: "城阳区"
        }, {
          name: "四方区"
        }, {
          name: "李沧区"
        }, {
          name: "黄岛区"
        }, {
          name: "崂山区"
        }, {
          name: "胶南市"
        }, {
          name: "胶州市"
        }, {
          name: "平度市"
        }, {
          name: "莱西市"
        }, {
          name: "即墨市"
        }, {
          name: "其他"
        }]
      }, {
        name: "淄博",
        sub: [{
          name: "张店区"
        }, {
          name: "临淄区"
        }, {
          name: "淄川区"
        }, {
          name: "博山区"
        }, {
          name: "周村区"
        }, {
          name: "桓台县"
        }, {
          name: "高青县"
        }, {
          name: "沂源县"
        }, {
          name: "其他"
        }]
      }, {
        name: "枣庄",
        sub: [{
          name: "市中区"
        }, {
          name: "山亭区"
        }, {
          name: "峄城区"
        }, {
          name: "台儿庄区"
        }, {
          name: "薛城区"
        }, {
          name: "滕州市"
        }, {
          name: "其他"
        }]
      }, {
        name: "东营",
        sub: [{
          name: "东营区"
        }, {
          name: "河口区"
        }, {
          name: "垦利县"
        }, {
          name: "广饶县"
        }, {
          name: "利津县"
        }, {
          name: "其他"
        }]
      }, {
        name: "烟台",
        sub: [{
          name: "芝罘区"
        }, {
          name: "福山区"
        }, {
          name: "牟平区"
        }, {
          name: "莱山区"
        }, {
          name: "龙口市"
        }, {
          name: "莱阳市"
        }, {
          name: "莱州市"
        }, {
          name: "招远市"
        }, {
          name: "蓬莱市"
        }, {
          name: "栖霞市"
        }, {
          name: "海阳市"
        }, {
          name: "长岛县"
        }, {
          name: "其他"
        }]
      }, {
        name: "潍坊",
        sub: [{
          name: "潍城区"
        }, {
          name: "寒亭区"
        }, {
          name: "坊子区"
        }, {
          name: "奎文区"
        }, {
          name: "青州市"
        }, {
          name: "诸城市"
        }, {
          name: "寿光市"
        }, {
          name: "安丘市"
        }, {
          name: "高密市"
        }, {
          name: "昌邑市"
        }, {
          name: "昌乐县"
        }, {
          name: "临朐县"
        }, {
          name: "其他"
        }]
      }, {
        name: "济宁",
        sub: [{
          name: "市中区"
        }, {
          name: "任城区"
        }, {
          name: "曲阜市"
        }, {
          name: "兖州市"
        }, {
          name: "邹城市"
        }, {
          name: "鱼台县"
        }, {
          name: "金乡县"
        }, {
          name: "嘉祥县"
        }, {
          name: "微山县"
        }, {
          name: "汶上县"
        }, {
          name: "泗水县"
        }, {
          name: "梁山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "泰安",
        sub: [{
          name: "泰山区"
        }, {
          name: "岱岳区"
        }, {
          name: "新泰市"
        }, {
          name: "肥城市"
        }, {
          name: "宁阳县"
        }, {
          name: "东平县"
        }, {
          name: "其他"
        }]
      }, {
        name: "威海",
        sub: [{
          name: "环翠区"
        }, {
          name: "乳山市"
        }, {
          name: "文登市"
        }, {
          name: "荣成市"
        }, {
          name: "其他"
        }]
      }, {
        name: "日照",
        sub: [{
          name: "东港区"
        }, {
          name: "岚山区"
        }, {
          name: "五莲县"
        }, {
          name: "莒县"
        }, {
          name: "其他"
        }]
      }, {
        name: "莱芜",
        sub: [{
          name: "莱城区"
        }, {
          name: "钢城区"
        }, {
          name: "其他"
        }]
      }, {
        name: "临沂",
        sub: [{
          name: "兰山区"
        }, {
          name: "罗庄区"
        }, {
          name: "河东区"
        }, {
          name: "沂南县"
        }, {
          name: "郯城县"
        }, {
          name: "沂水县"
        }, {
          name: "苍山县"
        }, {
          name: "费县"
        }, {
          name: "平邑县"
        }, {
          name: "莒南县"
        }, {
          name: "蒙阴县"
        }, {
          name: "临沭县"
        }, {
          name: "其他"
        }]
      }, {
        name: "德州",
        sub: [{
          name: "德城区"
        }, {
          name: "乐陵市"
        }, {
          name: "禹城市"
        }, {
          name: "陵县"
        }, {
          name: "宁津县"
        }, {
          name: "齐河县"
        }, {
          name: "武城县"
        }, {
          name: "庆云县"
        }, {
          name: "平原县"
        }, {
          name: "夏津县"
        }, {
          name: "临邑县"
        }, {
          name: "其他"
        }]
      }, {
        name: "聊城",
        sub: [{
          name: "东昌府区"
        }, {
          name: "临清市"
        }, {
          name: "高唐县"
        }, {
          name: "阳谷县"
        }, {
          name: "茌平县"
        }, {
          name: "莘县"
        }, {
          name: "东阿县"
        }, {
          name: "冠县"
        }, {
          name: "其他"
        }]
      }, {
        name: "滨州",
        sub: [{
          name: "滨城区"
        }, {
          name: "邹平县"
        }, {
          name: "沾化县"
        }, {
          name: "惠民县"
        }, {
          name: "博兴县"
        }, {
          name: "阳信县"
        }, {
          name: "无棣县"
        }, {
          name: "其他"
        }]
      }, {
        name: "菏泽",
        sub: [{
          name: "牡丹区"
        }, {
          name: "鄄城县"
        }, {
          name: "单县"
        }, {
          name: "郓城县"
        }, {
          name: "曹县"
        }, {
          name: "定陶县"
        }, {
          name: "巨野县"
        }, {
          name: "东明县"
        }, {
          name: "成武县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "安徽",
      sub: [{
        name: "合肥",
        sub: [{
          name: "庐阳区"
        }, {
          name: "瑶海区"
        }, {
          name: "蜀山区"
        }, {
          name: "包河区"
        }, {
          name: "长丰县"
        }, {
          name: "肥东县"
        }, {
          name: "肥西县"
        }, {
          name: "其他"
        }]
      }, {
        name: "芜湖",
        sub: [{
          name: "镜湖区"
        }, {
          name: "弋江区"
        }, {
          name: "鸠江区"
        }, {
          name: "三山区"
        }, {
          name: "芜湖县"
        }, {
          name: "南陵县"
        }, {
          name: "繁昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "蚌埠",
        sub: [{
          name: "蚌山区"
        }, {
          name: "龙子湖区"
        }, {
          name: "禹会区"
        }, {
          name: "淮上区"
        }, {
          name: "怀远县"
        }, {
          name: "固镇县"
        }, {
          name: "五河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "淮南",
        sub: [{
          name: "田家庵区"
        }, {
          name: "大通区"
        }, {
          name: "谢家集区"
        }, {
          name: "八公山区"
        }, {
          name: "潘集区"
        }, {
          name: "凤台县"
        }, {
          name: "其他"
        }]
      }, {
        name: "马鞍山",
        sub: [{
          name: "雨山区"
        }, {
          name: "花山区"
        }, {
          name: "金家庄区"
        }, {
          name: "当涂县"
        }, {
          name: "其他"
        }]
      }, {
        name: "淮北",
        sub: [{
          name: "相山区"
        }, {
          name: "杜集区"
        }, {
          name: "烈山区"
        }, {
          name: "濉溪县"
        }, {
          name: "其他"
        }]
      }, {
        name: "铜陵",
        sub: [{
          name: "铜官山区"
        }, {
          name: "狮子山区"
        }, {
          name: "郊区"
        }, {
          name: "铜陵县"
        }, {
          name: "其他"
        }]
      }, {
        name: "安庆",
        sub: [{
          name: "迎江区"
        }, {
          name: "大观区"
        }, {
          name: "宜秀区"
        }, {
          name: "桐城市"
        }, {
          name: "宿松县"
        }, {
          name: "枞阳县"
        }, {
          name: "太湖县"
        }, {
          name: "怀宁县"
        }, {
          name: "岳西县"
        }, {
          name: "望江县"
        }, {
          name: "潜山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黄山",
        sub: [{
          name: "屯溪区"
        }, {
          name: "黄山区"
        }, {
          name: "徽州区"
        }, {
          name: "休宁县"
        }, {
          name: "歙县"
        }, {
          name: "祁门县"
        }, {
          name: "黟县"
        }, {
          name: "其他"
        }]
      }, {
        name: "滁州",
        sub: [{
          name: "琅琊区"
        }, {
          name: "南谯区"
        }, {
          name: "天长市"
        }, {
          name: "明光市"
        }, {
          name: "全椒县"
        }, {
          name: "来安县"
        }, {
          name: "定远县"
        }, {
          name: "凤阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阜阳",
        sub: [{
          name: "颍州区"
        }, {
          name: "颍东区"
        }, {
          name: "颍泉区"
        }, {
          name: "界首市"
        }, {
          name: "临泉县"
        }, {
          name: "颍上县"
        }, {
          name: "阜南县"
        }, {
          name: "太和县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宿州",
        sub: [{
          name: "埇桥区"
        }, {
          name: "萧县"
        }, {
          name: "泗县"
        }, {
          name: "砀山县"
        }, {
          name: "灵璧县"
        }, {
          name: "其他"
        }]
      }, {
        name: "巢湖",
        sub: [{
          name: "居巢区"
        }, {
          name: "含山县"
        }, {
          name: "无为县"
        }, {
          name: "庐江县"
        }, {
          name: "和县"
        }, {
          name: "其他"
        }]
      }, {
        name: "六安",
        sub: [{
          name: "金安区"
        }, {
          name: "裕安区"
        }, {
          name: "寿县"
        }, {
          name: "霍山县"
        }, {
          name: "霍邱县"
        }, {
          name: "舒城县"
        }, {
          name: "金寨县"
        }, {
          name: "其他"
        }]
      }, {
        name: "亳州",
        sub: [{
          name: "谯城区"
        }, {
          name: "利辛县"
        }, {
          name: "涡阳县"
        }, {
          name: "蒙城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "池州",
        sub: [{
          name: "贵池区"
        }, {
          name: "东至县"
        }, {
          name: "石台县"
        }, {
          name: "青阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宣城",
        sub: [{
          name: "宣州区"
        }, {
          name: "宁国市"
        }, {
          name: "广德县"
        }, {
          name: "郎溪县"
        }, {
          name: "泾县"
        }, {
          name: "旌德县"
        }, {
          name: "绩溪县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "浙江",
      sub: [{
        name: "杭州",
        sub: [{
          name: "拱墅区"
        }, {
          name: "西湖区"
        }, {
          name: "上城区"
        }, {
          name: "下城区"
        }, {
          name: "江干区"
        }, {
          name: "滨江区"
        }, {
          name: "余杭区"
        }, {
          name: "萧山区"
        }, {
          name: "建德市"
        }, {
          name: "富阳市"
        }, {
          name: "临安市"
        }, {
          name: "桐庐县"
        }, {
          name: "淳安县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宁波",
        sub: [{
          name: "海曙区"
        }, {
          name: "江东区"
        }, {
          name: "江北区"
        }, {
          name: "镇海区"
        }, {
          name: "北仑区"
        }, {
          name: "鄞州区"
        }, {
          name: "余姚市"
        }, {
          name: "慈溪市"
        }, {
          name: "奉化市"
        }, {
          name: "宁海县"
        }, {
          name: "象山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "温州",
        sub: [{
          name: "鹿城区"
        }, {
          name: "龙湾区"
        }, {
          name: "瓯海区"
        }, {
          name: "瑞安市"
        }, {
          name: "乐清市"
        }, {
          name: "永嘉县"
        }, {
          name: "洞头县"
        }, {
          name: "平阳县"
        }, {
          name: "苍南县"
        }, {
          name: "文成县"
        }, {
          name: "泰顺县"
        }, {
          name: "其他"
        }]
      }, {
        name: "嘉兴",
        sub: [{
          name: "秀城区"
        }, {
          name: "秀洲区"
        }, {
          name: "海宁市"
        }, {
          name: "平湖市"
        }, {
          name: "桐乡市"
        }, {
          name: "嘉善县"
        }, {
          name: "海盐县"
        }, {
          name: "其他"
        }]
      }, {
        name: "湖州",
        sub: [{
          name: "吴兴区"
        }, {
          name: "南浔区"
        }, {
          name: "长兴县"
        }, {
          name: "德清县"
        }, {
          name: "安吉县"
        }, {
          name: "其他"
        }]
      }, {
        name: "绍兴",
        sub: [{
          name: "越城区"
        }, {
          name: "诸暨市"
        }, {
          name: "上虞市"
        }, {
          name: "嵊州市"
        }, {
          name: "绍兴县"
        }, {
          name: "新昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "金华",
        sub: [{
          name: "婺城区"
        }, {
          name: "金东区"
        }, {
          name: "兰溪市"
        }, {
          name: "义乌市"
        }, {
          name: "东阳市"
        }, {
          name: "永康市"
        }, {
          name: "武义县"
        }, {
          name: "浦江县"
        }, {
          name: "磐安县"
        }, {
          name: "其他"
        }]
      }, {
        name: "衢州",
        sub: [{
          name: "柯城区"
        }, {
          name: "衢江区"
        }, {
          name: "江山市"
        }, {
          name: "龙游县"
        }, {
          name: "常山县"
        }, {
          name: "开化县"
        }, {
          name: "其他"
        }]
      }, {
        name: "舟山",
        sub: [{
          name: "定海区"
        }, {
          name: "普陀区"
        }, {
          name: "岱山县"
        }, {
          name: "嵊泗县"
        }, {
          name: "其他"
        }]
      }, {
        name: "台州",
        sub: [{
          name: "椒江区"
        }, {
          name: "黄岩区"
        }, {
          name: "路桥区"
        }, {
          name: "临海市"
        }, {
          name: "温岭市"
        }, {
          name: "玉环县"
        }, {
          name: "天台县"
        }, {
          name: "仙居县"
        }, {
          name: "三门县"
        }, {
          name: "其他"
        }]
      }, {
        name: "丽水",
        sub: [{
          name: "莲都区"
        }, {
          name: "龙泉市"
        }, {
          name: "缙云县"
        }, {
          name: "青田县"
        }, {
          name: "云和县"
        }, {
          name: "遂昌县"
        }, {
          name: "松阳县"
        }, {
          name: "庆元县"
        }, {
          name: "景宁畲族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "福建",
      sub: [{
        name: "福州",
        sub: [{
          name: "鼓楼区"
        }, {
          name: "台江区"
        }, {
          name: "仓山区"
        }, {
          name: "马尾区"
        }, {
          name: "晋安区"
        }, {
          name: "福清市"
        }, {
          name: "长乐市"
        }, {
          name: "闽侯县"
        }, {
          name: "闽清县"
        }, {
          name: "永泰县"
        }, {
          name: "连江县"
        }, {
          name: "罗源县"
        }, {
          name: "平潭县"
        }, {
          name: "其他"
        }]
      }, {
        name: "厦门",
        sub: [{
          name: "思明区"
        }, {
          name: "海沧区"
        }, {
          name: "湖里区"
        }, {
          name: "集美区"
        }, {
          name: "同安区"
        }, {
          name: "翔安区"
        }, {
          name: "其他"
        }]
      }, {
        name: "莆田",
        sub: [{
          name: "城厢区"
        }, {
          name: "涵江区"
        }, {
          name: "荔城区"
        }, {
          name: "秀屿区"
        }, {
          name: "仙游县"
        }, {
          name: "其他"
        }]
      }, {
        name: "三明",
        sub: [{
          name: "梅列区"
        }, {
          name: "三元区"
        }, {
          name: "永安市"
        }, {
          name: "明溪县"
        }, {
          name: "将乐县"
        }, {
          name: "大田县"
        }, {
          name: "宁化县"
        }, {
          name: "建宁县"
        }, {
          name: "沙县"
        }, {
          name: "尤溪县"
        }, {
          name: "清流县"
        }, {
          name: "泰宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "泉州",
        sub: [{
          name: "鲤城区"
        }, {
          name: "丰泽区"
        }, {
          name: "洛江区"
        }, {
          name: "泉港区"
        }, {
          name: "石狮市"
        }, {
          name: "晋江市"
        }, {
          name: "南安市"
        }, {
          name: "惠安县"
        }, {
          name: "永春县"
        }, {
          name: "安溪县"
        }, {
          name: "德化县"
        }, {
          name: "金门县"
        }, {
          name: "其他"
        }]
      }, {
        name: "漳州",
        sub: [{
          name: "芗城区"
        }, {
          name: "龙文区"
        }, {
          name: "龙海市"
        }, {
          name: "平和县"
        }, {
          name: "南靖县"
        }, {
          name: "诏安县"
        }, {
          name: "漳浦县"
        }, {
          name: "华安县"
        }, {
          name: "东山县"
        }, {
          name: "长泰县"
        }, {
          name: "云霄县"
        }, {
          name: "其他"
        }]
      }, {
        name: "南平",
        sub: [{
          name: "延平区"
        }, {
          name: "建瓯市"
        }, {
          name: "邵武市"
        }, {
          name: "武夷山市"
        }, {
          name: "建阳市"
        }, {
          name: "松溪县"
        }, {
          name: "光泽县"
        }, {
          name: "顺昌县"
        }, {
          name: "浦城县"
        }, {
          name: "政和县"
        }, {
          name: "其他"
        }]
      }, {
        name: "龙岩",
        sub: [{
          name: "新罗区"
        }, {
          name: "漳平市"
        }, {
          name: "长汀县"
        }, {
          name: "武平县"
        }, {
          name: "上杭县"
        }, {
          name: "永定县"
        }, {
          name: "连城县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宁德",
        sub: [{
          name: "蕉城区"
        }, {
          name: "福安市"
        }, {
          name: "福鼎市"
        }, {
          name: "寿宁县"
        }, {
          name: "霞浦县"
        }, {
          name: "柘荣县"
        }, {
          name: "屏南县"
        }, {
          name: "古田县"
        }, {
          name: "周宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "湖南",
      sub: [{
        name: "长沙",
        sub: [{
          name: "岳麓区"
        }, {
          name: "芙蓉区"
        }, {
          name: "天心区"
        }, {
          name: "开福区"
        }, {
          name: "雨花区"
        }, {
          name: "浏阳市"
        }, {
          name: "长沙县"
        }, {
          name: "望城县"
        }, {
          name: "宁乡县"
        }, {
          name: "其他"
        }]
      }, {
        name: "株洲",
        sub: [{
          name: "天元区"
        }, {
          name: "荷塘区"
        }, {
          name: "芦淞区"
        }, {
          name: "石峰区"
        }, {
          name: "醴陵市"
        }, {
          name: "株洲县"
        }, {
          name: "炎陵县"
        }, {
          name: "茶陵县"
        }, {
          name: "攸县"
        }, {
          name: "其他"
        }]
      }, {
        name: "湘潭",
        sub: [{
          name: "岳塘区"
        }, {
          name: "雨湖区"
        }, {
          name: "湘乡市"
        }, {
          name: "韶山市"
        }, {
          name: "湘潭县"
        }, {
          name: "其他"
        }]
      }, {
        name: "衡阳",
        sub: [{
          name: "雁峰区"
        }, {
          name: "珠晖区"
        }, {
          name: "石鼓区"
        }, {
          name: "蒸湘区"
        }, {
          name: "南岳区"
        }, {
          name: "耒阳市"
        }, {
          name: "常宁市"
        }, {
          name: "衡阳县"
        }, {
          name: "衡东县"
        }, {
          name: "衡山县"
        }, {
          name: "衡南县"
        }, {
          name: "祁东县"
        }, {
          name: "其他"
        }]
      }, {
        name: "邵阳",
        sub: [{
          name: "双清区"
        }, {
          name: "大祥区"
        }, {
          name: "北塔区"
        }, {
          name: "武冈市"
        }, {
          name: "邵东县"
        }, {
          name: "洞口县"
        }, {
          name: "新邵县"
        }, {
          name: "绥宁县"
        }, {
          name: "新宁县"
        }, {
          name: "邵阳县"
        }, {
          name: "隆回县"
        }, {
          name: "城步苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "岳阳",
        sub: [{
          name: "岳阳楼区"
        }, {
          name: "云溪区"
        }, {
          name: "君山区"
        }, {
          name: "临湘市"
        }, {
          name: "汨罗市"
        }, {
          name: "岳阳县"
        }, {
          name: "湘阴县"
        }, {
          name: "平江县"
        }, {
          name: "华容县"
        }, {
          name: "其他"
        }]
      }, {
        name: "常德",
        sub: [{
          name: "武陵区"
        }, {
          name: "鼎城区"
        }, {
          name: "津市市"
        }, {
          name: "澧县"
        }, {
          name: "临澧县"
        }, {
          name: "桃源县"
        }, {
          name: "汉寿县"
        }, {
          name: "安乡县"
        }, {
          name: "石门县"
        }, {
          name: "其他"
        }]
      }, {
        name: "张家界",
        sub: [{
          name: "永定区"
        }, {
          name: "武陵源区"
        }, {
          name: "慈利县"
        }, {
          name: "桑植县"
        }, {
          name: "其他"
        }]
      }, {
        name: "益阳",
        sub: [{
          name: "赫山区"
        }, {
          name: "资阳区"
        }, {
          name: "沅江市"
        }, {
          name: "桃江县"
        }, {
          name: "南县"
        }, {
          name: "安化县"
        }, {
          name: "其他"
        }]
      }, {
        name: "郴州",
        sub: [{
          name: "北湖区"
        }, {
          name: "苏仙区"
        }, {
          name: "资兴市"
        }, {
          name: "宜章县"
        }, {
          name: "汝城县"
        }, {
          name: "安仁县"
        }, {
          name: "嘉禾县"
        }, {
          name: "临武县"
        }, {
          name: "桂东县"
        }, {
          name: "永兴县"
        }, {
          name: "桂阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "永州",
        sub: [{
          name: "冷水滩区"
        }, {
          name: "零陵区"
        }, {
          name: "祁阳县"
        }, {
          name: "蓝山县"
        }, {
          name: "宁远县"
        }, {
          name: "新田县"
        }, {
          name: "东安县"
        }, {
          name: "江永县"
        }, {
          name: "道县"
        }, {
          name: "双牌县"
        }, {
          name: "江华瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "怀化",
        sub: [{
          name: "鹤城区"
        }, {
          name: "洪江市"
        }, {
          name: "会同县"
        }, {
          name: "沅陵县"
        }, {
          name: "辰溪县"
        }, {
          name: "溆浦县"
        }, {
          name: "中方县"
        }, {
          name: "新晃侗族自治县"
        }, {
          name: "芷江侗族自治县"
        }, {
          name: "通道侗族自治县"
        }, {
          name: "靖州苗族侗族自治县"
        }, {
          name: "麻阳苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "娄底",
        sub: [{
          name: "娄星区"
        }, {
          name: "冷水江市"
        }, {
          name: "涟源市"
        }, {
          name: "新化县"
        }, {
          name: "双峰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "湘西土家族苗族自治州",
        sub: [{
          name: "吉首市"
        }, {
          name: "古丈县"
        }, {
          name: "龙山县"
        }, {
          name: "永顺县"
        }, {
          name: "凤凰县"
        }, {
          name: "泸溪县"
        }, {
          name: "保靖县"
        }, {
          name: "花垣县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "广西",
      sub: [{
        name: "南宁",
        sub: [{
          name: "青秀区"
        }, {
          name: "兴宁区"
        }, {
          name: "西乡塘区"
        }, {
          name: "良庆区"
        }, {
          name: "江南区"
        }, {
          name: "邕宁区"
        }, {
          name: "武鸣县"
        }, {
          name: "隆安县"
        }, {
          name: "马山县"
        }, {
          name: "上林县"
        }, {
          name: "宾阳县"
        }, {
          name: "横县"
        }, {
          name: "其他"
        }]
      }, {
        name: "柳州",
        sub: [{
          name: "城中区"
        }, {
          name: "鱼峰区"
        }, {
          name: "柳北区"
        }, {
          name: "柳南区"
        }, {
          name: "柳江县"
        }, {
          name: "柳城县"
        }, {
          name: "鹿寨县"
        }, {
          name: "融安县"
        }, {
          name: "融水苗族自治县"
        }, {
          name: "三江侗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "桂林",
        sub: [{
          name: "象山区"
        }, {
          name: "秀峰区"
        }, {
          name: "叠彩区"
        }, {
          name: "七星区"
        }, {
          name: "雁山区"
        }, {
          name: "阳朔县"
        }, {
          name: "临桂县"
        }, {
          name: "灵川县"
        }, {
          name: "全州县"
        }, {
          name: "平乐县"
        }, {
          name: "兴安县"
        }, {
          name: "灌阳县"
        }, {
          name: "荔浦县"
        }, {
          name: "资源县"
        }, {
          name: "永福县"
        }, {
          name: "龙胜各族自治县"
        }, {
          name: "恭城瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "梧州",
        sub: [{
          name: "万秀区"
        }, {
          name: "蝶山区"
        }, {
          name: "长洲区"
        }, {
          name: "岑溪市"
        }, {
          name: "苍梧县"
        }, {
          name: "藤县"
        }, {
          name: "蒙山县"
        }, {
          name: "其他"
        }]
      }, {
        name: "北海",
        sub: [{
          name: "海城区"
        }, {
          name: "银海区"
        }, {
          name: "铁山港区"
        }, {
          name: "合浦县"
        }, {
          name: "其他"
        }]
      }, {
        name: "防城港",
        sub: [{
          name: "港口区"
        }, {
          name: "防城区"
        }, {
          name: "东兴市"
        }, {
          name: "上思县"
        }, {
          name: "其他"
        }]
      }, {
        name: "钦州",
        sub: [{
          name: "钦南区"
        }, {
          name: "钦北区"
        }, {
          name: "灵山县"
        }, {
          name: "浦北县"
        }, {
          name: "其他"
        }]
      }, {
        name: "贵港",
        sub: [{
          name: "港北区"
        }, {
          name: "港南区"
        }, {
          name: "覃塘区"
        }, {
          name: "桂平市"
        }, {
          name: "平南县"
        }, {
          name: "其他"
        }]
      }, {
        name: "玉林",
        sub: [{
          name: "玉州区"
        }, {
          name: "北流市"
        }, {
          name: "容县"
        }, {
          name: "陆川县"
        }, {
          name: "博白县"
        }, {
          name: "兴业县"
        }, {
          name: "其他"
        }]
      }, {
        name: "百色",
        sub: [{
          name: "右江区"
        }, {
          name: "凌云县"
        }, {
          name: "平果县"
        }, {
          name: "西林县"
        }, {
          name: "乐业县"
        }, {
          name: "德保县"
        }, {
          name: "田林县"
        }, {
          name: "田阳县"
        }, {
          name: "靖西县"
        }, {
          name: "田东县"
        }, {
          name: "那坡县"
        }, {
          name: "隆林各族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "贺州",
        sub: [{
          name: "八步区"
        }, {
          name: "钟山县"
        }, {
          name: "昭平县"
        }, {
          name: "富川瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "河池",
        sub: [{
          name: "金城江区"
        }, {
          name: "宜州市"
        }, {
          name: "天峨县"
        }, {
          name: "凤山县"
        }, {
          name: "南丹县"
        }, {
          name: "东兰县"
        }, {
          name: "都安瑶族自治县"
        }, {
          name: "罗城仫佬族自治县"
        }, {
          name: "巴马瑶族自治县"
        }, {
          name: "环江毛南族自治县"
        }, {
          name: "大化瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "来宾",
        sub: [{
          name: "兴宾区"
        }, {
          name: "合山市"
        }, {
          name: "象州县"
        }, {
          name: "武宣县"
        }, {
          name: "忻城县"
        }, {
          name: "金秀瑶族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "崇左",
        sub: [{
          name: "江州区"
        }, {
          name: "凭祥市"
        }, {
          name: "宁明县"
        }, {
          name: "扶绥县"
        }, {
          name: "龙州县"
        }, {
          name: "大新县"
        }, {
          name: "天等县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "江西",
      sub: [{
        name: "南昌",
        sub: [{
          name: "东湖区"
        }, {
          name: "西湖区"
        }, {
          name: "青云谱区"
        }, {
          name: "湾里区"
        }, {
          name: "青山湖区"
        }, {
          name: "新建县"
        }, {
          name: "南昌县"
        }, {
          name: "进贤县"
        }, {
          name: "安义县"
        }, {
          name: "其他"
        }]
      }, {
        name: "景德镇",
        sub: [{
          name: "珠山区"
        }, {
          name: "昌江区"
        }, {
          name: "乐平市"
        }, {
          name: "浮梁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "萍乡",
        sub: [{
          name: "安源区"
        }, {
          name: "湘东区"
        }, {
          name: "莲花县"
        }, {
          name: "上栗县"
        }, {
          name: "芦溪县"
        }, {
          name: "其他"
        }]
      }, {
        name: "九江",
        sub: [{
          name: "浔阳区"
        }, {
          name: "庐山区"
        }, {
          name: "瑞昌市"
        }, {
          name: "九江县"
        }, {
          name: "星子县"
        }, {
          name: "武宁县"
        }, {
          name: "彭泽县"
        }, {
          name: "永修县"
        }, {
          name: "修水县"
        }, {
          name: "湖口县"
        }, {
          name: "德安县"
        }, {
          name: "都昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "新余",
        sub: [{
          name: "渝水区"
        }, {
          name: "分宜县"
        }, {
          name: "其他"
        }]
      }, {
        name: "鹰潭",
        sub: [{
          name: "月湖区"
        }, {
          name: "贵溪市"
        }, {
          name: "余江县"
        }, {
          name: "其他"
        }]
      }, {
        name: "赣州",
        sub: [{
          name: "章贡区"
        }, {
          name: "瑞金市"
        }, {
          name: "南康市"
        }, {
          name: "石城县"
        }, {
          name: "安远县"
        }, {
          name: "赣县"
        }, {
          name: "宁都县"
        }, {
          name: "寻乌县"
        }, {
          name: "兴国县"
        }, {
          name: "定南县"
        }, {
          name: "上犹县"
        }, {
          name: "于都县"
        }, {
          name: "龙南县"
        }, {
          name: "崇义县"
        }, {
          name: "信丰县"
        }, {
          name: "全南县"
        }, {
          name: "大余县"
        }, {
          name: "会昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "吉安",
        sub: [{
          name: "吉州区"
        }, {
          name: "青原区"
        }, {
          name: "井冈山市"
        }, {
          name: "吉安县"
        }, {
          name: "永丰县"
        }, {
          name: "永新县"
        }, {
          name: "新干县"
        }, {
          name: "泰和县"
        }, {
          name: "峡江县"
        }, {
          name: "遂川县"
        }, {
          name: "安福县"
        }, {
          name: "吉水县"
        }, {
          name: "万安县"
        }, {
          name: "其他"
        }]
      }, {
        name: "宜春",
        sub: [{
          name: "袁州区"
        }, {
          name: "丰城市"
        }, {
          name: "樟树市"
        }, {
          name: "高安市"
        }, {
          name: "铜鼓县"
        }, {
          name: "靖安县"
        }, {
          name: "宜丰县"
        }, {
          name: "奉新县"
        }, {
          name: "万载县"
        }, {
          name: "上高县"
        }, {
          name: "其他"
        }]
      }, {
        name: "抚州",
        sub: [{
          name: "临川区"
        }, {
          name: "南丰县"
        }, {
          name: "乐安县"
        }, {
          name: "金溪县"
        }, {
          name: "南城县"
        }, {
          name: "东乡县"
        }, {
          name: "资溪县"
        }, {
          name: "宜黄县"
        }, {
          name: "广昌县"
        }, {
          name: "黎川县"
        }, {
          name: "崇仁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "上饶",
        sub: [{
          name: "信州区"
        }, {
          name: "德兴市"
        }, {
          name: "上饶县"
        }, {
          name: "广丰县"
        }, {
          name: "鄱阳县"
        }, {
          name: "婺源县"
        }, {
          name: "铅山县"
        }, {
          name: "余干县"
        }, {
          name: "横峰县"
        }, {
          name: "弋阳县"
        }, {
          name: "玉山县"
        }, {
          name: "万年县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "贵州",
      sub: [{
        name: "贵阳",
        sub: [{
          name: "南明区"
        }, {
          name: "云岩区"
        }, {
          name: "花溪区"
        }, {
          name: "乌当区"
        }, {
          name: "白云区"
        }, {
          name: "小河区"
        }, {
          name: "清镇市"
        }, {
          name: "开阳县"
        }, {
          name: "修文县"
        }, {
          name: "息烽县"
        }, {
          name: "其他"
        }]
      }, {
        name: "六盘水",
        sub: [{
          name: "钟山区"
        }, {
          name: "水城县"
        }, {
          name: "盘县"
        }, {
          name: "六枝特区"
        }, {
          name: "其他"
        }]
      }, {
        name: "遵义",
        sub: [{
          name: "红花岗区"
        }, {
          name: "汇川区"
        }, {
          name: "赤水市"
        }, {
          name: "仁怀市"
        }, {
          name: "遵义县"
        }, {
          name: "绥阳县"
        }, {
          name: "桐梓县"
        }, {
          name: "习水县"
        }, {
          name: "凤冈县"
        }, {
          name: "正安县"
        }, {
          name: "余庆县"
        }, {
          name: "湄潭县"
        }, {
          name: "道真仡佬族苗族自治县"
        }, {
          name: "务川仡佬族苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "安顺",
        sub: [{
          name: "西秀区"
        }, {
          name: "普定县"
        }, {
          name: "平坝县"
        }, {
          name: "镇宁布依族苗族自治县"
        }, {
          name: "紫云苗族布依族自治县"
        }, {
          name: "关岭布依族苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "铜仁地区",
        sub: [{
          name: "铜仁市"
        }, {
          name: "德江县"
        }, {
          name: "江口县"
        }, {
          name: "思南县"
        }, {
          name: "石阡县"
        }, {
          name: "玉屏侗族自治县"
        }, {
          name: "松桃苗族自治县"
        }, {
          name: "印江土家族苗族自治县"
        }, {
          name: "沿河土家族自治县"
        }, {
          name: "万山特区"
        }, {
          name: "其他"
        }]
      }, {
        name: "毕节地区",
        sub: [{
          name: "毕节市"
        }, {
          name: "黔西县"
        }, {
          name: "大方县"
        }, {
          name: "织金县"
        }, {
          name: "金沙县"
        }, {
          name: "赫章县"
        }, {
          name: "纳雍县"
        }, {
          name: "威宁彝族回族苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黔西南布依族苗族自治州",
        sub: [{
          name: "兴义市"
        }, {
          name: "望谟县"
        }, {
          name: "兴仁县"
        }, {
          name: "普安县"
        }, {
          name: "册亨县"
        }, {
          name: "晴隆县"
        }, {
          name: "贞丰县"
        }, {
          name: "安龙县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黔东南苗族侗族自治州",
        sub: [{
          name: "凯里市"
        }, {
          name: "施秉县"
        }, {
          name: "从江县"
        }, {
          name: "锦屏县"
        }, {
          name: "镇远县"
        }, {
          name: "麻江县"
        }, {
          name: "台江县"
        }, {
          name: "天柱县"
        }, {
          name: "黄平县"
        }, {
          name: "榕江县"
        }, {
          name: "剑河县"
        }, {
          name: "三穗县"
        }, {
          name: "雷山县"
        }, {
          name: "黎平县"
        }, {
          name: "岑巩县"
        }, {
          name: "丹寨县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黔南布依族苗族自治州",
        sub: [{
          name: "都匀市"
        }, {
          name: "福泉市"
        }, {
          name: "贵定县"
        }, {
          name: "惠水县"
        }, {
          name: "罗甸县"
        }, {
          name: "瓮安县"
        }, {
          name: "荔波县"
        }, {
          name: "龙里县"
        }, {
          name: "平塘县"
        }, {
          name: "长顺县"
        }, {
          name: "独山县"
        }, {
          name: "三都水族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "云南",
      sub: [{
        name: "昆明",
        sub: [{
          name: "盘龙区"
        }, {
          name: "五华区"
        }, {
          name: "官渡区"
        }, {
          name: "西山区"
        }, {
          name: "东川区"
        }, {
          name: "安宁市"
        }, {
          name: "呈贡县"
        }, {
          name: "晋宁县"
        }, {
          name: "富民县"
        }, {
          name: "宜良县"
        }, {
          name: "嵩明县"
        }, {
          name: "石林彝族自治县"
        }, {
          name: "禄劝彝族苗族自治县"
        }, {
          name: "寻甸回族彝族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "曲靖",
        sub: [{
          name: "麒麟区"
        }, {
          name: "宣威市"
        }, {
          name: "马龙县"
        }, {
          name: "沾益县"
        }, {
          name: "富源县"
        }, {
          name: "罗平县"
        }, {
          name: "师宗县"
        }, {
          name: "陆良县"
        }, {
          name: "会泽县"
        }, {
          name: "其他"
        }]
      }, {
        name: "玉溪",
        sub: [{
          name: "红塔区"
        }, {
          name: "江川县"
        }, {
          name: "澄江县"
        }, {
          name: "通海县"
        }, {
          name: "华宁县"
        }, {
          name: "易门县"
        }, {
          name: "峨山彝族自治县"
        }, {
          name: "新平彝族傣族自治县"
        }, {
          name: "元江哈尼族彝族傣族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "保山",
        sub: [{
          name: "隆阳区"
        }, {
          name: "施甸县"
        }, {
          name: "腾冲县"
        }, {
          name: "龙陵县"
        }, {
          name: "昌宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "昭通",
        sub: [{
          name: "昭阳区"
        }, {
          name: "鲁甸县"
        }, {
          name: "巧家县"
        }, {
          name: "盐津县"
        }, {
          name: "大关县"
        }, {
          name: "永善县"
        }, {
          name: "绥江县"
        }, {
          name: "镇雄县"
        }, {
          name: "彝良县"
        }, {
          name: "威信县"
        }, {
          name: "水富县"
        }, {
          name: "其他"
        }]
      }, {
        name: "丽江",
        sub: [{
          name: "古城区"
        }, {
          name: "永胜县"
        }, {
          name: "华坪县"
        }, {
          name: "玉龙纳西族自治县"
        }, {
          name: "宁蒗彝族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "普洱",
        sub: [{
          name: "思茅区"
        }, {
          name: "普洱哈尼族彝族自治县"
        }, {
          name: "墨江哈尼族自治县"
        }, {
          name: "景东彝族自治县"
        }, {
          name: "景谷傣族彝族自治县"
        }, {
          name: "镇沅彝族哈尼族拉祜族自治县"
        }, {
          name: "江城哈尼族彝族自治县"
        }, {
          name: "孟连傣族拉祜族佤族自治县"
        }, {
          name: "澜沧拉祜族自治县"
        }, {
          name: "西盟佤族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "临沧",
        sub: [{
          name: "临翔区"
        }, {
          name: "凤庆县"
        }, {
          name: "云县"
        }, {
          name: "永德县"
        }, {
          name: "镇康县"
        }, {
          name: "双江拉祜族佤族布朗族傣族自治县"
        }, {
          name: "耿马傣族佤族自治县"
        }, {
          name: "沧源佤族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "德宏傣族景颇族自治州",
        sub: [{
          name: "潞西市"
        }, {
          name: "瑞丽市"
        }, {
          name: "梁河县"
        }, {
          name: "盈江县"
        }, {
          name: "陇川县"
        }, {
          name: "其他"
        }]
      }, {
        name: "怒江傈僳族自治州",
        sub: [{
          name: "泸水县"
        }, {
          name: "福贡县"
        }, {
          name: "贡山独龙族怒族自治县"
        }, {
          name: "兰坪白族普米族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "迪庆藏族自治州",
        sub: [{
          name: "香格里拉县"
        }, {
          name: "德钦县"
        }, {
          name: "维西傈僳族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "大理白族自治州",
        sub: [{
          name: "大理市"
        }, {
          name: "祥云县"
        }, {
          name: "宾川县"
        }, {
          name: "弥渡县"
        }, {
          name: "永平县"
        }, {
          name: "云龙县"
        }, {
          name: "洱源县"
        }, {
          name: "剑川县"
        }, {
          name: "鹤庆县"
        }, {
          name: "漾濞彝族自治县"
        }, {
          name: "南涧彝族自治县"
        }, {
          name: "巍山彝族回族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "楚雄彝族自治州",
        sub: [{
          name: "楚雄市"
        }, {
          name: "双柏县"
        }, {
          name: "牟定县"
        }, {
          name: "南华县"
        }, {
          name: "姚安县"
        }, {
          name: "大姚县"
        }, {
          name: "永仁县"
        }, {
          name: "元谋县"
        }, {
          name: "武定县"
        }, {
          name: "禄丰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "红河哈尼族彝族自治州",
        sub: [{
          name: "蒙自县"
        }, {
          name: "个旧市"
        }, {
          name: "开远市"
        }, {
          name: "绿春县"
        }, {
          name: "建水县"
        }, {
          name: "石屏县"
        }, {
          name: "弥勒县"
        }, {
          name: "泸西县"
        }, {
          name: "元阳县"
        }, {
          name: "红河县"
        }, {
          name: "金平苗族瑶族傣族自治县"
        }, {
          name: "河口瑶族自治县"
        }, {
          name: "屏边苗族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "文山壮族苗族自治州",
        sub: [{
          name: "文山县"
        }, {
          name: "砚山县"
        }, {
          name: "西畴县"
        }, {
          name: "麻栗坡县"
        }, {
          name: "马关县"
        }, {
          name: "丘北县"
        }, {
          name: "广南县"
        }, {
          name: "富宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "西双版纳傣族自治州",
        sub: [{
          name: "景洪市"
        }, {
          name: "勐海县"
        }, {
          name: "勐腊县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "西藏",
      sub: [{
        name: "拉萨",
        sub: [{
          name: "城关区"
        }, {
          name: "林周县"
        }, {
          name: "当雄县"
        }, {
          name: "尼木县"
        }, {
          name: "曲水县"
        }, {
          name: "堆龙德庆县"
        }, {
          name: "达孜县"
        }, {
          name: "墨竹工卡县"
        }, {
          name: "其他"
        }]
      }, {
        name: "那曲地区",
        sub: [{
          name: "那曲县"
        }, {
          name: "嘉黎县"
        }, {
          name: "比如县"
        }, {
          name: "聂荣县"
        }, {
          name: "安多县"
        }, {
          name: "申扎县"
        }, {
          name: "索县"
        }, {
          name: "班戈县"
        }, {
          name: "巴青县"
        }, {
          name: "尼玛县"
        }, {
          name: "其他"
        }]
      }, {
        name: "昌都地区",
        sub: [{
          name: "昌都县"
        }, {
          name: "江达县"
        }, {
          name: "贡觉县"
        }, {
          name: "类乌齐县"
        }, {
          name: "丁青县"
        }, {
          name: "察雅县"
        }, {
          name: "八宿县"
        }, {
          name: "左贡县"
        }, {
          name: "芒康县"
        }, {
          name: "洛隆县"
        }, {
          name: "边坝县"
        }, {
          name: "其他"
        }]
      }, {
        name: "林芝地区",
        sub: [{
          name: "林芝县"
        }, {
          name: "工布江达县"
        }, {
          name: "米林县"
        }, {
          name: "墨脱县"
        }, {
          name: "波密县"
        }, {
          name: "察隅县"
        }, {
          name: "朗县"
        }, {
          name: "其他"
        }]
      }, {
        name: "山南地区",
        sub: [{
          name: "乃东县"
        }, {
          name: "扎囊县"
        }, {
          name: "贡嘎县"
        }, {
          name: "桑日县"
        }, {
          name: "琼结县"
        }, {
          name: "曲松县"
        }, {
          name: "措美县"
        }, {
          name: "洛扎县"
        }, {
          name: "加查县"
        }, {
          name: "隆子县"
        }, {
          name: "错那县"
        }, {
          name: "浪卡子县"
        }, {
          name: "其他"
        }]
      }, {
        name: "日喀则地区",
        sub: [{
          name: "日喀则市"
        }, {
          name: "南木林县"
        }, {
          name: "江孜县"
        }, {
          name: "定日县"
        }, {
          name: "萨迦县"
        }, {
          name: "拉孜县"
        }, {
          name: "昂仁县"
        }, {
          name: "谢通门县"
        }, {
          name: "白朗县"
        }, {
          name: "仁布县"
        }, {
          name: "康马县"
        }, {
          name: "定结县"
        }, {
          name: "仲巴县"
        }, {
          name: "亚东县"
        }, {
          name: "吉隆县"
        }, {
          name: "聂拉木县"
        }, {
          name: "萨嘎县"
        }, {
          name: "岗巴县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阿里地区",
        sub: [{
          name: "噶尔县"
        }, {
          name: "普兰县"
        }, {
          name: "札达县"
        }, {
          name: "日土县"
        }, {
          name: "革吉县"
        }, {
          name: "改则县"
        }, {
          name: "措勤县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "海南",
      sub: [{
        name: "海口",
        sub: [{
          name: "龙华区"
        }, {
          name: "秀英区"
        }, {
          name: "琼山区"
        }, {
          name: "美兰区"
        }, {
          name: "其他"
        }]
      }, {
        name: "三亚",
        sub: [{
          name: "三亚市"
        }, {
          name: "其他"
        }]
      }, {
        name: "五指山",
        sub: []
      }, {
        name: "琼海",
        sub: []
      }, {
        name: "儋州",
        sub: []
      }, {
        name: "文昌",
        sub: []
      }, {
        name: "万宁",
        sub: []
      }, {
        name: "东方",
        sub: []
      }, {
        name: "澄迈县",
        sub: []
      }, {
        name: "定安县",
        sub: []
      }, {
        name: "屯昌县",
        sub: []
      }, {
        name: "临高县",
        sub: []
      }, {
        name: "白沙黎族自治县",
        sub: []
      }, {
        name: "昌江黎族自治县",
        sub: []
      }, {
        name: "乐东黎族自治县",
        sub: []
      }, {
        name: "陵水黎族自治县",
        sub: []
      }, {
        name: "保亭黎族苗族自治县",
        sub: []
      }, {
        name: "琼中黎族苗族自治县",
        sub: []
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "甘肃",
      sub: [{
        name: "兰州",
        sub: [{
          name: "城关区"
        }, {
          name: "七里河区"
        }, {
          name: "西固区"
        }, {
          name: "安宁区"
        }, {
          name: "红古区"
        }, {
          name: "永登县"
        }, {
          name: "皋兰县"
        }, {
          name: "榆中县"
        }, {
          name: "其他"
        }]
      }, {
        name: "嘉峪关",
        sub: [{
          name: "嘉峪关市"
        }, {
          name: "其他"
        }]
      }, {
        name: "金昌",
        sub: [{
          name: "金川区"
        }, {
          name: "永昌县"
        }, {
          name: "其他"
        }]
      }, {
        name: "白银",
        sub: [{
          name: "白银区"
        }, {
          name: "平川区"
        }, {
          name: "靖远县"
        }, {
          name: "会宁县"
        }, {
          name: "景泰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "天水",
        sub: [{
          name: "清水县"
        }, {
          name: "秦安县"
        }, {
          name: "甘谷县"
        }, {
          name: "武山县"
        }, {
          name: "张家川回族自治县"
        }, {
          name: "北道区"
        }, {
          name: "秦城区"
        }, {
          name: "其他"
        }]
      }, {
        name: "武威",
        sub: [{
          name: "凉州区"
        }, {
          name: "民勤县"
        }, {
          name: "古浪县"
        }, {
          name: "天祝藏族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "酒泉",
        sub: [{
          name: "肃州区"
        }, {
          name: "玉门市"
        }, {
          name: "敦煌市"
        }, {
          name: "金塔县"
        }, {
          name: "肃北蒙古族自治县"
        }, {
          name: "阿克塞哈萨克族自治县"
        }, {
          name: "安西县"
        }, {
          name: "其他"
        }]
      }, {
        name: "张掖",
        sub: [{
          name: "甘州区"
        }, {
          name: "民乐县"
        }, {
          name: "临泽县"
        }, {
          name: "高台县"
        }, {
          name: "山丹县"
        }, {
          name: "肃南裕固族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "庆阳",
        sub: [{
          name: "西峰区"
        }, {
          name: "庆城县"
        }, {
          name: "环县"
        }, {
          name: "华池县"
        }, {
          name: "合水县"
        }, {
          name: "正宁县"
        }, {
          name: "宁县"
        }, {
          name: "镇原县"
        }, {
          name: "其他"
        }]
      }, {
        name: "平凉",
        sub: [{
          name: "崆峒区"
        }, {
          name: "泾川县"
        }, {
          name: "灵台县"
        }, {
          name: "崇信县"
        }, {
          name: "华亭县"
        }, {
          name: "庄浪县"
        }, {
          name: "静宁县"
        }, {
          name: "其他"
        }]
      }, {
        name: "定西",
        sub: [{
          name: "安定区"
        }, {
          name: "通渭县"
        }, {
          name: "临洮县"
        }, {
          name: "漳县"
        }, {
          name: "岷县"
        }, {
          name: "渭源县"
        }, {
          name: "陇西县"
        }, {
          name: "其他"
        }]
      }, {
        name: "陇南",
        sub: [{
          name: "武都区"
        }, {
          name: "成县"
        }, {
          name: "宕昌县"
        }, {
          name: "康县"
        }, {
          name: "文县"
        }, {
          name: "西和县"
        }, {
          name: "礼县"
        }, {
          name: "两当县"
        }, {
          name: "徽县"
        }, {
          name: "其他"
        }]
      }, {
        name: "临夏回族自治州",
        sub: [{
          name: "临夏市"
        }, {
          name: "临夏县"
        }, {
          name: "康乐县"
        }, {
          name: "永靖县"
        }, {
          name: "广河县"
        }, {
          name: "和政县"
        }, {
          name: "东乡族自治县"
        }, {
          name: "积石山保安族东乡族撒拉族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "甘南藏族自治州",
        sub: [{
          name: "合作市"
        }, {
          name: "临潭县"
        }, {
          name: "卓尼县"
        }, {
          name: "舟曲县"
        }, {
          name: "迭部县"
        }, {
          name: "玛曲县"
        }, {
          name: "碌曲县"
        }, {
          name: "夏河县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "宁夏",
      sub: [{
        name: "银川",
        sub: [{
          name: "兴庆区"
        }, {
          name: "西夏区"
        }, {
          name: "金凤区"
        }, {
          name: "灵武市"
        }, {
          name: "永宁县"
        }, {
          name: "贺兰县"
        }, {
          name: "其他"
        }]
      }, {
        name: "石嘴山",
        sub: [{
          name: "大武口区"
        }, {
          name: "惠农区"
        }, {
          name: "平罗县"
        }, {
          name: "其他"
        }]
      }, {
        name: "吴忠",
        sub: [{
          name: "利通区"
        }, {
          name: "青铜峡市"
        }, {
          name: "盐池县"
        }, {
          name: "同心县"
        }, {
          name: "其他"
        }]
      }, {
        name: "固原",
        sub: [{
          name: "原州区"
        }, {
          name: "西吉县"
        }, {
          name: "隆德县"
        }, {
          name: "泾源县"
        }, {
          name: "彭阳县"
        }, {
          name: "其他"
        }]
      }, {
        name: "中卫",
        sub: [{
          name: "沙坡头区"
        }, {
          name: "中宁县"
        }, {
          name: "海原县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "青海",
      sub: [{
        name: "西宁",
        sub: [{
          name: "城中区"
        }, {
          name: "城东区"
        }, {
          name: "城西区"
        }, {
          name: "城北区"
        }, {
          name: "湟源县"
        }, {
          name: "湟中县"
        }, {
          name: "大通回族土族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "海东地区",
        sub: [{
          name: "平安县"
        }, {
          name: "乐都县"
        }, {
          name: "民和回族土族自治县"
        }, {
          name: "互助土族自治县"
        }, {
          name: "化隆回族自治县"
        }, {
          name: "循化撒拉族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "海北藏族自治州",
        sub: [{
          name: "海晏县"
        }, {
          name: "祁连县"
        }, {
          name: "刚察县"
        }, {
          name: "门源回族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "海南藏族自治州",
        sub: [{
          name: "共和县"
        }, {
          name: "同德县"
        }, {
          name: "贵德县"
        }, {
          name: "兴海县"
        }, {
          name: "贵南县"
        }, {
          name: "其他"
        }]
      }, {
        name: "黄南藏族自治州",
        sub: [{
          name: "同仁县"
        }, {
          name: "尖扎县"
        }, {
          name: "泽库县"
        }, {
          name: "河南蒙古族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "果洛藏族自治州",
        sub: [{
          name: "玛沁县"
        }, {
          name: "班玛县"
        }, {
          name: "甘德县"
        }, {
          name: "达日县"
        }, {
          name: "久治县"
        }, {
          name: "玛多县"
        }, {
          name: "其他"
        }]
      }, {
        name: "玉树藏族自治州",
        sub: [{
          name: "玉树县"
        }, {
          name: "杂多县"
        }, {
          name: "称多县"
        }, {
          name: "治多县"
        }, {
          name: "囊谦县"
        }, {
          name: "曲麻莱县"
        }, {
          name: "其他"
        }]
      }, {
        name: "海西蒙古族藏族自治州",
        sub: [{
          name: "德令哈市"
        }, {
          name: "格尔木市"
        }, {
          name: "乌兰县"
        }, {
          name: "都兰县"
        }, {
          name: "天峻县"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "新疆",
      sub: [{
        name: "乌鲁木齐",
        sub: [{
          name: "天山区"
        }, {
          name: "沙依巴克区"
        }, {
          name: "新市区"
        }, {
          name: "水磨沟区"
        }, {
          name: "头屯河区"
        }, {
          name: "达坂城区"
        }, {
          name: "东山区"
        }, {
          name: "乌鲁木齐县"
        }, {
          name: "其他"
        }]
      }, {
        name: "克拉玛依",
        sub: [{
          name: "克拉玛依区"
        }, {
          name: "独山子区"
        }, {
          name: "白碱滩区"
        }, {
          name: "乌尔禾区"
        }, {
          name: "其他"
        }]
      }, {
        name: "吐鲁番地区",
        sub: [{
          name: "吐鲁番市"
        }, {
          name: "托克逊县"
        }, {
          name: "鄯善县"
        }, {
          name: "其他"
        }]
      }, {
        name: "哈密地区",
        sub: [{
          name: "哈密市"
        }, {
          name: "伊吾县"
        }, {
          name: "巴里坤哈萨克自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "和田地区",
        sub: [{
          name: "和田市"
        }, {
          name: "和田县"
        }, {
          name: "洛浦县"
        }, {
          name: "民丰县"
        }, {
          name: "皮山县"
        }, {
          name: "策勒县"
        }, {
          name: "于田县"
        }, {
          name: "墨玉县"
        }, {
          name: "其他"
        }]
      }, {
        name: "阿克苏地区",
        sub: [{
          name: "阿克苏市"
        }, {
          name: "温宿县"
        }, {
          name: "沙雅县"
        }, {
          name: "拜城县"
        }, {
          name: "阿瓦提县"
        }, {
          name: "库车县"
        }, {
          name: "柯坪县"
        }, {
          name: "新和县"
        }, {
          name: "乌什县"
        }, {
          name: "其他"
        }]
      }, {
        name: "喀什地区",
        sub: [{
          name: "喀什市"
        }, {
          name: "巴楚县"
        }, {
          name: "泽普县"
        }, {
          name: "伽师县"
        }, {
          name: "叶城县"
        }, {
          name: "岳普湖县"
        }, {
          name: "疏勒县"
        }, {
          name: "麦盖提县"
        }, {
          name: "英吉沙县"
        }, {
          name: "莎车县"
        }, {
          name: "疏附县"
        }, {
          name: "塔什库尔干塔吉克自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "克孜勒苏柯尔克孜自治州",
        sub: [{
          name: "阿图什市"
        }, {
          name: "阿合奇县"
        }, {
          name: "乌恰县"
        }, {
          name: "阿克陶县"
        }, {
          name: "其他"
        }]
      }, {
        name: "巴音郭楞蒙古自治州",
        sub: [{
          name: "库尔勒市"
        }, {
          name: "和静县"
        }, {
          name: "尉犁县"
        }, {
          name: "和硕县"
        }, {
          name: "且末县"
        }, {
          name: "博湖县"
        }, {
          name: "轮台县"
        }, {
          name: "若羌县"
        }, {
          name: "焉耆回族自治县"
        }, {
          name: "其他"
        }]
      }, {
        name: "昌吉回族自治州",
        sub: [{
          name: "昌吉市"
        }, {
          name: "阜康市"
        }, {
          name: "奇台县"
        }, {
          name: "玛纳斯县"
        }, {
          name: "吉木萨尔县"
        }, {
          name: "呼图壁县"
        }, {
          name: "木垒哈萨克自治县"
        }, {
          name: "米泉市"
        }, {
          name: "其他"
        }]
      }, {
        name: "博尔塔拉蒙古自治州",
        sub: [{
          name: "博乐市"
        }, {
          name: "精河县"
        }, {
          name: "温泉县"
        }, {
          name: "其他"
        }]
      }, {
        name: "石河子",
        sub: []
      }, {
        name: "阿拉尔",
        sub: []
      }, {
        name: "图木舒克",
        sub: []
      }, {
        name: "五家渠",
        sub: []
      }, {
        name: "伊犁哈萨克自治州",
        sub: [{
          name: "伊宁市"
        }, {
          name: "奎屯市"
        }, {
          name: "伊宁县"
        }, {
          name: "特克斯县"
        }, {
          name: "尼勒克县"
        }, {
          name: "昭苏县"
        }, {
          name: "新源县"
        }, {
          name: "霍城县"
        }, {
          name: "巩留县"
        }, {
          name: "察布查尔锡伯自治县"
        }, {
          name: "塔城地区"
        }, {
          name: "阿勒泰地区"
        }, {
          name: "其他"
        }]
      }, {
        name: "其他"
      }],
      type: 1
    }, {
      name: "香港",
      sub: [{
        name: "中西区"
      }, {
        name: "湾仔区"
      }, {
        name: "东区"
      }, {
        name: "南区"
      }, {
        name: "深水埗区"
      }, {
        name: "油尖旺区"
      }, {
        name: "九龙城区"
      }, {
        name: "黄大仙区"
      }, {
        name: "观塘区"
      }, {
        name: "北区"
      }, {
        name: "大埔区"
      }, {
        name: "沙田区"
      }, {
        name: "西贡区"
      }, {
        name: "元朗区"
      }, {
        name: "屯门区"
      }, {
        name: "荃湾区"
      }, {
        name: "葵青区"
      }, {
        name: "离岛区"
      }, {
        name: "其他"
      }]
    }, {
      name: "澳门",
      sub: [{
        name: "花地玛堂区"
      }, {
        name: "圣安多尼堂区"
      }, {
        name: "大堂区"
      }, {
        name: "望德堂区"
      }, {
        name: "风顺堂区"
      }, {
        name: "嘉模堂区"
      }, {
        name: "圣方济各堂区"
      }, {
        name: "路凼"
      }, {
        name: "其他"
      }]
    }, {
      name: "台湾",
      sub: [{
        name: "台北市"
      }, {
        name: "高雄市"
      }, {
        name: "台北县"
      }, {
        name: "桃园县"
      }, {
        name: "新竹县"
      }, {
        name: "苗栗县"
      }, {
        name: "台中县"
      }, {
        name: "彰化县"
      }, {
        name: "南投县"
      }, {
        name: "云林县"
      }, {
        name: "嘉义县"
      }, {
        name: "台南县"
      }, {
        name: "高雄县"
      }, {
        name: "屏东县"
      }, {
        name: "宜兰县"
      }, {
        name: "花莲县"
      }, {
        name: "台东县"
      }, {
        name: "澎湖县"
      }, {
        name: "基隆市"
      }, {
        name: "新竹市"
      }, {
        name: "台中市"
      }, {
        name: "嘉义市"
      }, {
        name: "台南市"
      }, {
        name: "其他"
      }]
    }, {
      name: "海外",
      sub: [{
        name: "其他"
      }]
    }];
  });

angular.module('starter.directives', [])

  .directive('dateSelect', ['$rootScope', function($rootScope) {
    return {
      restrict: 'EA',
      template: '<div class="months" month="date.attr_month" ng-repeat="date in dates">' +
        '<div class="month">{{date.month|date:"yyyy-MM"}}</div>' +
        '<div><div class="date" ng-repeat="week in date.weeks"><div>{{week}}</div></div></div>' +
        '<div><div class="day" ng-repeat="day in date.lastmonth track by $index ">{{day}}</div>' +
        '<div class="date" ng-repeat="day in date.thismonth track by $index" ng-class={selectColor:day.selRow} ng-disabled={{day.disabled}} ng-click="day.disabled||ngshowif(date,$index,date.attr_month);"><div>{{day.today||day.k}}</div><p>¥{{day.datePrice||day.defaultPrice}}</p></div></div>' +
        '</div>',
      link: function(scope, ele, attr) {
        scope.count = 0;
        // var attr_month = attr.month ? parseInt(attr.month, 10) : 0;
        var attr_months = [0, 1, 2];
        var year, month;
        var todayMonth = new Date().getMonth();
        scope.dates = [];
        for (var i = 0; i < attr_months.length; i++) {
          var attr_month = attr_months[i];
          getDate();
        }

        scope.changedate.forEach(function(month, i) {
          month.forEach(function(date) {
            if (date.slice(-4) !== 'null') {
              var k = parseInt(date.slice(8, 10), 10) - 1;
              scope.dates[i].thismonth[k].datePrice = date.slice(11);
            }
          });
        });
        scope.ngshowif = function(date, i, attr_month) {

          date.thismonth[i].selRow = true;
          scope.count++;
          if (scope.count == 1) {
            first_attrmonth = date.attr_month;
            scope.firsti = i;
            date.thismonth[scope.firsti].k = '入住';
            scope.firtseclectday = [i, attr_month];
            sessionStorage.setItem('inday', year + '-' + (todayMonth + 1 + attr_month) + '-' + (scope.firsti + 1) + ' ' + '00:00:00');
          }

          if (scope.count == 2) {
            if (i == scope.firtseclectday[0] && attr_month == scope.firtseclectday[1]) {
              date.thismonth[i].selRow = false;
              date.thismonth[scope.firsti].k = scope.firtseclectday[0] + 1;
              scope.count = 0;
              return;
            }
            last_attrmonth = date.attr_month;
            if (first_attrmonth == last_attrmonth) {
              date.thismonth[i].k = '离开';
              scope.lasti = i;
              if (scope.lasti < scope.firsti) {
                scope.lasti = scope.firsti;
                scope.firsti = i;
              }
              date.thismonth[scope.firsti].k = '入住';
              date.thismonth[scope.lasti].k = '离开';
              for (var j = scope.firsti; j < scope.lasti; j++) {
                date.thismonth[j].selRow = true;
              }
              sessionStorage.setItem('inday', year + '-' + (todayMonth + 1 + attr_month) + '-' + (scope.firsti + 1) + ' ' + '00:00:00');
              sessionStorage.setItem('outday', year + '-' + (todayMonth + 1 + attr_month) + '-' + (scope.lasti + 1) + ' ' + '00:00:00');
              window.history.go(-1);
            } else if (first_attrmonth < last_attrmonth) {
              for (var j1 = scope.firsti; j1 < scope.dates[first_attrmonth].thismonth.length; j1++) {
                scope.dates[first_attrmonth].thismonth[j1].selRow = true;
              }
              last_attrmonth = date.attr_month;
              scope.lasti = i;
              for (var j2 = 0; j2 < scope.lasti; j2++) {
                scope.dates[last_attrmonth].thismonth[j2].selRow = true;
              }
              scope.dates[last_attrmonth].thismonth[scope.lasti].k = '离开';
              sessionStorage.setItem('outday', year + '-' + (todayMonth + last_attrmonth + 1) + '-' + (scope.lasti + 1) + ' ' + '00:00:00');
              window.history.go(-1);
            } else if (first_attrmonth > last_attrmonth) {
              last_attrmonth = first_attrmonth;
              first_attrmonth = date.attr_month;
              scope.lasti = scope.firsti;
              scope.firsti = i;
              for (var j3 = scope.firsti; j3 < scope.dates[first_attrmonth].thismonth.length; j3++) {
                scope.dates[first_attrmonth].thismonth[j3].selRow = true;
              }
              for (var j4 = 0; j4 < scope.lasti; j4++) {
                scope.dates[last_attrmonth].thismonth[j4].selRow = true;
              }
              scope.dates[last_attrmonth].thismonth[scope.lasti].k = '离开';
              scope.dates[first_attrmonth].thismonth[scope.firsti].k = '入住';
              sessionStorage.setItem('outday', year + '-' + (todayMonth + 1 + last_attrmonth) + '-' + (scope.lasti + 1) + ' ' + '00:00:00');
              sessionStorage.setItem('inday', year + '-' + (todayMonth + 1 + first_attrmonth) + '-' + (scope.firsti + 1) + ' ' + '00:00:00');
              window.history.go(-1);
            }
            if (Math.abs(first_attrmonth - last_attrmonth) > 1) {
              var min = Math.min(first_attrmonth, last_attrmonth);
              var max = Math.max(first_attrmonth, last_attrmonth);
              for (var k = min + 1; k < max; k++) {
                for (var j5 = 0; j5 < scope.dates[k].thismonth.length; j5++) {
                  scope.dates[k].thismonth[j5].selRow = true;
                }
              }
            }

          }
          if (scope.count > 2) {
            scope.count = 0;
            for (var k1 = 0; k1 < attr_months.length; k1++) {
              for (var j6 = 0; j6 < scope.dates[k1].thismonth.length; j6++) {
                scope.dates[k1].thismonth[j6].selRow = false;
              }
            }
            scope.dates[last_attrmonth].thismonth[scope.lasti].k = scope.lasti + 1;
            scope.dates[first_attrmonth].thismonth[scope.firsti].k = scope.firsti + 1;
            date.thismonth[i].selRow = true;
            scope.count++;
            first_attrmonth = date.attr_month;
            scope.firsti = i;
            date.thismonth[scope.firsti].k = '入住';
            sessionStorage.clear();
            sessionStorage.setItem('inday', year + '-' + (todayMonth + 1 + first_attrmonth) + '-' + (scope.firsti + 1) + ' ' + '00:00:00');
            // window.history.go(-1);
          }
        };

        function getDate() {

          scope.settings = {
            weeks: ['日', '一', '二', '三', '四', '五', '六'],
            month: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
          };
          var now = new Date();
          year = year ? year : now.getFullYear();
          month = (now.getMonth() + attr_month);
          now = attr_month > 0 ? now = new Date(year, month, 1) : now;
          var firstday = get_first_date(year, month).getDay();
          var lastday = get_last_date(year, month).getDay();
          var lastdate = get_last_date(year, month).getDate();
          var today = now.getDate();
          year = now.getFullYear();
          month = now.getMonth();
          var lastmonth = [];
          var thismonth = [];
          var d = 0;
          if (firstday !== 0) { //如果第一天不是星期天，补上上个月日期
            var last_month_lastdate = get_last_date(year, month - 1).getDate();
            var last_month_last_sunday = last_month_lastdate - firstday;
            for (var j = last_month_last_sunday + 1; j <= last_month_lastdate; j++) {
              lastmonth.push('');
              d++;
            }

          }

          for (var k = 1; k <= today - 1; k++) {
            thismonth.push({
              'k': k
            });
            d++;
            if (d == 7) {
              d = 0;

              if (lastday != 6) {

              }
            }
          }
          if (attr_month === 0) {
            thismonth.push({
              'k': today,
              'today': '今天'
            });
            for (var k2 = today + 1; k2 <= lastdate; k2++) {
              thismonth.push({
                'k': k2
              });
              d++;
              if (d == 7) {
                d = 0;

                if (lastday != 6) {

                }
              }
            }
          }else{
            for (var k2 = today; k2 <= lastdate; k2++) {
              thismonth.push({
                'k': k2
              });
              d++;
              if (d == 7) {
                d = 0;

                if (lastday != 6) {

                }
              }
            }
          }
          for (var i = 0; i < thismonth.length; i++) {
            thismonth[i].selRow = false;
            thismonth[i].disabled = false;
            thismonth[i].defaultPrice = scope.defaultPrice;
          }
          if (attr_month === 0) {
            for (var i1 = 0; i1 < thismonth.length; i1++) {
              if (thismonth[i1].k < today) {
                thismonth[i1].disabled = true
              }
            }
          }
          scope.lastmonth = lastmonth;
          scope.thismonth = thismonth;

          var aMonth = {
            'month': now,
            'weeks': scope.settings.weeks,
            'attr_month': attr_month,
            'lastmonth': scope.lastmonth,
            'thismonth': scope.thismonth
          };
          scope.dates.push(aMonth);
        }
        function get_first_date(year, month) {
          return new Date(year, month, 1);
        }

        function get_last_date(year, month) {
          return new Date(year, month + 1, 0);
        }
      }
    };
  }])

  .directive('dateAccount', ['ApiService', '$rootScope', function(ApiService, $rootScope) {
    return {
      restrict: 'EA',

      template: '<div class="day" ng-repeat="day in settings.weeks ">{{day}}</div>' +
        '<div class="day" ng-repeat="day in lastmonth ">{{day}}</div>' +
        '<div class="date" ng-repeat="day in thismonth " ng-class="{rented:indexi==$index}" ng-click="ngshowif(day,$index);"><div class="">{{day}}</div></div>',
      link: function(scope, ele, attr) {
        scope.ngshowif = function(day, i) {
          scope.selectDate = true;
          scope.indexi = i;
          var month = scope.month < 10 ? '0' + scope.month : scope.month;
          var day1 = day < 10 ? '0' + day : day;
          var data = {
            customerId: localStorage.getItem('customerId'),
            date: scope.year + '-' + month + '-' + day1
          };
          ApiService.landlordDayIncome(data).success(function(res) {
            $rootScope.DayIncomes = res.dataObject;
            $rootScope.$broadcast('DayIncomes');
          });
        };
        var attr_month = attr.month ? parseInt(attr.month, 10) : 0;
        var attr_year = attr.year ? parseInt(attr.year, 10) : 0;

        scope.$watch('year+month', function() {
          attr_month = scope.month;
          attr_year = scope.year;
          getCalenda();

        });

        function getCalenda() {
          scope.settings = {
            weeks: ['日', '一', '二', '三', '四', '五', '六'],
            month: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
          };
          var now = new Date();
          var year = attr_year;
          var month = attr_month - 1;
          now = new Date(year, month, 1);
          var firstday = get_first_date(year, month).getDay();
          var lastday = get_last_date(year, month).getDay();
          var lastdate = get_last_date(year, month).getDate();
          var today = now.getDate();
          year = now.getFullYear();
          var lastmonth = [];
          var thismonth = [];
          var d = 0;
          if (firstday !== 0) { //如果第一天不是星期天，补上上个月日期
            var last_month_lastdate = get_last_date(year, month - 1).getDate();
            var last_month_last_sunday = last_month_lastdate - firstday;

            for (var j = last_month_last_sunday + 1; j <= last_month_lastdate; j++) {
              lastmonth.push(j);
              d++;
            }

          }
          for (var k = 1; k <= today - 1; k++) {
            thismonth.push(k);
            d++;
            if (d == 7) {
              d = 0;

              if (lastday != 6) {

              }
            }
          }

          for (var k3 = today; k3 <= lastdate; k3++) {
            thismonth.push(k3);
            d++;
            if (d == 7) {
              d = 0;

              if (lastday != 6) {

              }
            }
          }

          scope.lastmonth = lastmonth;
          scope.thismonth = thismonth;
        }


        function get_first_date(year, month) {
          return new Date(year, month, 1);
        }

        function get_last_date(year, month) {
          return new Date(year, month + 1, 0);
        }
      }
    };
  }])
  .directive('datepick', ['$rootScope', function($rootScope) {
    return {
      restrict: 'EA',
      template: '<div class="months" month="date.attr_month" ng-repeat="date in dates">' +
        '<div class="month">{{date.month|date:"yyyy-MM"}}</div>' +
        '<div><div class="date" ng-repeat="week in date.weeks"><div>{{week}}</div></div></div>' +
        '<div><div class="day" ng-repeat="day in date.lastmonth track by $index ">{{day}}</div>' +
        '<div class="date" ng-repeat="day in date.thismonth track by $index" ng-class={selectColor:day.selRow} ng-disabled={{day.disabled}} ng-click="day.disabled||ngshowif(day,date.month,date.attr_month,$index);"><div>{{day.today||day.k}}</div><p>¥{{day.datePrice}}</p></div></div>' +
        '</div>',
      link: function(scope, ele, attr) {
        scope.count = 0;
        var attr_months = [0, 1, 2];
        var year, month;
        scope.dates = [];
        for (var i = 0; i < attr_months.length; i++) {
          var attr_month = attr_months[i];
          getDate();
        }
        $rootScope.dates = scope.dates;
        scope.changedate.forEach(function(month, i) {
          month.forEach(function(date) {
            if (date.slice(-4) !== 'null') {
            var k = parseInt(date.slice(8, 10), 10) - 1;
            scope.dates[i].thismonth[k].datePrice = date.slice(11);
          }
          });
        });
        scope.$on('datesChange', function() {});
        var changedates = [];
        var attr_months = [];
        var $index = [];
        scope.ngshowif = function(day, month, attr_month, index) {
          day.selRow = !day.selRow;
          time_month = (month.getMonth() + 1) < 10 ? '0' + (month.getMonth() + 1) : (month.getMonth() + 1);
          time_day = day.k < 10 ? '0' + day.k : day.k;
          var time = month.getFullYear() + '-' + time_month + "-" + time_day;
          if (day.selRow) {
            changedates.push(time);
            attr_months.push(attr_month);
            $index.push(index);
          } else {
            var index22 = changedates.indexOf(time);
            changedates.splice(index22, 1);
            var index1 = attr_months.indexOf(attr_month);
            attr_months.splice(index1, 1);
            var index2 = $index.indexOf(parseInt(index, 10));
            $index.splice(index2, 1);
          }
          $rootScope.changedates = changedates;
          localStorage.setItem('changedates', changedates);
          localStorage.setItem('attr_months', attr_months);
          localStorage.setItem('$index', $index);
        };

        function getDate() {

          scope.settings = {
            weeks: ['日', '一', '二', '三', '四', '五', '六'],
            month: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
          };
          var now = new Date();
          year = year ? year : now.getFullYear();
          month = (now.getMonth() + attr_month);
          var now = attr_month > 0 ? now = new Date(year, month, 1) : now;
          var firstday = get_first_date(year, month).getDay();
          var lastday = get_last_date(year, month).getDay();
          var lastdate = get_last_date(year, month).getDate();
          var today = now.getDate();
          year = now.getFullYear();
          month = now.getMonth();
          var lastmonth = [];
          var thismonth = [];
          var d = 0;
          if (firstday != 0) { //如果第一天不是星期天，补上上个月日期
            var last_month_lastdate = get_last_date(year, month - 1).getDate();
            var last_month_last_sunday = last_month_lastdate - firstday;
            for (var j = last_month_last_sunday + 1; j <= last_month_lastdate; j++) {
              lastmonth.push('');
              d++;
            }

          }

          for (var k = 1; k <= today - 1; k++) {
            thismonth.push({
              'k': k
            });
            d++;
            if (d == 7) {
              d = 0;

              if (lastday != 6) {

              }
            }
          }
          if (attr_month === 0) {
            thismonth.push({
              'k': today,
              'today': '今天'
            });
            for (var k = today + 1; k <= lastdate; k++) {
              thismonth.push({
                'k': k
              });
              d++;
              if (d == 7) {
                d = 0;

                if (lastday != 6) {

                }
              }
            }
          } else {
            for (var k = today; k <= lastdate; k++) {
              thismonth.push({
                'k': k
              });
              d++;
              if (d == 7) {
                d = 0;

                if (lastday != 6) {

                }
              }
            }
          }

          for (var i = 0; i < thismonth.length; i++) {
            thismonth[i].selRow = false;
            thismonth[i].datePrice = scope.defaultPrice;
            thismonth[i].disabled = false;
          }
          if (attr_month === 0) {
            for (var i1 = 0; i1 < thismonth.length; i1++) {
              if (thismonth[i1].k < today) {
                thismonth[i1].disabled = true
              }
            }
          }
          scope.lastmonth = lastmonth;
          scope.thismonth = thismonth;
          var aMonth = {
            'month': now,
            'weeks': scope.settings.weeks,
            'attr_month': attr_month,
            'lastmonth': scope.lastmonth,
            'thismonth': scope.thismonth,

          };
          scope.dates.push(aMonth);
        }
        function get_first_date(year, month) {
          return new Date(year, month, 1);
        }

        function get_last_date(year, month) {
          return new Date(year, month + 1, 0);
        }
      }
    };
  }])
  .directive('picshow', function() {
    return {
      restrict: 'EA',
      template: '<div  ><img ng-repeat="imgsrc in allImgs" ng-click="ngshowif($index)" src="{{imgsrc}}"></div>' +
        '<div class="mask" ng-if="maskShow" ng-click="maskShow1();" ng-class="{fade:true}"><img animate ng-class="{fade1:show}" ng-swipe-left="changeImgplus();" ng-swipe-left="changeImgminus();"   ng-src={{largeImg}}></div>',
      link: function(scope, ele, attr) {
        //  scope.imgsrcs = ['../imgs/wcj/home/slide_1.png', '../imgs/wcj/home/slide_2.png', '../imgs/wcj/home/slide_3.png', '../imgs/wcj/home/slide_4.png'];
        scope.maskShow = false;

        scope.ngshowif = function(i) {
          scope.maskShow = true;
          scope.largeImg = scope.imgsrcs[i];
          scope.index = i;
        };
        scope.maskShow1 = function() {

          scope.maskShow = false;
        };
        scope.changeImgplus = function() {
          scope.index++;
          if (scope.index < scope.imgsrcs.length) {
            scope.largeImg = scope.imgsrcs[scope.index];
          }
        };
        scope.changeImgminus = function() {
          scope.index--;
          if (scope.index >= 0) {
            scope.largeImg = scope.imgsrcs[scope.index];
          }
        };
      }
    };
  })
  .directive('qrCode', function() {
    return {
      restrict: 'EA',
      link: function(scope, ele, attr) {
        new QRCode(ele[0], {
          text: localStorage.getItem('customerId'),
          width: 500,
          height: 500,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H

        });
      }
    };
  })
  .directive('hmsPctSelect', ['ApiService', function(ApiService) {
    var TAG = 'hmsPCTSelectDirective';
    return {
      restrict: 'EA',
      scope: {
        default: '=defaultdata'
      },
      replace: true,
      transclude: true,
      template: '<div class="cityPicker" style="font-size: 14px;" ng-click="toSetDefaultPosition();">' +
        '{{selectedAddress.province+selectedAddress.city+selectedAddress.town}}<span class="right_arr"><span> ' +
        '</div>',
      controller: ['$scope', 'ApiService', '$element', '$attrs', '$ionicModal', '$http', '$ionicSlideBoxDelegate', '$timeout', '$rootScope', '$ionicScrollDelegate', function($scope, ApiService, $element, $attrs, $ionicModal, $http, $ionicSlideBoxDelegate, $timeout, $rootScope, $ionicScrollDelegate) {
        var selectedAddress = {};
        var addressData;
        this.$onInit = function() {
          selectedAddress = {};
          $scope.selectedAddress = {};


          ApiService.getCityPicker().success(function(res) { //调取城市选择器的接口获取城市数据
            addressData = res;
            $scope.provincesData = addressData['86'];
          }).error(function(err) {});

          $ionicModal.fromTemplateUrl('hmsPCTSelect-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
          }).then(function(modal) {
            $scope.PCTModal = modal;
          });
        };

        $scope.lockSlide = function() {
          $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').enableSlide(false);
        };

        $scope.$watch('default', function(newValue) {
          if (newValue) {
            $scope.selectedAddress = newValue;
          }
        });

        $scope.toSetDefaultPosition = function() {
          $scope.showBackBtn = false;
          $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').slide(0);
          $ionicScrollDelegate.$getByHandle('PCTSelectProvince').scrollTop();
          $scope.PCTModal.show();
        };

        //选择省
        $scope.chooseProvince = function(selectedProvince) {
          var selectedProvinceIndex;

          angular.forEach($scope.provincesData, function(item, index) {
            if (item === selectedProvince) {
              selectedProvinceIndex = index;
              return;
            }
          });


          selectedAddress = {};
          $scope.showBackBtn = true;
          $scope.citiesData = addressData['' + selectedProvinceIndex + ''];


          $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').next();
          $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').update();
          $ionicScrollDelegate.$getByHandle('PCTSelectCity').scrollTop();
          selectedAddress.province = selectedProvince;
        };

        //选择市
        $scope.chooseCity = function(selectedCity) {
          var selectedCityIndex;

          angular.forEach($scope.citiesData, function(item, index) {
            if (item === selectedCity) {
              selectedCityIndex = index;
              return;
            }
          });

          $scope.townData = addressData['' + selectedCityIndex + ''];

          selectedAddress.city = selectedCity;
          if (!$scope.townData) {
            selectedAddress.town = '';
            $scope.selectedAddress = selectedAddress;
            sessionStorage.setItem('detailAddress', JSON.stringify($scope.selectedAddress));
            $rootScope.$broadcast('PCTSELECT_SUCCESS', {
              result: $scope.selectedAddress
            });

            $timeout(function() {
              $scope.PCTModal.hide();
            }, 200);
          } else {
            $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').next();
            $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').update();
            $ionicScrollDelegate.$getByHandle('PCTSelectTown').scrollTop();
          }
        };

        //选择县
        $scope.chooseTown = function(selectedTown) {
          selectedAddress.town = selectedTown;
          $scope.selectedAddress = selectedAddress;
          sessionStorage.setItem('detailAddress', JSON.stringify($scope.selectedAddress));
          $rootScope.$broadcast('PCTSELECT_SUCCESS', {
            result: $scope.selectedAddress
          });

          $timeout(function() {
            $scope.PCTModal.hide();
          }, 200);
        };

        //slide返回上一级
        $scope.goBackSlide = function() {
          var currentIndex = $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').currentIndex();
          if (currentIndex > 0) {
            $ionicSlideBoxDelegate.$getByHandle('PCTSelectDelegate').previous();
          }
          if (currentIndex === 1) {
            $scope.showBackBtn = false;
          }
        };

        $scope.$on('$destroy', function() {
          $scope.PCTModal.remove();
        });
      }]
    };
  }])
  .directive('getHeight', ['$rootScope', function($rootScope) {
    return {
      restrict: 'EA',
      link: function(scope, ele, attr) {
        //var height = angular.element(document.querySelector('.houseDetail_header')).width();
        $rootScope.offsetHeight = ele[0].offsetHeight;
        $rootScope.$broadcast('getHeight');
      }
    };
  }])
  .directive('cityPicker', ['cityPickerData', '$ionicModal', '$timeout', '$ionicScrollDelegate', '$rootScope', function(cityPickerData, $ionicModal, $timeout, $ionicScrollDelegate, $rootScope) {
    return {
      restrict: 'EA',
      scope: true,
      template: '<div ng-click="modalShow()" class="cityPicker">' +
        '{{city_province+city_city+city_towns}}' +
        '<span class="right_arr"><span></div>',
      link: function(scope, ele, attr) {
        scope.cityData = cityPickerData;
        $ionicModal.fromTemplateUrl("lib/templates/city-picker.html", {
          scope: scope,
          animation: "slide-in-up"
        }).then(function(modal) {
          scope.modal = modal;
        });

        scope.modalShow = function() {
          scope.modal.show();
          var inner_height = document.getElementById('city_picker_inner').offsetHeight;
          scope.li_height = inner_height / 5;
        };
        scope.complete = function() {
          scope.modal.hide();
        };
        //Cleanup the modal when we are done with it!
        scope.$on("$destroy", function() {
          scope.modal.remove();
        });
        // Execute action on hide modal
        scope.$on("modal.hidden", function() {
          // Execute action
        });
        // Execute action on remove modal
        scope.$on("modal.removed", function() {
          // Execute action
        });

        var topValue = 0, // 上次滚动条到顶部的距离
          timer = null; // 定时器
        var oldTop_pro = newTop_pro = 0;
        var oldTop_city = newTop_city = 0;
        var oldTop_town = newTop_town = 0;
        //city_picker_inner高

        //  var inner_height = document.getElementById('city_picker_inner').offsetHeight
        //console.log(inner_height)
        scope.subCitys = scope.cityData[0].sub;
        scope.subTowns = scope.subCitys[0].sub;
        scope.provinceSelet = function() {
          provinceLog();
        };
        scope.citySelet = function() {
          cityLog();

        };
        scope.townSelet = function() {
          townLog();
        };

        function townLog() {
          if (timer) {
            $timeout.cancel(timer);
          }
          newTop_town = $ionicScrollDelegate.$getByHandle('townScroll').getScrollPosition().top;
          if (newTop_town === oldTop_town) {
            $timeout.cancel(timer);
            scope.provinceSeletTop = $ionicScrollDelegate.$getByHandle('townScroll').getScrollPosition().top;
            var index = scope.provinceSeletTop / scope.li_height;
            if (index == Math.ceil(index)) {
              if (scope.subTowns) {
                $rootScope.city_towns = scope.subTowns[Math.floor(index)].name;
                $rootScope.$broadcast('cityPickerChange');
              }
            } else {
              if (index >= (Math.floor(index) + 0.5)) {
                $ionicScrollDelegate.$getByHandle('townScroll').scrollTo(0, scope.li_height * (Math.floor(index) + 1), true);
              } else {
                $ionicScrollDelegate.$getByHandle('townScroll').scrollTo(0, scope.li_height * (Math.floor(index)), true);
              }
            }

          } else {
            oldTop_town = newTop_town;
            timer = $timeout(townLog, 100);
          }
        }

        function cityLog() {
          if (timer) {
            $timeout.cancel(timer);
          }
          newTop_city = $ionicScrollDelegate.$getByHandle('cityScroll').getScrollPosition().top;
          if (newTop_city === oldTop_city) {
            $timeout.cancel(timer);
            scope.provinceSeletTop = $ionicScrollDelegate.$getByHandle('cityScroll').getScrollPosition().top;
            var index = scope.provinceSeletTop / scope.li_height;
            if (index == Math.ceil(index)) {
              scope.subTowns = scope.subCitys[Math.floor(index)].sub;
              $ionicScrollDelegate.$getByHandle('townScroll').scrollTop();
              $rootScope.city_city = scope.subCitys[Math.floor(index)].name;
              $rootScope.$broadcast('cityPickerChange');
            } else {
              if (index >= (Math.floor(index) + 0.5)) {
                $ionicScrollDelegate.$getByHandle('cityScroll').scrollTo(0, scope.li_height * (Math.floor(index) + 1), true);
                scope.subTowns = scope.subCitys[Math.floor(index)].sub;
              } else {
                $ionicScrollDelegate.$getByHandle('cityScroll').scrollTo(0, scope.li_height * (Math.floor(index)), true);
                scope.subTowns = scope.subCitys[Math.floor(index)].sub;
              }
            }

          } else {
            oldTop_city = newTop_city;
            timer = $timeout(cityLog, 100);
          }
        }

        function provinceLog() {
          if (timer) {
            $timeout.cancel(timer);
          }
          newTop_pro = $ionicScrollDelegate.$getByHandle('provinceScroll').getScrollPosition().top;
          if (newTop_pro === oldTop_pro) {
            $timeout.cancel(timer);
            scope.provinceSeletTop = $ionicScrollDelegate.$getByHandle('provinceScroll').getScrollPosition().top;
            var index = scope.provinceSeletTop / scope.li_height;
            if (index == Math.ceil(index)) {
              scope.subCitys = scope.cityData[Math.floor(index)].sub;
              $ionicScrollDelegate.$getByHandle('cityScroll').scrollTop();
              $rootScope.city_province = scope.cityData[Math.floor(index)].name;
              scope.city_province = scope.cityData[Math.floor(index)].name;
              $rootScope.$broadcast('cityPickerChange');
              cityLog();
            } else {
              if (index >= (Math.floor(index) + 0.5)) {
                $ionicScrollDelegate.$getByHandle('provinceScroll').scrollTo(0, scope.li_height * (Math.floor(index) + 1), true);
                scope.subCitys = scope.cityData[Math.floor(index)].sub;
              } else {
                $ionicScrollDelegate.$getByHandle('provinceScroll').scrollTo(0, scope.li_height * (Math.floor(index)), true);
                scope.subCitys = scope.cityData[Math.floor(index)].sub;
              }

            }

          } else {
            oldTop_pro = newTop_pro;
            timer = $timeout(provinceLog, 100);
          }
        }

      }
    };
  }])
  .directive('getPoselevator', ['$rootScope', function($rootScope) {
    return {
      link: function(scope, ele, attr) {
        var posL = ele[0].offsetLeft;
        var posR = ele[0].offsetLeft + ele[0].offsetWidth;
        var posT = ele[0].offsetTop;
        var posB = ele[0].offsetTop + ele[0].offsetHeight;
        var pos = [posL, posR, posT, posB];
        $rootScope.poselevator = pos;
        $rootScope.$broadcast('getPos');
      }
    };
  }])
  .directive('getPosdoor', ['$rootScope', function($rootScope) {
    return {
      link: function(scope, ele, attr) {
        var posL = ele[0].offsetLeft;
        var posR = ele[0].offsetLeft + ele[0].offsetWidth;
        var posT = ele[0].offsetTop;
        var posB = ele[0].offsetTop + ele[0].offsetHeight;
        var pos = [posL, posR, posT, posB];
        $rootScope.posdoor = pos;
        $rootScope.$broadcast('getPos');
      }
    };
  }])
  .directive('getPosstream', ['$rootScope', function($rootScope) {
    return {
      link: function(scope, ele, attr) {
        var posL = ele[0].offsetLeft;
        var posR = ele[0].offsetLeft + ele[0].offsetWidth;
        var posT = ele[0].offsetTop;
        var posB = ele[0].offsetTop + ele[0].offsetHeight;
        var pos = [posL, posR, posT, posB];
        $rootScope.posstream = pos;
        $rootScope.$broadcast('getPos');
      }
    };
  }])
  .directive('getPoskey', ['$rootScope', function($rootScope) {
    return {
      link: function(scope, ele, attr) {
        var posL = ele[0].offsetLeft;
        var posT = ele[0].offsetTop;
        var width = ele[0].offsetWidth;
        $rootScope.poskey = [posL + width / 2, posT];

        $rootScope.$broadcast('getPos');
      }
    };
  }])
  .directive("canvas", ['$rootScope', function($rootScope) {
    return {
      restrict: "EA",
      link: function(scope, ele, attr) {
        var ctx = ele[0].getContext("2d");
        var dpr = document.getElementsByTagName('html')[0].getAttribute('data-dpr');
        ele[0].width = screen.width * 0.75 * dpr;
        ele[0].height = ele[0].width;
        ele[0].style.marginLeft = -ele[0].width / 2 + 'px';
        var img = new Image();
        img.src = 'imgs/wcj/colorPicker/colorPicker.png';
        img.onload = function() {
          ctx.drawImage(img, 0, 0, ele[0].width, ele[0].width);
          ele.bind('click', function(e) {
            var canvasOffsetTop = ele[0].offsetTop;
            var canvasOffsetLeft = ele[0].offsetLeft;
            var canvasX = Math.floor(e.pageX - canvasOffsetLeft);
            var canvasY = Math.floor(e.pageY - canvasOffsetTop);
            var imgData = ctx.getImageData(canvasX, canvasY, 1, 1);
            var pixel = imgData.data;
            $rootScope.rgb = pixel;
            $rootScope.$broadcast('rgbChange');
            document.getElementById('pot').style.left = e.pageX + 'px';
            document.getElementById('pot').style.top = e.pageY + 'px';
            //document.getElementById('dd').style.backgroundColor = "rgba(" + pixel[0] + "," + pixel[1] + "," + pixel[2] + "," + pixel[3] + ")";
          });
        };

      }
    };
  }])
  .directive('myTouchstart', [function() {
    return function(scope, element, attr) {
      element.on('touchstart', function(event) {
        scope.$apply(function(event) {
          scope.$eval(attr.myTouchstart);
        });
      });
    };
  }])
  .directive('myTouchmove', ['$rootScope', function($rootScope) {
    return function(scope, element, attr) {
      element.on('touchmove', function(event) {
        var left = event.touches[0].pageX || event.touches[0].clientX;
        var top = event.touches[0].pageY || event.touches[0].clientY;
        var width = element[0].offsetHeight;
        $rootScope.posEnd = [left, top, width];
        $rootScope.$broadcast('getPosEnd');
        element.css({
          'top': (top - width / 2) + 'px',
          'left': (left) + 'px'
        });
      });
    };
  }])
  .directive('myTouchend', ['$rootScope', function($rootScope) {
    return function(scope, element, attr) {
      scope.$on('getPos', function() {});
      element.on('touchend', function(event) {
        element.css({
          'top': $rootScope.poskey[1] + 'px',
          'left': $rootScope.poskey[0] + 'px'
        });
        scope.$apply(function() {
          scope.$eval(attr.myTouchend);
        });
      });
    };
  }])
  .directive("mouseUp", function() {
    return {
      restrict: "EA",
      scope: {
        subfn: '&',
        myValue: '@myValue'
      },
      link: function(scope, ele, attr) {
        ele.bind('touchend', function() {
          scope.subfn();
        });
      }
    };
  })
  .directive('passwordConfirm', function() {
    return {
      link: function(scope, ele, attr) {
        var ds = /^[0-9a-zA-Z]*$/;
        ele.bind('keyup', function(e) {
          e.target.value = e.target.value.replace(/[^0-9a-zA-Z]/g, '');
        });

      }
    };
  })
  .directive('numberConfirm', function() {
    return {
      link: function(scope, ele, attr) {
        var ds = /^[0-9]*$/;
        ele.bind('keyup', function(e) {

          e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });

      }
    };
  })
  .directive('chineseConfirm', function() {
    return {
      link: function(scope, ele, attr) {
        var ds = /^[0-9a-zA-Z]*$/;
        ///[^\u4e00-\u9fa5]$/;
        ele.bind('keyup', function(e) {
          e.target.value = e.target.value.replace(/[^\u4e00-\u9fa5]/g, '');
        });

      }
    };
  })
  .directive('sildeAnimation', function() {
    return {
      link: function(scope, ele, attr) {
        if (sessionStorage.getItem('checkInTop')) {
          ele[0].style.height = sessionStorage.getItem('checkInTop') + 'px';
        }
        ele.bind('touchmove', function(e) {
          ele[0].style.height = e.changedTouches[0].clientY + 'px';

        });
        ele.bind('touchend', function(e) {
          ele[0].style.height =(e.changedTouches[0].clientY-100)+'px' ;
          sessionStorage.setItem('checkInTop', e.changedTouches[0].clientY);

        });
      }
    };
  })
  .directive('ctrlBtn',['$state', function($state){
    return{
      link:function(scope,ele,attr){
        ele.bind('touchstart',function(){
          ele.addClass('ctrlOnBig')
        })
        ele.bind('touchend',function($state){
         ele.removeClass('ctrlOnBig');
        })
        scope.$on('ctrlStateEnter',function(){
          ele.addClass('ctrlOnSmall')
        })
        scope.$on('ctrlStateOut',function(){
          ele.removeClass('ctrlOnSmall')
        })
      }
    }
  }])

angular.module('starter.filters', [])
	.filter('MMdd', function() {
		return function(time) {
			return time.split(' ')[0].slice(5);
		};
	})
	.filter('YYMMdd', function() {
		return function(time) {
			var fds = time.split(' ')[0].split('-');
			return fds.join('.');
		};
	})
	.filter('MMyueddri', function() {
		return function(time) {
			var data = time.split('-');
			return data[1]+'月'+data[2].split(' ')[0]+'日';
		};
	})
	.filter('ant', function() {
		return function(num) {
			var data = num + '';
			 data = data.split('.');
			return data[0];
		};
	});

angular.module("templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("templates/shopCar/shopCar.html","<ion-view view-title=\"购物车\" ng-click=\"closeDelete()\">\n    <ion-nav-buttons side=\"left\">\n\n    </ion-nav-buttons>\n    <ion-content class=\"userCenter-back\">\n        <ul class=\"cart-list\">\n            <li ng-repeat=\"list in list track by $index\">\n            	<!--酒店名称-->\n                <div class=\"title\" ng-if=\'list.hotelName\'>\n                  <p class=\'checkbox special\' ng-click = \'isbatchcheck(list)\' >\n                   <input id={{list.hotelName}} type=\"checkbox\" ng-checked=\'list.hotelCheck\'  >\n                   <label for={{list.hotelName}}></label>\n                  </p>\n                   <span>{{list.hotelName}}</span>\n\n                </div>\n              <!--  酒店列表-->\n                <ion-list ng-repeat=\"roomList in list.carts track by $index\">\n                   <ion-item class=\"list-cont\" ng-click=\'goHouse(roomList.houseId)\'>\n                        <p class=\'checkbox\' ng-click = \'ischcked($event,roomList,list)\' >\n                   <input id={{roomList.houseName}} type=\"checkbox\" ng-checked = \'roomList.houseCheck\'  >\n                   <label for={{roomList.houseName}}></label>\n\n                   </p>\n                        <div class=\"list-pic\">\n                            <img ng-src=\"{{roomList.picture}}\" />\n                            <span></span>\n                        </div>\n                        <div class=\"list-desc\">\n                            <p> {{roomList.houseName}}</p>\n                            <p>{{roomList.inTime|MMdd}} - {{roomList.leaveTime|MMdd}}<i>共{{roomList.inDays}}晚</i></p>\n                            <div class=\"price\">¥{{roomList.totalFeel}}</div>\n                        </div>\n                    <ion-option-button class=\"button-positive del\" ng-click=\"delBtn(roomList.id,$event)\">删除</ion-option-button>\n                  </ion-item>\n                </ion-list>\n            </li>\n        </ul>\n        <div class=\"shopCar_blank\"></div>\n    </ion-content>\n   <div class=\"cart-footer\">\n		<div class=\"check-all\">\n			<p ng-class=\"{active:allcheck}\" ng-click=\"isallcheck()\"></p>\n			全选\n		</div>\n		<div class=\"total\">\n			\n		</div>\n			<div class=\"calculate\" ng-click=\'goOrderDetail();\' nav-direction=\"forward\">\n				结算\n			</div>\n	</div>\n</ion-view>\n");
$templateCache.put("templates/ctrl/ctrl.html","<ion-view hide-nav-bar=\'true\'>\r\n<div class=\"ctrl_header\">\r\n                <span native-ui-sref=\'tab.home\' native-options=\"{type: \'fade\', duration:\'500\'}\"><i class=\"close\" ></i></span>\r\n                <div class=\"select_btn\">\r\n                    <span ng-click=\"waitingIn()\" ng-class=\"{selectBtn:select}\">待入住</span>\r\n                    <span ng-click=\"hasIn();\" ng-class=\"{selectBtn:!select}\">已入住</span>\r\n                </div>\r\n            </div>\r\n    <ion-content has-subheader=\"false\">\r\n        <div class=\"my_orderform_wrap\">\r\n            <div class=\"blank\"></div>\r\n            <div ng-show=\"select\">\r\n                <div>\r\n                    <div class=\"order\" ng-repeat=\"order in orders track by $index\">\r\n                        <div class=\'hotel\' ng-repeat=\"hotel in order.hotelsx track by $index\">\r\n                            <p><span>{{hotel.hotelName}}</span><span>订单号:{{order.orderCode}}</span></p>\r\n                            <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\' ng-click=\'inHouse(house,hotel.hotelName,house.subOrderId,house.subOrderCode,hotel.hotelId);\'>\r\n                                <img ng-src=\'{{house.picture}}\' />\r\n                                <ul>\r\n                                    <li class=\"OrderNum\">{{house.houseName}}</li>\r\n                                    <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                                    <li class=\"money\">¥{{house.totalFee}}</li>\r\n                                </ul>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n            <div ng-hide=\"select\">\r\n               <div class=\"order\" ng-repeat=\"order in beHouses track by $index\" >\r\n                        <div class=\'hotel\' ng-repeat=\"hotel in order.hotelsx track by $index\" >\r\n                            <p><span>{{hotel.hotelName}}</span><span>订单号:{{order.orderCode}}</span></p>\r\n                            <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\'  ng-click=\'goCheckIn(house.houseId,house.subOrderId,house.subOrderCode,hotel.hotelName,house.houseName,hotel.hotelId)\' nav-direaction=\'forward\'>\r\n                                <img ng-src=\'{{house.picture}}\' />\r\n                                <ul>\r\n                                    <li class=\"OrderNum\">{{house.houseName}}</li>\r\n                                    <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                                    <li class=\"money\">¥{{house.totalFee}}</li>\r\n                                </ul>\r\n                            </div>\r\n                        </div>\r\n                    </div>\r\n            </div>\r\n        </div>\r\n        <ion-infinite-scroll ng-if=\"moreDataCanBeLoaded\" on-infinite=\"loadMoreData()\" immediate-check=\'false\'>\r\n        </ion-infinite-scroll>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/tabs/tabs.html","<ion-tabs class=\"tabs-icon-top tabs-color-active-calm\">\n    <ion-tab title=\"首页\" icon-off=\"bar_home_off\" icon-on=\"bar_home_on\" ui-sref=\"tab.home\">\n        <ion-nav-view name=\"tab-home\"></ion-nav-view>\n    </ion-tab>\n    <ion-tab title=\"发现\" icon-off=\" bar_discover_off\" icon-on=\"bar_discover_on\" href=\"#/tab/discover\">\n        <ion-nav-view name=\"tab-discover\"></ion-nav-view>\n    </ion-tab>\n    <ion-tab   ui-sref=\'tab.ctrl\' >\n        <ion-nav-view name=\"tab-ctrl\"></ion-nav-view>\n    </ion-tab>\n    <ion-tab title=\"购物车\" icon-off=\"bar_shopCar_off\" icon-on=\"bar_shopCar_on\" href=\"#/tab/shopCar\">\n        <ion-nav-view name=\"tab-shopCar\"></ion-nav-view>\n    </ion-tab>\n    <ion-tab title=\"我的\" icon-off=\"bar_userCenter_off\" icon-on=\"bar_userCenter_on\" href=\"#/tab/userCenter\">\n        <ion-nav-view name=\"tab-userCenter\"></ion-nav-view>\n    </ion-tab>\n</ion-tabs>\n <div class=\"ctrl\" ui-sref=\"tab.ctrl\" ctrl-btn></div>\n");
$templateCache.put("templates/userCenter/userCenter.html","<ion-view hide-nav-bar=\'true\'>\r\n  <ion-content style=\"height:100%\">\r\n    <div class=\"userCenter-back\">\r\n      <div class=\"userCenter_header\">\r\n        <p></p>\r\n        <div ng-click=\'headimg();\'>\r\n          <img ng-src={{imghead}} id=\"logo\" ng-show=\'imghead\' />\r\n          <span class=\"login-register\">{{useName}}</span>\r\n        </div>\r\n        <div class=\"user_tip\" ng-if=\"tip\">\r\n          <img src=\"imgs/lj/user_tip.png\" alt=\"\">\r\n        </div>\r\n        <div class=\"userCenter-list\">\r\n          <ul>\r\n            <a href=\"#/Nopay\" nav-direction=\"forward\">\r\n              <li>\r\n                <p class=\"pay\">待付款</p>\r\n              </li>\r\n            </a>\r\n            <a href=\"#/Pay\" nav-direction=\"forward\">\r\n              <li>\r\n                <p class=\"pay\">已付款</p>\r\n              </li>\r\n            </a>\r\n            <a href=\"#/Noevaluate\" nav-direction=\"forward\">\r\n              <li>\r\n                <p class=\"pay\">待评价</p>\r\n              </li>\r\n            </a>\r\n            <a href=\"#/lose-efficacy\" nav-direction=\"forward\">\r\n              <li>\r\n                <p class=\"pay\">已结束</p>\r\n              </li>\r\n            </a>\r\n          </ul>\r\n        </div>\r\n      </div>\r\n      <div class=\" userCenter-setting-list\">\r\n        <div class=\"item\">\r\n          <div class=\"center\" ui-sref=\"Consume\" nav-direction=\"forward\">\r\n            <p>\r\n              <img src=\"imgs/lj/runningwater.png\" />\r\n            </p>\r\n            <span style=\"margin-left: 10px;font-size: 0.4rem;\">消费流水</span>\r\n            <i>\r\n                            <img src=\"imgs/lj/arrows.png\" alt=\"\" />\r\n                        </i>\r\n          </div>\r\n        </div>\r\n        <div class=\"item\">\r\n          <div class=\"center\" ui-sref=\"beLandlord\" nav-direction=\"forward\">\r\n            <p>\r\n              <img src=\"imgs/lj/join.png\" />\r\n            </p>\r\n            <span style=\"margin-left: 10px;font-size: 0.4rem;\">加入我们</span>\r\n            <i>\r\n                            <img src=\"imgs/lj/arrows.png\" alt=\"\" />\r\n                        </i>\r\n          </div>\r\n        </div>\r\n        <div class=\"item\">\r\n          <div class=\"center\" nav-direction=\"forward\">\r\n            <p>\r\n              <img src=\"imgs/lj/about.png\" />\r\n            </p>\r\n            <span style=\"margin-left: 10px;font-size: 0.4rem;\">关于</span>\r\n            <i>\r\n                            <img src=\"imgs/lj/arrows.png\" alt=\"\" />\r\n                        </i>\r\n          </div>\r\n        </div>\r\n        </a>\r\n      </div>\r\n    </div>\r\n    </div>\r\n    </div>\r\n  </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/discover/discover.html","\n<ion-view title=\'发现\'>\n  <ion-nav-buttons side=\"left\">\n  </ion-nav-buttons>\n  <ion-content class=\"userCenter-back\">\n  <!-- <iframe src=\"http://m.amap.com/around/?locations=116.470098,39.992838&keywords=美食,KTV,地铁站,公交站&defaultIndex=3&defaultView=&searchRadius=5000&key=db834b40077df1a9574a3faf3cd17f72\"></iframe> -->\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/home/home.html","<ion-view hide-nav-bar=\'true\'>\n  <ion-content  class=\'has-footer home\' style=\'background-color:#f6f6f6;\'>\n    <div class=\"home_wrap\">\n      <ion-slide-box id=\'slide\' class=\'slide\' does-continue=\"true\" auto-play=\"true\" slide-interval=\"4000\">\n        <ion-slide ng-repeat=\'mainAD in mainADs track by $index\' native-ui-sref=\"houseDtail({id:mainAD.hotelId})\">\n          <div class=\"box \"><img ng-src={{mainAD.picture}}></div>\n        </ion-slide>\n      </ion-slide-box>\n      <div class=\"home_search_wrap\">\n        <div class=\"home_search\">\n          <div class=\"search_row\">\n            <div class=\"search_bar\">\n              <p class=\"city\" ui-sref=\'getCity\'><span>{{city}}</span><i class=\"icon ion-arrow-down-b\"></i></p>\n              <p class=\"seach_where\" ng-click=\'goSelectBussiniss($event)\'>搜索目的、商圈、生活圈</p>\n            </div>\n            <img ng-src=\"imgs/wcj/home/map.png\" class=\"loc\" />\n          </div>\n          <p class=\"search_btn\" ui-sref=\'nearby\'>查找酒店</p>\n        </div>\n      </div>\n      <div class=\"mainBtns\">\n        <div class=\"mainBtn\" ng-click=\"goNearBy()\">\n          <img ng-src=\"imgs/wcj/home/near_house.png\" />\n          <p>附近房源</p>\n        </div>\n        <div class=\"mainBtn\" native-ui-sref=\'landlordProfit\'>\n          <img ng-src=\"imgs/wcj/home/resruit.png\" />\n          <p>房东招募</p>\n        </div>\n        <div class=\"mainBtn\" native-ui-sref=\'myCollect\'>\n          <img ng-src=\"imgs/wcj/home/collection.png\" />\n          <p>我的收藏</p>\n        </div>\n        <div class=\"mainBtn\">\n          <img ng-src=\"imgs/wcj/home/more.png\" />\n          <p>敬请期待</p>\n        </div>\n      </div>\n      <div class=\"ad_pics_wrap\">\n        <h3 class=\"home_title\"><i class=\"icon_div\"></i>活动咨询</h3>\n        <ion-scroll direction=\'x\' class=\"ad_pics cl\">\n          <div class=\"\">\n            <figure ng-repeat=\"subAD in subADs track by $index\" native-ui-sref=\"houseDtail({id:subAD.hotelId})\">\n              <img ng-src={{subAD.picture}} alt=\"\">\n            </figure>\n          </div>\n          </ion-sroll>\n      </div>\n      <div class=\"content\">\n        <h3 class=\"home_title\"><i class=\"icon_div\"></i>推荐房源</h3>\n        <div>\n          <div class=\"ajklist\" ng-repeat=\"hotel in hotels track by $index\" ng-click=\"goHotelDetail(hotel.id)\">\n            <div>\n              <div class=\'item_ad\'>\n                <img ng-src={{hotel.mainPicture}}>\n                <div class=\"intr\">\n                  <h2>{{hotel.name}}</h2>\n                  <p class=\"loc\"><span><i class=\"icon\"></i>{{hotel.address}}</span></p>\n                  <p class=\"comment_star\">\n                    <i class=\"start_full\" ng-repeat=\"star in hotel.full_stars track by $index\"></i>\n                    <i class=\"start_blank\" ng-repeat=\"star in hotel.star_blank track by $index\"></i>\n                  </p>\n                  <p class=\"price\"><span>¥</span>{{hotel.price}}<span>起</span></p>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n      <!-- <div class=\"divier\">\n      </div> -->\n    </div>\n    <ion-infinite-scroll ng-if=\"moreDataCanBeLoaded\" on-infinite=\"loadMoreData()\" distance=\"10%\" immediate-check=\'false\'>\n    </ion-infinite-scroll>\n    <div class=\"divier\" style=\"height:50px\">\n    </div>\n  </ion-content>\n</ion-view>");
$templateCache.put("templates/directive/date/date.html","<div class=\"directive_date\">\r\n	<h2>2016年11月</h2>\r\n	<div class=\"date\">\r\n		<div class=\"weeks\">\r\n			<span>周日</span>\r\n			<span>周一</span>\r\n			<span>周二</span>\r\n			<span>周三</span>\r\n			<span>周四</span>\r\n			<span>周五</span>\r\n			<span>周六</span>\r\n		</div>\r\n	</div>\r\n</div>");
$templateCache.put("templates/shopCar/invoice/invoice.html","<ion-view title=\'发票\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" ng-click=\'back()\' ></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"shopcar-back\">\r\n     	<div class=\"invoice_btn\">\r\n     		<div class=\"btn_common needless\">不需要发票</div>\r\n     		<div class=\"btn_common need\">\r\n     			<p>需要发票 (电子)</p>\r\n     			<span>开具发票后发至您邮箱</span>\r\n     		</div>\r\n     	</div>\r\n     	<div class=\"invoice_cont\">\r\n     		<p>\r\n     			<label for=\"invoice_title\">发票抬头</label>\r\n     			<input type=\"text\" id=\"invoice_title\" value=\"杭州同步科技有限公司\" />\r\n     		</p>\r\n     		<p>\r\n     			<label for=\"invoice_ details\">发票明细</label>\r\n     			<input type=\"text\" id=\"invoice_ details\" value=\"房费\" />\r\n     		</p>\r\n     		<p class=\"noborder\">\r\n     			<label for=\"e-mail_address\">邮箱地址</label>\r\n     			<input type=\"text\" id=\"e-mail_address\" placeholder=\"用于接收电子发票\" />\r\n     		</p>\r\n     	</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/shopCar/orderDetail/orderDetail.html","<ion-view hide-nav-bar=\'true\' >\r\n\r\n    <ion-content>\r\n        <div class=\'orderDetail_wrap\'>\r\n            <div ng-class=\'{blur:time_select}\'>\r\n          <div class = \'hotel\'>\r\n            <div class=\'hotel_pics\'>\r\n                <div class=\'bgpic\'></div>\r\n                <div class=\'content\'>\r\n                   <div class=\"topBlank\" ng-if=\'platform\'></div>\r\n                    <div class=\'topbar\'>\r\n                    <span native-ui-sref=\'tab.shopCar\' native-options=\"{type: \'slide\', direction:\'right\'}\"></span>订单填写<p></p>\r\n                    </div>\r\n                    <ion-scroll>\r\n                    <div ng-repeat=\'hotel in hotels track by $index\'>\r\n                    <div class=\'position\' >\r\n                      <span></span>{{hotel.hotelName}}\r\n                    </div>\r\n\r\n                    <div class=rooms>\r\n                   <div class=\'room\' ng-repeat=\'house in hotel.carts track by $index\'>\r\n                       <p>{{house.inTime|MMyueddri}}-{{house.leaveTime|MMyueddri}}&nbsp;</p>\r\n                       <p>{{house.houseName}}</p>\r\n                       <p>共{{house.inDays}}晚</p>\r\n                   </div>\r\n                  </div>\r\n                   </div>\r\n                   </ion-scroll>\r\n                </div>\r\n            </div>\r\n            <!-- <div class=\'mess\'>\r\n                <div class=\'mess_detail\'>\r\n                    <span class=\'first\'>入住人<i class=\'bg\'></i></span>\r\n                    <input type=\"text\" value=\'王小二\' />\r\n                    <span class=\'bgpic\'></span>\r\n                </div>\r\n                <div class=\'mess_detail\'>\r\n                    <span class=\'first\'>手机号<i></i></span>\r\n                    <input type=\"text\" value=\'18868877305\' />\r\n                    <span class=\'bgpic1\'></span>\r\n                </div>\r\n            </div>\r\n            <div class=\'divier\'>\r\n                <span>爱居客服务</span> 免费尊享\r\n            </div>\r\n            <div class=\'mess\'>\r\n                <div class=\'mess_detail\' ng-click=\'time_select=true\'>\r\n                    <span class=\'first\'>到店时间</span>\r\n                    <p class=\'second\'>{{time}}前<i></i></p>\r\n                </div>\r\n                <div class=\'mess_detail\' ng-click=\'goInvoice()\'>\r\n                    <span class=\'first\'>发票</span>\r\n                    <p class=\'second\'>不需要<i></i></p>\r\n                </div>\r\n            </div>\r\n            <div class=\'divier\'>\r\n                <span>备注</span>\r\n            </div>\r\n            <div class=\'more\'>\r\n                   <input type=\"text\" placeholder=\'点击输入其他特殊要求\'/>\r\n            </div>\r\n          </div> -->\r\n\r\n            <div class=\'notice\'>\r\n              <h3>订单政策</h3>\r\n              <div>\r\n              	<h4>免费取消&nbsp;全额退款</h4>\r\n              	<p>最晚取消时间：1月19日&nbsp;18:00前,逾时无法取消和退款。</p>\r\n              	<p>预定超过3间时，需在1小时内在线支付房费。入住日前一天中午12：00前可免费取消全额退款，晚于该时间段不可取消，并且无法退款。</p>\r\n              </div>\r\n              <p></p>\r\n            </div>\r\n\r\n            </div>\r\n            <div class=\'arriveTime\' ng-show=\'time_select\' ng-class=\'{fade:time_select}\'>\r\n               <span class=\'close\' ng-click=\'time_select=false\' ></span>\r\n                <div class=\"topBlank\" ng-if=\'platform\'></div>\r\n                <div class=\'topbar\' ng-click=\'tim();\'>\r\n                      到店时间\r\n                        <p></p>\r\n                    </div>\r\n                    <div class=\'time\' ng-repeat=\'time in arriveTime track by $index\' ng-class=\'{selected:$index==indexi}\' ng-click=\'select($index)\'>{{time}}&nbsp;前</div>\r\n\r\n                    <div >\r\n                      <button type=\'button\' class=\'button button-calm button-full\' ng-click=\'time_select=false\'>保存</button>\r\n                    </div>\r\n\r\n            </div>\r\n\r\n        </div>\r\n    </ion-content>\r\n     <div class=\'payer\'>\r\n              <div>\r\n                <span>合计</span>\r\n                <span>¥{{total}}</span>\r\n              </div>\r\n              <div ng-click=\'submit();\'>\r\n                去支付\r\n              </div>\r\n            </div>\r\n</ion-view>\r\n");
$templateCache.put("templates/ctrl/CheckIn/checkIn.html","<ion-view hide-nav-bar=\'true\'>\n	<ion-content has-subheader=\"false\" overflow-scroll=\"true\" style=\"overflow: hidden\">\n		<div class=\"my_checkIn_wrap\">\n\n			<div class=\"checkIn_cont\">\n				<div class=\"checkIn_cont_add\">\n					<div class=\"checkIn-back\" native-ui-sref=\'tab.ctrl\' native-options=\"{type: \'slide\', direction:\'right\'}\">\n						<img src=\"imgs/lj/back.png\" />\n					</div>\n\n					<p ng-click=\'goClean();\' silde-animation><img src=\"imgs/kwn/checkIn/more1.png\" alt=\"\"></p>\n				</div>\n				<div>\n					<figure ng-repeat=\'figure in figures\' ui-sref=\'{{figure.path}}\'  class=\"home_figure {{figure.name}}\" ng-class=\'{active: $index===activeIndex}\'>\n            <img ng-src=\'imgs/kwn/checkIn/{{figure.name}}.png\' alt=\"\" />\n            <figcaption>{{figure.title}}</figcaption>\n          </figure>\n				</div>\n			</div>\n      <p class=\'slogan\'><img ng-src=\'imgs/kwn/checkIn/slogan.png\' alt=\"\"/></p>\n		</div>\n\n	</ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/airCondition/airCondition.html","<ion-view title={{title}}>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\'transform_scroll\' style=\"overflow: hidden;background:url(imgs/wcj/airCondition/air_bg.png);background-size: 100% 100%;\">\n    <div class=\"slide-pot\">\n      <span class=\"pot\" ng-repeat=\'pot in potArray\' ng-class=\'{active: $index === airState}\'></span>\n    </div>\n    <div style=\"width: 100%; height: 100%; overflow: hidden;\">\n      <div class=\"tvArrays\" on-swipe-right=\"onSwipeRight($event)\" on-swipe-left=\"onSwipeLeft($event)\" style=\"width: {{length}}00%;transform: translateX(-{{perWidth * airState}}%);\">\n        <div class=\"airCondition_wrap\" ng-repeat=\'airCondition in airConditionArrays\' style=\"width: {{perWidth}}%\">\n            <div class=\"air_display\">\n              <div class=\"air_box\">\n                <div class=\"air_display_box\">\n                  <span class=\'air_display_title\'>风速</span>\n                  <div class=\"air_speed\">\n                    <img class=\"{{speed}} speed_img\" ng-src=\"imgs/wcj/airCondition/{{speed}}.png\" alt=\"\" ng-repeat=\'speed in airCondition.speedArray\'>\n                  </div>\n                </div>\n                <div class=\"air_display_box air_box_down\">\n                  <span class=\'air_display_title\'>模式</span>\n                  <div class=\"air_model\">\n                    <img ng-src=\'imgs/wcj/airCondition/cold.png\' alt=\"\"  ng-if=\'airCondition.model === \"制冷\"\'/>\n                    <img ng-src=\'imgs/wcj/airCondition/hot.png\' alt=\"\" ng-if=\'airCondition.model === \"制热\"\'/>\n                    <span>{{airCondition.model}}</span>\n                  </div>\n                </div>\n              </div>\n              <div class=\"air_divide\">\n                <p></p>\n              </div>\n              <div class=\"air_box\">\n                <div class=\"air_display_box\">\n                  <span class=\'air_display_title\'>当前</span>\n                  <div class=\"tem\">20℃</div>\n                </div>\n                <div class=\"air_display_box air_box_down\">\n                  <span class=\'air_display_title\'>设置</span>\n                  <div class=\"tem\">{{airCondition.temp?airCondition.temp+\'℃\':\'\'}}</div>\n                </div>\n              </div>\n            </div>\n            <div class=\"air_round\">\n              <div class=\"middle_round\" ng-click=\'off(airCondition.deviceId)\'>\n                {{airCondition.status === \'OFF\'? \'ON\' : \'OFF\'}}\n              </div>\n              <span class=\"small_round up\"></span>\n              <span class=\"small_round down\"></span>\n              <span class=\"small_round left\"></span>\n              <span class=\"small_round right\"></span>\n            </div>\n            <div class=\"air_btn\">\n              <figure class=\'air_figure\' ng-click=\'tempAdd();\'>\n                <div class=\"air_figure_img\">\n                  <img class=\'btn_tmp\' ng-src=\'imgs/wcj/airCondition/plus.png\' alt=\"\" />\n                </div>\n                <figcaption>温度+</figcaption>\n              </figure>\n              <figure class=\'air_figure\' ng-click=\"tempReduce();\">\n                <div class=\"air_figure_img\">\n                  <img class=\'btn_tmp\' ng-src=\'imgs/wcj/airCondition/minus.png\' alt=\"\" />\n                </div>\n                <figcaption>温度-</figcaption>\n              </figure>\n              <figure class=\'air_figure\' ng-click=\'speedChange()\')}>\n                <div class=\"air_figure_img\">\n                  <img class=\'btn_speed\' ng-src=\'imgs/wcj/airCondition/speed.png\' alt=\"\" />\n                </div>\n                <figcaption>风速</figcaption>\n              </figure>\n              <figure class=\'air_figure\' ng-click=\"changeModel();\">\n                <div class=\"air_figure_img\">\n                  <img class=\'btn_speed\' ng-src=\'imgs/wcj/airCondition/air_model.png\' alt=\"\" />\n                </div>\n                <figcaption>模式</figcaption>\n              </figure>\n            </div>\n          </div>\n        \n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/clean/clean.html","<ion-view hide-nav-bar=\'true\'>\r\n    <ion-content class=\"userCenter-back\" overflow-scroll=\"true\" style=\"overflow: hidden\">\r\n    	<div class=\"clean-wrap\">\r\n			<div class=\"clean-bar\">\r\n			    <img ng-src=\"imgs/wcj/home/clean.png\"/>\r\n			</div>\r\n			<div class=\"clean-back\" ng-click=\'goback()\'>\r\n			     <img  src=\"imgs/lj/back.png\"/>\r\n			</div>\r\n  			<div class=\"clean-address\">\r\n  				<p>{{hotelName}}</p>\r\n  				<span>{{houseName}}</span>\r\n  			</div>\r\n  			<div class=\"clean-list\">\r\n  				<ul>\r\n  					<li class=\"clean-sweep\" ng-click=\"goService(\'打扫\')\"><img src=\"imgs/lj/clean.png\"/><i>打扫</i></li>\r\n  					<li class=\"clean-sweep\" ng-click=\"goService(\'维修\')\"><img src=\"imgs/lj/repair.png\"/><i>维修</i></li>\r\n  					<li class=\"clean-sweep\" ng-click=\'leave();\'><img src=\"imgs/lj/house.png\"/><i>退房</i></li>\r\n  				</ul>\r\n  			</div>\r\n		</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/ctrl/curtain/curtain.html","<ion-view title={{title}}>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\'transform_scroll curtain_bg\' style=\"overflow-x: hidden; overflow-y:visible;\">\n    <div class=\"slide-pot\">\n      <span class=\"pot pot_curtain\" ng-repeat=\'pot in potArray\' ng-class=\'{active: $index === tvState}\'></span>\n    </div>\n    <div class=\"tvArrays\" on-swipe-right=\"onSwipeRight()\" on-swipe-left=\"onSwipeLeft()\" style=\"width: {{length}}00%;transform: translateX(-{{perWidth * tvState}}%);\">\n      <div class=\"curtain_wrap\" ng-repeat=\'curtains in curtainArrays\' style=\"width: {{perWidth}}%\">\n          <div ng-repeat=\'curtain in curtains\'>\n            <p class=\"curtain_name\">{{curtain.name}}</p>\n            <div class=\"curtain_group\">\n              <p ng-repeat=\'btn in curtainBtns\' \n              class=\"curtain_btn\" \n              ng-click=\'curtainCtrl(btn.type, curtain,$index)\'\n              ng-class=\'{active: curtain.chuanglianActiveIndex == $index}\'>{{btn.title}}</p>\n            </div>\n            <div class=\'inputRange\' on-release=\'onRelease($event,curtain.brightness, curtain.wayId)\'>\n              <input type=\"range\"  min=\"0\" max=\"100\" ng-model=\"curtain.brightness\" style=\"background:linear-gradient(to right, #6095f0, white {{curtain.brightness}}%, white)\"/>\n            </div>\n          </div>\n        </div>\n    \n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/inHouse/inHouse.html","<ion-view view-title=\'入住\'>\r\n     <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.ctrl\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n	<ion-content has-subheader=\"false\">\r\n	   <div class=\"inHouse_wrap\">\r\n              <div class=\"order\" >\r\n               <div class=\'hotel\' >\r\n                <p><span>{{hotelName}}</span><span>订单号:{{orderCode}}</span></p>\r\n\r\n                <div class=\"item-three\" >\r\n                    <img ng-src=\'{{house.picture}}\' />\r\n                    <ul>\r\n                        <li class=\"OrderNum\">{{house.houseName}}</li>\r\n                        <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                        <li class=\"money\">¥{{house.totalFee}}</li>\r\n                    </ul>\r\n                </div>\r\n               </div>\r\n            </div>\r\n            <div class=\"buttons\" >\r\n            <button class=\"button button-full button-calm\"  ng-click=\'inHome();\'>入住</button>\r\n            <button class=\"button button-full \" style=\"background-color: #dfdfdf;color:#fff\" ng-click=\'cancleSubOrder();\'>取消订房</button>\r\n            </div>\r\n            </div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/ctrl/colorPicker/colorPicker.html","<ion-view view-title=\'调光\'>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\"colorPicker_wrap\" getHeight>\n    <section class=\"rbgbtns\" id=\'rbgbtns\' >\n      <p style=\"background-color:{{color}}\" ng-repeat=\"color in color1 track by $index\" ng-click=\'colorSubmit(color)\'></p>\n    </section>\n    <section class=\"rbgbtns\" id=\'rbgbtns2\' >\n      <p style=\"background-color:{{color}}\" ng-repeat=\"color in color2 track by $index\" ng-click=\'colorSubmit(color)\'></p>\n    </section>\n    <canvas id=\"myCanvas\" canvas>\n         </canvas>\n    <span class=\"pot\" id=\"pot\"></span>\n    <div id=\'dd\'></div>\n\n    <section class=\"buttons\">\n      <a class=\'check\' ng-click=\"changeRgb()\"></a>\n      <div></div>\n      <a class=\"open\" ng-click=\"color()\"></a>\n    </section>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/ctrlDetail/ctrlDetail.html","<ion-view hide-nav-bar=\'true\'>\r\n	<ion-content has-subheader=\"false\">\r\n		<div class=\"my_orderform_wrap\">\r\n			<div class=\"header\">\r\n				<span><i class=\"close\" native-ui-sref=\'myHouse\' native-options=\"{type: \'slide\', direction:\'right\'}\"></i></span>\r\n				<div class=\"select_btn\">\r\n					<span ng-click=\"select=true\" ng-class=\"{selectBtn:select}\">待入住</span>\r\n					<span ng-click=\"select=false\" ng-class=\"{selectBtn:!select}\">已入住</span>\r\n				</div>\r\n			</div>\r\n			<div >\r\n\r\n			  <div class=\"normal\">\r\n    			<h2>杭州马克菠萝假日酒店<i></i></h2>\r\n    			<div class=\"normal_house\" ui-sref=\'orderFormDetail\'>\r\n    				<div class=\"list item_avatar\">\r\n    					<a class=\"item\">\r\n    						<img src=\"imgs/wcj/home/slide_1.png\" alt=\"\">\r\n    						<div>\r\n    							 <p>杭州市西湖区平海路38号</p>\r\n    							<p>商务标准房&nbsp;203</p>\r\n\r\n                                <p>入住时间:2015.08.18-2015.9.04</p>\r\n    						</div>\r\n    					</a>\r\n    					<span></span>\r\n    				</div>\r\n    			</div>\r\n    		</div>\r\n			</div>\r\n			<div class=\"buttons\">\r\n			<button class=\"button button-full button-calm\">入住</button>\r\n			<button class=\"button button-full \" style=\"background-color: #dfdfdf;color:#fff\">取消订房</button>\r\n			</div>\r\n		</div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/ctrl/light/light.html","<ion-view title=\"灯\">\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content overflow-scroll=\"true\" style=\"overflow: hidden\">\n    <div class=\"light_wrap\">\n      <div class=\'light_bg\'>\n        <div class=\"round\">\n          <div class=\"large_round\" on-touch=\'onTouch($event)\' on-drag=\'touchstart($event)\' style=\"transform:rotateZ({{-large_round_rotate}}deg)\">\n            <div class=\'round_wrap\' ng-repeat=\"light in lights\" style=\"transform:rotateZ({{light.rotate}}deg)\">\n              <div class=\'lights light_{{light.status}} {{light.name.replace(type_light, \"\")}}_{{light.status}}\' \n              style=\"transform:rotateZ({{large_round_rotate-light.rotate}}deg)\"\n              ng-click=\'lightCtrl(light)\'>\n                <div class=\"light_img\"></div>\n                <p>{{light.name.replace(type_light, \'\')}}</p>\n              </div>\n            </div>\n          </div>\n          <div class=\"middle_round\" style=\'transform:rotateZ({{middle_round_rotate}})\'>\n            <p class=\'class_title\'  \n            ng-repeat=\'tab in tab_navs\' \n            style=\'transform:rotateZ({{- $index * 30 + 30}}deg)\'\n            ng-class=\'{class_title_active: $index == modleIndex}\'\n            ng-click=\'typeClick($index, tab)\'>\n              {{tab}}\n            </p>\n          </div>\n          <img class=\"small_round\" ng-src=\'imgs/wcj/light/small_round.png\' alt=\'\' /> \n        </div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/lock/lock.html","<ion-view title=\"门卡\">\n  <ion-nav-buttons side=\"left\" get-height>\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content style=\"top:0!important\" overflow-scroll=\"true\" style=\"overflow: hidden\">\n    <div class=\'roomCard_bg\'> \n        <div class=\'round_bg\'> \n          <div class=\'figure figure_{{arry.name}}\' ng-repeat=\'arry in arrys\' ng-click=\'lockCtrl(arry.name, $index)\' ng-class=\'{active: $index===activeIndex}\'>\n              <div>\n                  <img ng-src=\'imgs/wcj/lock/{{arry.name}}.png\' alt=\"\" ng-if=\'$index!==activeIndex\' />  \n                  <img ng-src=\'imgs/wcj/lock/{{arry.name}}_active.png\' ng-if=\'$index===activeIndex\'  alt=\"\"/>       \n              </div>\n              <p class=\'selectTitle\'>{{arry.title}}</p>\n          </div>    \n          <div class=\'center\'>\n            <p class=\'center_name\'>{{name}}</p>\n            <p class=\'center_num\'>{{num}}</p>\n          </div>\n          <img src=\'imgs/wcj/lock/pots.png\' class=\'pots_top\' alt=\"\"/>\n\n        </div>\n      </div>\n</ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/model/model.html","<ion-view title=\"情景模式\">\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content>\n    <div class=\"model_wrap\">\n      <div class=\'models_bg\'>\n        <div class=\'model_item\'>\n          <figure class=\'figure\' ng-click=\"modelCtrl(model.sceneId,$index)\" ng-repeat=\"model in modelArray\">\n            <div class=\"model_img {{model.name.replace(\'情景\', \'\')}}\" ng-class=\'{active:$index==activeIndex}\'>\n              <div></div>\n            </div>\n            <figcaption class=\'figcaption\'>\n              {{model.name.replace(\'情景\', \'\')}}\n            </figcaption>\n          </figure>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/readLight/readLight.html","<ion-view title=\"阅读灯\">\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content>\n    <div class=\"spotLight_wrap\">\n      <div class=\"light\">\n        <p>调光白光</p>\n        <label class=\"toggle toggle-ajk\">\n          <input type=\"checkbox\" ng-model=\'check.white\' ng-checked=\"check.white\" ng-click=\"whiteService()\">\n          <div class=\"track\">\n            <div class=\"handle\"></div>\n          </div>\n        </label>\n      </div>\n      <div class=\"slide\">\n        <span class=\"left\"></span>\n        <input type=\"range\" id=\'range\' ng-disabled=\'!check.white\' ng-model=\'brightness.value1\' min=\"0\" max=\"100\" my-value=\'{{brightness.value1}}\' subfn =\'changeSubmit(brightness.value1,\"调光白光\")\'  mouse-up/>\n          <span class=\"right\"></span>\n      </div>\n      <div class=\"light\">\n        <p>调光暖光</p>\n        <label class=\"toggle toggle-ajk\">\n          <input type=\"checkbox\" ng-model=\'check.warm\'  ng-checked=\"check.warm\" ng-click=\"warmService()\">\n          <div class=\"track\">\n            <div class=\"handle\"></div>\n          </div>\n        </label>\n      </div>\n      <div class=\"slide\">\n        <span class=\"left\"></span>\n        <input type=\"range\" id=\'range\' ng-model=\'brightness.value2\' ng-disabled=\'!check.warm\'  min=\"0\" max=\"100\" my-value=\'{{brightness.value2}}\' subfn =\'changeSubmit(brightness.value2,\"调光暖光\")\'  mouse-up/>\n          <span class=\"right\"></span>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/repair/repair.html","<ion-view title=\'维修\'>\n  <ion-nav-buttons side=\"left\">\n     <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n </ion-nav-buttons>\n <ion-content>\n   <div class=\"sweepTime_wrap\">\n   <div class=\"sweepTime_select\" ng-show=\'contenSwitch\'>\n     <section>\n       <div class=\"service repair\" ng-click=\"changeRepair()\">\n         <p>服务:</p>\n         <p>{{selectApplication}}维修</p>\n       </div>\n       <div class=\"service\" >\n         <p>时间</p>\n         <p>立即维修</p>\n       </div>\n     </section>\n     <div class=\"conform_bnt\">\n       <button class=\"button button-full button-calm\" ng-click=\"submitRepair()\">确定</button>\n     </div>\n     <div class=\"select_time repair\"  ng-class=\"{\'transitionUp\':timeSwitch}\">\n       <p>选择维修物品</p>\n       <p  ng-class=\'{select_bg:$index==index}\' ng-repeat=\'time in repairThings track by $index\' ng-click=\"selectRepair($index,time)\">{{time}}</p>\n     </div>\n     <div class=\'backdrop visible active\' ng-show =\'timeSwitch\' ng-click=\'timeSwitch=false\' ></div>\n   </div>\n   <div class=\"sweepTime_select sweepTime_schedule\" ng-show=\"!contenSwitch\">\n     <section>\n       <div class=\"service second\">\n         <p>服务:</p>\n         <p>{{selectApplication}}维修</p>\n       </div>\n       <div class=\"service second\">\n         <p>时间:</p>\n         <p>立即维修</p>\n       </div>\n       \n     </section>\n     <div class=\"status\">\n          <p>状态</p>\n          <div></div>\n          <div class=\"content\">\n            <p ng-class=\"{statusNow:waitingStatus}\"><span>等待处理</span></p>\n            <p ng-class=\"{statusNow:handleStatus}\"><span>维修中</span></p>\n            <p ng-class=\"{statusNow:completeStatus}\"><span>维修完成</span></p>\n          </div>\n     </div>\n   </div>\n </div>\n </ion-content>\n </ion-view>\n");
$templateCache.put("templates/ctrl/service/service.html","<ion-view title=\"服务\">\n  <ion-nav-buttons side=\"left\" get-height>\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content>\n    <!-- <div class=\"service_wrap\">\n    <div style=\"height:10px\"></div>\n    <section>\n      <img src=\"imgs/wcj/service/dnd.png\" alt=\"\">\n      <p>请勿打扰</p>\n      <span></span>\n      <label class=\"toggle toggle-ajk\">\n        <input type=\"checkbox\" ng-model=\'check.dnd\' ng-checked=\"check.dnd\" ng-click=\"dndService()\">\n        <div class=\"track\">\n          <div class=\"handle\"></div>\n        </div>\n      </label>\n    </section>\n    <section>\n      <img src=\"imgs/wcj/service/clean.png\" alt=\"\">\n      <p>立即打扫</p>\n      <span></span>\n      <label class=\"toggle toggle-ajk\">\n        <input type=\"checkbox\" ng-model=\'check.clean\' ng-checked=\"check.clean\" ng-click=\"cleanService()\">\n        <div class=\"track\">\n          <div class=\"handle\"></div>\n        </div>\n      </label>\n    </section>\n  </div> -->\n    <div class=\"service_wrap\">\n      <div class=\'service_bg\'>\n        <div class=\'marignTop\'></div>\n        <div class=\'rect\'>\n          <div class=\'service_item\' ng-click=\'modelClick(\"qingli\")\'>\n            <img ng-src=\'imgs/wcj/service/swape.png\' alt=\"\" class=\'swape\' />\n            <p class=\'content\'>请即清理</p>\n            <img ng-src=\'imgs/wcj/service/click_{{check.clean}}.png\' alt=\"\" class=\'selectedlight\' />\n          </div>\n          <div class=\'service_item\' ng-click=\'modelClick(\"darao\")\'>\n            <img ng-src=\'imgs/wcj/service/ring.png\' alt=\"\" class=\'ring\' />\n            <p class=\'content\'>请勿打扰</p>\n            <img ng-src=\'imgs/wcj/service/click_{{check.dnd}}.png\' alt=\"\" class=\'selectedlight\' />\n          </div>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/ctrl/sweepTime/sweepTime.html","<ion-view title=\'打扫\'>\n  <ion-nav-buttons side=\"left\">\n     <button class=\"button button-clear ajk_back\" ng-click=\'back()\' native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n </ion-nav-buttons>\n <ion-content>\n   <div class=\"sweepTime_wrap\">\n   <div class=\"sweepTime_select\" ng-show=\'contenSwitch\'>\n     <section>\n       <div class=\"service\">\n         <p>服务:</p>\n         <p>房间打扫</p>\n       </div>\n       <div class=\"time\" ng-click=\"changeTime();\">\n         <p>时间</p>\n         <p>13:00-14:00<i></i></p>\n       </div>\n     </section>\n     <div class=\"conform_bnt\">\n       <button class=\"button button-full button-calm\" ng-click=\"contenSwitch=false\">确定</button>\n     </div>\n     <p>注：酒店会在次日12:00-18:00间 打扫续住卫生</p>\n     <div class=\"select_time\"  ng-class=\"{transitionUp:timeSwitch}\">\n       <p>选择打扫时间</p>\n       <p  ng-class=\'{select_bg:$index==index}\' ng-repeat=\'time in times track by $index\' ng-click=\"selectTime($index,time)\">{{time}}</p>\n     </div>\n     <div class=\'backdrop visible active\' ng-show =\'timeSwitch\' ng-click=\'timeSwitch=false\' ></div>\n   </div>\n   <div class=\"sweepTime_select sweepTime_schedule\" ng-show=\"!contenSwitch\">\n     <section>\n       <div class=\"service\">\n         <p>服务:</p>\n         <p>房间打扫</p>\n       </div>\n       <div class=\"time\" ng-click=\"changeTime();\">\n         <p>时间</p>\n         <p>13:00-14:00</p>\n       </div>\n     </section>\n     <div class=\"status\">\n          <p>状态</p>\n          <div></div>\n          <div class=\"content\">\n            <p ng-class=\"{statusNow:waitingStatus}\"><span>等待处理</span></p>\n            <p ng-class=\"{statusNow:handleStatus}\"><span>已处理，准备打扫</span></p>\n            <p ng-class=\"{statusNow:completeStatus}\"><span>打扫完成</span></p>\n          </div>\n     </div>\n   </div>\n </div>\n </ion-content>\n </ion-view>\n");
$templateCache.put("templates/ctrl/tv/tv.html","<ion-view title={{title}}>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" ng-click=\"goback()\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\'transform_scroll\' style=\"overflow-x: hidden; overflow-y:visible;background: url(\'imgs/wcj/newTv/tv_bg.png\');background-size: 100% 100%\">\n    <div class=\"slide-pot\">\n      <span class=\"pot\" ng-repeat=\'pot in potArray\' ng-class=\'{active: $index === tvState}\'></span>\n    </div>\n    <div class=\"tvArrays\" on-swipe-right=\"onSwipeRight()\" on-swipe-left=\"onSwipeLeft()\" style=\"width: {{length}}00%; transform: translateX(-{{perWidth * tvState}}%);\">\n      <div class=\"futrue_wrap\" ng-repeat=\'tv in tvArrays\' style=\"width: {{perWidth}}%\">\n        <div class=\"tvBox\">\n          <p class=\"tv_switch tv_btn\" ng-click=\'tvon(tv, tv.tv_status, $index)\' ng-class=\"{active:tv.tv_status === \'ON\'}\"></p>\n          <p class=\"tv_btn tv_v_plus\" ng-click=\'tvAdd(tv)\'></p>\n          <p class=\"tv_btn tv_v_minus\" ng-click=\'tvMunis(tv)\'></p>\n        </div>\n        <div class=\"tvBox\">\n          <p class=\"tv_switch tv_btn\" ng-click=\'tvBoxOn(tv)\' ng-class=\"{active:tvboxswitch}\"></p>\n          <p class=\"tv_btn tv_mute\" ng-click=\'tvBoxMute(tv)\'></p>\n          <p class=\"tv_btn tv_return\" ng-click=\'tvBoxReturn(tv)\'></p>\n        </div>\n        <div class=\"dir_control\">\n          <div class=\"channel_voice\">\n            <span class=\"arr_up round\" ng-click=\"tvBoxUp(tv)\"></span>\n            <span class=\"arr_title\">频道</span>\n            <span class=\"arr_down round\" ng-click=\"tvBoxDown(tv)\"></span>\n          </div>\n          <div class=\"arr_round\">\n            <span class=\"round_up round\" ng-click=\"tvBoxUp(tv)\">\n            </span>\n            <span class=\"round_down round\" ng-click=\"tvBoxDown(tv)\"></span>\n            <span class=\"round_left round\" ng-click=\"tvBoxLeft(tv)\"></span>\n            <span class=\"round_right round\" ng-click=\"tvBoxRight(tv)\"></span>\n            <div class=\"arr_center\">\n              <div class=\"arr_ok\" ng-click=\"tvBoxOk(tv)\"}>\n                ok\n              </div>\n            </div>\n          </div>\n          <div class=\"channel_voice\">\n            <span class=\"arr_up round\" ng-click=\"tvBoxVol_P(tv)\"></span>\n            <span class=\"arr_title\">音量</span>\n            <span class=\"arr_down round\" ng-click=\"tvBoxVol_M(tv)\"></span>\n          </div>\n        </div>\n        <div class=\"review_tv\">\n          <p class=\"review_btn\" ng-click=\"tvBoxStop(tv)\">点播</p>\n          <p class=\"review_btn\" ng-click=\"tvBoxPlay(tv)\">回看</p>\n        </div>\n        <div class=\"tv_num\" ng-click=\'tvBoxNum($event, tv)\'>\n          <div class=\"num_item\">\n            <span class=\"num\" data-key=\'1\'>1</span>\n            <span class=\"num\" data-key=\'2\'>2</span>\n            <span class=\"num\" data-key=\'3\'>3</span>\n          </div>\n          <div class=\"num_item\">\n            <span class=\"num\" data-key=\'4\'>4</span>\n            <span class=\"num\" data-key=\'5\'>5</span>\n            <span class=\"num\" data-key=\'6\'>6</span>\n          </div>\n          <div class=\"num_item\">\n            <span class=\"num\" data-key=\'7\'>7</span>\n            <span class=\"num\" data-key=\'8\'>8</span>\n            <span class=\"num\" data-key=\'9\'>9</span>\n          </div>\n          <div class=\"num_item_last\">\n            <span class=\"num\" data-key=\'0\'>0</span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/ChangePwd/ChangePassword.html","<ion-view view-title=\"修改密码\">\r\n	<ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"setting\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n        <form class=\"ChangePwd-txt\" name=\'ChangePassword\'>\r\n        	<!-- <p class=\"nowpwd\">\r\n        		<input id=\"nowpwd\" type=\"text\" placeholder=\"当前密码\" />\r\n        	</p> -->\r\n            <p class=\"newpwd\">\r\n                <input id=\"oldpwd\" password-confirm name=\"oldpwd\" type=\"password\" ng-pattern=\'/[a-zA-Z\\d+]{6,36}/\' placeholder=\"旧密码\" ng-model=\"sendData.oldPassword\" required />\r\n            </p>\r\n        	<p class=\"newpwd\">\r\n        		<input id=\"newpwd\" password-confirm name=\"newpwd\" type=\"password\" ng-pattern=\'/[a-zA-Z\\d+]{6,36}/\' placeholder=\"新密码\" ng-model=\"sendData.password\" required />\r\n        	</p>\r\n        	<p class=\"verifypwd\">\r\n        		<input id=\"verifypwd\" password-confirm name=\"verifypwd\" type=\"password\" ng-pattern=\'/[a-zA-Z\\d+]{6,36}/\' placeholder=\"确认新密码\" ng-model=\'password_repeat\' required/>\r\n        	</p>\r\n        </form>\r\n    <div class=\"ChangePwd-btn\" ng-disabled=\'ChangePassword.$invalid||sendData.password!=password_repeat\' ng-class=\'{select:ChangePassword.$valid&&sendData.password==password_repeat}\' ng-click=\"changepwdBtn11()\">确认提交</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/Consume/Consume.html","<ion-view view-title=\'消费流水\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n        <div class=\"Consume-list\">\r\n        	<div class=\"Consume-tittle\">\r\n    			<span>本月</span>\r\n    		</div>\r\n        	<div class=\"list\" ng-repeat=\'consume in consumes track by $index\'>\r\n        		<span class=\"data\">{{consume.gmtCreate|MMdd}}</span>\r\n        		<p><img ng-src=\"{{consume.hotels[0].picture}}\"/></p>\r\n	        	<ul>\r\n	        		<li class=\"check-in\"><span class=\"money\">{{consume.amount}}</span></li>\r\n	        		<li class=\"housetype\">订单号：{{consume.orderCode}}</li>\r\n	        		<li class=\"address\">{{consume.hotels[0].hotelName}}</li>\r\n	        	</ul>\r\n            <span class=\"evaluate\">{{consume.payTypeStr}}</span>\r\n        	</div>\r\n        </div>\r\n        <ion-infinite-scroll\r\n            ng-if=\"moreDataCanBeLoaded\"\r\n            on-infinite=\"loadMoreData()\"\r\n            immediate-check=\'false\'>\r\n        </ion-infinite-scroll>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/Nopay/Nopay.html","<ion-view view-title=\'待付款订单\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n\r\n        	<!-- <div class=\"order\" ng-repeat=\"order in orders track by $index\" ng-click=\"goOrderdetail(order.orderCode)\">\r\n               <div class=\'hotel\' ng-repeat=\"hotel in order.hotelsx track by $index\">\r\n                <p><span>{{hotel.hotelName}}</span><span>订单号:{{order.orderCode}}</span></p>\r\n\r\n                <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\'>\r\n                    <img ng-src=\'{{house.picture}}\' />\r\n                    <ul>\r\n                        <li class=\"OrderNum\">{{house.houseName}}</li>\r\n                        <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                        <li class=\"money\">¥{{house.totalFee}}</li>\r\n                    </ul>\r\n                </div>\r\n             </div>\r\n            </div> -->\r\n            <div class=\"order\" ng-repeat=\"order in orders track by $index\" ng-click=\"goOrderdetail(order.orderCode)\">\r\n                    <div class=\'hotel\'>\r\n                     <p><span>订单号:{{order.orderCode}}</span></p>\r\n                     <div class=\"item-two\" >\r\n                         <img ng-src=\'{{order.hotelsx[0].houses[0].picture}}\' />\r\n                         <ul>\r\n                             <li class=\"Time\">下单时间:{{order.orderTime}}</li>\r\n                             <li class=\"money\">¥{{order.totalFee}}</li>\r\n                         </ul>\r\n                     </div>\r\n                     </div>\r\n                 </div>\r\n            <ion-infinite-scroll\r\n                ng-if=\"moreDataCanBeLoaded\"\r\n                on-infinite=\"loadMoreData()\"\r\n                immediate-check=\'false\'>\r\n            </ion-infinite-scroll>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/Order-form/Order-form.html","<ion-view view-title=\'订单详情\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"Nopay\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n    	<div class=\"Order-form-head\">\r\n    		<p>\r\n    			<span>订单状态：</span>\r\n    			<i>待付款</i>\r\n    		</p>\r\n    		<span>¥{{order.totalFee|ant}}<i>.00</i></span>\r\n    	</div>\r\n       <div class=\"order\" >\r\n               <div class=\'hotel\' ng-repeat=\"hotel in order.hotels track by $index\">\r\n                <p><span>{{hotel.hotelName}}</span><span>订单号:{{order.orderCode}}</span></p>\r\n\r\n                <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\'>\r\n                    <img ng-src=\'{{house.picture}}\' />\r\n                    <ul>\r\n                        <li class=\"OrderNum\">{{house.houseName}}</li>\r\n                        <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                        <li class=\"address\">{{house.address}}</li>\r\n                    </ul>\r\n                </div>\r\n                </div>\r\n            </div>\r\n            <div class=\'large_buttons\'>\r\n               <button type=\'button\' class=\'button button-calm button-full\' ng-click=\'pay();\'>确认支付</button>\r\n               <button type=\'button\' style=\'background-color:#fff\' class=\'button button-stable button-full\' ng-click=\"cancelOrder();\">取消订单</button>\r\n            </div>\r\n        <div class=\"Order-form-remind\">\r\n        	<div class=\"remind\">\r\n        		<div class=\"title\">特别提醒</div>\r\n        		<p>请于12点后办理入住，如提前到店，视酒店空房情况安排。</p>\r\n        		<p>最晚退房时间：<span>12:00(8月9日)</span></p>\r\n        	</div>\r\n        	<div class=\"remind\">\r\n            <span></span>\r\n        		<p>本订单最晚取消时间和修改时间为<span>18:00(8月7日)</span></p>\r\n        		<p>当超过最晚取消时间和修改时间后，爱居客将不接受您的取消或修改请求，同时已支付的预付款项不予退还，优惠券订单一经修改或取消后无法恢复</p>\r\n        	</div>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/Noevaluate/Noevaluate.html","<ion-view view-title=\'待评价\'>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\"userCenter-back\">\n    <div class=\"Noevaluate-list\" ng-repeat=\"hotel in hotels track by $index\">\n      <div class=\"Noevaluate-head\">\n        <h1>{{hotel.hotelName}}</h1>\n      </div>\n        <div class=\"list\">\n          <p><img ng-src={{hotel.picture}} /></p>\n          <ul>\n            <li class=\"address\">{{hotel.address}}</li>\n            <li class=\"housetype\">{{hotel.hotelName}}</li>\n            <li class=\"time\">入住时间：<span>{{hotel.inTime|YYMMdd}}-{{hotel.leaveTime|YYMMdd}}</span></li>\n          </ul>\n          <p class=\"Noevaluate\" ng-click=\"goevaluate(hotel.hotelId,hotel.houseId,hotel.hotelName,hotel.picture,hotel.subOrderCode)\"><input type=\"button\" id=\"\" value=\"评价\" /></p>\n        </div>\n    </div>\n    <ion-infinite-scroll\n        ng-if=\"moreDataCanBeLoaded\"\n        on-infinite=\"loadMoreData()\"\n        immediate-check=\'false\'>\n    </ion-infinite-scroll>\n\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/beLandlord/be_landlord.html","<ion-view title=\"我是房东\">\r\n	<ion-nav-buttons side=\"left\">\r\n			<button class=\"button button-clear ajk_back\" native-ui-sref=\'tab.userCenter\' native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n	</ion-nav-buttons>\r\n	<ion-content class=\'beLandlord\' >\r\n\r\n		<div class=\"beLandlord_wrap\">\r\n			<div class=\"center_box\">\r\n				<figure   class=\"my_account\" ng-class=\'{active:select}\'  ng-click=\"select&&goNext(\'myaccount\')\"  nav-direction=\"forward\">\r\n					<p class=\'my_account_img\'></p>\r\n					<figcaption>\r\n						我的收入\r\n					</figcaption>\r\n				</figure>\r\n				<figure class=\"join_us active\"   ui-sref=\'landlordProfit\' nav-direction=\"forward\">\r\n					<p class=\"join_us_img\"></p>\r\n					<figcaption>\r\n						加盟我们\r\n					</figcaption>\r\n				</figure>\r\n				<figure class=\"my_house\"  ng-class=\'{active:select}\' ng-click=\"select&&goNext(\'myHouse\')\"  nav-direction=\"forward\">\r\n					<p class=\"my_house_img\"></p>\r\n					<figcaption>\r\n						我的房子\r\n					</figcaption>\r\n				</figure>\r\n			</div>\r\n		</div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/bindingPhone/bindingPhone.html","<ion-view view-title=\"绑定手机\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"setting\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n      <div >\r\n        <div class=\"RetrievePwd-txt\" >\r\n          <form name=\'RetrievePwd\' novalidate class=\"login-text\">\r\n            <p class=\"tel\">\r\n                <input id=\"tel\" name=\'tel\' number-confirm type=\"tel\" placeholder=\"手机号\" ng-minlength=\"11\" ng-maxlength=\"11\" maxlength=\"11\" ng-pattern=\'/^1[34578]\\d{9}$/\' ng-model=\"sendData.telephone\" required />\r\n                <span class=\"GetCode\" ><input ng-disabled=\"RetrievePwd.tel.$invalid\" type=\"button\" name=\"\" id=\"GetCode\" value=\"获取验证码\" ng-class=\"{slecet:RetrievePwd.tel.$valid}\"  ng-click=\"bindingPhoneBtn()\"/></span>\r\n            </p>\r\n            <p class=\"pwd\">\r\n                <input id=\"pwd\" number-confirm type=\"tel\" ng-minlength=\"6\" ng-maxlength=\"6\" maxlength=\'6\' ng-pattern=\'/\\d{6}/\' placeholder=\"请输入验证码\" ng-model=\"sendData.code\" required />\r\n            </p>\r\n            </form>\r\n        </div>\r\n      <div class=\"RetrievePwd-btn\" ng-disabled=\"RetrievePwd.$invalid\" ng-class=\'{slecet:RetrievePwd.$valid}\' ng-click=\"telBtn()\">绑定手机</div>\r\n      </div>\r\n      <div  class=\"bindPhone1\">\r\n        <label for=\"\">已绑定手机号:</label>\r\n        <span>{{num}}</span>\r\n      </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/binding/binding.html","<ion-view view-title=\'身份绑定\'>\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" native-ui-sref=\"setting\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n  </ion-nav-buttons>\n  <ion-content class=\"userCenter-back\">\n    <div ng-if=\"!bindWhether\">\n      <form class=\"login-txt\" name=\"binging\">\n        <p class=\"tel\">\n          <label for=\"pwd\">真实姓名</label>\n          <input id=\"pwd\" name=\"pwd\" type=\"text\" placeholder=\"请输入您的姓名\" ng-model=\"sendData.name\" required/>\n        </p>\n        <p class=\"pwd\">\n          <label for=\"pwd\">身份证号</label>\n          <input id=\"pwd\" number-confirm name=\"idcard\" ng-minlength=\'18\' ng-maxlength=\'18\' maxlength=\'18\' type=\"tel\" ng-pattern=\'/\\d{18}/\' placeholder=\"请输入您的身份证号码\" ng-model=\"sendData.cardNo\" required/>\n        </p>\n      </form>\n      <div class=\"binding\">\n        <!-- <input type=\"button\" id=\"\" value=\"绑定\" ng-disabled=\'binging.$invalid\' ng-class=\'{slect:binging.$valid}\' ng-click=\"buttonBtn()\" /> -->\n        <button type=\"button\" class=\"button button-full button-calm\" ng-disabled=\'binging.$invalid\' ng-class=\'{slect:binging.$valid}\' ng-click=\"buttonBtn()\">身份绑定</button>\n      </div>\n    </div>\n    <div ng-if=\'bindWhether\'>\n      <form class=\"login-txt\" name=\"binging\">\n        <p class=\"tel\">\n          <label for=\"pwd\">真实姓名</label>\n          <span>{{name}}</span>\n        </p>\n        <p class=\"pwd\">\n          <label for=\"pwd\">身份证号</label>\n          <span>{{cardNo}}</span>\n        </p>\n      </form>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/endOrderDetail/endOrderDetail.html","<ion-view view-title=\'已结束\'>\n    <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"lose-efficacy\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n    </ion-nav-buttons>\n    <ion-content class=\"userCenter-back\">\n         <div class=\"order status\">\n               <div class=\'hotel\' ng-repeat=\"hotel in order.hotelsx track by $index\">\n                <p><span>{{hotel.hotelName}}</span></p>\n\n                <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\'>\n                    <img ng-src=\'{{house.picture}}\' />\n                    <ul>\n                        <li >{{house.houseName}}\n                          <p class=\'cancel\'>{{house.mark}}</p>\n                        </li>\n                        <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\n                        <li class=\"money\">¥{{house.totalFee}}</li>\n                    </ul>\n\n                </div>\n                </div>\n            </div>\n        <div class=\"order-information\">\n        	<h3>订单信息</h3>\n        	<p><i>订单编号：</i><span>{{order.orderCode}}</span></p>\n        	<p><i>下单时间：</i><span>{{order.orderTime}}</span></p>\n        </div>\n    </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/evaluate/evaluate.html","<ion-view view-title=\'评价\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"Noevaluate\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n      <div class=\"evaluate_wrap\">\r\n        <section class=\"title\">\r\n          <img ng-src=\"{{picture}}\" alt=\"\">\r\n          <p>{{hotelName}}</p>\r\n        </section>\r\n        <section class=\"diver\">\r\n          <p><span>为酒店打分</span></p>\r\n        </section>\r\n        <section class=\"stars\">\r\n          <span class=\"{{star}}\" ng-click=\'selectStar($index)\' ng-repeat=\"star in stars track by $index\"></span>\r\n        </section>\r\n        <section class=\"text\">\r\n          <textarea name=\"message\" ng-model=\'message.content\' placeholder=\'说说哪里满意或不满意，帮助大家选择\' ></textarea>\r\n        </section>\r\n        <div></div>\r\n      </div>\r\n      <div class=\"evaluate_buttons\">\r\n        <button type=\"button\" name=\"button\" class=\"button button-calm button-full\" ng-click=\"submit()\">提交评价</button>\r\n      </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/login/login.html","<ion-view view-title=\'登录\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n    <div >\r\n        <form name=\'login\' class=\"login-txt\">\r\n        	<p class=\"tel\">\r\n        		<label for=\"tel\">账号</label>\r\n        		<input id=\"tel\" type=\"tel\" number-confirm maxlength=\"11\" ng-maxlength=\'11\' ng-minlength=\'11\' placeholder=\"请输入手机号\" ng-model=\"sendData.account\" required />\r\n        	</p>\r\n        	<p class=\"pwd\">\r\n        		<label for=\"pwd\">密码</label>\r\n        		<input id=\"pwd\" password-confirm type=\"password\" placeholder=\"6-32位字母数字组合\" maxlength=\'32\' ng-minlength=\"6\" ng-maxlength=\"32\"  ng-model=\"sendData.password\" required />\r\n        	</p>\r\n        </form>\r\n        <div class=\"login-btn\" ng-click=\"loginBtn()\" ng-disabled=\'login.$invalid\' ng-class=\'{select:login.$valid}\'>登录</div>\r\n        <div class=\"login-forgetpwd\">\r\n        	<a class=\"register\" href=\"#/register\">立即注册</a>\r\n        	<a class=\"forgetpwd\" href=\"#/RetrievePwd\">忘记密码？</a>\r\n        </div>\r\n    </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/lose-efficacy/lose-efficacy.html","<ion-view view-title=\'已结束\'>\r\n    <ion-nav-buttons >\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n      <div class=\"order\" ng-repeat=\"order in orders track by $index\" ng-click=\'goOrderDetail(order)\'>\r\n              <div class=\'hotel\'>\r\n               <p><span>订单号:{{order.orderCode}}</span></p>\r\n               <div class=\"item-two\" >\r\n                   <img ng-src=\'{{order.hotelsx[0].houses[0].picture}}\' />\r\n                   <ul>\r\n                       <li class=\"Time\">下单时间:{{order.orderTime}}</li>\r\n                       <li class=\"money\">{{order.orderTime}}</li>\r\n                   </ul>\r\n               </div>\r\n               </div>\r\n           </div>\r\n            <ion-infinite-scroll\r\n                ng-if=\"moreDataCanBeLoaded\"\r\n                on-infinite=\"loadMoreData()\"\r\n                immediate-check = \"false\">\r\n            </ion-infinite-scroll>\r\n\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/Pay/Pay.html","<ion-view view-title=\'已付款订单\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n       <div class=\"order\" ng-repeat=\"order in orders track by $index\" ui-sref=\'status({id:order.orderCode})\' nav-direction=\"forward\">\r\n               <div class=\'hotel\'>\r\n                <p><span>订单号:{{order.orderCode}}</span></p>\r\n                <div class=\"item-two\" >\r\n                    <img ng-src=\'{{order.hotelsx[0].houses[0].picture}}\' />\r\n                    <ul>\r\n                        <li class=\"Time\">下单时间:{{order.orderTime}}</li>\r\n                        <li class=\"money\">¥{{order.totalFee}}</li>\r\n                    </ul>\r\n                </div>\r\n                </div>\r\n            </div>\r\n            <ion-infinite-scroll\r\n                ng-if=\"moreDataCanBeLoaded\"\r\n                on-infinite=\"loadMoreData()\"\r\n                immediate-check=\'false\'>\r\n            </ion-infinite-scroll>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/setPwd/setPwd.html","<ion-view view-title=\"设置密码\">\r\n	<ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"RetrievePwd\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n        <div class=\"RetrievePwd-txt\">\r\n          <form name=\'setPwd\' novalidate>\r\n        	<p class=\"tel\">\r\n        		<input id=\"tel\" name=\"tel\" type=\"password\" ng-pattern=\'/[a-zA-Z\\d+]{6,36}/\' ng-model=\'password\' placeholder=\"新密码\" required />\r\n        	</p>\r\n        	<p class=\"pwd\">\r\n        		<input id=\"pwd\" name=\"pwd\" type=\"password\" ng-model=\'password_repeat\' ng-pattern=\'/[a-zA-Z\\d+]{6,36}/\' placeholder=\"确认新密码\" required/>\r\n        	</p>\r\n            </form>\r\n        </div>\r\n\r\n       <div class=\"RetrievePwd-btn\" ng-disabled=\"setPwd.$invalid||password!=password_repeat\" ng-class=\"{slecet:setPwd.$valid&&password==password_repeat}\" ng-click=\"changepwd();\">确认提交</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/RetrievePwd/RetrievePwd.html","<ion-view view-title=\"找回登录密码\">\r\n	<ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"login\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n        <div class=\"RetrievePwd-txt\">\r\n          <form name=\'RetrievePwd\' novalidate>\r\n        	<p class=\"tel\">\r\n        		<input number-confirm id=\"tel\" name=\'tel\' type=\"tel\" placeholder=\"手机号\" ng-minlength=\"11\" ng-maxlength=\"11\" ng-pattern=\'/^1[34578]\\d{9}$/\' maxlength=\'11\' ng-model=\"sendData.telephone\" required />\r\n        		<span class=\"GetCode\" ><input ng-disabled=\"RetrievePwd.tel.$invalid\" type=\"button\" name=\"\" id=\"GetCode\" value=\"获取验证码\" ng-class=\"{slecet:RetrievePwd.tel.$valid}\"  ng-click=\"getVerifyCode()\"/></span>\r\n        	</p>\r\n        	<p class=\"pwd\">\r\n        		<input id=\"pwd\" type=\"tel\" maxlength=\'6\' number-confirm ng-minlength=\"6\" ng-maxlength=\"6\" ng-pattern=\'/\\d{6}/\' placeholder=\"请输入验证码\" ng-model=\"sendData.code\" required />\r\n        	</p>\r\n            </form>\r\n        </div>\r\n       <a href=\"#/bindsuccess\"><div class=\"RetrievePwd-btn\" ng-disabled=\"RetrievePwd.$invalid\" ng-class=\'{slecet:RetrievePwd.$valid}\' ng-click=\"RetrievePwdBtn()\">完成</div></a>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/qrCode/qrCode.html","<ion-view view-title=\'二维码\'>\n	 <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"setting\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n    </ion-nav-buttons>\n    <ion-content>\n    	<div class=\"qrCode_wrap\">\n    	<div class=\"blank\"></div>\n    		<div class=\'content\'>\n    			<div class=\"person\">\n    				<img ng-src=\"{{imghead}}\" alt=\"\">\n    				<p>{{name}}</p>\n    			</div>\n    			<qr-code class=\"qrCode\" id=\"qrCode\"></qr-code>\n    		</div>\n    	</div>\n    </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/register/register.html","<ion-view view-title=\"注册\">\r\n	<ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"login\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n   <ion-content class=\"userCenter-back\">\r\n   		<form class=\"register-txt\" name=\'register\' novalidate>\r\n        	<p class=\"tel\">\r\n        		<label for=\"tel\">手机号</label>\r\n        		<input id=\"tel\" number-confirm type=\"tel\" placeholder=\"手机号\" ng-pattern=\'/[0-9]{11}/\' name=\'tel\' ng-minlength=\"11\" ng-maxlength=\"11\" maxlength=\'11\' ng-model=\"sendData.telephone\" required />\r\n        		<span class=\"GetCode\" ><input type=\"button\" name=\"\" id=\"GetCode\" value={{getCodeValue}}  ng-click=\"getVerifyCode()\" ng-disabled=\'register.tel.$invalid||!getCodeValueSwitch\'/></span>\r\n        	</p>\r\n        	<p class=\"tel\">\r\n        		<label for=\"code\">验证码</label>\r\n        		<input id=\"code\" number-confirm type=\"tel\" ng-minlength=\"6\" ng-maxlength=\"6\" maxlength=\'6\' placeholder=\"请输入验证码\"  ng-model=\"sendData.code\" required/>\r\n        	</p>\r\n        	<p class=\"password\">\r\n        		<label for=\"password\">密&nbsp;&nbsp;&nbsp;码</label>\r\n        		<input id=\"password\" password-confirm type=\"password\"  placeholder=\"6-32位字母数字组合\" ng-minlength=\"6\" ng-maxlength=\"32\" ng-model=\"sendData.password\" maxlength=\'32\' required/>\r\n        	</p>\r\n        </form>\r\n        <div class=\"register-btn\" ng-click=\"registerBtn()\" ng-disabled=\'register.$invalid||!checked\' ng-class=\'{select:register.$valid&&checked}\'>注册</div>\r\n        <div class=\"agreement\">\r\n        	<input name=\'confirm\' type=\"checkbox\" ng-model=\"checked\" id=\"box\">\r\n					<label for=\'confirm\'></label>\r\n					<span class=\"character\">\r\n						我已阅读并同意爱居客</span><span style=\"color: orangered;\"><<用户使用协议>></span>\r\n        </div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/setting/setting.html","<ion-view view-title=\"个人设置\">\n	<ion-nav-buttons side=\"left\">\n		<button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n	</ion-nav-buttons>\n	<ion-content class=\"userCenter-back\">\n		<div class=\"list setting-list\">\n			<a href=\"\">\n				<div class=\"item marginB\" >\n					<div class=\"center\" ng-click=\'qrCode();\'>\n						<p>\n							<img src=\"imgs/kwn/code.png\" alt=\"\" />\n							<span></span>\n						</p>\n						<span>二维码</span>\n						<i>\n							<img src=\"imgs/kwn/arrows.png\" alt=\"\" />\n							<span></span>\n						</i>\n					</div>\n				</div>\n			</a>\n			<a href=\"#/binding\">\n				<div class=\"item shortboder\" >\n					<div class=\"center\">\n						<p>\n							<img src=\"imgs/kwn/data.png\" alt=\"\" />\n							<span></span>\n						</p>\n						<span>身份绑定</span>\n						<i>\n							<img src=\"imgs/kwn/arrows.png\" alt=\"\" />\n							<span></span>\n						</i>\n					</div>\n				</div>\n			</a>\n			<a href=\"\">\n				<div class=\"item marginB shortboder\" ng-click=\'changeHeadPic();\'>\n					<div class=\"center\">\n						<p class=\"headChange\">\n							<img ng-src=\"imgs/kwn/head.png\" alt=\"\" />\n							<span></span>\n						</p>\n						<span>头像更换</span>\n						<i>\n							<img src=\"imgs/kwn/arrows.png\" alt=\"\" />\n							<span></span>\n						</i>\n					</div>\n				</div>\n			</a>\n			<a href=\"#/bindingPhone\">\n				<div class=\"item shortboder bindPhone\">\n					<div class=\"center\">\n						<p>\n							<img src=\"imgs/kwn/phone.png\" alt=\"\" />\n							<span></span>\n						</p>\n						<span>手机绑定</span>\n						<i>\n							<img src=\"imgs/kwn/arrows.png\" alt=\"\" />\n							<span></span>\n						</i>\n					</div>\n				</div>\n			</a>\n			<a href=\"#/ChangePwd\">\n				<div class=\"item shortboder changePassword\">\n					<div class=\"center\">\n						<p>\n							<img src=\"imgs/kwn/lock.png\" alt=\"\" />\n							<span></span>\n						</p>\n						<span>修改密码</span>\n						<i>\n							<img src=\"imgs/kwn/arrows.png\" alt=\"\" />\n							<span></span>\n						</i>\n					</div>\n				</div>\n			</a>\n		</div>\n	</ion-content>\n	<ion-footer-bar align-title=\"left\" class=\"setting-footer\" ng-click=\'logout();\'>\n		<p>退出当前账户</p>\n	</ion-footer-bar>\n</ion-view>\n");
$templateCache.put("templates/userCenter/status/status.html","<ion-view view-title=\'已付款\'>\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"Pay\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content class=\"userCenter-back\">\r\n        <div class=\"status-header\">\r\n        	<div class=\"status-cont\">\r\n        		<p>等待入住</p>\r\n        		<span>距离入住还剩<i>{{leaveTimes}}</i>天</span>\r\n        	</div>\r\n        </div>\r\n         <div class=\"order status\">\r\n               <div class=\'hotel\' ng-repeat=\"hotel in order.hotels track by $index\">\r\n                <p><span>{{hotel.hotelName}}</span></p>\r\n\r\n                <div class=\"item-three\" ng-repeat=\'house in hotel.houses track by $index\'>\r\n                    <img ng-src=\'{{house.picture}}\' />\r\n                    <ul>\r\n                        <li >{{house.houseName}}\r\n                          <p class=\'cancel\' ng-click=\'cancel(house.subOrderCode);\' ng-show=\"{{house.orderCancel}}\">取消预定</p>\r\n                          <p class=\'cancel yicancel\' ng-show=\"{{house.yiCancel}}\">已取消</p>\r\n                        </li>\r\n                        <li class=\"Time\">{{house.inTimes}}<span class=\"Day\">共{{house.days}}晚</span></li>\r\n                        <li class=\"money\">¥{{house.fee}}</li>\r\n                    </ul>\r\n\r\n                </div>\r\n                </div>\r\n            </div>\r\n        <div class=\"order-information\">\r\n        	<h3>订单信息</h3>\r\n        	<p><i>订单编号：</i><span>{{order.orderCode}}</span></p>\r\n        	<p><i>下单时间：</i><span>{{order.orderTime}}</span></p>\r\n        	<p><i>合计：</i><span>{{order.totalFee}}</span></p>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/get_city/get_city.html","<ion-view view-title=\"定位城市\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.home\" native-options=\"{type: \'slide\', direction:\'down\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content overflow-scroll=\"true\" >\r\n    <div class=\"getCity_wrap\">\r\n    	<div class=\"find_cityback\">\r\n    		<div class=\"find_city\">\r\n\r\n	                <i class=\"icon\"></i>\r\n	                <input type=\"text\" ng-model=\'search.text\' placeholder=\"城市/行政区/拼音\" ng-blur=\'searchGo()\'>\r\n	        </div>\r\n    	</div>\r\n         <div class=\"getCity_left\">\r\n    		<div class=\"getCity_cont\">\r\n	        	<div class=\"current_loc\" id=\"state_0\" ng-if=\'nowCity\'>\r\n	        	    <h2>当前位置</h2>\r\n	        		<button class=\"button\" ng-click=\"cityChoose(nowCity)\" ui-sref=\"tab.home\">{{nowCity}}</button>\r\n	        	</div>\r\n	        	<div class=\"lately_city current_loc\" id=\"state_1\">\r\n	        		<h2>最近访问过城市</h2>\r\n	        		<button class=\"button\" ng-repeat=\"visitedCity in visitedCity track by $index\" ng-click=\"cityChoose(visitedCity)\" ui-sref=\"tab.home\">{{visitedCity}}</button>\r\n	        	</div>\r\n	        	<div class=\"hot_city current_loc\" id=\"state_2\">\r\n	        		<h2>热门城市</h2>\r\n	        		<button class=\"button \" ng-repeat=\"hotCity in hotCity track by $index\" ng-click=\"cityChoose(hotCity)\" ui-sref=\"tab.home\">{{hotCity}}</button>\r\n	        	</div>\r\n	      </div>\r\n	        <div class=\"list cities\" ng-repeat=\"allcityArr in allcityArr track by $index\">\r\n			  <div class=\"item initial\" id=\"city_{{allcityArr.letter.toUpperCase()}}\">{{allcityArr.letter.toUpperCase()}}</div>\r\n			  <p class=\"city\" href=\"javascript:;\" ng-repeat=\"city in allcityArr.data track by $index\" ng-click=\"cityChoose(city)\" ui-sref=\"tab.home\">{{city}}</p>\r\n			</div>\r\n    	</div>\r\n\r\n    </div>\r\n    </ion-content>\r\n    <div class=\"letter_list\">\r\n      <h2>\r\n        <p ng-repeat=\"now in now track by $index\" ng-click=\"nowTouch($index)\">{{now}}</p>\r\n      </h2>\r\n      <p ng-repeat=\"letter in letters track by $index\" ng-touchmove=\"mTouch(letter)\" ng-click=\"mTouch(letter)\">{{letter}}</p>\r\n    </div>\r\n     <div style=\"position:fixed;left:47%;top:47%;width:40px;height:40px;background:#ddd;display:flex;justify-content:center;align-items:center;font-size:20px;color:#262626;\" ng-show=\"showMiddle\">\r\n        {{hint}}\r\n    </div>\r\n    <div id=\"mysubway\" style=\"display:none;\"></div>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/futrue/futrue.html","<ion-view title=\'敬请期待\'>\n  <ion-nav-buttons side=\"left\">\n      <button class=\"button button-clear ajk_back\" ui-sref=\'tab.home\'></button>\n  </ion-nav-buttons>\n  <ion-content>\n    <div id=\"container\"></div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/home/hotelService/hotelService.html","<ion-view title=\"酒店设施\">\n    <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" ng-click=\"back()\"></button>\n    </ion-nav-buttons>\n    <ion-content>\n      <div class=\"hotelDetail_wrap\">\n    		<div class=\"title\"><h2>酒店设施</h2></div>\n    		<div class=\"devices\">\n    			<h2 >智能设施</h2>\n    			<div flex=\"main:left\">\n    				<p flex=\"dir:top cross:center\" ng-repeat=\'assort in assorts track by $index\'><i><img ng-src={{assort.img}} alt=\"\"></i>{{assort.name}}</p>\n    			</div>\n\n    		</div>\n    		<div class=\"devices common_devices\">\n    			<h2 >通用设施</h2>\n    			<div flex=\"main:left\">\n    				<p flex=\"dir:top cross:center\" ng-repeat=\'service in services track by $index\'><i flex=\"main:center cross:center\"><img ng-src={{service.img}} alt=\"\"></i>{{service.name}}</p>\n    			</div>\n    		</div>\n    	</div>\n    </ion-content>\n  </ion-view>\n");
$templateCache.put("templates/home/hotel_detail/hotel_detail.html","<ion-view title=\"酒店详情\">\r\n	 <ion-nav-buttons side=\"left\">\r\n            <button class=\"button button-clear ajk_back\" ng-click=\'back()\'></button>\r\n    </ion-nav-buttons>\r\n    <ion-content>\r\n    	<div class=\"hotelDetail_wrap\">\r\n    		<div class=\"hotel_introduce\">\r\n    			<h2>酒店简介</h2>\r\n    			<div class=\"hotel_mess\">\r\n    				<p>\r\n    					<span>房间数量(间):{{roomnum}}间房</span>\r\n    					<span>联系方式:{{num}}</span>\r\n    				</p>\r\n    				<button class=\"button button-calm\" ng-click=\'call()\'><i class=\"icon call\"></i>联系酒店</button>\r\n    			</div>\r\n    			<p>\r\n    				{{profiles}}\r\n    			</p>\r\n    		</div>\r\n\r\n    	</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/hotel_pics/hotel_pics.html","<ion-view title=\"酒店图片\">\r\n    <ion-nav-buttons side=\"left\">\r\n\r\n            <button class=\"button button-clear ajk_back\" ng-click=\'back()\'></button>\r\n\r\n    </ion-nav-buttons>\r\n    <ion-content>\r\n        <div class=\"hotel_pics_wrap\">\r\n\r\n\r\n            <div class=\"hotel_pics\">\r\n                <div class=\"pic_items\">\r\n                    <div class=\"pic_item\" ng-repeat=\'hotelPic in hotelPics track by $index\' ng-class=\'{active:indexi==$index}\' ng-click=\'changeColor($index,hotelPic.all)\'><p>{{hotelPic.imgsrcs}}<span>({{hotelPic.all.length}})</span></p></div>\r\n                </div>\r\n\r\n                <div class=\"pics\">\r\n                    <div class=\"picshow\" >\r\n                        <img ng-repeat=\"imgsrc in allImgs track by $index\" ng-click=\"ngshowif($index)\" ng-src=\"{{imgsrc}}\">\r\n                    </div>\r\n                </div>\r\n            </div>\r\n\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/house_detail/house_detail.html","<ion-view hide-nav-bar=\'true\'>\r\n <div class=\"change_bars fixed\" ng-show=\'!fixed\' >\r\n            <div class=\"change_bar\" ng-click=\'switchOn()\'>\r\n                <p  ng-class=\"{borderBottom:switch}\">\r\n                    <i class=\"hotel_detail\"></i>酒店详情\r\n                </p>\r\n            </div>\r\n            <div class=\"change_bar\" ng-click=\'switchOff()\'>\r\n                <p ng-class=\"{borderBottom:!switch}\">\r\n                    <i class=\"room_type\"></i>房间类型\r\n                </p>\r\n            </div>\r\n        </div>\r\n    <ion-scroll id=\'scroll\'  class=\'houseIntr_content\'>\r\n     <div class=\"houseDetail_wrap\">\r\n        <div class=\"houseDetail_header\" get-height >\r\n            <img ng-src={{pic}} ng-click = \'gohotelPics();\'>\r\n            <a ng-click=\'goHome()\' class=\"back\"><i></i></a>\r\n            <div class=\"share\">\r\n                <a ng-click=\"collect();\"><i class=\"unlike\" ng-if=\"!whetherCollect\"></i><i class=\"like\" ng-if=\"whetherCollect\"></i></a>\r\n                <a ng-click=\'share();\'><i class=\"navigation\"></i></a>\r\n            </div>\r\n            <span class=\"hotel_name\">\r\n				{{name}}\r\n			</span>\r\n            <p class=\"pics_num\" ng-click = \'gohotelPics();\'>{{picsLength}}张</p>\r\n        </div>\r\n        <div class=\"change_bars\" ng-show=\'fixed\'>\r\n            <div class=\"change_bar\">\r\n                <p ng-click=\'switchOn()\' ng-class=\"{borderBottom:switch}\">\r\n                    <i class=\"hotel_detail\"></i>酒店详情\r\n                </p>\r\n            </div>\r\n            <div class=\"change_bar\">\r\n                <p ng-click=\'switchOff()\' ng-class=\"{borderBottom:!switch}\">\r\n                    <i class=\"room_type\"></i>房间类型\r\n                </p>\r\n            </div>\r\n        </div>\r\n        <div ng-show=\'switch\'  class=\"hotel_detail_wrap\">\r\n          <div class=\"hotel_introduce\">\r\n              <h2 ><p><span class=\"divier\"></span>酒店简介</p><p class=\"see_all\" ng-click=\'seeAll();\'>查看全部></p></h2>\r\n              <p>{{profiles}}\r\n              </p>\r\n              <div></div>\r\n          </div>\r\n            <div class=\"hotel_devices\">\r\n                <h2><p><span class=\"divier\"></span>酒店设施</p></h2>\r\n                <div>\r\n                  <div>\r\n                    <div class=\"hotel_device\" ng-repeat=\'assort in assorts track by $index\'>\r\n                        <div class=\"img\">\r\n                            <img ng-src=\"{{assort.src}}\" alt=\"\">\r\n                        </div>\r\n                        <p>{{assort.name}}</p>\r\n                    </div>\r\n                    </div>\r\n                    <div class=\"more\">\r\n                      <div class=\"hotel_device\" ng-click=\'seeAllService();\'>\r\n                          <div class=\"img\" >\r\n                              <img ng-src=\"imgs/wcj/house_detail/more.png\" alt=\"\">\r\n                          </div>\r\n                          <p>更多</p>\r\n                      </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n            <div class=\"map\" ng-click=\"goMap()\">\r\n                <div class=\"house_map\" id=\'map\'></div>\r\n                <p class=\"map_loc\"><i></i>{{address}}</p>\r\n            </div>\r\n            <div class=\"comment\" ng-click=\'goHotelFeedback();\' ng-if=\"comment_if\">\r\n                <div class=\"comment_div\" >\r\n                    <p class=\"comment_star\">\r\n                        <span class=\"divier\"></span>评价&nbsp;&nbsp;&nbsp;\r\n                        <i class=\"start_full\" ng-repeat=\"star in stars track by $index\"></i>\r\n                        <i class=\"start_blank\" ng-repeat=\"star in star_blank track by $index\"></i>\r\n                    </p>\r\n                    <p class=\"comment_num\" >查看{{feedbackCount}}条点评<i class=\"left\"></i></p>\r\n                </div>\r\n                <div class=\"comment_atavter\" >\r\n                  <div class=\"atavter\" >\r\n                    <img ng-src=\"{{comment_first.headPicture||\'imgs/wcj/imghead.png\'}}\">\r\n                    <div>\r\n                      <p>{{comment_first.customer}}</p>\r\n                    </div>\r\n                  </div>\r\n                    <p class=\"all\">\r\n                        {{comment_first.content}}\r\n                    </p>\r\n                </div>\r\n            </div>\r\n            <div class=\"hotel_rule\">\r\n                <h2><span class=\"divier\"></span>酒店规则</h2>\r\n                <div class=\"deposit\"  style=\"position:relative\">\r\n                    <span class=\"blue_back\">押金</span>\r\n                    <span><strong>{{yajin}}</strong>元</span>\r\n                </div>\r\n                <div class=\"drawback\">\r\n                    <div style=\"position:relative\">\r\n                        <span class=\"blue_back\">退款</span>\r\n                    </div>\r\n                    <p>\r\n                        {{dealRule}}\r\n                    </p>\r\n                    <div class=\"blank\">\r\n\r\n                    </div>\r\n                </div>\r\n\r\n            </div>\r\n        </div>\r\n        <div ng-hide=\'switch\'   class=\"room_type\">\r\n            <div class=\"normal\" ng-repeat=\'room in roomType track by $index\'>\r\n                <h2 >{{room.houseTypex}}</h2>\r\n                <div class=\"list\">\r\n                    <div style=\'background-color:#fff\' class=\"item-two item-two-avater\"  ng-click=\'goHouseIntr(hos.id);\' ng-repeat=\'hos in room.rooms track by $index\'>\r\n                        <img ng-src=\'{{hos.picture}}\'>\r\n                         <ul class=\"room_mess\" >\r\n                        	 	 <li class=\"houseName\">{{hos.name}}</li>\r\n                             <li class=\"money\">¥{{hos.defaultPrice}}</li>\r\n                        	</ul>\r\n                          <p class=\"avater\"><i class=\"icon left_arr\"></i></p>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n            <div class=\"blank\">\r\n\r\n            </div>\r\n            <ion-infinite-scroll ng-if=\"moreDataCanBeLoaded\" on-infinite=\"loadMoreData()\" distance=\"10%\" immediate-check=\'false\'>\r\n            </ion-infinite-scroll>\r\n        </div>\r\n\r\n        </div>\r\n    \r\n    </ion-scroll>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/house_intr/house_intr.html","<ion-view hide-nav-bar=\'true\'>\r\n      <div class=\"houseIntr_fixed\" id=\'fixedScroll\'>\r\n        <a  class=\"back\" ng-click=\'back();\'><i></i></a>\r\n        <div class=\"share\" ng-click=\'share();\'>\r\n\r\n            <a><i class=\"navigation\"></i></a>\r\n        </div>\r\n      </div>\r\n      <div class=\"houseIntr_fixed default\" id=\'fixedDefault\'>\r\n        <a  class=\"back\" ng-click=\'back();\'><i></i></a>\r\n        <div class=\"share\" ng-click=\'share();\'>\r\n\r\n            <a><i class=\"navigation\"></i></a>\r\n        </div>\r\n      </div>\r\n      <ion-scroll on-scroll=\'swipe()\'  class=\'houseIntr_content\' get-height>\r\n        <div class=\"houseIntr_wrap\">\r\n            <div class=\"top_img\">\r\n                <ion-slide-box class=\'slide\'>\r\n                    <ion-slide ng-repeat=\'img in houseIntr.housePictures track by $index\'>\r\n                        <div class=\"box \"><img ng-src=\"{{img}}\"></div>\r\n                    </ion-slide>\r\n                </ion-slide-box>\r\n                <p>{{houseIntr.name}}</p>\r\n            </div>\r\n            <!-- <div class=\"house_mess\">\r\n                <h2>{{houseIntr.name}}</h2>\r\n                <p class=\"house_num\">房间编号:08080808</p>\r\n                <p>\r\n                    西溪蝶园，欧美风格，西溪湿地附近\r\n                    3室1厅1厨一卫1阳台110 可住6人双人床3张，智能化体验\r\n                     欧式风格，简装风格\r\n                </p>\r\n            </div> -->\r\n            <div class=\"house_detail\">\r\n                <h2>房间详情</h2>\r\n                <div class=\"state\">\r\n                    <span>可租房态</span>\r\n                    <span ng-click=\'selectDate()\'>查看日历</span>\r\n                </div>\r\n                <div class=\"money room\">\r\n                    <span>押金</span>\r\n                    <span>{{defaultPrice1}}</span>\r\n                </div>\r\n                <div class=\"gettime room\">\r\n                    <span>接待时间</span>\r\n                    <span>{{houseIntr.receptionTimeStr}}</span>\r\n                </div>\r\n                <div class=\"intime room\">\r\n                    <span>入住时间</span>\r\n                    <span>{{houseIntr.inTime}}以后</span>\r\n                </div>\r\n                <div class=\"outtime room\">\r\n                    <span>退房时间</span>\r\n                    <span>{{houseIntr.leaveTime}}之前</span>\r\n                </div>\r\n            </div>\r\n            <div class=\"house_devices\" >\r\n                <h2>房间设施</h2>\r\n                <div class=\"devices\">\r\n                    <p ng-repeat=\'assort in assorts track by $index\'><i><img ng-src=\"{{assort[1]}}\"></i>{{assort[0]}}</p>\r\n                </div>\r\n                <p class=\"more\"></p>\r\n            </div>\r\n\r\n        </div>\r\n      </ion-scroll>\r\n\r\n    <button class=\"button button-full button-calm\" style=\"position: fixed;bottom:0;margin-bottom: 0;opacity:0.8\" ng-click=\'joinShopCar();\'>\r\n                <i class=\"icon ion-loading-c\"></i>加入购物车\r\n            </button>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/map/map.html","<ion-view title=\'酒店地图\'>\n	 <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" ng-click=\"back();\"></button>\n    </ion-nav-buttons>\n    <ion-content>\n      <div id=\'container\'></div>\n     <!-- <div id=\"mapContainer\" ></div>-->\n      <div class=\"map-tips\">\n          <div class=\"map-btn places\" ng-click=\"myplace()\">\n            <p><img src=\"imgs/kwn/map/place.png\"></p>\n            <span>我的位置</span>\n          </div>\n        <div class=\"map-btn navigation\" ng-click=\"init()\">\n          <p><img src=\"imgs/kwn/map/navigation.png\"></p>\n          <span>导航</span>\n        </div>\n      </div>\n      <div class=\'center1\'>\n        <div id=\'bt\' class=\"btmtip\" ng-click=\'selectMapApp();\'>点击去地图</div>\n    </div>\n	    </ion-content>\n</ion-view>\n");
$templateCache.put("templates/home/my_collect/my_collect.html","<ion-view title=\"我的收藏\">\r\n    <ion-nav-buttons side=\"left\">\r\n            <button class=\"button button-clear ajk_back\" ng-click=\'back()\'></button>\r\n    </ion-nav-buttons>\r\n    <ion-content>\r\n        <div class=\"my_collect_wrap\">\r\n            <div class=\"hotel\" ng-repeat=\"collect in collects track by $index\">\r\n                <div class=\"item-three iterm-three-avater\" ui-sref=\"houseDtail({id:collect.hotelId})\">\r\n                            <img ng-src=\"{{collect.hotel.mainPicture}}\">\r\n                            <ul class=\"intr\">\r\n                                <li>{{collect.hotel.name}}</li>\r\n                                <li class=\"loc\"></span>{{collect.hotel.address}}<span></li>\r\n                                <li class=\"money\">¥{{collect.hotel.price}}</li>\r\n                            </ul>\r\n                         <p class=\"avater\"><i class=\"icon left_arr\"></i></p>\r\n                    </a>\r\n                </div>\r\n            </div>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/nearby/nearby.html","<ion-view title=\'{{nowcity}}\'>\n   <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\'tab.home\' native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n    </ion-nav-buttons>\n    <ion-nav-buttons side=\"right\">\n        <button class=\"button button-clear mapbtn\" nav-direction=\'back\' ng-click=\"mapshow()\"></button>\n    </ion-nav-buttons>\n    <div class=\"nearby-nav\" >\n      <!-- <div class=\"nav frist\">12月22日<br/>入住 <i></i></div> -->\n      <div class=\"nav\"  ng-class=\"{\'active\': flag}\" ng-click=\"show()\" >筛选 <i class=\"down_arr\"></i></div>\n      <div class=\"nav\" ng-class=\"{\'active\': sort}\" ng-click=\"sortshow()\">默认排序 <i></i></div>\n      <div class=\"sort\" ng-click=\"rank=!rank\"><span class=\'changeStatus1\' ng-class=\'{verticalStatus:rank}\' ></span></div>\n  </div>\n  <ion-content class=\"userCenter-back\">\n\n    <div class=\"diver\"></div>\n    <div ng-if=\'!rank\'>\n		<div class=\"nearby-list\" ng-repeat=\'hotel in hotels track by $index\' ui-sref=\'houseDtail({id:hotel.id})\'>\n				<div class=\"list\">\n			    	<div class=\"pic\">\n			    		<img ng-src = \'{{hotel.mainPicture}}\'>\n			    	</div>\n			    	<div class=\"desc\">\n			    		<h2>{{hotel.name}}</h2>\n			      	<p><span class=\"place\"><i class=\"icon\"></i>{{hotel.address}}</span></p>\n              <p class=\"money\"><em>¥</em>{{hotel.price}}<b>起</b></p>\n			    	</div>\n			</div>\n    </div>\n		</div>\n    <div ng-if=\'rank\' class=\"vertical\">\n		<div class=\"ajklist_vertical\" ng-repeat=\'hotel in hotels track by $index\' ui-sref=\'houseDtail({id:hotel.id})\'>\n				<div class=\"list\">\n			    	<div class=\"pic\">\n			    		<img ng-src = \'{{hotel.mainPicture}}\'>\n			    	</div>\n			    	<div class=\"intr\">\n			    		<h2>{{hotel.name}}</h2>\n			      	<p class=\"loc\"><span><i class=\"icon\"></i>{{hotel.address}}</span></p>\n              <p class=\"price\"><span>¥</span>{{hotel.price}}<span>起</span></p>\n			    	</div>\n			</div>\n    </div>\n		</div>\n		<div class=\"nearby-filtrate\" ng-show=\"flag\" ng-class =\'{slideDown:flag}\'>\n				<div class=\"filtrate\">\n					<div class=\"filtrate-list\">\n						<ul class=\"ban\">\n							<li ng-repeat=\"screenlist in screenlist track by $index\" ng-class=\"{checkback:$index==i}\" ng-click=\"screenlistClass($index)\"><i ng-class=\"{checked:$index==i}\">·</i>{{screenlist}}</li>\n						</ul>\n						<div class=\"filtrate-list-r\">\n							<!--附近-->\n							<ul class=\"price\" ng-show=\"neighbour\">\n								<li ng-class=\"{show:$index==j}\" ng-repeat=\"neighbouringlist in neighbouringlist track by $index\" ng-click=\"neighbouringClass($index,neighbouringlist)\"><span>{{neighbouringlist}}</span><i></i></li>\n							</ul>\n							<!--商圈-->\n							<ul class=\"price\" ng-hide=\"business\">\n								<li ng-repeat=\"businessArr in businessArr track by $index\" ng-class=\"{show:$index==k}\" ng-click=\"businessClass($index,businessArr)\"><span>{{businessArr}}</span><i></i></li>\n							</ul>\n							<!--价格-->\n							<ul class=\"price\" ng-hide=\"price\">\n								<li ng-repeat=\"pricelist in pricelist track by $index\" ng-class=\"{show:$index==j}\" ng-click=\"pricelistClass($index,pricelist)\"><span>{{pricelist}}</span><i></i></li>\n							</ul>\n							<!--区域-->\n							<ul class=\"price\" ng-hide=\"arealist\">\n								<li ng-repeat=\"areaArr in areaArr track by $index\" ng-class=\"{show:$index==t}\" ng-click=\"areacontClass($index,areaArr)\"><span>{{areaArr}}</span><i></i></li>\n							</ul>\n							<ul class=\"metro\" ng-hide=\"metro\">\n								<li class=\"path\">\n									<p ng-repeat=\"metroArr in metrolistArr track by $index\" ng-class=\"{right:$index==a}\" ng-click=\"metrochecked($index,metroArr)\">{{metroArr}}</p>\n								</li>\n								<li class=\"station\">\n									<p ng-repeat=\"maplistArr in maplistArr track by $index\" ng-class=\"{show:$index==j}\" ng-click=\"maplistClass($index,maplistArr)\"><span>{{maplistArr}}</span><i></i></p>\n								</li>\n							</ul>\n						</div>\n					</div>\n					<div class=\"filtrate-btn\">\n						<div class=\"left-btn\">清空</div>\n						<div class=\"right-btn\" ng-click=\"search()\">确定</div>\n					</div>\n				</div>\n		</div>\n		<div class=\"nearby-sort\" ng-show=\"sort\" ng-class =\'{slideDown:sort}\'>\n			<ul>\n				<li ng-class=\"{active:$index==i}\" ng-repeat=\"sortlist in sortlist\" ng-click=\"sortlistclass($index,sortlist)\"><span>{{sortlist}}</span><i></i></li>\n			</ul>\n		</div>\n		<div class=\'backdrop visible\' ng-class=\'{active:flag||sort}\' ng-show =\'flag||sort\' ng-click = \'filterHide()\'></div>\n    <script id=\"map-modal.html\" type=\"text/ng-template\">\n      <ion-modal-view>\n        <ion-header-bar class=\'\'>\n          <button class=\"button button-clear ajk_back modalbtn\" ng-click=\'closeModal();\'></button>\n          <h1 class=\"title\">酒店地图</h1>\n        </ion-header-bar>\n        <ion-content>\n          <div id=\"HouseOnMap\" class=\"HouseOnMap\"></div>\n          {{data}}\n        </ion-content>\n      </ion-modal-view>\n    </script>\n\n  </ion-content>\n  <ion-infinite-scroll ng-if=\"moreDataCanBeLoaded\" on-infinite=\"loadMoreData()\" distance=\"10%\" immediate-check=\'false\'>\n  </ion-infinite-scroll>\n</ion-view>\n");
$templateCache.put("templates/home/picShow/picShow.html","<ion-view hide-nav-bar=\'true\'>\n	<ion-content style=\'background-color: #000;\'>\n		     <div class=\"picShow_wrap\">\n		     <div class=\"blank\"></div>\n		      <div class=\"back\" native-ui-sref=\'hotelPics\' native-options=\"{type: \'fade\', duration:500}\"></div>\n		     	<ion-slide-box id=\'slide\' class=\'slide\' active-slide=\'index\'>\n                    <ion-slide ng-repeat=\'img in imgs track by $index\'>\n                        <div class=\"box\">\n                          <img ng-src=\"{{img}}\" alt=\"\">\n                        </div>\n                    </ion-slide>\n                </ion-slide-box>\n		     </div>\n	</ion-content>\n</ion-view>\n");
$templateCache.put("templates/home/select_bussiniss/select_bussinss.html","<ion-view hide-nav-bar=\'true\'>\n    <ion-content class=\'selectBussiniss_back\' overflow-scroll=\"true\" style=\"overflow: hidden\">\n        <div class=\'selectBussiniss_search\'>\n            <span native-ui-sref=\"tab.home\" native-options=\"{type: \'slide\', direction:\'down\'}\"></span>\n            <div class=\"\">\n                <i class=\"icon s_b_search\"></i>\n                <!--<span>花蒋路</span>-->\n                <form>\n                  <input type=\"search\" placeholder=\"搜索\" ng-model=\'searchText.text\'/>\n                  <button style=\'opacity:0\' ng-click=\"submitSearch()\"></button>\n                </form>\n\n            </div>\n        </div>\n        <div class=\"selectBussinss_wrap\">\n            <div class=\"selectBussinss_list\">\n                <div class=\"first_floor\" ng-class=\"{active:$index==i}\" ng-repeat=\"select in selectArr track by $index\" ng-click=\"selectShow($index)\">{{select}}</div>\n            </div>\n            <ul class=\"metro_list\"  ng-show=\"metroshow\">\n                <li ng-repeat=\"metroArr in metroArr\" ng-click=\"metrochecked(metroArr)\">{{metroArr}}</li>\n            </ul>\n            <div class=\"content_list\" ng-class={\'ditie\':metroshow}>\n                <div class=\"list metro_cont_list\" ng-show=\"metroContList\" ng-repeat=\"maplistArr in maplistArr track by $index\">\n                    <div class=\"item item-divider initial\">\n                        {{maplistArr.letter.toUpperCase()}}\n                    </div>\n                    <p class=\"item cont_list\" href=\"javascript:void(0);\" ng-repeat=\"maplist in maplistArr.data track by $index\" ng-click=\'goNearby(maplist)\'>\n						{{maplist}}\n					</p>\n                </div>\n                <div class=\"list\" ng-show=\"contentList\" ng-repeat=\"maplistArr in maplistArr track by $index\">\n                    <!--<a class=\"item cont_list\" href=\"javascript:;\">\n						全部\n					</a>-->\n                    <div class=\"item item-divider initial\">\n                        {{maplistArr.letter.toUpperCase()}}\n                    </div>\n                    <p class=\"item cont_list\" href=\"javascript:;\" ng-repeat=\"listArr in maplistArr.data track by $index\" ng-click=\'goNearby(listArr)\'>\n						{{listArr}}\n					</p>\n                </div>\n            </div>\n        </div>\n        <div id=\"panel\"></div>\n    </ion-content>\n</ion-view>\n");
$templateCache.put("templates/home/select_date/select_date.html","<ion-view view-title=\"日期选择\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" ng-click=\"back()\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content>\r\n        <div class=\"directive_date\">\r\n            <date-select></date-select>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/home/comment/comment.html","<ion-view title=\"全部点评\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" ng-click=\"goHouseDtail()\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content>\r\n        <div class=\"comment_wrap\">\r\n            <div class=\"comment_all\">\r\n                <h2>酒店总评</h2>\r\n                <div class=\"stars\">\r\n                    <span class=\"star_full\" ng-repeat=\'star in star_full track by $index\'></span>\r\n\r\n                    <span class=\"star_blank\" ng-repeat=\'star in star_blank track by $index\'></span>\r\n                </div>\r\n                <span class=\"point\">{{stars}}分</span>\r\n            </div>\r\n            <div class=\"list card comment\" ng-repeat=\'customer in customers track by $index\'>\r\n                <div class=\"item item-avatar\">\r\n                    <img ng-src=\"{{customer.headPicture}}\">\r\n                    <h2>{{customer.customer}}<span class=\"point\">{{customer.stars}}分</span><span class=\"mask\"></span></h2>\r\n                </div>\r\n                <p class=\"all\">\r\n                    {{customer.content}}\r\n                </p>\r\n                <p class=\"about\">\r\n                    <span  class=\"subdued\">{{customer.gmtCreate}}</span>\r\n                </p>\r\n            </div>\r\n\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/landlord_profit/landlord_profit.html","<ion-view view-title=\"成为房东\">\r\n	 <ion-nav-buttons side=\"left\" >\r\n        <button class=\"button button-clear ajk_back\" ng-click=\'goback();\' nav-direction=\'back\'></button>\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\"  >\r\n    	<div class=\"landlord_profit_wrap\">\r\n   		 <div class=\"contents\">\r\n    			<div class=\"content\">\r\n    				<span>成为房东的好处</span>\r\n    				<span>进一步了解</span>\r\n    			</div>\r\n    			<div class=\"content\">\r\n    				<span>优秀房东攻略</span>\r\n    				<span>进一步了解</span>\r\n    			</div>\r\n    			<div class=\"content\">\r\n    				<span>如何加盟我们</span>\r\n    				<span>进一步了解</span>\r\n    			</div>\r\n    		</div>\r\n    		 <div class=\"submit\" >\r\n        	  <button class=\"button button-full button-calm\" ng-click=\"joinus()\">\r\n              加盟我们\r\n            </button>\r\n        </div>\r\n    	</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/account_detail/account_detail.html","<ion-view view-title=\"订单信息\">\n    <ion-nav-buttons side=\"left\">\n        <button class=\"button button-clear ajk_back\" ng-click=\'goBack()\'></button>\n    </ion-nav-buttons>\n	<ion-content>\n    <div class=\"account_detail_wrap\">\n      <div class=\"order_detal\">\n        <div class=\"avater_intr\">\n          <img ng-src=\"{{house.picture}}\" alt=\"\">\n          <h4>{{hotelName}}</h4>\n        </div>\n        <div class=\"other_intr clearfix\"><span>房型</span><p>{{house.houseName}}</p></div>\n        <div class=\"other_intr clearfix\"><span>地址</span><p>{{house.address}}</p></div>\n        <div class=\"other_intr clearfix\"><span>入住时间</span><p>{{house.inTimes}}</p></div>\n      </div>\n    </div>\n  </ion-content>\n</ion-view>\n");
$templateCache.put("templates/userCenter/beLandlord/joinUs/join_us.html","<ion-view view-title=\"成为房东\">\n  <ion-nav-buttons side=\"left\">\n    <button class=\"button button-clear ajk_back\" native-ui-sref=\"landlordProfit\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\n  </ion-nav-buttons>\n  <ion-content overflow-scroll=\"true\" style=\"overflow: hidden\">\n    <div class=\"joinUs_wrap\">\n      <div ng-if=\"!bindWhether\">\n        <section class=\"intr\">\n          <div>\n            <span>真实姓名:</span>\n            <input type=\"text\" placeholder=\"请输入姓名\" ng-pattern=\'/^[\\u4e00-\\u9fa5]{2,20}$/\' ng-model=\"data.name\">\n          </div>\n          <div>\n            <span>身份证号:</span>\n            <input type=\"tel\" number-confirm ng-minlength=\'18\' ng-maxlength=\'18\' maxlength=\'18\' ng-pattern=\'/\\d{18}/\' placeholder=\"请输入身份证号码\" ng-model=\'data.cardNo\'>\n          </div>\n        </section>\n        <div class=\"upload_idcard\">\n          <div class=\'id_Card\' ng-if=\'idCard\'>\n            <div class=\"\" ng-click=\'getIdCard(\"font\")\'>\n              <img src=\"imgs/wcj/join_us/plus.png\" alt=\"身份证真面\">\n              <p>点击上传身份证真反面照片</p>\n            </div>\n            <div class=\"\" ng-click=\'getIdCard(\"back\")\'>\n              <img src=\"imgs/wcj/join_us/plus.png\" alt=\"身份证反面\">\n              <p>点击上传身份证真反面照片</p>\n            </div>\n            <!-- <img src=\"imgs/wcj/join_us/plus.png\" alt=\"\">\n          <p>点击上传身份证真反面照片</p>\n          <p>(可调取摄像头现拍或在相册中选取)</p>\n          <p class=\"num\">0/2</p> -->\n          </div>\n          <div class=\'id_Card img\' ng-if=\'!idCard\'>\n            <div class=\"\" ng-click=\'getIdCard(\"font\")\'>\n              <img ng-src={{fontImg}} alt=\"\">\n            </div>\n            <div class=\"\" ng-click=\'getIdCard(\"back\")\'>\n              <img ng-src={{backImg}} alt=\"\">\n            </div>\n          </div>\n          <label class=\"item item-input \">\n                <span class=\"input-label\">提示:</span>\n                <p>可调取摄像头现拍或在相册中选取,身份证照片与证件号要求清晰可见,如有看不清则视为无效</p>\n            </label>\n        </div>\n\n        <section class=\"intr address\">\n\n          <div ng-if=\"!platform\" style=\"margin-bottom:1px\">\n            <span>所在地区:</span>\n            <hms-pct-select ng-transclude></hms-pct-select><span class=\'right\'></span>\n          </div>\n          <div ng-if=\"platform\" style=\"margin-bottom:1px\">\n            <span>所在地区:</span>\n            <city-picker></city-icker>\n          </div>\n          <div>\n            <span>详细地址:</span>\n            <input type=\"text\" placeholder=\"如街道、楼牌号等\" ng-model=\'data.detailAddress\'>\n          </div>\n        </section>\n        <div class=\"submit\">\n          <button class=\"button button-full button-calm\" ng-click=\'submit();\'>\n              提交审核\n            </button>\n        </div>\n      </div>\n      <div ng-if=\"bindWhether\">\n        <section class=\"intr detailintr\">\n          <div>\n            <span>真实姓名:</span>\n            <p>{{landlord.name}}</p>\n          </div>\n          <div>\n            <span>身份证号:</span>\n            <p>{{landlord.cardNo}}</p>\n          </div>\n          <div>\n            <span>所在地区:</span>\n            <p>{{landlord.address}}</p>\n          </div>\n          <div>\n            <span>详细地址:</span>\n            <p>{{landlord.detailAddress}}</p>\n          </div>\n        </section>\n      </div>\n    </div>\n  </ion-content>\n  <script id=\"hmsPCTSelect-modal.html\" type=\"text/ng-template\">\n    <ion-modal-view>\n      <ion-header-bar class=\"bar-calm\">\n        <h1 class=\"title\">选择地址</h1>\n        <div class=\"buttons\">\n          <button ng-click=\"PCTModal.hide();\" class=\"button button-clear\">\n          取消\n        </button>\n        </div>\n      </ion-header-bar>\n      <ion-content overflow-scroll=\"true\" style=\"overflow: hidden\">\n        <ion-slide-box show-pager=\"false\" style=\"height: 100%;\" does-continue=\"false\" delegate-handle=\"PCTSelectDelegate\" ng-init=\"lockSlide()\">\n          <ion-slide>\n            <ion-scroll style=\"height: 100%;\" scrollbar-y=\"false\" delegate-handle=\"PCTSelectProvince\">\n              <ion-item class=\"item-icon-right\" ng-click=\"chooseProvince(item);\" ng-repeat=\"item in provincesData track by $index\">\n                <span>{{item}}</span>\n                <i class=\"icon ion-ios-arrow-right icon-item\"></i>\n              </ion-item>\n            </ion-scroll>\n          </ion-slide>\n          <!--省选择结束-->\n\n          <!--市选择开始-->\n          <ion-slide>\n            <ion-scroll style=\"height: 100%;\" scrollbar-y=\"false\" delegate-handle=\"PCTSelectCity\">\n              <ion-item class=\"item-icon-right\" ng-click=\"chooseCity(item);\" ng-repeat=\"item in citiesData track by $index\">\n                <span>{{item}}</span>\n                <i class=\"icon ion-ios-arrow-right icon-item\"></i>\n              </ion-item>\n            </ion-scroll>\n          </ion-slide>\n          <!--市选择结束-->\n\n          <!--县选择开始-->\n          <ion-slide>\n            <ion-scroll style=\"height: 100%;\" scrollbar-y=\"false\" delegate-handle=\"PCTSelectTown\">\n              <ion-item class=\"item-icon-right\" ng-click=\"chooseTown(item);\" ng-repeat=\"item in townData track by $index\">\n                <span>{{item}}</span>\n                <i class=\"icon ion-ios-arrow-right icon-item\"></i>\n              </ion-item>\n            </ion-scroll>\n          </ion-slide>\n        </ion-slide-box>\n\n      </ion-content>\n    </ion-modal-view>\n\n  </script>\n</ion-view>\n");
$templateCache.put("templates/userCenter/beLandlord/my_house/my_house.html","<ion-view view-title=\"房源\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"beLandlord\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n	<ion-content>\r\n		<div class=\"myHouse_wrap_house\" ng-repeat = \'hotel in hotels track by $index\'>\r\n		 <div class=\"myHouse_wrap_detail\">\r\n		 	<img ng-src={{hotel.mainPicture}} alt=\"\">\r\n			<div>\r\n				<h2>{{hotel.name}}</h2>\r\n				<p>{{hotel.address}}</p>\r\n				<p class=\"num\">共:{{hotel.houseCounts}}间&nbsp;今日已出租:{{hotel.leaseCounts}}间</p>\r\n			</div>\r\n		 </div>\r\n		 <div class=\"myHouse_wrap_btn\">\r\n		 	<div><span ng-click=\'seeHouse(hotel.id)\' >查看</span></div>\r\n		 	<div><span ui-sref=\'myhouseDetail({id:hotel.id})\'>详情</span></div>\r\n		 	<div><span ui-sref=\'myOrderForm({id:hotel.id})\'>订单</span></div>\r\n		 </div>\r\n		</div>\r\n		</div>\r\n    <ion-infinite-scroll\r\n        ng-if=\"moreDataCanBeLoaded\"\r\n        on-infinite=\"loadMoreData()\"\r\n        immediate-check=\'false\'>\r\n    </ion-infinite-scroll>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/my_orderform/my_orderform.html","<ion-view hide-nav-bar=\'true\'>\r\n	<ion-content has-subheader=\"false\">\r\n		<div class=\"my_orderform_wrap\">\r\n			<div class=\"divier\"></div>\r\n			<div class=\"header\">\r\n				<span><i class=\"close\" native-ui-sref=\'myHouse\' native-options=\"{type: \'slide\', direction:\'right\'}\"></i></span>\r\n				<div class=\"select_btn\">\r\n					<span ng-click=\"select=true\" ng-class=\"{selectBtn:select}\">进行中</span>\r\n					<span ng-click=\"select=false\" ng-class=\"{selectBtn:!select}\">已结束</span>\r\n				</div>\r\n			</div>\r\n			<div ng-show=\"select\">\r\n			  <div class=\"normal\" ng-repeat =\'order in orders track by $index\'>\r\n               <div ng-repeat=\'hotel in order.hotelsx track by $index\'>\r\n    			<h2>{{hotel.hotelName}}</h2>\r\n    			<div class=\"normal_house\"  ng-repeat=\'house in hotel.houses track by $index\' ng-click=\"goAccountDetail(house,hotel.hotelName)\">\r\n    				<div class=\"item-four\">\r\n    						<img ng-src=\"{{house.picture}}\" alt=\"\">\r\n    						<ul>\r\n    							 <li class=\"OrderNum\">订单号:{{order.orderCode}}</li>\r\n    							<li>{{house.houseName}}</li>\r\n    							<li>{{house.address}}</li>\r\n                  <li>入住时间:{{house.inTimes}}</li>\r\n    						</ul>\r\n    					</div>\r\n    				</div>\r\n    			</div>\r\n\r\n    		</div>\r\n\r\n			</div>\r\n			<div ng-hide=\"select\">\r\n				 <div class=\"normal\" ng-repeat =\'order in endOrders track by $index\'>\r\n               <div ng-repeat=\'hotel in order.hotels track by $index\'>\r\n                <h2>{{hotel.hotelName}}</h2>\r\n                <div class=\"normal_house\" ui-sref=\'orderFormDetail\' ng-repeat=\'house in hotel.houses track by $index\' ng-click=\"goAccountDetail(house,hotel.hotelName)\">\r\n                    <div class=\"item-four\">\r\n                            <img ng-src={{house.picture}} alt=\"\">\r\n                            <ul>\r\n                                 <li>订单号:{{order.orderCode}}</li>\r\n                                <li>{{house.houseName}}</li>\r\n                                <li>{{house.address}}</li>\r\n                                <li>入住时间:{{house.inTimes}}</li>\r\n                            </ul>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n\r\n            </div>\r\n\r\n\r\n    		</div>\r\n			</div>\r\n		</div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/myaccount/myaccount.html","<ion-view view-title=\"我的收入\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"beLandlord\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-nav-buttons side=\"right\" >\r\n        <span class=\"date_select\" ng-click=\"openDatePicker();\">{{month}}</span>\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\">\r\n        <div class=\"myaccount_wrap\">\r\n           <div ng-if=\"!dataswitch\">\r\n            <div class=\"btns\">\r\n                <span ng-click=\"dayIncome()\" ng-class=\"{select:select}\">日报表</span>\r\n                <span ng-click=\"monthIncome();\" ng-class=\"{select:!select}\">月报表</span>\r\n            </div>\r\n            <div ng-show=\'select\' class=\"select\">\r\n            	 <!-- <p>年总收入:<span>10000</span></p> -->\r\n            <div class=\"date_picker directive_date\">\r\n                 <p>本月预估收入:{{monthIncomes}}</p>\r\n                <date-account year={{year}} month={{month}}></date-account>\r\n            </div>\r\n            <div class=\"normal\" ng-repeat = \'dayIncome in DayIncomes track by $index\'>\r\n\r\n                <div class=\"normal_house\"  >\r\n                        <div class=\"item-three\" style=\"background-color:#fff\">\r\n                            <img ng-src={{dayIncome.picture}} alt=\"\">\r\n                            <ul>\r\n                                <li>订单号:{{dayIncome.orderCode}}</li>\r\n                                <li>入住时间:{{dayIncome.inTimes}}</li>\r\n                                <li class=\"money\">预估收入:{{dayIncome.totalFee}}</li>\r\n                            </ul>\r\n                        </div>\r\n                </div>\r\n            </div>\r\n            </div>\r\n            <div ng-hide=\"select\" class=\'select\'>\r\n\r\n                <div class=\"order\" ng-repeat=\"order in incomeOrders track by $index\" >\r\n               <div class=\'hotel\' >\r\n                <p><span>{{order.hotelName}}</span><span>订单号:{{order.orderCode}}</span></p>\r\n\r\n                <div class=\"item-three\" >\r\n                    <img ng-src=\'{{order.picture}}\' />\r\n                    <ul>\r\n                        <li class=\"OrderNum\">{{order.houseName}}</li>\r\n                        <li class=\"Time\">{{order.inTimes}}</li>\r\n                        <li class=\"money\">¥{{order.totalFee}}</li>\r\n                    </ul>\r\n                </div>\r\n                </div>\r\n            </div>\r\n            </div>\r\n            </div>\r\n            <div class=\"dataSelect\" ng-if=\"dataswitch\">\r\n              <h2>请选择年份</h2>\r\n              <div class=\"years\">\r\n                  <p ng-repeat=\'year in years track by $index\' ng-click=\'monthSelect(year,$index)\' ng-class=\'{active:indexi==$index}\'>{{year}}</p>\r\n              </div>\r\n              <h2>请选择月份</h2>\r\n              <div class=\'month\'>\r\n                  <p ng-repeat=\'month in months track by $index\' ng-click=\'daySelect(month,$index)\' ng-class=\'{active:indexii==$index}\'>{{month}}</p>\r\n              </div>\r\n            </div>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/myhouse_changeprice/myhouse_changeprice.html","<ion-view view-title=\"房态日历\">\r\n    <ion-nav-buttons side=\"left\">\r\n\r\n        <button class=\"button button-clear ajk_back\" ng-click=\'back();\' ></button>\r\n\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\" class=\"has-footer\">\r\n        <div class=\"myhouse_changeprice_wrap\">\r\n            <h2>{{houseName}}</h2>\r\n\r\n                <div class=\"directive_date fix\">\r\n               <datepick></datepick>\r\n            </div>\r\n            \r\n        </div>\r\n    </ion-content>\r\n    <button class=\'button button-calm button-full \' ng-click=\'changePrice()\' style=\"position:fixed;bottom: 0;margin: 0\">修改价格</button>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/myhouse_detail/myhouse_detail.html","<ion-view view-title=\"爱居客酒店\">\r\n	 <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"myHouse\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\">\r\n    	<div class=\"myhouse_detail_wrap\">\r\n    		<div class=\"normal\" ng-repeat = \'hotel in hotels track by $index\'>\r\n    			<h2>{{hotel.houseTypex}}</h2>\r\n    			<div class=\"normal_house\" ng-repeat=\'house in hotel.houses track by $index\'>\r\n    					<div style=\'background-color:#fff\' class=\"item-two item-two-avater\" ng-click=\'myhouseIntr(house.id)\'>\r\n    						<img ng-src=\"{{house.picture}}\" alt=\"\">\r\n    						<ul>\r\n    							<li class=\"houseName OrderNum\">{{house.name}}</li>\r\n    							<li>编号:12345687955412</li>\r\n    						</ul>\r\n								<p class=\'money\' ui-sref=\'myhouseChangePrice({id:house.id,name:\"{{house.name}}\",price:house.defaultPrice})\'>更改房价</p>\r\n    					</div>\r\n    				</div>\r\n    		</div>\r\n\r\n    	</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/myhouse_intr/myhouse_intr.html","<ion-view hide-nav-bar=\'true\'>\r\n	<ion-content has-subheader=\"false\">\r\n\r\n		<div class=\"myhouse_intr_wrap\">\r\n		 <span class=\"back\" ng-click=\'goback()\'></span>\r\n			 <ion-slide-box class=\'slide\'>\r\n            <ion-slide ng-repeat=\'pic in house.housePictures track by $index\'>\r\n                <div class=\"box \"><img ng-src={{pic}}></div>\r\n            </ion-slide>\r\n        </ion-slide-box>\r\n        <div class=\"mess\">\r\n        	<h2>爱居客酒店-{{house.name}}</h2>\r\n        	<div>\r\n        		<h3>房屋信息:</h3>\r\n        		<p>\r\n        			{{house.profiles}}\r\n        		</p>\r\n        	</div>\r\n        </div>\r\n        <div class=\"basicItem\" ui-sref=\'myhouseBasicmess\'>\r\n             <div>\r\n              基本信息\r\n             </div>\r\n        </div>\r\n				<div class=\"myhouse_basicmess_wrap\">\r\n	    	  <div class=\"wrap\">\r\n	    	  	<p>\r\n	    			<span>房屋面积</span>\r\n	    			<span>1000㎡</span>\r\n	    		</p>\r\n	    			<p>\r\n	    			<span>户型</span>\r\n	    			<span>2室2厅1卫</span>\r\n	    		</p>\r\n	    			<p>\r\n	    			<span>床数</span>\r\n	    			<span>2张</span>\r\n	    		</p>\r\n	    			<p>\r\n	    			<span>可住人数</span>\r\n	    			<span>4人</span>\r\n	    		</p>\r\n	    	  </div>\r\n	    	</div>\r\n         <div class=\"basicItem\">\r\n             <div>\r\n              配套设施\r\n             </div>\r\n        </div>\r\n				<div class=\"myhouse_wrap_wrap\">\r\n	          <div>\r\n	          <span ng-repeat=\'assort in assorts track by $index\'>{{assort}}</span>\r\n\r\n	              </div>\r\n	        </div>\r\n		</div>\r\n	</ion-content>\r\n\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/orderform_detail/orderform_detail.html","<ion-view view-title=\"详细信息\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"myaccount\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n	<ion-content has-subheader=\"false\">\r\n		<div class=\"orderform_detail_wrap\">\r\n			<div class=\"header\">\r\n				<span>爱居客酒店-西湖店</span>\r\n				<span>交易成功</span>\r\n			</div>\r\n			<div class=\"mess\">\r\n				<p >\r\n					<span>付款方式</span>\r\n					<span>支付宝</span>\r\n				</p>\r\n				<p>\r\n					<span>房客支付</span>\r\n					<span>1000元</span>\r\n				</p>\r\n				<p>\r\n					<span>预计收入</span>\r\n					<span>800元</span>\r\n				</p>\r\n				<p>\r\n					<span>房间打扫</span>\r\n					<span>50元</span>\r\n				</p>\r\n				<p>\r\n					<span>服务费用</span>\r\n					<span>100元</span>\r\n				</p>\r\n			</div>\r\n			<div class=\"mess\">\r\n				<p >\r\n					<span>入住人</span>\r\n					<span>王小二</span>\r\n				</p>\r\n				<p>\r\n					<span>手机号</span>\r\n					<span>13000000000000</span>\r\n				</p>\r\n			</div>\r\n		</div>\r\n	</ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/see_myhouse/see_myhouse.html","<ion-view view-title=\"查看房源\">\r\n    <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"myHouse\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\" style=\'background-color: #efefef\'>\r\n      <div class=\"seeHouse_wrap\">\r\n        <div class=\"seeHouse_wrap_slide\">\r\n            <ion-slide-box class=\'slide\'>\r\n                <ion-slide ng-repeat=\'pic in pics track by $index \'>\r\n                    <div class=\"box \"><img ng-src={{pic}}></div>\r\n                </ion-slide>\r\n\r\n            </ion-slide-box>\r\n        </div>\r\n        <div class=\"seeHouse_wrap_intr\">\r\n            <h2>{{hotel.name}}</h2>\r\n            <div>\r\n                <h4>房源简介:</h4>\r\n                 <p >\r\n                    {{hotel.profiles}}\r\n                 </p>\r\n            </div>\r\n        </div>\r\n        <div class=\"list item_normal\">\r\n            <div class=\"address\">\r\n            	 <i class=\"seeHouse_wrap_loc\" ></i>\r\n               {{hotel.address}}\r\n            </div>\r\n        </div>\r\n         <div class=\"trade_rule\" ui-sref=\'tradeRule\'>\r\n             	<i class=\"seeHouse_wrap_rule\"></i>\r\n               <p>交易规则查看</p>\r\n             <i class=\"seeHouse_wrap_rightarr icon-right\"></i>\r\n        </div>\r\n        </div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/trade_rule/trade_rule.html","<ion-view view-title=\"交易规则\">\r\n	 <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" ng-click=\"back()\"></button></a>\r\n    </ion-nav-buttons>\r\n    <ion-content has-subheader=\"false\">\r\n    	<div class=\"trade_rule_wrap\">\r\n    		<h2>温馨提示</h2>\r\n    		<p>1.房客入住前一天18:00之前取消订单,预付房费全部退还。</p>\r\n    		<p>2.房客入住前一天18:00之后,入住日的18:00之前取消订单,从预付房费中扣除第一天的房租。</p>\r\n    		<p>3.房客入住日日期的18:00之后默认为入住,并扣除当天房费,若入住后提前退房,则房东从线上预付订金中扣除退房次日的房费。</p>\r\n    	</div>\r\n    </ion-content>\r\n</ion-view>\r\n");
$templateCache.put("templates/userCenter/beLandlord/waitCheck/wait_check.html","<ion-view view-title=\"待审核\">\r\n <ion-nav-buttons side=\"left\">\r\n        <button class=\"button button-clear ajk_back\" native-ui-sref=\"tab.userCenter\" native-options=\"{type: \'slide\', direction:\'right\'}\"></button>\r\n    </ion-nav-buttons>\r\n	<ion-content has-subheader=\"false\">\r\n		<div class=\"waitCheck_wrap\">\r\n			<div class=\"wait_check\">\r\n\r\n					<img src=\"imgs/wcj/wait_check/check.png\" alt=\"\">\r\n					<p>\r\n						加盟我们\r\n					</p>\r\n\r\n			</div>\r\n			<p>审核完成后,我们会与您电话联系,确定签约时间</p>\r\n		</div>\r\n	</ion-content>\r\n</ion-view>\r\n");}]);
angular.module('home-controller', [])
  .controller('homeCtrl', ['$scope', '$ionicPlatform', '$cordovaAppAvailability', '$ionicScrollDelegate', '$rootScope', 'ApiService', '$ionicSlideBoxDelegate', '$stateParams', '$state', '$ionicLoading', 'mainADs', '$location', '$ionicViewSwitcher', '$ionicPopup', function($scope, $ionicPlatform, $cordovaAppAvailability, $ionicScrollDelegate, $rootScope, ApiService, $ionicSlideBoxDelegate, $stateParams, $state, $ionicLoading, mainADs, $location, $ionicViewSwitcher, $ionicPopup) {
    $ionicSlideBoxDelegate.update();
    $ionicSlideBoxDelegate.loop(true);
    //选择的城市
    $scope.city = localStorage.getItem('city') ? localStorage.getItem('city') : '杭州';
    $scope.$on('cityChange', function() {
      $scope.city = localStorage.getItem('city');
      pageNo = 1
      getHomePageHotels()
    });

    $scope.$on('cityChange', function() {
      var city = sessionStorage.getItem("city");
      var CityReg = /市$/;
      if (CityReg.test(city)) {
        $scope.city = city.substring(0, city.length - 1);
      } else {
        $scope.city = city;
      }
      pageNo = 1
      getHomePageHotels()
    });
    var city = sessionStorage.getItem("city");
    var CityReg = /市$/;
    if (CityReg.test(city)) {
      $scope.city = city.substring(0, city.length - 1);
    } else {
      $scope.city = city;
    }
    //定位
    //Ã–Ã·Â¹Ã£Â¸Ã¦
    $scope.mainADs = mainADs.data.result;

    //
    $scope.goSelectBussiniss = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $state.go('selectBussiniss');
      $ionicViewSwitcher.nextDirection("forward");
    };
    //副广告
    ApiService.getHomePageBanner({
      level: 1
    }).success(function(res) {
      $scope.subADs = res.result;
    });
    //酒店列表
    var pageNo = 1;
    $scope.moreDataCanBeLoaded = true;

    function getHomePageHotels() {
      ApiService.getHomePageHotels({
        pageNo: pageNo,
        pageSize: 5,
        address: encodeURI($scope.city || '杭州市')
      }).success(function(res) {
        if (res.success) {
          // $ionicLoading.hide();
          $scope.hotels = res.result.map(function(hotel) {
            //评价星星
            hotel.full_stars = [];
            hotel.full_stars.length = parseInt(hotel.stars, 10) || 5;
            hotel.star_blank = [];
            hotel.star_blank.length = 5 - hotel.full_stars.length;
            return hotel
          })
          pageNo++;
        }
      });
    }
    getHomePageHotels()
    $scope.loadMoreData = function() {
      ApiService.getHomePageHotels({
        pageNo: pageNo,
        pageSize: 5,
        address: encodeURI(sessionStorage.getItem("city") || '杭州')
      }).success(function(res) {
        console.log(res)
        if (res.success && res.result.length > 0) {
          for (var i = 0; i < res.result.length; i++) {
            $scope.hotels.push(res.result[i]);
          }
          $scope.$broadcast("scroll.infiniteScrollComplete");
          pageNo++;

        } else {
          $scope.moreDataCanBeLoaded = false;
        }
      });
    };
    //酒店详详情
    $scope.goHotelDetail = function(id) {
      $state.go('houseDtail', {
        id: id
      });
      $ionicViewSwitcher.nextDirection("forward");
    };
    //goNearBy
    $scope.goNearBy = function() {
      $state.go('nearby', { city: sessionStorage.getItem('city') })
    }
    //滚动置顶
    $scope.$on('getHeight', function() {

    });
    $scope.swipe = function() {
      var scrollTop = $ionicScrollDelegate.getScrollPosition().top;
      //var opacity = angular.element(document.querySelector('#fixed'))[0].style.opacity
      angular.element(document.querySelector('#fixed'))[0].style.opacity = scrollTop * 0.002;
      angular.element(document.querySelector('#fixedHeader'))[0].style.opacity = scrollTop * 0.002;
      angular.element(document.querySelector('#fixedHeaderDefalut'))[0].style.opacity = 1 - scrollTop * 0.002 * 2;
    };



  }]);

angular.module('discover-controller', [])
  .controller('discoverCtrl', ['$scope', '$state', '$ionicModal', '$cordovaInAppBrowser', function($scope, $state,$ionicModal,$cordovaInAppBrowser) {
	// if (ionic.Platform.isIOS()) {
	// 	cordova.ThemeableBrowser.open('http://m.amap.com/around/?locations=116.470098,39.992838&keywords=美食,KTV,地铁站,公交站&defaultIndex=3&defaultView=&searchRadius=5000&key=db834b40077df1a9574a3faf3cd17f72', '_blank', {
	// 		statusbar: {
	// 			color: '#ffffffff'
	// 		},
	// 		toolbar: {
	// 			height: 24,
	// 			color: '#222635ff'
	// 		},
	// 		title: {
	// 			color: '#000000',
	// 			staticText:'',
	// 			showPageTitle: false
	// 		},
	// 		closeButton: {
	// 			image: 'www/imgs/wcj/close.png',
	// 			imagePressed: 'www/imgs/wcj/close.png',
	// 			align: 'left',
	// 			event: 'closePressed'
	// 		},
	// 		backButtonCanClose: true
	// 	}).addEventListener('closePressed', function(e) {
  //       $state.go('tab.home')
	// 	});
	// }
  var defaultOptions = {
    location: 'no',
     clearcache: 'yes',
     toolbar: 'yes'
};
//$cordovaInAppBrowserProvider.setDefaultOptions(options);
var lng = sessionStorage.getItem('longitude');
var lat = sessionStorage.getItem('latitude');
$cordovaInAppBrowser.open('http://m.amap.com/around/?locations='+lng+','+lat+'&keywords=美食,KTV,地铁站,公交站&defaultIndex=3&defaultView=&searchRadius=5000&key=db834b40077df1a9574a3faf3cd17f72', '_blank', defaultOptions)
    .then(function(event) {
      $state.go('tab.home')
      // success
    })
    .catch(function(event) {
      // error
    });
}]);

angular.module('getCity-controller',[])
	.controller('getCityCtrl', ['$scope', '$ionicNativeTransitions', '$state', '$timeout', '$location', '$ionicScrollDelegate', '$timeout', '$anchorScroll', 'ApiService', function($scope,$ionicNativeTransitions,$state,$timeout,$location,$ionicScrollDelegate,$timeout,$anchorScroll,ApiService) {
		$scope.letters = ["A","B","C",,"D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
     //当前城市
		$scope.nowCity = sessionStorage.getItem("nowcity");
	  //获取城市数据
	 ApiService.getBussinessArea().success(function(res){
	 	var cityArr = [];
		for(var i = 0,len=res.length;i<len;i++){
			for(var j = 0,citylen=res[i].cities.length;j<citylen;j++){
				cityArr.push(res[i].cities[j].name);
			}
		}
		$scope.allcityArr = pySegSort(cityArr);
		//最近访问的城市
		if(localStorage.getItem("visited")){
			$scope.visitedCity = JSON.parse(localStorage.getItem("visited"));
		}else{
			$scope.visitedCity = [];
		}
		//搜索城市
       	$scope.Data = {
    		searchcity:""
    	};
		$scope.SearchCity = function(city){
       	sessionStorage.setItem("city",$scope.Data.searchcity);
			$scope.visitedCity.unshift($scope.Data.searchcity);
			for(var i=0;i<$scope.visitedCity.length;i++){
				var a = $scope.visitedCity[i];
				for(var j=i+1;j<$scope.visitedCity.length;j++){
					if($scope.visitedCity[j]==a){
						$scope.visitedCity.splice(j,1);
						j=j-1;
					}
				}
			}
			if($scope.visitedCity.length>3){
				$scope.visitedCity.pop();
			}
			localStorage.setItem("visited",JSON.stringify($scope.visitedCity));
		};
		//点击选择城市
		 $scope.cityChoose = function(city){
			sessionStorage.setItem("city",city);
			sessionStorage.setItem("nowcity",city);
			localStorage.setItem("city", city);
			$scope.visitedCity.unshift(city);
			for(var i=0;i<$scope.visitedCity.length;i++){
				var a = $scope.visitedCity[i];
				for(var j=i+1;j<$scope.visitedCity.length;j++){
					if($scope.visitedCity[j]==a){
						$scope.visitedCity.splice(j,1);
						j=j-1;
					}
				}
			}
			if($scope.visitedCity.length>3){
				$scope.visitedCity.pop();
			}
			localStorage.setItem("visited",JSON.stringify($scope.visitedCity));
		};
	 });
	 //当前、最近、热门
		$scope.now=["当前","最近","热门"];
		$scope.nowTouch=function(index){
			$location.hash("state_"+index);
			$ionicScrollDelegate.anchorScroll(true);
		};
		//热门城市
		$scope.hotCity=["北京市","上海市","广州市","深圳市","杭州市","重庆市","成都市","沈阳市","武汉"];
		$scope.hotCitycont = function(index){
			sessionStorage.setItem("city",$scope.hotCity[index]);
		};
		//选择热门城市
		$scope.hotCitycont = function(index){
			sessionStorage.setItem("city",$scope.hotCity[index]);
			localStorage.setItem('city',$scope.hotCity[index]);
		};
	  //按首字母排序函数
	     function pySegSort(arr) {
		    if(!String.prototype.localeCompare)
		        return null;
		    var letters = "*abcdefghjklmnopqrstwxyz".split('');
		    var zh = "阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀".split('');
		    var segs = [];
		    var curr;
		    letters.forEach(function(item,i){
		        curr = {letter: item, data:[]};
		        arr.forEach(function(item2){
		            if((!zh[i-1] || zh[i-1].localeCompare(item2) <= 0) && item2.localeCompare(zh[i]) == -1) {
		                curr.data.push(item2);
		            }
		        });
		        if(curr.data.length) {
		            segs.push(curr);
		            curr.data.sort(function(a,b){
		                return a.localeCompare(b);
		            });
		        }
		    });
		    return segs;
	}
	     //滚动条滚动问题
	    $scope.showMiddle=false;
	    $scope.mTouch=function(c){
		  	$scope.hint=c;
		  	$scope.showMiddle=true;
		$location.hash("city_"+$scope.hint);
		$ionicScrollDelegate.anchorScroll(true);
			 $timeout(function(){
	            $scope.showMiddle=false;
	        },300);
	};

		//城市搜搜
		$scope.search = {
			text:''
		};
		$scope.searchGo = function(){
			var data = $scope.search;

			$state.go('nearby');
			sessionStorage.setItem('city',$scope.search.text);
		};
	}]);

angular.module('myOrderForm-controller', [])
	.controller('myOrderFormCtrl', ['$scope', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', '$stateParams', function($scope,$state,ApiService, DuplicateLogin,systemBusy,$timeout,$ionicLoading,$stateParams) {
		$scope.select = true;
		$ionicLoading.show({
			template: '<ion-spinner icon="ios"></ion-spinner>'
		});
			//进行中订单
		ApiService.queryLandlordOrders({
			hotelId:$stateParams.id,
			customerId: localStorage.getItem('customerId'),
			type: 'ongoing',
			pageNo: 1,
			pageSize: 2
		}).success(function(res) {
			$ionicLoading.hide();

			if (res.success) {
				$scope.orders = res.result;
			}else {
				if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
			}

		});
		$scope.goAccountDetail = function(house,hotelName){
			
 		 	var data = {
				hotelName:hotelName,
				house:house
			}
			$state.go("accountDetail",{data:data})
		}
			//一结束订单
		ApiService.queryLandlordOrders({
			hotelId:$stateParams.id,
			customerId: localStorage.getItem('customerId'),
			type: 'end'
		}).success(function(res) {
			if (res.success) {
				$scope.endOrders = res.result;

			}
		});
	}]);

angular.module('landlordProfit-controller', [])
  .controller('landlordProfitCtrl', ['$scope', '$ionicNativeTransitions', '$state', 'ApiService', '$ionicHistory', function($scope, $ionicNativeTransitions, $state, ApiService, $ionicHistory) {
	$scope.goback = function() {
		$ionicNativeTransitions.stateGo($ionicHistory.viewHistory().backView.stateId, {}, {}, {
			"type": "slide",
			"direction": "right" // in milliseconds (ms), default 400
		});
	};
	$scope.joinus = function() {

		if (!localStorage.getItem('customerId')) {
			$state.go('login');
		} else {
			$state.go('joinUs');
		}
	};

}]);

angular.module('houseDetail-controller', [])
  .controller('houseDetailCtrl', ['$scope', '$rootScope', '$ionicHistory', 'AJKIp', 'DuplicateLogin', '$ionicNativeTransitions', '$location', '$ionicScrollDelegate', '$ionicGesture', '$ionicViewSwitcher', '$ionicLoading', '$timeout', '$ionicActionSheet', '$stateParams', '$ionicBackdrop', 'ApiService', '$state', 'hotelPics', '$ionicPopup', '$timeout', function($scope,$rootScope,$ionicHistory,AJKIp,DuplicateLogin,$ionicNativeTransitions,$location, $ionicScrollDelegate, $ionicGesture, $ionicViewSwitcher, $ionicLoading, $timeout, $ionicActionSheet, $stateParams, $ionicBackdrop, ApiService, $state, hotelPics, $ionicPopup, $timeout) {
	$ionicLoading.show({
		template: '<ion-spinner icon="ios"></ion-spinner>'
	});
	$scope.switch = true;
    //返回
	$scope.goHome = function() {
    var views = $ionicHistory.viewHistory().views;

    var backView = ''
    for (var i in views) {
      if(views[i].stateName=='tab.home'||views[i].stateName=="myCollect"||views[i].stateName=='nearby'){
        backView = views[i].stateName;
      }
    }
    $ionicNativeTransitions.stateGo(backView, {}, {}, {
    "type": "slide",
    "direction": "right", // 'left|right|up|down', default 'left' (which is like 'next')
});

	};

    //酒店详细信息

	ApiService.getHotelDetail({
		hotelId: $stateParams.id,
		customerId:localStorage.getItem('customerId')|| '-1'
	}).success(function(res) {
    //console.log(res)
		if (res.success) {
			$ionicLoading.hide();
        //名字
			var hotelDetail = res.dataObject;
			$scope.name = hotelDetail.name;
        //图片数量
			$scope.picsLength = hotelDetail.pictures.length;
        //评价星星
			$scope.stars = [];
			$scope.stars.length = hotelDetail.stars||5;
			$scope.star_blank = [];
			$scope.star_blank.length = 5 - $scope.stars.length;
        //评价数量
			$scope.feedbackCount = hotelDetail.feedbackCount;
        //评价内容
			$scope.feedback = hotelDetail.feedback;
        //酒店地址
			$scope.detailAddress = hotelDetail.detailAddress;
			$scope.address = hotelDetail.address;
        //交易规则详情
			$scope.dealRule = hotelDetail.dealRule;
        //酒店简介
			$scope.profiles = hotelDetail.profiles;
			$scope.profiles = $scope.profiles.slice(0,150)+'...';
        //图片相册
        //是否收藏
			$scope.whetherCollect = hotelDetail.whetherCollect;
			hotelPics.pics = hotelDetail.pictures;
			$scope.pic = hotelDetail.pictures[0].pictures.split(',')[0];
      //酒店押金
      $scope.yajin = hotelDetail.price;
        //地图
			var map, geolocation;
        //加载地图，调用浏览器定位服务
			map = new AMap.Map('map', {
				resizeEnable: true,
				dragEnable: false
			});
			function geocoder() {
				var geocoder = new AMap.Geocoder({
				});
          //地理编码,返回地理编码结果
				geocoder.getLocation($scope.address, function(status, result) {
					if (status === 'complete' && result.info === 'OK') {
						geocoder_CallBack(result);
					}
				});
			}
			geocoder();
        //加入点标记
			function addMarker(i, d) {
				var marker = new AMap.Marker({
					map: map,
					position: [d.location.getLng(), d.location.getLat()]
				});
			}
        //地理编码返回结果展示
			function geocoder_CallBack(data) {
				var resultStr = "";
          //地理编码结果数组
				var geocode = data.geocodes;
				for (var i = 0; i < geocode.length; i++) {
            //拼接输出html
					resultStr += "<span style=\"font-size: 12px;padding:0px 0 4px 2px; border-bottom:1px solid #C1FFC1;\">" + "<b>地址</b>：" + geocode[i].formattedAddress + "" + "&nbsp;&nbsp;<b>的地理编码结果是:</b><b>&nbsp;&nbsp;&nbsp;&nbsp;坐标</b>：" + geocode[i].location.getLng() + ", " + geocode[i].location.getLat() + "" + "<b>&nbsp;&nbsp;&nbsp;&nbsp;匹配级别</b>：" + geocode[i].level + "</span>";
					addMarker(i, geocode[i]);
				}
				map.setFitView();
			}
        //酒店设施
			var assorts = hotelDetail.assorts;
			$scope.assorts = assorts.map(function(x) {
				index = x.indexOf('-');
				var name = x.slice(0, index);
				var src = x.slice(index + 1);
				return {
					'name':name,
					'src':src
				};
			});
			$scope.gohotelPics = function() {
				$state.go('hotelPics', {
					pics: hotelDetail.pictures,
					id: $stateParams.id
				});
				sessionStorage.setItem('currentId',$stateParams.id);
			};
        //微信风享
			$scope.share = function() {
				var hideSheet = $ionicActionSheet.show({
					buttons: [{
						text: '微信好友'
					}, {
						text: '朋友圈'
					}, ],
					cancelText: '取消',
					buttonClicked: function(index) {
						hideSheet();
						Wechat.share({
							message: {
								title: $scope.name,
								description: $scope.profiles,
								thumb: $scope.pic,
								media: {
									type: Wechat.Type.WEBPAGE,
									webpageUrl: AJKIp+$location.path()
								}
							},
							scene: index // share to Timeline
						}, function() {

						}, function(reason) {

						});

					}
				});
			};
        //跳转地图
			$scope.goMap = function(){
				$state.go('map',{destination:$scope.address});
			};
        //评价列表
			ApiService.getHotelFeedback({hotelId:$stateParams.id}).success(function(res){
				if(res.success){
					$scope.comment_if = res.result.length>0?true:false;
					$scope.comment_first = res.result[0];
				}
			});
			$scope.goHotelFeedback = function() {
				$state.go('comment', {
					id: hotelDetail.id,
					stars: hotelDetail.stars
				});
				$ionicViewSwitcher.nextDirection("forward");
			};
      var pageNo = 1;
        //酒店房间列表
      $scope.moreDataCanBeLoaded = true;
			ApiService.getHotelHouses({
        pageNo: 1,
        pageSize: 10,
				hotelId: $stateParams.id
			}).success(function(res) {
        //console.log(res)

        //$scope.roomnum = res.result.length
		    $scope.rooms = []
        //console.log(roomTypes)
        pageNo++
        $scope.roomType = _hotelRoom(res.result)

        $scope.loadMoreData = function() {
          ApiService.getHotelHouses({
            pageNo: pageNo,
            pageSize: 10,
            hotelId: $stateParams.id
          }).success(function(res) {
            //console.log(res)
            if (res.success && res.result.length > 0) {
            $scope.roomType = _hotelRoom(res.result)
            $scope.$broadcast("scroll.infiniteScrollComplete");
              pageNo++;

            } else {
              $scope.moreDataCanBeLoaded = false;
            }
          });
        };
          //进入房间详情
				$scope.goHouseIntr = function(id) {
					$state.go('house_intr', {
						id: id
					});
				};
          //进入房间简介
				$scope.seeAll = function() {
					var detail = {
						assorts: hotelDetail.assorts,
						services: hotelDetail.services,
						profiles: hotelDetail.profiles,
						num:hotelDetail.telephone,
            roomnum: 10
					};
					$state.go('hotelDetail', {
						hotelDetail: detail
					});
				};
          //进入房间设施
				$scope.seeAllService = function() {
					var detail = {
						assorts: hotelDetail.assorts,
						services: hotelDetail.services,
						profiles: hotelDetail.profiles
					};
					$state.go('hotelService', {
						hotelDetail: detail
					});
				};
          //收藏
				$scope.collect = function() {
					if(!localStorage.getItem('customerId')){
						$state.go('login');
						return;
					}
					$scope.whetherCollect = !!$scope.whetherCollect;
					if (!$scope.whetherCollect) {
						ApiService.addCustomerCollect({
							hotelId: hotelDetail.id,
							customerId: localStorage.getItem('customerId')
						}).success(function(res) {
							$scope.whetherCollect = !$scope.whetherCollect;
							if (res.success == true) {
								$ionicLoading.show({
									template: "收藏成功",
									noBackdrop: 'true',

								});
								$timeout(function() {
									$ionicLoading.hide();

								}, 2000);
							}else {
                if (res.msg==='非法请求') {
                  $ionicLoading.show({
                		template: DuplicateLogin
                	});
                  $timeout(function(){
                    $ionicLoading.hide();
                    $state.go('login')
                  },2000)
                }
							}
						});
					} else {
						ApiService.cancelCustomerCollect({
							collectId: hotelDetail.collectId,
							customerId: localStorage.getItem('customerId')
						}).success(function(res) {
							$scope.whetherCollect = !$scope.whetherCollect;
              if (res.success) {
                $ionicLoading.show({
  								template: "取消成功",
  								noBackdrop: 'true',

  							});
  							$timeout(function() {
  								$ionicLoading.hide();

  							}, 2000);
              }else{
                if (res.msg==='非法请求') {
                  $ionicLoading.show({
                		template: DuplicateLogin
                	});
                  $timeout(function(){
                    $ionicLoading.hide();
                    $state.go('login')
                  },2000)
                }
              }
						});
					}
				};
			});
		}else{
			$ionicLoading.hide();
		}
	});

    //滚动栏固定
	$scope.$on('getHeight', function() {

	});
	$scope.fixed = true;
	$scope.getPosition = function() {
		if ($ionicScrollDelegate.getScrollPosition().top >= $scope.offsetHeight) {
			$scope.fixed = false;
			$scope.$apply();
		} else {
			$scope.fixed = true;
			$scope.$apply();
		}
	};

    //视图切换
	$scope.switch = true;
	$scope.switchOn = function() {
		$scope.switch = true;
      //$scope.$apply()
	};
	$scope.switchOff = function() {
		$scope.switch = false;
      //$scope.$apply()
	};

  // 处理酒店房间加载
  function _hotelRoom(_room) {
    _room.forEach(function(room) {
      $scope.rooms.push(room)
    })
    var roomType = [],
          roomTypes = [];
        
        for (var i = 0; i < $scope.rooms.length; i++) {
          if (roomType.indexOf($scope.rooms[i].houseTypex) == -1) {
            roomType.push(
                $scope.rooms[i].houseTypex
              );
          }
        }

        for (var i = 0; i < roomType.length; i++) {
          roomTypes[i] = {
            'houseTypex': roomType[i],
            rooms: []
          };
        }

        for (var i = 0; i < roomTypes.length; i++) {
          for (var j = 0; j < $scope.rooms.length; j++) {
            if ($scope.rooms[j].houseTypex == roomTypes[i].houseTypex) {
              roomTypes[i].rooms.push($scope.rooms[j]);
            }
          }
        }
        //console.log(roomTypes)
        return roomTypes
  }
}]);

angular.module('hotelDetail-controllers', [])
  .controller('hotelDetailCtrl', ['$scope', '$rootScope', '$stateParams', function($scope, $rootScope, $stateParams) {
	$scope.back = function() {
		$rootScope.$ionicGoBack();
	};
	$scope.switch = false;
  $scope.roomnum = $stateParams.hotelDetail.roomnum
	$scope.profiles = $stateParams.hotelDetail.profiles;
	$scope.num =  $stateParams.hotelDetail.num;
	$scope.assorts = $stateParams.hotelDetail.assorts.map(function(assort) {
		var index = assort.indexOf('-');
		return {
			name: assort.slice(0, index),
			img: assort.slice(index + 1),

		};
	});
	$scope.services = $stateParams.hotelDetail.services.map(function(assort) {
		var index = assort.indexOf('-');
		return {
			name: assort.slice(0, index),
			img: assort.slice(index + 1),

		};
	});
	$scope.call = function() {
		var number = $scope.num;
		window.plugins.CallNumber.callNumber(onSuccess, onError, number, true);

		function onSuccess(result) {

		}

		function onError(result) {

		}
	};

}]);

angular.module('myhouseChangePrice-controller', [])
  .controller('myhouseChangepriceCtrl', ['$scope', '$stateParams', '$state', '$rootScope', '$ionicLoading', 'DuplicateLogin', 'systemBusy', 'roomPrice', '$stateParams', 'ApiService', '$ionicPopup', '$timeout', '$rootScope', function($scope,$stateParams,$state,$rootScope,$ionicLoading,DuplicateLogin,systemBusy, roomPrice, $stateParams, ApiService, $ionicPopup, $timeout, $rootScope) {
    $scope.houseName = $stateParams.name
    $scope.defaultPrice = $stateParams.price;
  $scope.changedate = [];
	if (roomPrice.data.success == true) {
		roomPrice.data.dataObject.forEach(function(month) {
			$scope.changedate.push(month);
		});

	}
	$scope.price = '200';
	$scope.changePrice = function() {


		$scope.data = {};

      // 调用$ionicPopup弹出定制弹出框
		$ionicPopup.show({
			template: "<input type='number' ng-model='data.price'>",
			title: "请输入修改价格",
			scope: $scope,
			buttons: [{
				text: '确定',
				onTap:function(){
					return $scope.data.price;
				}
			}, {
				text: '取消'
			}],
			cssClass: 'ajkChange',
		})
        .then(function(res) {
	changedates = localStorage.getItem('changedates');
	$scope.pricedata = {
		houseId: $stateParams.id,
		dates: changedates,
		price: ''
	};
	$scope.pricedata.price = res;

	ApiService.landlordModifyHousePrice($scope.pricedata).success(function(res) {

		if (res.success) {
      localStorage.setItem('changedates','');
			var attr_months = localStorage.getItem('attr_months').split(',');
			var $index = localStorage.getItem('$index').split(',');
			for (var i=0;i<attr_months.length;i++) {
				$scope.dates[attr_months[i]].thismonth[$index[i]].datePrice = $scope.pricedata.price;
			}
      //location.reload() ;
			$rootScope.$broadcast('datesChange');
			$ionicLoading.show({
				template: '修改成功'
			});
			$timeout(function() {
				$ionicLoading.hide();
			}, 1000);
		}else{
      if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: res.msg
          });
          $timeout(function(){
            $ionicLoading.hide();
          },2000)
        }
    }
	});
});

	};

	$scope.submit = function() {
		$scope.data.startDate = $scope.startTime;
		$scope.data.endDate = $scope.endTime;

	};
   //返回
	$scope.back = function(){
		$rootScope.$ionicGoBack();
	};
}]);

angular.module('myaccount-controller', [])
  .controller('myaccountCtrl', ['$scope', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', '$filter', function($scope,$state,ApiService,DuplicateLogin,systemBusy,$timeout,$ionicLoading, $filter) {
	$scope.select = true;

	$scope.now = new Date();
	var year = $scope.now.getFullYear();
	var month = $scope.now.getMonth();
	var select_year = "",
		select_month = "";
	var monthIncome_month = month+1;
	var  monthIncome_year = year;
	$scope.year = year;
	$scope.month = month + 1;
	$scope.dataswitch = false;
	$scope.years = [year - 1, year];
	$scope.months = [];
	$scope.openDatePicker = function() {
		$scope.dataswitch = true;
	};
	$scope.monthSelect = function(year, i) {
		$scope.year = year;
		select_year = year;
		$scope.indexi = i;
		$scope.months = [];
		monthIncome_year = year;
		if ($scope.now.getFullYear() === year) {
			for (var i = 1; i <= month + 1; i++) {
				$scope.months.push(i);
			}
		} else {
			$scope.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		}

	};
	$scope.daySelect = function(month, i) {
		select_month = month;
		monthIncome_month = month;
		select_month = select_month < 10 ? "0" + select_month : select_month;
		$scope.indexii = i;
		$scope.month = month;
		$scope.dataswitch = false;
		$scope.monthIncome();
    yueshouru();
	};
	$scope.$on('DayIncomes', function() {

	});

    //日收入
	$scope.dayIncome = function(){
		$scope.select = true;
	};
  yueshouru();
  function yueshouru(){
    $scope.monthIncomes = 0;
    var monthIncome = monthIncome_year+'-'+(monthIncome_month<10?'0'+(monthIncome_month):(monthIncome_month+1));
    ApiService.landlordMonthIncome({customerId:localStorage.getItem('customerId'),month:monthIncome})
    .success(function(res){
      if(res.success){
        $scope.incomeOrders = res.dataObject;
        $scope.incomeOrders.forEach(function(order){
          $scope.monthIncomes = $scope.monthIncomes+parseFloat(order.totalFee,10)
        })
          $scope.monthIncomes = $scope.monthIncomes.toFixed(2);
      }else{
        if (res.msg==='非法请求') {
            $ionicLoading.show({
              template: DuplicateLogin
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('login')
            },2000)
          }else {
            $ionicLoading.show({
              template: systemBusy
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('tab.home')
            },2000)
          }
      }
    });
  }
  //月收入

  //var now
	$scope.monthIncome = function(){
		$scope.select = false;
	};
}]);

angular.module('myHouse-controller', [])
	.controller('myHouseCtrl', ['$scope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$state', '$ionicLoading', '$timeout', '$stateParams', function($scope, ApiService,DuplicateLogin,systemBusy,$state, $ionicLoading,$timeout,$stateParams) {
		if (!localStorage.getItem('customerId')) {
			$state.go('login');
		} else {
			$ionicLoading.show({
				template: '<ion-spinner icon="ios"></ion-spinner>'
			});
			var pageNo = 1;
	    $scope.moreDataCanBeLoaded = true;
			ApiService.landlordHotels({
				customerId: localStorage.getItem('customerId'),
				pageNo: pageNo,
	      pageSize: 7
			}).success(function(res) {
				if (res.success) {
					pageNo++;
					$ionicLoading.hide();
					$scope.hotels = res.result;
				}else{
					if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
				}
			});

			$scope.loadMoreData = function() {
	      ApiService.landlordHotels({
					customerId: localStorage.getItem('customerId'),
	        pageNo: pageNo,
	        pageSize: 7
	      }).success(function(res) {
	        if (res.success) {
						if (res.result.length > 0) {
							for (var i = 0; i < res.result.length; i++) {
		            $scope.hotels.push(res.result[i]);
		          }
							$scope.$broadcast("scroll.infiniteScrollComplete");
		          pageNo++;
						}else{
							$scope.moreDataCanBeLoaded = false;
						}
	        } else {
	          $scope.moreDataCanBeLoaded = false;
						if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
	        }
	      });
	    };



			$scope.seeHouse = function(id) {
				$state.go('seeHouse', {
					id: id
				});
			};
		}
	}]);

angular.module('joinUs-controller', [])
  .controller('joinUsCtrl', ['$scope', '$state', '$cordovaFileTransfer', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$rootScope', '$ionicActionSheet', '$cordovaImagePicker', '$timeout', '$cordovaCamera', 'ApiService', function($scope, $state, $cordovaFileTransfer, DuplicateLogin, systemBusy, $ionicLoading, $rootScope, $ionicActionSheet, $cordovaImagePicker, $timeout, $cordovaCamera, ApiService) {
    ApiService.getCustomerInfo({
      customerId: localStorage.getItem('customerId')
    }).success(function(res) {
      if (res.success) {
        if (res.dataObject.type === 1) {
          $scope.bindWhether = true;
          $scope.landlord = res.dataObject.landlord
        } else if (res.dataObject.type === 0) {
          if (res.dataObject.landlord.status === 0) {
            $state.go('waitCheck')
          }
          if (res.dataObject.landlord.status === 2) {
            $scope.bindWhether = false;
          }
        }
      } else {
        if (res.msg === '非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function() {
            $ionicLoading.hide();
            $state.go('login')
          }, 2000)
        } else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function() {
            $ionicLoading.hide();
            $state.go('tab.home')
          }, 2000)
        }
      }
    })
    $scope.idCard = true;
    $scope.imgheads = [];
    $scope.name = '';
    $scope.data = {
      customerId: localStorage.getItem('customerId'),
      name: '',
      cardNo: '',
      cardPictureFront: '',
      cardPictureBack: '',
      address: '浙江省--西湖区',
      detailAddress: ''
    };

    //获取省份证
    $scope.getIdCard = function(type) {
      $scope.type = type;
      var hideSheet = $ionicActionSheet.show({
        buttons: [{
          text: '拍照'
        }, {
          text: '从图库中获取'
        }, ],
        cancelText: '取消',

        buttonClicked: function(index) {
          $scope.idCard = false;
          hideSheet();
          if (index == 1) {
            // statement
            var options = {
              maximumImagesCount: 1,
              width: 100,
              height: 100,
              quality: 50
            };

            $cordovaImagePicker.getPictures(options)
              .then(function(results) {
                //for (var i = 0; i < results.length; i++) {

                if ($scope.type == 'font') {
                  $scope.fontImg = results[0];
                  $scope.imgs = results[0];

                } else {
                  $scope.backImg = results[0];
                  $scope.imgs = results[0];

                }
                //  }

                subImgs();
              });
          } else if (index == 0) {
            var options = {
              destinationType: Camera.DestinationType.FILE_URI,
              sourceType: Camera.PictureSourceType.CAMERA,
              quality: 40,
              targetWidth: 400, //照片宽度
              targetHeight: 400
            };

            $cordovaCamera.getPicture(options).then(function(imageURI) {
              if ($scope.type == 'font') {
                $scope.fontImg = imageURI;

                $scope.imgs = imageURI;
              } else {
                $scope.backImg = imageURI;
                $scope.imgs = imageURI;
              }

              subImgs();
            }, function(err) {
              // error
            });
          }





        }
      });
    };

    //上传照片
    function subImgs() {
      var url = "http://www.live-ctrl.com/aijukex/op/op_imgUpload";

      var trustHosts = true;
      var options = {};

      var targetPath = $scope.imgs;
      $cordovaFileTransfer.upload(url, targetPath, options)
        .then(function(result) {
          // Success

          var result = result.response.split(':');
          var img = result[3].slice(1) + ':' + result[4].slice(0, -2);


          //$scope.$apply();

          if ($scope.type == 'font') {
            $scope.data.cardPictureFront = img;
          } else {
            $scope.data.cardPictureBack = img;
          }
        }, function(err) {
          // Error

        }, function(progress) {
          // constant progress updates

        });


    }
    //android获取地址
    $scope.$on('PCTSELECT_SUCCESS', function() {
      var detail = JSON.parse(sessionStorage.getItem('detailAddress'));
      $scope.data.address = detail.province + '-' + detail.city + '-' + detail.town;
    });
    //ios获取地址
    $scope.$on('cityPickerChange', function() {
      //$scope.province = localStorage.getItem('cityPickerProvince')

      $scope.data.address = $scope.city_province + '-' + $scope.city_city + '-' + $scope.city_towns;
    });

    //提交
    $scope.submit = function() {


      if (ionic.Platform.isAndroid()) {
        if (sessionStorage.getItem('address')) {
          $scope.data.address = JSON.parse(sessionStorage.getItem('address'));
          $scope.data.address = $scope.data.address.province + '-' + $scope.data.address.city + '-' + $scope.data.address.town;
        } else {
          $scope.data.address = '浙江省-杭州市-西湖区';
        }
      }

      var re1 = /^[\u4E00-\u9FA5]{2,4}$/; //姓名
      var re2 = /(^\d{15}$)|(^\d{17}([0-9]|X)$)/; //身份证
      if (re1.test($scope.data.name)) {
        if (re2.test($scope.data.cardNo)) {
          if ($scope.data.cardPictureFront && $scope.data.cardPictureBack) {
            if ($scope.data.detailAddress != '') {
              if (ionic.Platform.isAndroid()) {
                var data = {};
                for (attr in $scope.data) {
                  data[attr] = $scope.data[attr];
                }
                data.name = encodeURI(data.name);
                data.detailAddress = encodeURI(data.detailAddress);
                data.address = encodeURI(data.address);

                ApiService.customerBecomeLandlord(data).success(function(res) {
                  if (res.success) {
                    $ionicLoading.show({
                      template: '提交成功'
                    });
                    $timeout(function() {
                      $ionicLoading.hide();
                      $state.go('waitCheck');
                    }, 2000);
                  } else {
                    if (res.msg === '非法请求') {
                      $ionicLoading.show({
                        template: DuplicateLogin
                      });
                      $timeout(function() {
                        $ionicLoading.hide();
                        $state.go('login')
                      }, 2000)
                    } else {
                      $ionicLoading.show({
                        template: systemBusy
                      });
                      $timeout(function() {
                        $ionicLoading.hide();
                        $state.go('tab.home')
                      }, 2000)
                    }
                  }


                });
              }
              if (ionic.Platform.isIOS()) {
                var data1 = {};
                for (attr in $scope.data) {
                  data1[attr] = $scope.data[attr];
                }
                data1.name = encodeURI(data1.name);
                data1.detailAddress = encodeURI(data1.detailAddress);
                data1.address = encodeURI(data1.address);
                
                ApiService.customerBecomeLandlord(data1).success(function(res) {
                  if (res.success) {
                    $ionicLoading.show({
                      template: '提交成功'
                    });
                    $timeout(function() {
                      $ionicLoading.hide();
                      $state.go('waitCheck');
                    }, 2000);
                  } else {
                    if (res.msg === '非法请求') {
                      $ionicLoading.show({
                        template: DuplicateLogin
                      });
                      $timeout(function() {
                        $ionicLoading.hide();
                        $state.go('login')
                      }, 2000)
                    } else {
                      $ionicLoading.show({
                        template: systemBusy
                      });
                      $timeout(function() {
                        $ionicLoading.hide();
                        $state.go('tab.home')
                      }, 2000)
                    }
                  }


                });
              }

            } else {
              $ionicLoading.show({
                template: '请填写详细地址',
                noBackdrop: true
              });
              $timeout(function() {
                $ionicLoading.hide();

              }, 2000);
            }

          } else {
            $ionicLoading.show({
              template: '请上传身份证正反面照片',
              noBackdrop: true
            });
            $timeout(function() {
              $ionicLoading.hide();

            }, 2000);
          }
        } else {
          $ionicLoading.show({
            template: '请填写正确身份证号',
            noBackdrop: true
          });
          $timeout(function() {
            $ionicLoading.hide();

          }, 2000);
        }
      } else {
        $ionicLoading.show({
          template: '请填写正确姓名',
          noBackdrop: true
        });
        $timeout(function() {
          $ionicLoading.hide();

        }, 2000);
      }
    };
    //平台
    if (ionic.Platform.isIOS()) {
      $scope.platform = true;
    } else if (ionic.Platform.isAndroid()) {
      $scope.platform = false;
    }



  }]);

angular.module('myHouseDetail-controller', [])
	.controller('myHouseDetailCtrl', ['$scope', 'ApiService', '$stateParams', '$state', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', function($scope, ApiService, $stateParams, $state, DuplicateLogin,systemBusy,$timeout,$ionicLoading) {

		$ionicLoading.show({
			template: '<ion-spinner icon="ios"></ion-spinner>'
		});
		ApiService.landlordHotelHouses({
			hotelId: $stateParams.id
		}).success(function(res) {
			
			$ionicLoading.hide();
			if (res.success) {
				$scope.hotels = res.result;
				var houseTypex = [],
					hotels = [];
				$scope.hotels.forEach(function(hotel) {
					if (houseTypex.indexOf(hotel.houseTypex) == -1) {
						houseTypex.push(hotel.houseTypex);
					}
				});

				for (var i = 0; i < houseTypex.length; i++) {
					hotels[i] = {};

				}
				for (var i = 0; i < houseTypex.length; i++) {
					hotels[i].houseTypex = houseTypex[i];
					hotels[i].houses = [];
				}

				for (var i = 0; i < houseTypex.length; i++) {
					for (var j = 0; j < $scope.hotels.length; j++) {
						if ($scope.hotels[j].houseTypex == houseTypex[i]) {
							hotels[i].houses.push($scope.hotels[j]);

						}
					}
				}
				$scope.hotels = hotels;
			}else{
				if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
			}
		});
		$scope.myhouseIntr = function(id,price) {
			sessionStorage.setItem("hotelId", $stateParams.id);
			$state.go('myhouseIntr', {
				id: id,
				price:price
			});
		};
	}]);

angular.module('tradeRule-controller', [])
.controller('tradeRuleCtrl',['$scope', '$rootScope', function($scope,$rootScope){
	$scope.back = function(){
		$rootScope.$ionicGoBack();
	};
}]);

angular.module('seeHouse-controller', [])
	.controller('seeHouseCtrl', ['$scope', 'ApiService', '$state', '$stateParams', 'hotel', function($scope, ApiService, $state, $stateParams, hotel) {
		$scope.hotel = hotel.data.dataObject;
		$scope.pics = [];
		hotel.data.dataObject.pictures.forEach(function(pic,index){
			var picArray = pic.pictures.split(',');
			for (var i = 0; i < picArray.length; i++) {
				$scope.pics.push(picArray[i]);
			}
		});
	}]);

angular.module('myHouseIntr-controller', [])
	.controller('myhouseIntrCtrl', ['$scope', 'ApiService', 'house', '$state', '$stateParams', function($scope, ApiService, house, $state, $stateParams) {

		$scope.house = house.data.dataObject;
		$scope.myhouseDevice = function() {
			$state.go('myhouseDevice', {
				mess: $scope.house.assort
			});
		};
		$scope.assorts = $scope.house.assort.split(',');
		$scope.goback = function() {
			$state.go('myhouseDetail', {
				id: sessionStorage.getItem('hotelId')
			});
		};
	}]);

angular.module('orderFormDetail-controller', [])
    .controller('orderFormDetail', ['$scope', function($scope){
      
    }])

angular.module('accountDetail-controller', [])
	.controller('accountDetailCtrl', ['$scope', 'ApiService', '$state', '$rootScope', '$stateParams', function($scope, ApiService, $state,$rootScope,$stateParams) {
		
		$scope.goBack = function(){
			$rootScope.$ionicGoBack();
		}
		$scope.house = $stateParams.data.house;
		$scope.hotelName = $stateParams.data.hotelName;
	}]);

angular.module('endOrderDetail-controller', [])
  .controller('endOrderDetailCtrl', ['$scope', '$stateParams', function($scope,$stateParams) {
    var house
    $scope.order = $stateParams.data;
    if($scope.order.mark){
      $scope.order.hotelsx.map(function(hotel){
        house = hotel.houses.map(function(house){
                house.mark = $scope.order.mark
              })
      })
    }
  }])

angular.module('beLandlord-controller', [])
    .controller('beLandlord', ['$scope', 'ApiService', '$state', function($scope,ApiService,$state) {
      $scope.select = false;
      ApiService.getCustomerInfo({customerId: localStorage.getItem('customerId')})
      .success(function(res){
         console.log(res)
         if (res.success) {
           if (res.dataObject.type===1) {
             $scope.select = true
           }
         }
      })
	$scope.figureDatas = [{ img: 'my_account', figcaption: '我的收入' }, { img: 'join_us', figcaption: '我的收入' }, { img: 'my_house', figcaption: '我的收入' }];
	$scope.active = function() {
		$scope.select = true;
	};
  $scope.goNext = function(url){
    $state.go(url)
  }
}]);

angular.module('Orderform-controller', [])
  .controller('OrderformCtrl', ['$scope', '$stateParams', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$timeout', '$state', '$ionicPopup', function($scope, $stateParams, ApiService, DuplicateLogin, systemBusy, $ionicLoading, $timeout, $state, $ionicPopup) {

    ApiService.viewOrderDetail({
      orderCode: $stateParams.id
    }).success(function(res) {
      if (res.success) {
        $scope.order = res.dataObject;
        //支付订单

        $scope.pay = function() {
          var tradeNo = res.dataObject.orderCode
          var price = res.dataObject.totalFee;
          ApiService.getOrderInfo({ orderCode: tradeNo, fee: price })
            .success(function(res) {
              console.log(res)
              _AP.pay('https://mapi.alipay.com/gateway.do?' + res.dataObject);
            })
        };
      } else {
        if (res.msg === '非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function() {
            $ionicLoading.hide();
            $state.go('login')
          }, 2000)
        } else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function() {
            $ionicLoading.hide();
            $state.go('tab.home')
          }, 2000)
        }
      }
    });

    //取消订单
    $scope.cancelOrder = function() {
      $ionicPopup.confirm({
          template: "确定要取消订单吗",
          buttons: [{
            text: '确定',
            onTap: function(e) {
              return 1;
            }
          }, {
            text: '取消'
          }],
          cssClass: 'ajk'
        })
        .then(function(res) {
          if (res) {
            ApiService.cancelOrder({
              orderCode: $stateParams.id
            }).success(function(res) {
              if (res.success) {
                $ionicLoading.show({
                  template: '取消成功'
                });
                $timeout(function() {
                  $ionicLoading.hide();
                }, 2000);
                $state.go('Nopay');
              } else {
                if (res.msg === '非法请求') {
                  $ionicLoading.show({
                    template: DuplicateLogin
                  });
                  $timeout(function() {
                    $ionicLoading.hide();
                    $state.go('login')
                  }, 2000)
                } else {
                  $ionicLoading.show({
                    template: systemBusy
                  });
                  $timeout(function() {
                    $ionicLoading.hide();
                    $state.go('tab.home')
                  }, 2000)
                }
              }
            });
          } else {

          }
        });

    };

  }]);

angular.module('hotelPicsCtrl-controller', [])
  .controller('hotelPicsCtrl', ['$scope', '$rootScope', '$ionicNativeTransitions', '$ionicHistory', '$ionicSlideBoxDelegate', 'hotelPics', '$stateParams', '$state', function($scope,$rootScope,$ionicNativeTransitions,$ionicHistory,$ionicSlideBoxDelegate, hotelPics, $stateParams,$state) {
    //back
	$scope.back = function(){
		$ionicNativeTransitions.stateGo('houseDtail',{id:sessionStorage.getItem('currentId')},{},{
			"type": "slide",
			"direction": "right"// 'left|right|up|down', default 'left' (which is like 'next')
		});
	};
	$scope.picShow = false;
	$scope.index = 1;
	$scope.imgsrcs = [];

	$scope.outView = [];
	$scope.hall = [];
	$scope.restaurant = [];
	$scope.restArea = [];
	$scope.proscenium = [];
	$scope.other = [];

	for (var i = 0; i < hotelPics.pics.length; i++) {
		$scope.imgsrcs.push(hotelPics.pics[i].pictures.split(','));

		switch (hotelPics.pics[i].type) {
		case 0:
			$scope.outView=hotelPics.pics[i].pictures.split(',');
			break;
		case 1:
			$scope.hall=hotelPics.pics[i].pictures.split(',');
			break;
		case 2:
			$scope.restaurant=hotelPics.pics[i].pictures.split(',');
			break;
		case 3:
			$scope.restArea=hotelPics.pics[i].pictures.split(',');
			break;
		case 4:
			$scope.proscenium=hotelPics.pics[i].pictures.split(',');
			break;
		case 5:
			$scope.other=hotelPics.pics[i].pictures.split(',');
			break;
		default:
			break;
		}
	}
	$scope.imgall=[];
	for(var i=0;i<$scope.imgsrcs.length;i++){
		for(var j=0;j<$scope.imgsrcs[i].length;j++){
			$scope.imgall.push($scope.imgsrcs[i][j]);
		}
	}
	$scope.hotelPics = [{
		imgsrcs: '全部',
		all: $scope.imgall
	}, {
		imgsrcs: '外观',
		all: $scope.outView
	}, {
		imgsrcs: '餐厅',
		all: $scope.hall
	}, {
		imgsrcs: '大厅',
		all: $scope.restaurant
	}, {
		imgsrcs: '休息区域',
		all: $scope.restArea
	}, {
		imgsrcs: '前台',
		all: $scope.proscenium
	}, {
		imgsrcs: '其他',
		all: $scope.other
	}, ];
	$scope.allImgs = $scope.imgall;
	$scope.indexi = 0;

	$scope.changeColor = function(i, pics) {
		$scope.indexi = i;
		$scope.allImgs = pics;

	};
	$scope.ngshowif = function(i) {
		$scope.maskShow = true;
		$scope.index = i;
		$ionicSlideBoxDelegate.slide($scope.index);
		var data = {
			imgsrcs:$scope.allImgs,
			index:i
		};
		$state.go('picShow',{data:data});
	};

	$scope.switch = function() {
		$scope.maskShow = false;
	};
}]);

angular.module('nearby-controller', [])
  .controller('nearbyCtrl' ,['$scope', '$ionicHistory', '$stateParams', 'ApiService', '$ionicBackdrop', '$ionicModal', function($scope, $ionicHistory,$stateParams,ApiService, $ionicBackdrop, $ionicModal) {
    $scope.nowcity = sessionStorage.getItem('city');
    $scope.searchInfo = $stateParams.city;
    if ($scope.searchInfo) {
      $scope.nowcity += '(' + $scope.searchInfo + ')';
    }
    $scope.pageNo = 1;

    //初始刷新
    $scope.typedata1 = $stateParams.city;
    if(sessionStorage.getItem('searchType')==='1'){

      ApiService.queryHotelsPage({
        address: encodeURI(sessionStorage.getItem('city')+'-'+$scope.typedata1, "UTF-8"),
        pageNo: $scope.pageNo,
        type:'mark',
        pageSize: 5
      }).success(function(res) {
        $scope.type = 1
        if (res.success) {
          $scope.hotels = res.result;
          $scope.pageNo++
        }
      });
    }else if(sessionStorage.getItem('searchType')==='2'){
      ApiService.queryHotelsPage({
        address: encodeURI(sessionStorage.getItem('city')+'-'+$scope.typedata1, "UTF-8"),
        pageNo: $scope.pageNo,
        type:'keyWord',
        pageSize: 5
      }).success(function(res) {
        $scope.type = 1
        if (res.success) {
          $scope.hotels = res.result;
          $scope.pageNo++
        }
      });
    }

    //显示筛选
    $scope.flag = false;
    $scope.show = function() {
      $scope.sort = false;
      $scope.flag = !$scope.flag;
      //$ionicBackdrop.retain();
    };

    /*左边渲染*/
    //商圈
    $scope.business = true;
    //价格
    $scope.price = true;
    //地铁
    $scope.metro = true;
    //附近
    $scope.neighbour = true;
    //区域
    $scope.arealist = true;
    $scope.screenlist = ["附近", "商圈", "区域", "地铁"];
    $scope.screenlistClass = function(index) {
      $scope.i = index;
      if (index == 0) {
        $scope.business = true;
        $scope.price = true;
        $scope.metro = true;
        $scope.neighbour = true;
        $scope.arealist = true;
      } else if (index == 1) {
        $scope.price = true;
        $scope.metro = true;
        $scope.neighbour = false;
        $scope.business = false;
        $scope.arealist = true;
        maplist();
      } else if (index == 2) {
        $scope.price = true;
        $scope.metro = true;
        $scope.neighbour = false;
        $scope.business = true;
        $scope.arealist = false;
        areacont();
      } else if (index == 3) {
        $scope.business = true;
        $scope.price = true;
        $scope.neighbour = false;
        $scope.metro = false;
        $scope.arealist = true;
        $scope.metrolist();
      } else if (index == 4) {
        $scope.business = true;
        $scope.metro = true;
        $scope.neighbour = false;
        $scope.price = false;
        $scope.arealist = true;
      } else if (index == 5) {

      }
    };
    /*右边渲染*/
    //附近
    $scope.searchData = '';
    $scope.neighbouringlist = [ "1公里", "3公里", "5公里", "10公里"];
    $scope.neighbouringClass = function(index, data) {
      $scope.j = index;
      $scope.searchData = data;
    };

    //显示排序
    $scope.sort = false;
    $scope.sortshow = function() {
      $scope.flag = false;
      $scope.sort = !$scope.sort;
    };
    $scope.sortlist = ["默认排序", "价格最高", "价格最低", "评分最高", "评分最低", "评价数量最少", "评价数量最多"];
    $scope.sortlistclass = function(index, data) {
      $scope.i = index;
      $scope.searchData = data;
      $scope.sort = false;

      var type = '';
      var orderBy = '';
      switch (data) {
        case '价格最低':
          type = 'price', orderBy = 'desc'
          break;
        case '价格最高':
          type = 'price', orderBy = 'asc'
          break;
        case '评分最低':
          type = 'stars', orderBy = 'desc'
          break;
        case '评分最高':
          type = 'stars', orderBy = 'asc'
          break;
        case '评价数量最少':
          type = 'count', orderBy = 'desc'
          break;
        case '评价数量最多':
          type = 'count', orderBy = 'asc'
          break;
        default:type = 'price', orderBy = 'asc'
      }
      $scope.type2 = type;
      $scope.orderBy = orderBy;
      $scope.pageNo =1;
      //$scope.moreDataCanBeLoaded = true;
      ApiService.queryNearbySearch({type:$scope.type2,orderBy:$scope.orderBy,pageNo: 1,
      pageSize: 7}).success(function(res){
        $scope.type = 2;
        if(res.success){
          $scope.hotels = res.result;
          $scope.pageNo++;
          $scope.moreDataCanBeLoaded = true;
        }
      })
    };
    $scope.maplistClass = function(index, data) {
      $scope.j = index;
      $scope.searchData = data;
    };
    //地图搜索 获取地图返回数据
    function maplist() {
      $scope.businessArr = ["不限"];
      var placeSearchOptions = { //构造地点查询类
        pageSize: 20,
        pageIndex: 1,
        city: sessionStorage.getItem("city") //城市
      };
      var placeSearch = new AMap.PlaceSearch(placeSearchOptions);
      //关键字查询，您如果想修改结果展现效果，请参考页面：http://lbs.amap.com/fn/css-style/
      placeSearch.search("商圈", callback);
      var placeSearchRender = new Lib.AMap.PlaceSearchRender();

      function callback(status, result) {
        var length = result.poiList.pois.length;
        for (var i = 0; i < length; i++) {
          $scope.businessArr.push(result.poiList.pois[i].name);
        }
        for (var i = 0; i < $scope.businessArr.length; i++) {
          var a = $scope.businessArr[i];
          for (var j = i + 1; j < $scope.businessArr.length; j++) {
            if ($scope.businessArr[j] == a) {
              $scope.businessArr.splice(j, 1);
              j = j - 1;
            }
          }
        }
        $scope.businessClass = function(index, data) {
          $scope.k = index;
          $scope.searchData = data;
        };
        $scope.$apply(function() {
          $scope.businessArr;
        });
      }
      //
    }
    //区域获取
    function areacont() {
      $scope.areaArr = ["不限"];
      var city = sessionStorage.getItem("city");
      if (city == "北京" || city == "上海" || city == "重庆" || city == "天津") {
        city = city + "市市辖区";
      }
      var districtSearch = new AMap.DistrictSearch({
        level: 'city',
        subdistrict: 2
      });
      districtSearch.search(city, function(status, result) {
        var res = result.districtList[0].districtList;
        for (var i = 0, len = res.length; i < len; i++) {
          $scope.areaArr.push(res[i].name);
        }
        $scope.areacontClass = function(index, data) {
          $scope.t = index;
          $scope.searchData = data;
        };
        $scope.$apply(function() {
          $scope.areaArr;
        });
      });
    }
    //地铁线路获取
    var CityReg = /市$/;
    $scope.metrolist = function() {
      $scope.metrolistArr = [];
      var nowcity = sessionStorage.getItem("city");
      if (CityReg.test(nowcity)) {
        nowcity = nowcity.substring(0, nowcity.length - 1);
      }
      ApiService.getMetro().success(function(data) {
        for (var i = 0, len = data.length; i < len; i++) {
          if (data[i].city == nowcity) {
            for (var j = 0, length = data[i].linedata.length; j < length; j++) {
              $scope.metrolistArr.push(data[i].linedata[j].line);
            }
          }
        }
      });
    };
    //metrolist();
    //地铁线路选中
    $scope.metrochecked = function(index, line) {
      $scope.a = index;
      $scope.searchData = line;
      $scope.maplistArr = ["不限"];
      var nowcity = sessionStorage.getItem("city");
      if (CityReg.test(nowcity)) {
        nowcity = nowcity.substring(0, nowcity.length - 1);
      }
      ApiService.getMetro().success(function(data) {
        for (var i = 0, len = data.length; i < len; i++) {
          if (data[i].city == nowcity) {
            for (var j = 0, length = data[i].linedata.length; j < length; j++) {
              if (data[i].linedata[j].line == line) {
                for (var k = 0; k < data[i].linedata[j].linestation.length; k++) {
                  $scope.maplistArr.push(data[i].linedata[j].linestation[k]);
                }
              }
            }
          }
        }
      });
    };


    $ionicModal.fromTemplateUrl("map-modal.html", {
      scope: $scope,
      animation: "slide-in-up"
    }).then(function(modal) {
      $scope.modal = modal;
    });
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we are done with it!
    $scope.$on("$destroy", function() {
      $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on("modal.hidden", function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on("modal.removed", function() {
      // Execute action
    });
    $scope.mapshow = function() {
      $scope.modal.show();
      //加载地图
      var map = new AMap.Map('HouseOnMap', {
        resizeEnable: true
      });
      //将列表的房子标记到地图
      var lnglats = [
        ["116.4123", "39.906422"],
        ["116.4352", "39.906933"],
        ["116.445435", "39.9054345"]
      ];
      var data = [{
        "price": "￥345",
        "name": "爱居客西溪店"
      }, {
        "price": "￥340",
        "name": "爱居客西溪店"
      }, {
        "price": "￥945",
        "name": "爱居客西溪店"
      }];
      for (var i = 0; i < data.length; i++) {
        var div = document.createElement('div');
        div.className = 'circle';
        div.innerHTML = data[i].name + "<br/>" + data[i].price;
        var marker = new AMap.Marker({
          content: div,
          title: data[i].name,
          position: lnglats[i],
          map: map,
          //offset: new AMap.Pixel(-24, 5),
          zIndex: 300
        });
      }
      map.setFitView();
    };

    $scope.search = function() {
      if ([ "1公里", "3公里", "5公里", "10公里"].indexOf($scope.searchData)>-1) {
        $scope.pageNo = 1
        //$scope.moreDataCanBeLoaded = true;
        $scope.flag = false;
        ApiService.queryNearbySearch({
          type:'distance',
          longitude:120.070041,
          latitude:30.286377,
          distance:$scope.searchData.slice(0,-2),
          pageNo: 1,
          pageSize: 7
        }).success(function(res){
          $scope.type = 4
          if(res.success){
            $scope.hotels = res.result;
            $scope.pageNo++;
            $scope.moreDataCanBeLoaded = true;
          }
        })
      }else{
        $scope.pageNo = 1
        //$scope.moreDataCanBeLoaded = true;
        $scope.flag = false;
        $scope.typedata3 = $scope.nowcity + '-' + $scope.searchData;
        ApiService.queryHotelsPage({
          address: encodeURI($scope.typedata3, "UTF-8"),
          pageNo: 1,
          pageSize: 7
        }).success(function(res) {
          $scope.type = 3
          if (res.success) {
            $scope.hotels = res.result;
            $scope.pageNo++;
            $scope.moreDataCanBeLoaded = true;
          }
        });
      }
    };

    //加载更多
    var pageNo = 1;
    $scope.moreDataCanBeLoaded = true;
    $scope.loadMoreData = function() {
      switch ($scope.type) {
        case 1:
        ApiService.queryHotelsPage({
          address: encodeURI($scope.typedata1, "UTF-8"),
          pageNo:$scope.pageNo,
          pageSize:7
        }).success(function(res) {
          if (res.success && res.result.length > 0) {
            for (var i = 0; i < res.result.length; i++) {
              $scope.hotels.push(res.result[i]);
            }
          $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.pageNo++;
          } else {
            $scope.moreDataCanBeLoaded = false;
          }
        });
          break;
        case 2:
        ApiService.queryNearbySearch({type:$scope.type2,orderBy:$scope.orderBy,pageNo: $scope.pageNo,
        pageSize: 7}).success(function(res){
          if (res.success && res.result.length > 0) {
            for (var i = 0; i < res.result.length; i++) {
              $scope.hotels.push(res.result[i]);
            }
          $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.pageNo++;
          } else {
            $scope.moreDataCanBeLoaded = false;
          };
        });
          break;
        case 3:
        ApiService.queryHotelsPage({
          address: encodeURI($scope.typedata3, "UTF-8"),
          pageNo:$scope.pageNo,
          pageSize:7
        }).success(function(res) {
          if (res.success && res.result.length > 0) {
            for (var i = 0; i < res.result.length; i++) {
              $scope.hotels.push(res.result[i]);
            }
          $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.pageNo++;
          } else {
            $scope.moreDataCanBeLoaded = false;
          }
        });
          break;
        case 4:
        ApiService.queryNearbySearch({
          type:'distance',
          longitude:120.070041,
          latitude:30.286377,
          distance:$scope.searchData.slice(0,-2),
          pageNo: $scope.pageNo,
          pageSize: 7
        }).success(function(res){
          $scope.type = 4
          if(res.success&&res.result.length > 0){
            for (var i = 0; i < res.result.length; i++) {
              $scope.hotels.push(res.result[i]);
            }
            $scope.pageNo++;
              $scope.$broadcast("scroll.infiniteScrollComplete");
          }else{
            $scope.moreDataCanBeLoaded = false;
          }
        })
          break;
        default:
         break;
       }
    };

  }]);

angular.module('map-controller', [])
  .controller('mapCtrl', ['$scope', '$rootScope', '$stateParams', '$cordovaAppAvailability', '$ionicActionSheet', '$cordovaFileOpener2', function($scope, $rootScope, $stateParams, $cordovaAppAvailability, $ionicActionSheet, $cordovaFileOpener2) {
    $scope.back = function() {
      $rootScope.$ionicGoBack();
    };
    $scope.btnshow = true;
    var geolocation;

    //我的位置
    $scope.myplace = function() {
      $scope.map = new AMap.Map('container', {
        resizeEnable: true,
        zoom: 18
      });
      var lnglatXY = [sessionStorage.getItem('longitude'), sessionStorage.getItem('latitude')]; //地图上所标点的坐标
      var geocoder = new AMap.Geocoder({
            radius: 1000,
            extensions: "all"
        });
        geocoder.getAddress(lnglatXY, function(status, result) {
            if (status === 'complete' && result.info === 'OK') {
                $scope.startAddress = result.regeocode.formattedAddress
            }
        });
        var marker = new AMap.Marker({  //加点
             map: $scope.map,
             position: lnglatXY
         });
         $scope.map.setFitView();
    };
    $scope.myplace();
    //导航
    $scope.init = function() {
      $scope.btnshow = false;
      var keywords = [$scope.startAddress, $stateParams.destination];
      var map = new AMap.Map("container");
      AMap.plugin(["AMap.Driving"], function() {
        var drivingOption = {
          policy: AMap.DrivingPolicy.LEAST_TIME,
          map: map
        };
        var driving = new AMap.Driving(drivingOption); //构造驾车导航类
        //根据起终点坐标规划驾车路线
        driving.search([{
          keyword: keywords[0]
        }, {
          keyword: keywords[1]
        }], function(status, result) {
          console.log(result)
          $scope.selectMapApp = function() {
            mapApp = [];
            if (ionic.Platform.isIOS()) {
              $cordovaAppAvailability.check('baidumap://')
                .then(function() {
                  mapApp.push({
                    text: '百度地图'
                  });
                }, function() {});
              $cordovaAppAvailability.check('iosamap://')
                .then(function() {
                  mapApp.push({
                    text: '高德地图'
                  });
                }, function() {});
              $cordovaAppAvailability.check('http://')
                .then(function() {
                  mapApp.push({
                    text: '苹果地图'
                  });
                }, function() {});
            } else {
              $cordovaAppAvailability.check('com.baidu.BaiduMap')
                .then(function() {
                  mapApp.push({
                    text: '百度地图'
                  });
                }, function() {});
              $cordovaAppAvailability.check('com.autonavi.minimap')
                .then(function() {
                  mapApp.push({
                    text: '高德地图'
                  });
                }, function() {});
            }
            var hideSheet = $ionicActionSheet.show({
              buttons: mapApp,
              cancelText: '取消',
              buttonClicked: function(index) {
                hideSheet();
                if (ionic.Platform.isIOS()) {
                  if (mapApp[index].text == '百度地图') {
                    window.location.href = 'baidumap://map/direction?origin=' + result.origin.lat + ',' + result.origin.lng + '&destination=' + result.destination.lat + ',' + result.destination.lng + '&mode=driving&src=webapp.navi.yourCompanyName.yourAppName';
                  } else if (mapApp[index].text == '高德地图') {
                    window.location.href = 'iosamap://path?sourceApplication=applicationName&sid=BGVIS1&slat=' + result.origin.lat + '&slon=' + result.origin.lng + '&sname=' + keywords[0] + '&did=BGVIS2&dlat=' + result.destination.lat + '&dlon=' + result.destination.lng + '&dname=' + keywords[1] + '&dev=0&t=0';
                  } else if (mapApp[index].text == '苹果地图') {
                    window.location.href = 'http://maps.apple.com/?saddr=' + result.origin.lat + ',' + result.origin.lng + '&daddr=' + result.destination.lat + ',' + result.destination.lng + '&dirflg=r';
                  }
                } else {
                  if (mapApp[index].text == '百度地图') {
                    window.location.href = 'bdapp://map/direction?origin=' + result.origin.lat + ',' + result.origin.lng + '&destination=' + result.destination.lat + ',' + result.destination.lng + '&mode=driving&src=webapp.navi.yourCompanyName.yourAppName';
                  } else if (mapApp[index].text == '高德地图') {
                    window.location.href = 'androidamap://route?sourceApplication=applicationName&sid=BGVIS1&slat=' + result.origin.lat + '&slon=' + result.origin.lng + '&sname=' + keywords[0] + '&did=BGVIS2&dlat=' + result.destination.lat + '&dlon=' + result.destination.lng + '&dname=' + keywords[1] + '&dev=0&t=0';
                  }
                }
              }
            });
          };
        });
      });
    };
  }]);

angular.module('hotelService-controllers', [])
.controller('hotelService',['$scope', '$stateParams', '$rootScope', function($scope,$stateParams,$rootScope){
	$scope.back = function() {
		$rootScope.$ionicGoBack();
	};
	$scope.switch = false;
	$scope.profiles = $stateParams.hotelDetail.profiles;
	$scope.assorts = $stateParams.hotelDetail.assorts.map(function(assort) {
		var index = assort.indexOf('-');
		return {
			name: assort.slice(0, index),
			img: assort.slice(index + 1),

		};
	});
	$scope.services = $stateParams.hotelDetail.services.map(function(assort) {
		var index = assort.indexOf('-');
		return {
			name: assort.slice(0, index),
			img: assort.slice(index + 1),

		};
	});
}]);

angular.module('collectCtrl-controller', [])
    .controller('collectCtrl', ['$scope', 'ApiService', '$rootScope', '$state', '$ionicLoading', 'DuplicateLogin', '$timeout', function($scope, ApiService,$rootScope,$state,$ionicLoading,DuplicateLogin,$timeout) {
	if (!localStorage.getItem('customerId')) {
		$state.go('login');

	} else {

		ApiService.getCustomerCollect({ customerId: localStorage.getItem('customerId') }).success(function(res) {
      if (res.success) {
        $scope.collects = res.result;
      }else {
        if (res.msg==='非法请求') {
        $ionicLoading.show({
          template: DuplicateLogin
        });
        $timeout(function(){
          $ionicLoading.hide();
          $state.go('login')
        },2000)
      }else {
        $ionicLoading.show({
          template: systemBusy
        });
        $timeout(function(){
          $ionicLoading.hide();
          $state.go('tab.home')
        },2000)
      }
      }
		});
	}
	$scope.back = function(){
		$state.go('tab.home')
	};
}]);

angular.module('houseIntrCtrl-controller', [])
    .controller('houseIntrCtrl', ['$scope', 'AJKIp', '$location', 'DuplicateLogin', 'systemBusy', '$ionicScrollDelegate', '$stateParams', '$rootScope', 'ApiService', '$ionicLoading', '$timeout', 'houseIntr', '$state', '$ionicActionSheet', '$ionicViewSwitcher', function($scope,AJKIp,$location,DuplicateLogin,systemBusy,$ionicScrollDelegate,$stateParams,$rootScope, ApiService, $ionicLoading,$timeout,houseIntr, $state, $ionicActionSheet,$ionicViewSwitcher) {

	$scope.houseIntr = houseIntr.data.dataObject;
	$scope.back = function(){
		$rootScope.$ionicGoBack();
	};
  $scope.defaultPrice1 = $scope.houseIntr.defaultPrice;
        // 房间设施
	$scope.assorts = $scope.houseIntr.assort.split(',');
	$scope.assorts = $scope.assorts.map(function(assort,index){
		assort = assort.split(':');
		var sheshi = assort[0].split('-')[0];
		var url = 'http:'+assort[1];
		return [sheshi,url];
	});
            //微信风享
	$scope.share = function() {
		var hideSheet = $ionicActionSheet.show({
			buttons: [{
				text: '微信好友'
			}, {
				text: '朋友圈'
			}, ],

			titleText: '分享',
			cancelText: '取消',
			buttonClicked: function(index) {
				hideSheet();
				Wechat.share({
					message: {
						title: $scope.houseIntr.name,
						description: $scope.houseIntr.profiles,
						thumb: $scope.houseIntr.housePictures[0],
						media: {
							type: Wechat.Type.WEBPAGE,
							webpageUrl: AJKIp+$location.path()
						}
					},
					scene: index // share to Timeline
				}, function() {

				}, function(reason) {

				});

			}
		});
	};
  function godataselect(){
    var data = {id:$scope.houseIntr.id,defaultPrice:$scope.defaultPrice1}
    $state.go('selectDate',{data:data})
  }
  $scope.selectDate = function(){
    godataselect()
  }
            //加入购物车
	$scope.joinShopCar = function() {
		if (!localStorage.getItem('customerId')) {
			$state.go('login');
			$ionicViewSwitcher.nextDirection("forward");
		} else {
			if (sessionStorage.getItem('inday') && sessionStorage.getItem('outday')) {
				var data = {
					houseId: $scope.houseIntr.id,
					customerId: localStorage.getItem('customerId'),
					inTime: sessionStorage.getItem('inday'),
					leaveTime: sessionStorage.getItem('outday')
				};

				ApiService.addshopCar(data).success(function(res) {
					if (res.success === true) {
						$state.go('tab.shopCar');
						$ionicViewSwitcher.nextDirection("forward");
						sessionStorage.getItem('inday',''),
            sessionStorage.getItem('outday','');
					}else{
            if (res.msg==='非法请求') {
            $ionicLoading.show({
              template: DuplicateLogin
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('login')
            },2000)
          }else {
            $ionicLoading.show({
              template: res.msg
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('tab.home')
            },2000)
          }
					}


				});


			} else {
				godataselect()
			}
		}
	};
        //滚动置顶
	$scope.$on('getHeight', function() {

	});
	$scope.swipe = function(){
		var scrollTop = $ionicScrollDelegate.getScrollPosition().top;

          //var opacity = angular.element(document.querySelector('#fixed'))[0].style.opacity
		angular.element(document.querySelector('#fixedScroll'))[0].style.opacity = scrollTop*0.005;
		angular.element(document.querySelector('#fixedDefault'))[0].style.opacity =1 - scrollTop*0.005*2;
	};
}]);

angular.module('selectDate.controllers', [])
	.controller('selectDateCtrl', ['$scope', '$rootScope', '$stateParams', 'roomPrice', function($scope,$rootScope,$stateParams,roomPrice) {
		$scope.changedate = [];
		if (roomPrice.data.success == true) {
			roomPrice.data.dataObject.forEach(function(month) {

				$scope.changedate.push(month);
			});

		}
		$scope.defaultPrice = $stateParams.data.defaultPrice
		$scope.back = function(){
			$rootScope.$ionicGoBack();
		};
	}]);

angular.module('commentCtrl-controller', [])
	.controller('commentCtrl', ['$scope', '$rootScope', '$stateParams', 'ApiService', '$state', function($scope, $rootScope,$stateParams, ApiService, $state) {
		//返回
		$scope.stars = $stateParams.stars;
		$scope.star_full = [];
		$scope.star_full.length = $scope.stars;
		$scope.star_blank = [];
		$scope.star_blank.length = 5 - $scope.stars;
		$scope.goHouseDtail = function() {
			$rootScope.$ionicGoBack();
		};
		ApiService.getHotelFeedback({
			hotelId: $stateParams.id
		}).success(function(res) {
			$scope.customers = res.result;
		});
	}]);

angular.module('register-controller', [])
    .controller('registerCtrl',['$scope', 'ApiService', '$ionicLoading', '$ionicBackdrop', '$state', '$timeout', '$interval', function($scope,ApiService,$ionicLoading,$ionicBackdrop,$state,$timeout,$interval){
	$scope.checked = true;

   	$scope.sendData = {
    		telephone:"",
    		code:"",
    		password:"",
    		type:"REG"
	};
  $scope.getCodeValue = '获取验证码';
  $scope.getCodeValueSwitch = true;
	$scope.getVerifyCode = function () {
		ApiService.getREG($scope.sendData).success(function(res){
			if(res.success===true){
				$ionicLoading.show({
					template: "获取验证码成功",
					noBackdrop: 'true',
				});
        $scope.getCodeValue = 60;
        $scope.getCodeValueSwitch = false;
        $interval(function(){
          if ($scope.getCodeValue>0) {
              $scope.getCodeValue--;
          }else{
            $scope.getCodeValueSwitch = true;
            $scope.getCodeValue = '获取验证码';
          }
        },1000)
				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}else{
				$ionicLoading.show({
					template: res.msg,
					noBackdrop: 'true',
				});
				$timeout(function() {
					$ionicLoading.hide();
				}, 2000);
			}
		});
	};

	$scope.registerBtn = function(){
		
   		ApiService.register($scope.sendData).success(function(res){
			if(res.success){
				localStorage.setItem('customerId',res.dataObject.id);
   			  $ionicLoading.show({
				template: '注册成功!',
				noBackdrop: 'true',

			});
				$timeout(function() {
					$ionicLoading.hide();
					$state.go('login');
				}, 2000);
			} else {
				$ionicLoading.show({
					template: res.msg,
					noBackdrop: 'true',

				});
				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}
   		});
	};

}]);

angular.module('login-controller', [])
  .controller('loginCtrl', ['$scope', '$rootScope', 'ApiService', '$ionicPopup', '$ionicHistory', '$state', '$ionicLoading', '$timeout', function($scope, $rootScope,ApiService, $ionicPopup,$ionicHistory,$state, $ionicLoading, $timeout) {
  localStorage.removeItem('customerId');
  localStorage.removeItem('imghead');
  localStorage.removeItem('loginCount');
  localStorage.removeItem('token');
	$scope.sendData = {
		account: "",
		password: ""
	};
	$scope.loginBtn = function() {
		var re = /^1[34578]\d{9}$/;
		var re1 = /[a-zA-Z\d+]{6,36}/;
		if (re.test($scope.sendData.account)) {
			if (re1.test($scope.sendData.password)) {
				ApiService.login($scope.sendData).success(function(res) {
					if (res.success) {
						localStorage.setItem('imghead',res.dataObject.headPicture?res.dataObject.headPicture:'');
						localStorage.setItem("customerId", res.dataObject.id);
						localStorage.setItem("loginCount", res.dataObject.loginCount);
						localStorage.setItem("token", res.dataObject.token);
						localStorage.setItem("userName", res.dataObject.telephone);
						$ionicLoading.show({
							template: "登录成功",
							noBackdrop: 'true',

						});
						$timeout(function() {
							$ionicLoading.hide();
							var backState = ['ChangePwd','RetrievePwd','register'];
							var ifback = false;
							for (var i = 0; i < backState.length; i++) {
								if($ionicHistory.viewHistory().backView.stateName===backState[i]){
									ifback = true;
								}
							}
							if(!ifback){
								$rootScope.$ionicGoBack();
							}else{
								$state.go('tab.userCenter');
							}
						}, 1000);
					} else {
						$ionicLoading.show({
							template: "密码错误",
							noBackdrop: 'true',

						});

						$timeout(function() {
							$ionicLoading.hide();

						}, 2000);
					}

				});
			} else {
				$ionicLoading.show({
					template: "请输入正确密码",
					noBackdrop: 'true',

				});
				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}
		} else {
			$ionicLoading.show({
				template: "请输入正确手机号",
				noBackdrop: 'true',

			});
			$timeout(function() {
				$ionicLoading.hide();

			}, 1000);
		}


	};
}]);

angular.module('RetrievePwd-controller', [])
  .controller('RetrievePwdCtrl', ['$scope', '$ionicLoading', '$timeout', 'ApiService', '$log', '$state', function($scope, $ionicLoading,$timeout,ApiService, $log, $state) {
	$scope.sendData = {
		telephone: "",
		type: "RPSW",
		code: ""
	};
	$scope.getVerifyCode = function() {
		ApiService.RetrievePwd($scope.sendData).success(function(res) {
			if(res.success){
				$ionicLoading.show({
					template: "获取验证码成功",
					noBackdrop: 'true',

				});

				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}else{
				$ionicLoading.show({
					template: res.msg,
					noBackdrop: 'true',

				});

				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}
		});
	};
	$scope.RetrievePwdBtn = function() {
		ApiService.verify($scope.sendData).success(function(res) {
            console.log(res)
			if (res.success == true) {
				$state.go('login');

			}else{
				$ionicLoading.show({
					template: "获取验证码错误",
					noBackdrop: 'true',

				});

				$timeout(function() {
					$ionicLoading.hide();

				}, 2000);
			}
		});
	};

}]);

angular.module('select_bussiniss-controller', [])
  .controller('select_bussinissCtrl', ["$scope","ApiService",'$state',function($scope,ApiService,$state) {
  	 //页面渲染
	$scope.metroshow = false;
	$scope.listshow = false;
	$scope.contentList = false;
	$scope.metroContList = false;
	$scope.selectShow = function(index){
		showSelect(index);
	};
	function showSelect(index){
		$scope.i = index;
		if(index==2){
			$scope.metroshow = true;
			$scope.contentList = false;
			$scope.metrochecked($scope.metroArr[0]);
		}else if(index==3){
			$scope.metroshow = false;
			$scope.contentList = true;
			$scope.metroContList = false;
			$scope.maplistArr = pySegSort($scope.businissArea);
		}else {
			$scope.metroshow = false;
			$scope.contentList = true;
			$scope.metroContList = false;
			maplist(index);
		}
	}
     //showSelect('0');
  		//获取地铁线路
	 		var CityReg = /市$/;
	$scope.metroArr = [];
	var nowcity = sessionStorage.getItem("city");
	if(CityReg.test(nowcity)){
		nowcity = nowcity.substring(0,nowcity.length-1);
	}
	ApiService.getMetro().success(function(data){
		for(var i = 0,len = data.length;i<len;i++){
			if(data[i].city==nowcity){
				for(var j = 0, length = data[i].linedata.length;j<length;j++){
					$scope.metroArr.push(data[i].linedata[j].line);
				}
			}
		}
		if($scope.metroArr.length==0){
			$scope.selectArr = ["景区","车站|机场","商圈","行政圈","医院","学校","特色"];
			$scope.selectShow = function(index){
				$scope.i = index;
						     		$scope.metroshow = false;
						     		$scope.contentList = true;
						     		$scope.metroContList = false;
						     		maplist(index);
						     	};
					    }else{
					    		$scope.selectArr = ["景区","车站|机场","地铁路线","商圈","行政圈","医院","学校","特色"];
					    }
		showSelect(0);
	});

    //获取地图列表
	function maplist(index) {
     		var Arr = [];
     		$scope.maplistArr=[];
		var placeSearchOptions = { //构造地点查询类
			pageSize: 30,
			pageIndex: 1,
			city: sessionStorage.getItem("city") //城市
		};
		var placeSearch = new AMap.PlaceSearch(placeSearchOptions);
				//关键字查询，您如果想修改结果展现效果，请参考页面：http://lbs.amap.com/fn/css-style/
		placeSearch.search($scope.selectArr[index], callback);
		var placeSearchRender = new Lib.AMap.PlaceSearchRender();
		function callback(status, result) {
			var length = result.poiList.pois.length;
			for(i = 0;i < length;i++){
				Arr.push(result.poiList.pois[i].name);
			}
			for(var i=0;i<Arr.length;i++){
				var a = Arr[i];
				for(var j=i+1;j<Arr.length;j++){
					if(Arr[j]==a){
						Arr.splice(j,1);
						j=j-1;
					}
				}
			}
			$scope.maplistArr = pySegSort(Arr);
			$scope.$apply(function(){
				$scope.maplistArr;
			});
		}
	}
     //按首字母排序函数
	function pySegSort(arr){
		    if(!String.prototype.localeCompare)
		        return null;
		    var letters = "*abcdefghjklmnopqrstwxyz".split('');
		    var zh = "阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀".split('');
		    var segs = [];
		    var curr;
		    letters.forEach(function(item,i){
		        curr = {letter: item, data:[]};
		        arr.forEach(function(item2){
		            if((!zh[i-1] || zh[i-1].localeCompare(item2) <= 0) && item2.localeCompare(zh[i]) == -1) {
		                curr.data.push(item2);
		            }
		        });
		        if(curr.data.length) {
		            segs.push(curr);
		            curr.data.sort(function(a,b){
		                return a.localeCompare(b);
		            });
		        }
		    });
		    return segs;
	}
 	//获取地铁线路
	$scope.metrochecked = function(line){
		$scope.metroContList = true;
		var nowcity = sessionStorage.getItem("city");
		if(CityReg.test(nowcity)){
			nowcity = nowcity.substring(0,nowcity.length-1);
		}
		var arr=[];
	     		$scope.maplistArr=[];
		ApiService.getMetro().success(function(data){
			for(var i = 0,len = data.length;i<len;i++){
				if(data[i].city==nowcity){
					for(var j = 0, length = data[i].linedata.length;j<length;j++){
						if(data[i].linedata[j].line==line){
							for(var k = 0;k<data[i].linedata[j].linestation.length;k++){
								arr.push(data[i].linedata[j].linestation[k]);
							}
						}
					}
				}
			}
			$scope.maplistArr = pySegSort(arr);
		});
	};
      //获取商圈数据
	ApiService.getBussinessArea().success(function(res){
		var selectCity = sessionStorage.getItem("city");
		var data = res;
		var businessCounties = [];
		$scope.businissArea = [];
		for(var i=0;i<data.length;i++){
			for(var j=0;j<data[i].cities.length;j++){
				if(selectCity==data[i].cities[j].name){
					businessCounties = data[i].cities[j].counties;
				}
			}
		}
		for(var i=0;i<businessCounties.length;i++){
			$scope.businissArea.push(businessCounties[i].name);
		}
	});

      //跳转nearby
	$scope.goNearby = function(data){
		$state.go('nearby',{city:data});
    sessionStorage.setItem('searchType','1')
	};

  //最上方搜索框
  $scope.searchText = {
    text:''
  };
  $scope.submitSearch = function(){
    $state.go('nearby',{city:$scope.searchText.text})
    sessionStorage.setItem('searchType','2')
  }

}]);

angular.module('futrue-controller', [])
  .controller('futrueCtrl', ['$scope', 'ApiService', '$cordovaInAppBrowser', '$state', function($scope,ApiService,$cordovaInAppBrowser,$state) {
    var map = new AMap.Map("container", {
       resizeEnable: true
   });
   AMap.service(["AMap.PlaceSearch"], function() {
       var placeSearch = new AMap.PlaceSearch({ //构造地点查询类
           pageSize: 10,
           pageIndex: 1,
           city: "杭州", //城市
           map: map//,
           //panel: "panel"
       });
       //关键字查询
       var lng = sessionStorage.getItem('longitude');
       var lat = sessionStorage.getItem('latitude')
       var pont = [120.065375,30.292008];
       placeSearch.searchNearBy("爱居客", pont, 5000, function(status, result) {
    if (status === 'complete' && result.info === 'OK') {
      console.log(result);
    }
});
   });
  }])

angular.module('shopCar-controller', [])
  .controller('shopCarCtrl', ['$scope', 'ApiService', '$state', 'DuplicateLogin', '$ionicViewSwitcher', '$ionicViewSwitcher', '$ionicListDelegate', '$ionicLoading', '$timeout', function($scope, ApiService, $state,DuplicateLogin,$ionicViewSwitcher, $ionicViewSwitcher, $ionicListDelegate, $ionicLoading, $timeout) {
    //关闭所有选项按钮
	$scope.closeDelete = function() {
		$ionicListDelegate.closeOptionButtons();
	};
    //获取购物车列表
	if (!localStorage.getItem('customerId')) {
    $ionicLoading.hide();

    $timeout(function(res){
      $state.go('login');
    //  $ionicLoading.hide();
  },50);
	} else {
		sessionStorage.setItem('inday', '');
		sessionStorage.setItem('outday', '');
		$scope.data = {
			customerId: localStorage.getItem('customerId')
		};

		ApiService.shopCarList($scope.data).success(function(res) {
      if (!res.success) {
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }
      }
			$scope['list'] = res.dataObject;
			$scope.list.forEach(function(hotel) {
				hotel.hotelCheck = false;
				hotel.carts.forEach(function(house) {
					house.houseCheck = false;
				});
			});
			var list = $scope['list'].slice();

        //删除按钮
			$scope.delBtn = function(id,$event) {
				$event.stopPropagation();
				$scope.hid = {
					cartIds: id
				};
				$scope.list.splice();
				ApiService.shopCardel($scope.hid).success(function(res) {
          if(!res.success){
            if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
          }
				});
				ApiService.shopCarList($scope.data).success(function(res) {
          if (res.success) {
            $scope.list = res.dataObject;
            $scope.allcheck = false;
            $scope.allPrice = 0;
  					$scope.list.forEach(function(order, index) {
  						if (order.carts.length == 0) {
  							order = {};
  						}
  					});
          }else{
            if (res.msg==='非法请求') {
            $ionicLoading.show({
              template: DuplicateLogin
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('login')
            },2000)
          }else {
            $ionicLoading.show({
              template: systemBusy
            });
            $timeout(function(){
              $ionicLoading.hide();
              $state.go('tab.home')
            },2000)
          }
          }
				});
			};

        //单全选按钮
			$scope.checked = false;
			$scope.batchcheck = false;
			$scope.isbatchcheck = function(index) {
				$scope.j = index;
			};
			$scope.allcheck = false;
        //购物车选择按钮
			$scope.allPrice = 0;
			$scope.ischcked = function(e,roomList, hotel) {

				e.stopPropagation();
				roomList.houseCheck = !roomList.houseCheck;
				var isHotelCheck = true;
				var isAll = true;
				hotel.carts.forEach(function(house) {
					if (house.houseCheck == false) {
						isHotelCheck = false;
					}
				});
				hotel.hotelCheck = isHotelCheck;
				$scope.list.forEach(function(hotel) {
					if (hotel.hotelCheck == false) {
						isAll = false;
					}
				});
				$scope.allcheck = isAll;
				getAllPrice();
				getOrderDetail();
			};
			$scope.isbatchcheck = function(list) {
				list.hotelCheck = !list.hotelCheck;
				var isAll = true;
				list.carts.forEach(function(house) {
					house.houseCheck = list.hotelCheck;
				});
				$scope.list.forEach(function(hotel) {
					if (hotel.hotelCheck == false) {
						isAll = false;
					}
				});
				$scope.allcheck = isAll;
				getAllPrice();
				getOrderDetail();
			};
			$scope.isallcheck = function() {
				$scope.allcheck = !$scope.allcheck;
				$scope.list.forEach(function(list) {
					list.hotelCheck = $scope.allcheck == true ? true : false;
					list.carts.forEach(function(house) {
						house.houseCheck = $scope.allcheck == true ? true : false;
					});
				});
				getAllPrice();
				getOrderDetail();
			};
        //计算总价格
			function getAllPrice() {
				$scope.allPrice = 0;
				$scope.list.forEach(function(hotel) {
					hotel.carts.forEach(function(house) {
						if (house.houseCheck) {
							$scope.allPrice = $scope.allPrice + parseInt(house.totalFeel, 10);
						}
					});
				});
			}
        //去酒店详情页面
			$scope.goHotel = function(id) {
				$state.go('houseDtail', {
					id: id
				});
			};
        //去房间详情页面
			$scope.goHouse = function(id) {
				$state.go('house_intr', {
					id: id
				});
			};
        //计算订单参数
			var order = {
				customerId: localStorage.getItem('customerId'),
				hotelIds: '',
				houseIds: '',
				inTimes: '',
				leaveTimes: '',
				totalFees: '',
				depositFees: ''
			};

			var hotels = [];

			function getOrderDetail() {


          // list = $scope.list.slice(0);
				for (var i = 0; i < $scope.list.length; i++) {
					hotels[i] = {};
				}
				for (var i = 0; i < $scope.list.length; i++) {
					hotels[i].hotelName = $scope.list[i].hotelName;
					hotels[i].carts = [];
				}

				$scope.list.forEach(function(hotel, index) {
					hotel.carts.forEach(function(house, index2) {
						if (house.houseCheck) {

							hotels[index].carts.push(house);

						}
					});
				});
			}
        //提交订单
			$scope.goOrderDetail = function() {
        hotels =  hotels.filter(function(hotel){return hotel.carts.length>0})
				if (hotels && hotels.length > 0) {
					$state.go('orderDetail', {
						'order': hotels
					});
				} else {
					$ionicLoading.show({
						template: "请先选择房间",
						noBackdrop: 'true',

					});
					$timeout(function() {
						$ionicLoading.hide();

					}, 1000);
				}

			};
		});
	}
}]);

angular.module('invoice-controller', [])
  .controller('invoceCtrl', ['$scope', '$ionicHistory', '$ionicNativeTransitions', '$state', '$stateParams', function($scope, $ionicHistory, $ionicNativeTransitions,$state, $stateParams) {
	$scope.back = function() {
		$ionicNativeTransitions.stateGo('orderDetail', {
			'order': $stateParams.order
		}, {
			cache: false
		}, {
			"type": "slide",
			"direction": "right" // 'left|right|up|down', default 'left' (which is like 'next')
        // in milliseconds (ms), default 400
		});
	};
}]);

angular.module('userCenter-controller', [])
    .controller('userCenter', ['$scope', '$state', '$ionicViewSwitcher', function($scope, $state, $ionicViewSwitcher) {
    	//console.log(sessionStorage.getItem('_city'))
	$scope.useName = '注册/登录';
	$scope.imghead = 'imgs/wcj/imghead.png';
	$scope.tip = false;
	if (localStorage.getItem('customerId')) {
		$scope.useName = localStorage.getItem('userName')||'aijuke';

		if(localStorage.getItem('loginCount')<=1){
			$scope.tip = true;
      localStorage.setItem('loginCount',2)
		}

		if (localStorage.getItem('imghead')) {
			
			$scope.imghead = localStorage.getItem('imghead')||'imgs/wcj/imghead.png';

		}
	}

	$scope.headimg = function() {
		if (localStorage.getItem('customerId')) {
			$state.go('setting');
			$ionicViewSwitcher.nextDirection("forward");
		} else {
			$state.go('login');
			$ionicViewSwitcher.nextDirection("forward");
		}
	};

}]);

angular.module('binding-controller', [])
  .controller('bindingCtrl', ['$scope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicPopup', '$ionicBackdrop', '$state', '$timeout', '$ionicLoading', '$ionicViewSwitcher', function($scope, ApiService,DuplicateLogin,systemBusy,$ionicPopup, $ionicBackdrop, $state, $timeout, $ionicLoading, $ionicViewSwitcher) {
  $scope.bindWhether = false;
  ApiService.getCustomerInfo({customerId:localStorage.getItem('customerId')}).success(function(res){
    
    if (res.success) {
      if (res.dataObject.cardNo!==undefined) {
        $scope.bindWhether = true;
        $scope.name = res.dataObject.name;
        $scope.cardNo = res.dataObject.cardNo;
      }
    }else{
      if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
    }
  })
	$scope.sendData = {
		customerId: localStorage.getItem("customerId"),
		name: "",
		cardNo: ""
	};
	$scope.buttonBtn = function() {
    var data = {}
    data.customerId = $scope.sendData.customerId;
    data.name = encodeURI($scope.sendData.name);
    data.cardNo = $scope.sendData.cardNo
		ApiService.custom(data).success(function(res) {
      if(res.success){
        $ionicLoading.show({
  				template: "绑定成功",
  				noBackdrop: 'true',
  			});
  			$timeout(function() {
  				$ionicLoading.hide();
  				$state.go('setting');
  				$ionicViewSwitcher.nextDirection("back");
  			}, 2000);
      }else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }

		});
	};
}]);

angular.module('bindingPhone-controller', [])
  .controller('bindingPhoneCtrl', ['$scope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicPopup', '$ionicBackdrop', '$state', '$timeout', '$ionicLoading', '$ionicViewSwitcher', function($scope, ApiService,DuplicateLogin,systemBusy, $ionicPopup, $ionicBackdrop, $state, $timeout, $ionicLoading, $ionicViewSwitcher) {
    ApiService.getCustomerInfo({
      customerId: localStorage.getItem('customerId')
    }).success(function(res) {

      if (res.success) {
        if (res.dataObject.telephone !== undefined) {
          $scope.bindWhether = true;
          $scope.num = res.dataObject.telephone;
        }
      }else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }
    })
    $scope.sendData = {
      customerId: localStorage.getItem("customerId"),
      telephone: "",
      code: ''
    };

    $scope.bindingPhoneBtn = function() {
      ApiService.bindingPhone($scope.sendData).success(function(res) {

        if (res.success) {
          $ionicLoading.show({
            template: "获取验证码成功",
            noBackdrop: 'true',

          });
          $timeout(function() {
            $ionicLoading.hide();
          }, 2000);
        } else {
          if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
        }
      });
    };

    $scope.telBtn = function() {
      var sendData1 = {
        customerId: localStorage.getItem("customerId"),
        telephone: $scope.sendData.telephone,
        code: $scope.sendData.code
      };
      ApiService.telephoneBinding(sendData1).success(function(res) {
        
        if (res.success) {
          $ionicLoading.show({
            template: "手机绑定成功",
            noBackdrop: 'true',

          });
          $timeout(function() {
            $ionicLoading.hide();
            $state.go('setting');
            $ionicViewSwitcher.nextDirection("back");
          }, 2000);
        } else {
          if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
        }
      });
    };
  }]);

angular.module('ChangePwd-controller', [])
  .controller('ChangePwdCtrl', ['$scope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$ionicPopup', '$ionicBackdrop', '$state', '$timeout', function($scope, ApiService, DuplicateLogin,systemBusy,$ionicLoading,$ionicPopup, $ionicBackdrop, $state, $timeout) {
	$scope.sendData = {
		customerId: localStorage.getItem("customerId"),
		oldPassword: '',
		password: "",

	};
	$scope.password_repeat = '';

	$scope.changepwdBtn11 = function() {
		ApiService.changepwd($scope.sendData).success(function(res) {
			if (res.success) {
				$ionicLoading.show({
					template: '修改成功',
					noBackdrop: 'true',
				});
				localStorage.removeItem('customerId');
				$timeout(function() {
					$ionicLoading.hide();
					$state.go('login');
				}, 2000);
			} else {
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: res.msg
          });
          $timeout(function(){
            $ionicLoading.hide();
            //$state.go('tab.home')
          },2000)
        }
			}

		});
	};
}]);

angular.module('setPwd-controller', [])
.controller('setPwdCtrl',['$scope', 'ApiService', '$state', function($scope,ApiService,$state){
	$scope.password='';
	$scope.password_repeat='';
	var data={
		customerId:localStorage.getItem('customerId'),
		password:$scope.password
	};
	$scope.changepwd = function(){
		ApiService.changepwd(data).success(function(res){
			if(res.success==true){
				$state.go('login');
			}
		});
	};
}]);

angular.module('setting-controller', [])
  .controller('settingCtrl', ['$scope', '$ionicPlatform', '$cordovaFileTransfer', 'ApiService', '$ionicLoading', 'DuplicateLogin', 'systemBusy', '$cordovaCamera', '$ionicViewSwitcher', '$ionicActionSheet', '$ionicPopup', '$cordovaImagePicker', '$state', '$timeout', function($scope, $ionicPlatform, $cordovaFileTransfer, ApiService, $ionicLoading, DuplicateLogin, systemBusy, $cordovaCamera, $ionicViewSwitcher, $ionicActionSheet, $ionicPopup, $cordovaImagePicker, $state, $timeout) {
    $scope.imghead = localStorage.getItem('imghead') ? localStorage.getItem('imghead') : "imgs/kwn/logo.png";
    // 二维码
    $scope.qrCode = function() {

      var person = {
        id: localStorage.getItem('customerId'),
        head: $scope.imghead
      };
      $state.go('qrCode', {
        person: person
      }, {
        cache: false
      });
    };
    $scope.changeHeadPic = function() {

      var hideSheet = $ionicActionSheet.show({
        buttons: [{
          text: '拍照'
        }, {
          text: '从图库中获取'
        }, ],
        cancelText: '取消',

        buttonClicked: function(index) {
          hideSheet();
          if (index == 1) {
            // statement
            var options = {
              maximumImagesCount: 1,
              width: 100,
              height: 100,
              quality: 50
            };

            $cordovaImagePicker.getPictures(options)
              .then(function(results) {
                for (var i = 0; i < results.length; i++) {
                  $scope.imghead = results[i];
                }
                $ionicLoading.show({
                  template: '<ion-spinner icon="ios"></ion-spinner>'
                });
                var url = "http://www.live-ctrl.com/aijukex/op/op_imgUpload";
                var targetPath = $scope.imghead;
                var trustHosts = true;
                var options = {};
                $cordovaFileTransfer.upload(url, targetPath, options)
                  .then(function(result) {
                    // Success!
                    var result = result.response.split(':');
                    var img = result[3].slice(1) + ':' + result[4].slice(0, -2);
                    ApiService.modifyHeadPicture({
                      customerId: localStorage.getItem('customerId'),
                      pciture: img
                    }).success(function(res) {

                      if (res.success) {
                        $ionicLoading.hide();
                        localStorage.setItem('imghead', img);
                        $ionicLoading.show({
                          template: "更换头像成功",
                          noBackdrop: 'true',
                        });
                        $timeout(function() {
                          $ionicLoading.hide();

                        }, 2000);
                      } else {
                        if (res.msg === '非法请求') {
                          $ionicLoading.show({
                            template: DuplicateLogin
                          });
                          $timeout(function() {
                            $ionicLoading.hide();
                            $state.go('login')
                          }, 2000)
                        } else {
                          $ionicLoading.show({
                            template: systemBusy
                          });
                          $timeout(function() {
                            $ionicLoading.hide();
                            $state.go('tab.home')
                          }, 2000)
                        }
                      }
                    });
                  }, function(err) {
                    // Error
                    $ionicLoading.hide();

                    $ionicLoading.show({
                      template: "已取消",
                      noBackdrop: 'true',
                    });
                    $timeout(function() {
                      $ionicLoading.hide();

                    }, 2000);

                  }, function(progress) {
                    // constant progress updates


                  });

              }, function(error) {
                $ionicLoading.hide();

                $ionicLoading.show({
                  template: "已取消",
                  noBackdrop: 'true',
                });
                $timeout(function() {
                  $ionicLoading.hide();

                }, 2000);
                // error getting photos
              });
          } else if (index == 0) {
            hideSheet();
            var options = {
              destinationType: Camera.DestinationType.FILE_URI,
              sourceType: Camera.PictureSourceType.CAMERA,
              quality: 10,
              targetWidth: 400, //照片宽度
              targetHeight: 400
            };
            $cordovaCamera.getPicture(options).then(function(imageURI) {
              $ionicLoading.show({
                template: '<ion-spinner icon="ios"></ion-spinner>'
              });
              $scope.imghead = imageURI;
              var url = "http://www.live-ctrl.com/aijukex/op/op_imgUpload";
              var targetPath = imageURI;
              var trustHosts = true;
              var options = {};
              $cordovaFileTransfer.upload(url, targetPath, options)
                .then(function(result) {
                  // Success!


                  var result = result.response.split(':');
                  var img = result[3].slice(1) + ':' + result[4].slice(0, -2);

                  ApiService.modifyHeadPicture({
                    customerId: localStorage.getItem('customerId'),
                    pciture: img
                  }).success(function(res) {

                    if (res.success) {
                      $ionicLoading.hide();
                      localStorage.setItem('imghead', img);
                      $ionicLoading.show({
                        template: "更换头像成功",
                        noBackdrop: 'true',
                      });
                      $timeout(function() {
                        $ionicLoading.hide();

                      }, 2000);
                    }else{
                      if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
                    }
                  });
                }, function(err) {
                  // Error

                }, function(progress) {
                  // constant progress updates

                });
            }, function(err) {
              // error
            });
          }
        }
      });


    };


    //退出当前账号
    $scope.logout = function() {
      $ionicPopup.show({
          template: "确定要退出吗?",
          buttons: [{
            text: '确定',
            onTap: function() {
              return 1;
            }
          }, {
            text: '取消'
          }],
          cssClass: 'ajk',

        })
        .then(function(res) {
          if (res) {
            localStorage.removeItem('customerId');
            localStorage.removeItem('imghead');
            localStorage.removeItem('token');
            localStorage.removeItem('userName');
            $state.go('tab.userCenter');
            $ionicViewSwitcher.nextDirection("back");
          } else {

          }
        });


    };
  }]);

angular.module('Nopay-controller', [])
	.controller('NopayCtrl', ['$scope', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', function($scope, $state, ApiService, DuplicateLogin,systemBusy,$timeout,$ionicLoading) {
		if (!localStorage.getItem('customerId')) {
			$state.go('login');
		} else {
			$ionicLoading.show({
				template: '<ion-spinner icon="ios"></ion-spinner>'
			});
			$scope.pageNo = 1;
			$scope.moreDataCanBeLoaded = true;
			ApiService.queryOrderPage({
				customerId: localStorage.getItem('customerId'),
				status: 0,
				pageNo: $scope.pageNo,
				pageSize: 5
			}).success(function(res) {
				
				if (res.success) {
					$ionicLoading.hide();
					$scope.orders = res.result;
					$scope.pageNo++;
				}else{
					if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
				}
			});
				//加载更多order
			$scope.loadMoreData = function() {
				ApiService.queryOrderPage({
					customerId: localStorage.getItem('customerId'),
					status: 0,
					pageNo: $scope.pageNo,
					pageSize: 5
				}).success(function(res) {
					if (res.success) {
						if (res.result.length > 0) {
							for (var i = 0; i < res.result.length; i++) {
								$scope.orders.push(res.result[i]);
							}
							$scope.$broadcast("scroll.infiniteScrollComplete");
							$scope.pageNo++;
						}else{
							$scope.moreDataCanBeLoaded = false;
						}

					} else {
						$scope.moreDataCanBeLoaded = false;
						if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
					}

				});
			};

			//进入订单详情
			$scope.goOrderdetail = function(id) {
				$state.go("Order-form", {
					id: id
				});
			};
		}
	}]);

angular.module('Pay-controller', [])
    .controller('PayCtrl', ['$scope', '$state', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', 'ApiService', function($scope, $state, DuplicateLogin,systemBusy,$timeout,$ionicLoading, ApiService) {
	if (!localStorage.getItem('customerId')) {
		$state.go('login');
	} else {
		$ionicLoading.show({
			template: '<ion-spinner icon="ios"></ion-spinner>'
		});
		$scope.pageNo = 1;
		$scope.moreDataCanBeLoaded = true;
		ApiService.queryOrderPage({
			customerId: localStorage.getItem('customerId'),
			status: 1,
			pageNo: $scope.pageNo,
			pageSize:5
		}).success(function(res) {

			if (res.success) {
				$ionicLoading.hide();
				$scope.orders = res.result;
				$scope.pageNo++;
			}else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }
		});
		$scope.loadMoreData = function() {
			ApiService.queryOrderPage({
				customerId: localStorage.getItem('customerId'),
				status: 1,
				pageNo: $scope.pageNo,
				pageSize:5
			}).success(function(res) {
      
				if (res.success) {
          if(res.result.length > 0){
            for (var i = 0; i < res.result.length; i++) {
              $scope.orders.push(res.result[i]);
            }
            $scope.$broadcast("scroll.infiniteScrollComplete");
            $scope.pageNo++;
          }else{
            $scope.moreDataCanBeLoaded = false;
          }
				} else {
					$scope.moreDataCanBeLoaded = false;
          if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
				}

			});
		};
	}
}]);

angular.module('Noevaluate-controller', [])
.controller('NoevaluateCtrl',['$scope', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', function($scope,$state,ApiService,DuplicateLogin,systemBusy,$timeout,$ionicLoading){
	 if(!localStorage.getItem('customerId')){
		$state.go('login');
	 }else{
		 $scope.pageNo=1;
		 $scope.moreDataCanBeLoaded = true;
		 ApiService.queryJudgeOrders({
			 customerId:localStorage.getItem('customerId'),
			 pageNo: $scope.pageNo,
			 pageSize: 5
		 }).success(function(res){

			 if (res.success) {
				 $scope.hotels = res.result;
  			 $scope.pageNo++;
  			 $scope.goevaluate = function(hotelId,houseId,hotelName,picture,subOrderCode){
  				 var data = {hotelId:hotelId,houseId:houseId,hotelName:hotelName,picture:picture,subOrderCode:subOrderCode};
  				 
  				 $state.go('evaluate',{data:data});
  			 };
			 }else{
				 if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
			 }
		 });
		 //加载
		 $scope.loadMoreData = function() {
			 ApiService.queryJudgeOrders({
				 customerId:localStorage.getItem('customerId'),
				 pageNo: $scope.pageNo,
				 pageSize: 5
			 }).success(function(res) {
				 if (res.success) {
					 if(res.result.length > 0){
						 for (var i = 0; i < res.result.length; i++) {
							 $scope.hotels.push(res.result[i]);
						 }
							$scope.$broadcast("scroll.infiniteScrollComplete");
						 $scope.pageNo++;
					 }else {
					 	$scope.moreDataCanBeLoaded = false;
					 }

				 } else {
					 $scope.moreDataCanBeLoaded = false;
					 if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }

				 }
			 });
		 };
	 }
}]);

angular.module('loseEfficacy-controller', [])
    .controller('loseEfficacyCtrl', ['$scope', '$state', '$ionicLoading', 'ApiService', '$timeout', 'DuplicateLogin', 'systemBusy', function($scope, $state, $ionicLoading, ApiService,$timeout,DuplicateLogin,systemBusy) {
	if (!localStorage.getItem('customerId')) {
		$state.go('login');
	} else {
		$ionicLoading.show({
			template: '<ion-spinner icon="ios"></ion-spinner>'
		});
		$scope.pageNo = 1;
		$scope.moreDataCanBeLoaded = true;
		ApiService.queryCustomerOrders({
			customerId: localStorage.getItem('customerId'),
			pageNo: $scope.pageNo,
			pageSize: 5,
      type:'end'
		}).success(function(res) {
			if (res.success) {
				$ionicLoading.hide();
				$scope.orders = res.result;
				$scope.pageNo++;
			}else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }
		});
		$scope.loadMoreData = function() {
      ApiService.queryCustomerOrders({
  			customerId: localStorage.getItem('customerId'),
  			pageNo: $scope.pageNo,
  			pageSize: 5,
        type:'end'
  		}).success(function(res) {

				if (res.success) {
          if (res.result.length > 0) {
            for (var i = 0; i < res.result.length; i++) {
  						$scope.orders.push(res.result[i]);
  						$scope.$broadcast("scroll.infiniteScrollComplete");
  					}
  					$scope.pageNo++;
          }else {
            $scope.moreDataCanBeLoaded = false;
          }

				} else {
					$scope.moreDataCanBeLoaded = false;
          if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
				}

			});
		};
    //订单详情
    $scope.goOrderDetail = function(order){
      $state.go('endOrderDetail',{data:order})
    }
	}
}]);

angular.module('qrCode-controller', [])
.controller('qrCodeCtrl',['$scope', '$stateParams', function($scope,$stateParams){
	if (localStorage.getItem('imghead')) {
		$scope.imghead = localStorage.getItem('imghead');
	}

	$scope.name = localStorage.getItem('userName');
}]);

angular.module('Consume-controller', [])
	.controller('ConsumeCtrl', ['$scope', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$timeout', function($scope, $state, ApiService,DuplicateLogin,systemBusy, $ionicLoading,$timeout) {
		if (!localStorage.getItem('customerId')) {
			$state.go('login');
		} else {
			$ionicLoading.show({
				template: '<ion-spinner icon="ios"></ion-spinner>'
			});
			$scope.pageNo = 1;
			$scope.moreDataCanBeLoaded = true;
			ApiService.customerConsumeRecords({
				customerId: localStorage.getItem('customerId'),
				pageNo: $scope.pageNo,
				pageSize: 7
			}).success(function(res) {

				if (res.success) {
					$ionicLoading.hide();
					$scope.consumes = res.result;
					$scope.pageNo++;
				}else{
					if (res.msg==='非法请求') {
	          $ionicLoading.show({
	            template: DuplicateLogin
	          });
	          $timeout(function(){
	            $ionicLoading.hide();
	            $state.go('login')
	          },2000)
	        }else {
	          $ionicLoading.show({
	            template: systemBusy
	          });
	          $timeout(function(){
	            $ionicLoading.hide();
	            $state.go('tab.home')
	          },2000)
	        }
				}
			});
			$scope.loadMoreData = function() {
				ApiService.customerConsumeRecords({
					customerId: localStorage.getItem('customerId'),
					pageNo: $scope.pageNo,
					pageSize: 7
				}).success(function(res) {
	        console.log(res);
					if (res.success) {
						if (res.result.length > 0) {
							for (var i = 0; i < res.result.length; i++) {
								$scope.consumes.push(res.result[i]);
							}
		          $scope.$broadcast("scroll.infiniteScrollComplete");
							$scope.pageNo++;
						}else{
							$scope.moreDataCanBeLoaded = false;
						}
					} else {
						$scope.moreDataCanBeLoaded = false;
						if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
					}

				});
			};
		}
	}]);

angular.module('status-controller', [])
  .controller('statusCtrl', ['$scope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$state', '$stateParams', '$ionicLoading', '$ionicPopup', '$timeout', function($scope, ApiService,DuplicateLogin,systemBusy,$state, $stateParams, $ionicLoading, $ionicPopup, $timeout) {
    ApiService.viewOrderDetail({
      orderCode: $stateParams.id
    }).success(function(res) {

      if (res.success) {
        $scope.order = res.dataObject;
        //取消子订单
        $scope.cancel = function(id) {

          $ionicPopup.confirm({
              template: "确定要取消预订吗",
              buttons: [{
                text: '确定',
                onTap: function(e) {
                  return 1;
                }
              }, {
                text: '取消'
              }],
              cssClass: 'ajk'
            })
            .then(function(res) {
              if (res) {
                ApiService.cancleSubOrder({
                  subOrderCode: id
                }).success(function(res) {
                  
                  if (res.success) {

                    $ionicLoading.show({
                      template: '取消成功'
                    });
                    $state.go('Pay');
                    $timeout(function() {
                      $ionicLoading.hide();
                    }, 1000);
                  }else{
                    if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
                  }
                });
              } else {

              }
            });
        };

        //计算最近入住时间
        var times = $scope.order.hotels[0].houses[0].inTimes.slice(0, 10);
        var times = times.split('年');
        times[1] = times[1].split('月');
        times = times[0] + '-' + times[1][0] + '-' + times[1][1];


        function DateDiff(sDate1) { //sDate1和sDate2是2006-12-18格式
          var aDate, oDate1, oDate2, iDays;
          aDate = sDate1.split("-");
          oDate1 = new Date().setFullYear(aDate[0], aDate[1] - 1, aDate[2]); //转换为12-18-2006格式
          oDate2 = new Date();
          iDays = parseInt((oDate1 - oDate2) / 1000 / 60 / 60 / 24); //把相差的毫秒数转换为天数
          return iDays;
        }
        if (DateDiff(times) < 0) {
          $scope.leaveTimes = 0;
        } else {
          $scope.leaveTimes = DateDiff(times);
        }

        //是否可以取消订单
        //是否可以取消子订单
        $scope.order.hotels.forEach(function(hotel) {
          hotel.houses.forEach(function(house) {
            var times = house.inTimes.slice(0, 10);
            var times = times.split('年');
            times[1] = times[1].split('月');
            times = times[0] + '-' + times[1][0] + '-' + times[1][1];
            var cancelTime = times.split('-');
            var dataif = new Date(cancelTime[0], cancelTime[1] - 1, cancelTime[2], 14, 00, 00).getTime() - new Date().getTime() > 86400000 ? true : false;
            if(dataif&&house.status==0){
              house.orderCancel=true;

            }
            if(dataif&&house.status==4){
              house.yiCancel=true;
            }
          });
        });

      }else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }
    });
  }]);

angular.module('orderDetail-controller', [])
	.controller('orderDetailCtrl', ['$scope', '$state', '$stateParams', 'systemBusy', 'DuplicateLogin', '$timeout', 'ApiService', '$ionicLoading', function($scope, $state,$stateParams,systemBusy,DuplicateLogin,$timeout,ApiService, $ionicLoading) {
		//是否是ios
		if (ionic.Platform.isIOS()) {
			$scope.platform = true;
		} else if (ionic.Platform.isAndroid()) {
			$scope.platform = false;
		}
			//订单信息
		$scope.hotels = $stateParams.order;
		//发票页面
		$scope.goInvoice = function(){
			$state.go('invoice',{order:$stateParams.order});
		};
		//选择时间
		$scope.arriveTime = ['14:00', '15:00', '16:00', '17:00', '18:00'];
		$scope.indexi = 2;
		$scope.time = $scope.arriveTime[$scope.indexi];
		$scope.time_select = false;
		$scope.select = function(i) {
			$scope.indexi = i;
			$scope.time = $scope.arriveTime[$scope.indexi];
		};
		$scope.time_submit = function() {
			$scope.time_select = false;
		};
			//合计总价
		// $scope.total = 0;
		// for (var i = 0; i < $scope.hotels.length; i++) {
		// 	for (var j = 0; j < $scope.hotels[i].carts.length; j++) {
		// 		$scope.total += parseInt($scope.hotels[i].carts[j].totalFeel, 10)+parseInt($scope.hotels[i].carts[j].depositFee,10);
		// 	}
		// }
		$scope.total = 0;
		for (var i = 0; i < $scope.hotels.length; i++) {
			for (var j = 0; j < $scope.hotels[i].carts.length; j++) {
				$scope.total += parseFloat($scope.hotels[i].carts[j].totalFeel)+parseFloat($scope.hotels[i].carts[j].depositFee,10);
			}
		}
		$scope.total = $scope.total.toFixed(2)
		//提交
		$scope.submit = function() {
			var data = {
					houseIds: '',
					inTimes: '',
					leaveTimes: ''
				},
				data2 = {
					customerId: localStorage.getItem('customerId'),
					hotelIds: '',
					houseIds: '',
					inTimes: '',
					leaveTimes: '',
					totalFees: ''
				};
			var houseIds = [],
				inTimes = [],
				leaveTimes = [],
				hotelIds = [],
				totalFees = [],
				depositFees = [];
			$scope.hotels.forEach(function(hotel) {
				hotel.carts.forEach(function(house) {
					houseIds.push(house.houseId);
					inTimes.push(house.inTime.split(' ')[0]);
					leaveTimes.push(house.leaveTime.split(' ')[0]);
					hotelIds.push(house.hotelId);
					totalFees.push(house.totalFeel);
					depositFees.push(house.depositFee);

				});
			});
			data.houseIds = houseIds.join(',');
			data.inTimes = inTimes.join(',');
			data.leaveTimes = leaveTimes.join(',');
			data2.houseIds = houseIds.join(',');
			data2.inTimes = inTimes.join(',');
			data2.leaveTimes = leaveTimes.join(',');
			data2.hotelIds = hotelIds.join(',');
			data2.totalFees = totalFees.join(',');
			data2.depositFees = depositFees.join(',');
			ApiService.checkHouseWhetherReserve(data).success(function(res) {
				if (res.success == true) {
					ApiService.submitOrder(data2).success(function(res) {
						if(res.success){
							//删除购物车内容
							var carIds = '';
						 $stateParams.order[0].carts.forEach(function(house){
							 carIds+=house.id+',';
						 });
						 carIds = carIds.slice(0,-1);
							ApiService.shopCardel({cartIds:carIds}).success(function(res){
							});
							var tradeNo = res.dataObject.orderCode;
							var orderDetail = res.dataObject;
							if (res.success) {
								ApiService.getOrderInfo({orderCode: tradeNo, fee: $scope.total})
								.success(function(res) {
									console.log(res)
									_AP.pay('https://mapi.alipay.com/gateway.do?' + res.dataObject);
								})
							}
						}else{
							$ionicLoading.show({
		            template: res.msg
		          });
		          $timeout(function(){
		            $ionicLoading.hide();
		            $state.go('tab.home')
		          },2000)
						}
					});
				}else{
					if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: res.msg
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
				}
			});
		};
	}]);

angular.module('ctrl-controller', [])
  .controller('ctrl', ['$scope', '$state', '$rootScope', 'ApiService', 'DuplicateLogin', 'systemBusy', '$timeout', '$ionicLoading', '$ionicViewSwitcher', function($scope,$state,$rootScope, ApiService, DuplicateLogin, systemBusy, $timeout, $ionicLoading, $ionicViewSwitcher) {

    $scope.select = true;
    $scope.pageNo = 1;
    $scope.moreDataCanBeLoaded = true;
    $ionicLoading.show({
      template: '<ion-spinner icon="ios"></ion-spinner>'
    });
    if (!localStorage.getItem('customerId')) {
      $ionicLoading.hide();

      $timeout(function(res){
        $state.go('login');

      },50)
    }
    else {
      ApiService.queryCustomerOrders({
        customerId: localStorage.getItem('customerId'),
        type: 'waiting',
        pageNo: $scope.pageNo ,
        pageSize: 5,
      }).success(function(res) {
        if (res.success) {
          $scope.pageNo++;
          $ionicLoading.hide();
          $scope.orders = res.result;
          //待入住=>已入住
          $scope.inHouse = function(house, hotelName, orderCode, code,hotelId) {
            $scope.InhotelName = hotelName;
            $scope.InorderCode = orderCode;
            var data = {
              house: house,
              hotelName: hotelName,
              orderCode: orderCode,
              subOrderCode: code,
              hotelId:hotelId
            };
            $state.go('inHouse', {
              data: data
            });
            $ionicViewSwitcher.nextDirection("back");
          };
        } else {
          if (res.msg === '非法请求') {
            $ionicLoading.show({
              template: DuplicateLogin
            });
            $timeout(function() {
              $ionicLoading.hide();
              $state.go('login')
            }, 2000)
          } else {
            $ionicLoading.show({
              template: systemBusy
            });
            $timeout(function() {
              $ionicLoading.hide();
              $state.go('tab.home')
            }, 2000)
          }
        }
      });
      //加载更多
      $scope.loadMoreData = function() {
        ApiService.queryCustomerOrders({
          customerId: localStorage.getItem('customerId'),
          type: 'waiting',
          pageNo: $scope.pageNo,
          pageSize: 5
        }).success(function(res) {
          if (res.success ) {
            for (var i = 0; i < res.result.length; i++) {
              $scope.orders.push(res.result[i]);
              $scope.$broadcast("scroll.infiniteScrollComplete");
            }
            $scope.moreDataCanBeLoaded = false;
            $scope.pageNo++;

          } else {
            $scope.moreDataCanBeLoaded = false;
            if (res.msg === '非法请求') {
              $ionicLoading.show({
                template: DuplicateLogin
              });
              $timeout(function() {
                $ionicLoading.hide();
                $state.go('login')
              }, 2000)
            } else {
              $ionicLoading.show({
                template: systemBusy
              });
              $timeout(function() {
                $ionicLoading.hide();
                $state.go('tab.home')
              }, 2000)
            }
          }

        });
      };
      //待入住
      $scope.waitingIn = function() {
        $scope.select = true;
      };
      //已入住
      $scope.hasIn = function() {
        $scope.select = false;
        ApiService.queryCustomerOrders({
          customerId: localStorage.getItem('customerId'),
          type: 'already',
          pageNo: 1,
          pageSize: 5
        }).success(function(res) {
          console.log(res)
          if (res.success) {
            $scope.beHouses = res.result;
          } else {
            if (res.msg === '非法请求') {
              $ionicLoading.show({
                template: DuplicateLogin
              });
              $timeout(function() {
                $ionicLoading.hide();
                $state.go('login')
              }, 2000)
            } else {
              $ionicLoading.show({
                template: systemBusy
              });
              $timeout(function() {
                $ionicLoading.hide();
                $state.go('tab.home')
              }, 2000)
            }
          }
        });
      };

      //goCheckIn
      $scope.goCheckIn = function(houseId, subOrderCode, code,hotelName,houseName,hotelId) {
        sessionStorage.setItem('serviceHotelId',hotelId);
        sessionStorage.setItem('serviceHouseId',houseId);
        sessionStorage.setItem('hotelName', hotelName);
        sessionStorage.setItem('houseName', houseName);
        sessionStorage.setItem('subOrderCode', subOrderCode);
        
        var data = {
          houseId: houseId,
          subOrderId: subOrderCode,
          subOrderCode: code
        };
        $state.go('checkIn', {
          data: data
        });
      };
    }





  }]);

angular.module('inHouse-controller', [])
  .controller('inHouseCtrl', ['$scope', '$stateParams', '$state', 'DuplicateLogin', 'systemBusy', '$ionicPopup', 'ApiService', '$ionicLoading', '$timeout', function($scope, $stateParams, $state,DuplicateLogin,systemBusy,$ionicPopup,ApiService, $ionicLoading, $timeout) {

    $scope.house = $stateParams.data.house;
    $scope.hotelName = $stateParams.data.hotelName;
    $scope.orderCode = $stateParams.data.orderCode;
    sessionStorage.setItem('hotelName', $scope.hotelName);
    sessionStorage.setItem('houseName', $scope.house.houseName);
    var time = $stateParams.data.house.inTime.split(' ')[0].split('-');
    var inTime = new Date(time[0], time[1] - 1, time[2], 14, 00, 00).getTime();
    sessionStorage.setItem('subOrderCode', $stateParams.data.house.subOrderCode);
    $scope.inTime = inTime > new Date().getTime();
    //入住
    $scope.inHome = function() {
      var data = {
        subOrderCode: $scope.house.subOrderCode,
        operate: 'in'
      };
      ApiService.modifySubOrdersStatus(data).success(function(res) {
        
        if (res.success) {
          var data = {
            houseId: $scope.house.houseId,
            subOrderId: $scope.orderCode,
            subOrderCode: $stateParams.data.subOrderCode
          };
          sessionStorage.setItem('serviceHotelId',$stateParams.data.hotelId);
          sessionStorage.setItem('serviceHouseId',$scope.house.houseId);
          $state.go('checkIn', {
            data: data
          });
        }else{
          $ionicLoading.show({
            template:res.msg
          })
          $timeout(function(res){
            $ionicLoading.hide()
          },2000)
        }
      });
    };
    //取消订房
    $scope.cancleSubOrder = function() {
			$ionicPopup.show({
          template: "确定要取消退房吗?",
          buttons: [{
            text: '确定',
            onTap: function() {
              return 1;
            }
          }, {
            text: '取消'
          }],
          cssClass: 'ajk',
        })
				.then(function(res){
					if(res){
						ApiService.cancleSubOrder({
							subOrderCode: $scope.house.subOrderCode
						}).success(function(res) {
							if (res.success) {
								$ionicLoading.show({
									template: '取消订单成功'
								});
								$timeout(function() {
									$state.go('tab.home');
								}, 1000);
							}else {
								if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
							}
						});
					}
				})

    };
  }]);

angular.module('airCondition-controller', [])
  .controller('airCtrl', ['$scope', 'ApiService', '$rootScope', '$stateParams', '$timeout', '$ionicLoading', function($scope, ApiService, $rootScope, $stateParams, $timeout, $ionicLoading) {
    $scope.goback = function() {
      $rootScope.$ionicGoBack();
    };
    // 空调开关状态
    $scope.status = 'OFF'
    // 起始设置温度
    $scope.temp = ''
    var data1 = {
      deviceName: encodeURI('空调'),
      houseId: sessionStorage.getItem('houseId')
    }
    ApiService.queryDeviceType(data1)
      .success(function(res) {
        $scope.deviceType = res.dataObject
        var data = {
          ip: sessionStorage.getItem('ip'),
          deviceType: $scope.deviceType,
          houseId: sessionStorage.getItem('houseId')
        };
        ApiService.ctrlHostDeviceByType(data).success(function(res) {
          if (res.success) {
            $scope.length = res.dataObject.devices.length
            $scope.title = res.dataObject.devices[0].name.replace(/[0-9$]/g, '')
            //more(res.dataObject)
            $scope.airConditionArrays = []
            res.dataObject.devices.forEach(function(air) {
              var airData = {}
              airData.deviceId = air.deviceId
              airData.index = 0
              airData.model = '制冷'
              airData.status = 'OFF'
              airData.speed = 0
              airData.speedArray = []
              var ways = air.ways;
              if (ways) {
                // console.log(ways)
                airWays(ways, airData)
              }

              $scope.airConditionArrays.push(airData)
            })
            more()
            $scope.airState = 0
            $scope.model = '制冷'

            //向右滑
            $scope.onSwipeRight = function(e) {
              e.preventDefault()
              e.stopPropagation()
              if ($scope.airState > 0) {
                $scope.airState--
                  changeTempArray('制冷')
                $scope.title = res.dataObject.devices[$scope.airState].name.replace(/[0-9$]/g, '')
              }
            }
            //向左滑
            $scope.onSwipeLeft = function(e) {
              e.preventDefault()
              e.stopPropagation()
              if ($scope.airState < $scope.length - 1) {
                $scope.airState++
                  changeTempArray('制冷')
                $scope.title = res.dataObject.devices[$scope.airState].name.replace(/[0-9$]/g, '')
              }
            }
            $scope.onDrag = function(e) {
              e.preventDefault()
              e.stopPropagation()
            }
            var index = 0;

            //改变模式
            $scope.changeModel = function() {
              var arr = $scope.airConditionArrays[$scope.airState]
              $scope.airConditionArrays[$scope.airState].index = 0
              if ($scope.airConditionArrays[$scope.airState].model == '制冷') {
                $scope.airConditionArrays[$scope.airState].model = '制热';
                changeTempArray('制热')

              } else {
                $scope.airConditionArrays[$scope.airState].model = '制冷';
                changeTempArray('制冷')
              }
              changeTem('ON')
            };
            //$scope.temp = arr[0];
            //温度加
            $scope.tempAdd = function() {
              changeTem('plus')
            };
            //温度减
            $scope.tempReduce = function() {
              changeTem('mius')
            };
            $scope.speedChange = function() {
              var air = $scope.airConditionArrays[$scope.airState]
              air.speed ++ 
              air.speedArray = []
              for(var i = 1 ; i<= air.speed%4 ; i++) {
                air.speedArray.push('speed_' + i)
              }
              changeTem()
            }
            //关闭空调
            $scope.off = function(deviceId) {
              var air = $scope.airConditionArrays[$scope.airState]
              if (air.status === 'OFF') {
                air.status = 'ON'
                changeTem('ON')
              } else {
                air.status = 'OFF'
                var arr = $scope.airConditionArrays[$scope.airState]
                var data = {
                  deviceId: deviceId,
                  houseId: sessionStorage.getItem('houseId'),
                  deviceType: $scope.deviceType,
                  port: sessionStorage.getItem('port'),
                  serverId: sessionStorage.getItem('serverId'),
                  key: 'OFF',
                  mode: arr.model === '制冷' ? 'COOL' : 'WARM',
                  wind: 1,
                  onOff: 'OFF'
                };
                air.temp = null
              ApiService.smartHostControl(data).success(function(res) {
                console.log(res)
              });
              }
            };
          } else {
            $timeout(function() {
              $ionicLoading.hide();
            }, 1000);
          }
        });
      })


    //多个空调
    function more() {
      $scope.potArray = []
      if ($scope.length > 1) {
        for (var i = $scope.length - 1; i >= 0; i--) {
          $scope.potArray.push(i)
        }
      }
      $scope.perWidth = 100 / $scope.length
    }
    // 空调数据排列
    function airWays(ways, airData) {
     // console.log(ways)
      if ($scope.deviceType === 'VIRTUAL_AIR_REMOTE') {
        var allKey = [],
          coolKey = [],
          warmKey = [],
          coolName, warmName;

        function numberOrder(a, b) {
          return a - b;
        }
        coolKey = ways.filter(function(way) {
          return way.remoteKey.indexOf('COOL') > -1
        }).map(function(way) {
          coolName = way.remoteKey.slice(0, -2);
          return way.remoteKey.slice(-2)
        })

        var coolWays = coolKey.sort(numberOrder).map(function(item) {
          return coolName + item
        });

        warmKey = ways.filter(function(way) {
          return way.remoteKey.indexOf('WARM') > -1
        }).map(function(way) {
          warmName = way.remoteKey.slice(0, -2);
          return way.remoteKey.slice(-2)
        })
        var warmWays = warmKey.sort(numberOrder).map(function(item) {
          return warmName + item
        });
        airData.coolWays = coolWays
        airData.warmWays = warmWays
      }
      if ($scope.deviceType === 'VIRTUAL_CENTRAL_AIR_REMOTE') {
        var coolWays = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30]
        var warmWays = [20, 21, 22, 23, 24, 25, 26, 28, 29, 30]
      }
      airData.coolWays = coolWays
      airData.warmWays = warmWays
    }

    // 改变temp数组
    function changeTempArray(model) {
      if ($scope.deviceType === 'VIRTUAL_AIR_REMOTE') {
        if (model === '制冷' && $scope.airConditionArrays[$scope.airState].coolWays) {
          $scope.airConditionArrays[$scope.airState].temp = $scope.airConditionArrays[$scope.airState].coolWays[0].slice(-2)
        } else if ($scope.airConditionArrays[$scope.airState].warmWays) {
          $scope.airConditionArrays[$scope.airState].temp = $scope.airConditionArrays[$scope.airState].warmWays[0].slice(-2)
        }
      } else {
        if (model === '制冷' && $scope.airConditionArrays[$scope.airState].coolWays) {
          $scope.temp = $scope.airConditionArrays[$scope.airState].coolWays[0]
        } else if ($scope.airConditionArrays[$scope.airState].warmWays) {
          $scope.temp = $scope.airConditionArrays[$scope.airState].warmWays[0]
        }
      }
    }
    //改变温度
    function changeTem(type) {
      navigator.vibrate(100);
      var arr = $scope.airConditionArrays[$scope.airState]
      //console.log(arr)
      var temArr = []
      var index = arr.index
      arr.status = 'ON'
      if (arr.model === '制冷') {
        temArr = arr.coolWays
      } else {
        temArr = arr.warmWays
      }
      if (type === 'plus' && index + 1 <= temArr.length - 1) {
        index = index + 1
        arr.index = index
      }
      if (type === 'mius' && index - 1 >= 0) {
        index = index - 1
        arr.index = index
      }
      if (type === 'ON') {
        index = Math.floor(temArr.length/2)
        arr.index = index
       // console.log(index)
      }
      var data = {
        deviceId: arr.deviceId,
        houseId: sessionStorage.getItem('houseId'),
        deviceType: $scope.deviceType,
        port: sessionStorage.getItem('port'),
        serverId: sessionStorage.getItem('serverId'),
        key: temArr[index],
        mode: arr.model === '制冷' ? 'COOL' : 'WARM',
        wind: arr.speed%4
      };
      if ($scope.deviceType === 'VIRTUAL_AIR_REMOTE') {
        arr.temp = temArr[index].slice(-2);
      } else {
        arr.temp = temArr[index]
      }
    
      ApiService.smartHostControl(data).success(function(res) {
        console.log(res)
      });

    }
  }]);

angular.module('curtain-controller', [])
  .controller('curtainCtrl', ['$scope', 'ApiService', '$rootScope', '$stateParams', function($scope, ApiService, $rootScope, $stateParams) {
    $scope.goback = function() {
      $rootScope.$ionicGoBack();
    };
    var data = {
      ip: sessionStorage.getItem('ip'),
      deviceType: 'CURTAIN'
    };
    $scope.curtainBtns = [{ title: '打开', type: 'OPEN' }, { title: '停止', type: 'STOP' }, { title: '关闭', type: 'CLOSE' }]
    ApiService.queryCurtains(data).success(function(res) {
      if (res.success) {
        console.log(res)
        for (var curtains in res.dataObject) {
          //console.log(curtains)
          res.dataObject[curtains].forEach(function(curtain) {
            curtain.brightness = 50
          })
        }
        $scope.curtainArrays = res.dataObject
        $scope.title = Object.keys(res.dataObject)[0]
        $scope.length = Object.keys(res.dataObject).length
        more()
        $scope.curtainCtrl = function(actionType, curtain, index) {
          curtain.chuanglianActiveIndex = index
         	console.log(curtain)
          var data = {
            houseId: sessionStorage.getItem('houseId'),
            deviceType: 'CURTAIN',
            port: sessionStorage.getItem('port'),
            serverId: sessionStorage.getItem('serverId'),
            actionType: actionType,
            wayId: curtain.wayId,
            brightness: 100
          };
          ApiService.smartHostControl(data).success(function(res) {
            console.log(res)
          });
        };
        $scope.change = function(value, actionType) {

        };
        $scope.onRelease = function(e,brightness, wayId) {
        	e.stopPropagation()
        	e.preventDefault()
          var data = {
            houseId: sessionStorage.getItem('houseId'),
            deviceType: 'CURTAIN',
            port: sessionStorage.getItem('port'),
            serverId: sessionStorage.getItem('serverId'),
            actionType: 'OPEN',
            wayId: wayId,
            brightness: brightness
          };
          ApiService.smartHostControl(data).success(function(res) {
            console.log(res)
          });
        };
      }
    });
    //多个窗帘

    function more() {
      $scope.potArray = []
      if ($scope.length > 1) {
        for (var i = $scope.length - 1; i >= 0; i--) {
          $scope.potArray.push(i)
        }
      }
      $scope.perWidth = 100 / $scope.length
      $scope.tvState = 0
    }

    //向右滑
    $scope.onSwipeRight = function() {
      if ($scope.tvState > 0) {
        $scope.tvState--
          $scope.title = Object.keys($scope.curtainArrays)[$scope.tvState]
      }
    }
    //向左滑
    $scope.onSwipeLeft = function() {
      if ($scope.tvState < $scope.length - 1) {
        $scope.tvState++
          $scope.title = Object.keys($scope.curtainArrays)[$scope.tvState]
      }
    }


  }]);

angular.module('tv-controller', [])
  .controller('tvCtrl', ['$scope', 'ApiService', '$rootScope', function($scope, ApiService, $rootScope) {
    $scope.goback = function() {
      $rootScope.$ionicGoBack();
    }

    var data = {
      houseId: sessionStorage.getItem('houseId')
    };
    $scope.tv_switch_active = false;
    ApiService.queryTvDevices(data).success(function(res) {
      
      if (res && res.success) {
        $scope.tvArrays = res.dataObject
        for (var i in $scope.tvArrays) {
          $scope.tvArrays[i].tv_status = 'OFF'
        }
        $scope.length = Object.keys($scope.tvArrays).length
        $scope.title = Object.keys(Object.values($scope.tvArrays)[0])[0].replace(/[0-9$]/g, '')
        more()
        $scope.tvswitch = false;
        //电视机开
        $scope.tvon = function(tv, status, index) {
          $scope.tv_switch_active = !$scope.tv_switch_active;
          
          var status;
          if (status === 'OFF') {
            setOrder('ON', tv);
            status = 'ON'
          } else {
            setOrder('OFF', tv);
            status = 'OFF'
          }
          for (var i in $scope.tvArrays) {
            //console.log(i, index)
            if (i == index + 1) {
              $scope.tvArrays[i].tv_status = status
            }
          }
        };

        //电视加
        $scope.tvAdd = function(tv) {
          setOrder('VOL_PLUS', tv);
        };
        //电视减
        $scope.tvMunis = function(tv) {
          setOrder('VOL_SUB', tv);
        };
        //机顶盒开
        $scope.tvboxswitch = false;
        $scope.tvBoxOn = function(tv) {
          $scope.tvboxswitch = !$scope.tvboxswitch;
          if ($scope.tvboxswitch) {
            setOrder_box('ON', tv)
          } else {
            setOrder_box('OFF', tv);
          }
        };

        //机顶盒静音
        $scope.tvBoxMute = function(tv) {
          setOrder_box('MUTE', tv);
        };
        //机顶盒返回
        $scope.tvBoxReturn = function(tv) {
          setOrder_box('RETURN', tv);
        };
        //机顶盒up
        $scope.tvBoxUp = function(tv) {
          setOrder_box('UP', tv);
        };
        //机顶盒down
        $scope.tvBoxDown = function(tv) {
          setOrder_box('DOWN', tv);
        };
        //机顶盒left
        $scope.tvBoxLeft = function(tv) {
          setOrder_box('LEFT', tv);
        };
        //机顶盒right
        $scope.tvBoxRight = function(tv) {
          setOrder_box('RIGHT', tv);
        };
        //机顶盒ok
        $scope.tvBoxOk = function(tv) {
          setOrder_box('OK', tv);
        };
        //机顶盒right
        $scope.tvBoxRight = function(tv) {
          setOrder_box('RIGHT', tv);
        };
        // 机顶盒声音加
        $scope.tvBoxVol_P = function(tv) {
          setOrder_box('VOL_PLUS', tv);
        };
        // 机顶盒声音减
        $scope.tvBoxVol_M = function(tv) {
          setOrder_box('VOL_SUB', tv);
        };
        // 机顶盒点播
        $scope.tvBoxStop = function(tv) {
          setOrder_box('STOP', tv);
        };
        // 机顶盒会看
        $scope.tvBoxPlay = function(tv) {
          setOrder_box('PLAY', tv);
        };
        //机顶盒num
        $scope.tvBoxNum = function(e, tv) {
          setOrder_box(e.target.dataset.key, tv);
          //console.log(e.target.dataset.key)
        };
      }
    });
    function setOrder(key, tv) {
          console.log(navigator.vibrate);
          navigator.vibrate(1000);
          var deviceId = ''
          for (var i in tv) {
            if (i.indexOf('电视机') > -1) {
              deviceId = tv[i]
            }
          }
          var data = {
            houseId: sessionStorage.getItem('houseId'),
            deviceType: 'VIRTUAL_TV_DVD_REMOTE',
            deviceId: deviceId,
            key: key,
            port: sessionStorage.getItem('port'),
            serverId: sessionStorage.getItem('serverId')
          };
          ApiService.smartHostControl(data).success(function(res) { console.log(res); });
        }
    function setOrder_box(key, tv) {
      navigator.vibrate(3000);
      var deviceId = ''
      for (var i in tv) {
        if (i.indexOf('机顶盒') > -1) {
          deviceId = tv[i]
        }
      }
      var data = {
        houseId: sessionStorage.getItem('houseId'),
        deviceType: 'VIRTUAL_TV_DVD_REMOTE',
        deviceId: deviceId,
        key: key,
        port: sessionStorage.getItem('port'),
        serverId: sessionStorage.getItem('serverId')
      };
      ApiService.smartHostControl(data).success(function(res) { console.log(res); });
    }

    // 多台电视机
    function more() {
      $scope.potArray = []
      if ($scope.length > 1) {
        for (var i = $scope.length - 1; i >= 0; i--) {
          $scope.potArray.push(i)
        }
      }
      $scope.perWidth = 100 / $scope.length
      $scope.tvState = 0
    }

    //向右滑
    $scope.onSwipeRight = function() {
      if ($scope.tvState > 0) {
        $scope.tvState--
          $scope.title = Object.keys(Object.values($scope.tvArrays)[$scope.tvState])[0].replace(/[0-9$]/g, '')

      }
    }
    //向左滑
    $scope.onSwipeLeft = function() {
      if ($scope.tvState < $scope.length - 1) {
        $scope.tvState++
          $scope.title = Object.keys(Object.values($scope.tvArrays)[$scope.tvState])[0].replace(/[0-9$]/g, '')
      }
    }
  }]);

angular.module('sweepTime-controller', [])
  .controller('sweepTimeCtrl', ['$scope', '$rootScope', 'ApiService', '$stateParams', function($scope, $rootScope, ApiService, $stateParams) {
    $scope.back = function() {
      $rootScope.$ionicGoBack();
    }
    var data = {
      hotelId: sessionStorage.getItem('serviceHotelId'),
      customerId: localStorage.getItem('customerId'),
      houseId: sessionStorage.getItem('serviceHouseId'),
      type: $stateParams.id
    }
    $scope.waitingStatus = false;
    $scope.handleStatus = false;
    $scope.completeStatus = false;
    ApiService.serviceHandleRecords(data).success(function(res) {
      if (res.success) {
        switch (res.result[0].content) {
          case '等待':
            $scope.waitingStatus = true;
            break;
          case '已处理':
            $scope.handleStatus = true;
            break;
          case '打扫完成':
            $scope.completeStatus = true;
            break;
          default:
            break
        }
      }
    })
    $scope.contenSwitch = false;
    $scope.changeTime = function() {
      $scope.timeSwitch = true;
    };
    $scope.times = ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00'];
    $scope.selectTime = function(id, time) {
      $scope.index = id;
      $scope.timeSwitch = false;
    };
  }]);

angular.module('clean-controller', [])
  .controller('cleanCtrl', ['$scope', '$stateParams', '$rootScope', '$ionicPopup', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$timeout', '$ionicViewSwitcher', function($scope, $stateParams, $rootScope,$ionicPopup,$state, ApiService,DuplicateLogin,systemBusy,$ionicLoading, $timeout, $ionicViewSwitcher) {
  $scope.goback = function() {
		$rootScope.$ionicGoBack();
	};
  $scope.hotelName = sessionStorage.getItem('hotelName');
  $scope.houseName = sessionStorage.getItem('houseName');
	$scope.leave = function() {
		$ionicPopup.show({
			template: "确定要退房吗?",
			buttons: [{
				text: '确定',
				onTap:function(){
					return 1;
				}
			}, {
				text: '取消'
			}],
			cssClass: 'ajk',
		})
  .then(function(res) {
	if (res) {
		ApiService.modifySubOrdersStatus({
			subOrderCode: $stateParams.data.subOrderCode,
			operate: 'leave'
		}).success(function(res) {
			if (res.success) {
				$ionicLoading.show({
					template: '退房成功',
          noBackdrop: 'true',
          duration: 2000
				});
				$timeout(function() {
					$state.go('tab.home');
					$ionicViewSwitcher.nextDirection("back");
				}, 1000);
			}else{
        if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
      }
		});
	} else {

	}
});
	};
	$scope.goService = function(type) {
		if (type == '打扫') {
      var sweepData = {
        hotelId:sessionStorage.getItem('serviceHotelId'),
        customerId:localStorage.getItem('customerId'),
        houseId:sessionStorage.getItem('serviceHouseId'),
        content:encodeURI('打扫'),
        type:1
      }
      ApiService.customerCallService(sweepData).success(function(res){
        if (res.success) {
          $state.go('sweepTime',{id:1});
        }
      })

		} else if (type == '维修') {
			$state.go('maintain',{id:2});

		}
	};
}]);

angular.module('checkIn-controller', [])
  .controller('checkInCtrl', ['$scope', '$rootScope', '$stateParams', '$interval', 'encode64', 'ApiService', '$state', '$ionicViewSwitcher', function($scope,$rootScope,$stateParams,$interval,encode64 ,ApiService, $state, $ionicViewSwitcher) {
    $scope.goack = function() {
      $rootScope.$ionicGoBack();
    };
	$scope.goClean = function() {
		$state.go('clean', {
			data: $stateParams.data
		});
		$ionicViewSwitcher.nextDirection("forward");
	};
	
	$scope.figures = [
    {name:'curtain',title:'窗帘',path:'curtain'},
    {name:'lock',title:'门锁',path:'lock'},
    {name:'light',title:'灯',path:'light'},
    {name:'tv',title:'电视',path:'tv'},
    {name:'service',title:'服务',path:'service'},
    {name:'air',title:'空调',path:'airCondition'},
    {name:'model',title:'情景',path:'model'}
   ]
   $scope.activeIndex = 0
   var timer = $interval(function() {
      $scope.activeIndex = ($scope.activeIndex + 1)%7
    },3900)

	var houseId = $stateParams.data.houseId;
	ApiService.viewHouseHostInfo({
		houseId: houseId
	}).success(function(res) {
		console.log(res)
		if (res.success) {
			sessionStorage.setItem('houseId', encode64(houseId + ''));
			sessionStorage.setItem('serverId', res.dataObject.serverId);
			sessionStorage.setItem('port', res.dataObject.port);
			sessionStorage.setItem('ip', res.dataObject.ip);
			sessionStorage.setItem('ctrl_houseName', res.dataObject.name);
		}
	});

	

	// 退出时取消interval 事件
	$scope.$on("$destroy", function() {
    $interval.cancel(timer);      
   })
}]);

angular.module('maintain-controller', [])
.controller('maintainCtrl',['$scope', '$rootScope', 'ApiService', '$stateParams', '$ionicLoading', '$timeout', function($scope,$rootScope,ApiService,$stateParams,$ionicLoading,$timeout){
	$scope.goback = function(){
	  $rootScope.$ionicGoBack();
	}
	var data = {
		hotelId:sessionStorage.getItem('serviceHotelId'),
		customerId:localStorage.getItem('customerId'),
		houseId:sessionStorage.getItem('serviceHouseId'),
		type:$stateParams.id
	}
	$scope.waitingStatus = false;
	$scope.handleStatus = false;
	$scope.completeStatus = false;
	ApiService.serviceHandleRecords(data).success(function(res){
		if (res.success) {
			if (res.result.length==0) {
				$scope.contenSwitch=true;
			}else {
				$scope.contenSwitch=false;
				switch (res.result[0].content) {
					case '等待':
						$scope.waitingStatus = true;
						break;
					case '正在':
						$scope.handleStatus = true;
						break;
					case '完成':
						$scope.completeStatus = true;
						break;
					default:
						break
				}
			}
		}
	})
	$scope.contenSwitch=true;
	$scope.timeSwitch = false;
	$scope.repairThings = ['空调','电视机','灯','门锁','窗帘','其他'];
	$scope.selectApplication = $scope.repairThings[0];
	$scope.selectRepair = function(id,thing){
		$scope.index = id;
		$scope.timeSwitch = false;
		$scope.selectApplication = thing;
	};
	$scope.changeRepair=function(){
		$scope.timeSwitch = true;
	};
	$scope.timeSwitch1 = function(){
		$scope.timeSwitch = false;
	};
	//提交维修申请
	$scope.submitRepair = function(){
		var maintainData = {
			hotelId:sessionStorage.getItem('serviceHotelId'),
			customerId:localStorage.getItem('customerId'),
			houseId:sessionStorage.getItem('serviceHouseId'),
			content:encodeURI($scope.selectApplication),
			type:2
		}
		ApiService.customerCallService(maintainData).success(function(res){
			if (res.success) {

				$scope.contenSwitch=false;
				$ionicLoading.show({
					template:'提交成功'
				})
				$timeout(function(res){
					$ionicLoading.hide();
				})
			}
		})
	}
}]);

angular.module('model-controller', [])
.controller('modelCtrl',['$scope', '$rootScope', 'ApiService', function($scope,$rootScope,ApiService){
	$scope.goback = function(){
	  $rootScope.$ionicGoBack();
	}

	ApiService.queryHostScenes({serverId:sessionStorage.getItem('serverId')}).success(function(res){
		if(res.success){
			var models = res.dataObject
			$scope.modelArray = models.filter(function(model,index){
					return   model.name.indexOf('情景') > -1;
				});
			$scope.modelCtrl = function(sceneId, index){
				$scope.activeIndex=index;

				var data = {
					houseId:sessionStorage.getItem('houseId'),
					deviceType:'SCENE',
					port:sessionStorage.getItem('port'),
					serverId:sessionStorage.getItem('serverId'),
					sceneId: sceneId
				};
				ApiService.smartHostControl(data).success(function(res){
					console.log(res)
				});
			};
		}
	});
}]);

angular.module('light-controller', [])
  .controller('lightCtrl', ['$scope', '$rootScope', '$stateParams', 'quadrant', '$rootScope', 'ApiService', '$state', '$timeout', function($scope, $rootScope, $stateParams, quadrant, $rootScope, ApiService, $state, $timeout) {
    $scope.goback = function() {
      $rootScope.$ionicGoBack();
      //$state.go('checkIn');
    }
    $scope.tab_navs = ['卫生间', '卧室', '走廊', '其他']

    var data = {
      deviceType: 'SWITCH',
      ip: sessionStorage.getItem('ip'),
      houseId: sessionStorage.getItem('houseId')
    };
    //获取主机路线
    function getways() {
      ApiService.querySmartDeviceWays(data)
        .success(function(res) {
          if (res.success) {
            //console.log(res)
            $scope.lights = res.dataObject.ways
            $scope.allLights = $scope.lights.filter(function(light, index) {
              return light.name.indexOf('灯') > -1;
            });
            $scope.tabClick('卧室', 1)
          }
        })
    }
    getways();
    //切换tab
    $scope.tabClick = function(type, index) {
      $scope.lights = $scope.allLights.filter(function(light, index) {
        return light.name.indexOf(type) > -1;
      });
      $scope.lights.forEach(function(light, index) {
        var rotate = -90 + (30 * Math.round(index / 2)) * Math.pow(-1, index + 1)
        light.rotate = rotate
      })
    }
    // typeClick
    $scope.middle_round_rotate = 0 + 'deg'
    $scope.modleIndex = 1
    $scope.type_light = '卧室'
    $scope.typeClick = function(index, type) {
      $scope.middle_round_rotate = index * 25 - 25 + 'deg'
      $scope.modleIndex = index;
      $scope.type_light = type
      $scope.tabClick(type, index)
    }
    //灯控制
    $scope.lightCtrl = function(light) {
      var status = light.status == 'ON' ? "CLOSE" : 'OPEN';
      light.status = light.status == 'ON' ? "OFF" : 'ON';
      var data = {
        houseId: sessionStorage.getItem('houseId'),
        port: sessionStorage.getItem('port'),
        deviceType: 'SWITCH',
        serverId: sessionStorage.getItem('serverId'),
        actionType: status,
        wayId: light.wayId,
        brightness: 90
      };

      ApiService.smartHostControl(data).success(function(res) {
        console.log(res)
      });
    };

    // large_round 渲染
    var fontSize = window.innerWidth / 10
    var raduisX = fontSize * 7.733,
      raduisY = fontSize * 12.27,
      currentAngle = 0;
    $scope.large_round_rotate = 0
    $scope.onTouch = function(e) {
      e.preventDefault()
      var pageX = e.gesture.center.pageX
      var pageY = e.gesture.center.pageY
      var to = ((pageX - raduisX) / (pageY - raduisY))
      var whichquadrant = quadrant(pageX, raduisX, pageY, raduisY)
      if (whichquadrant === 3) {
        $scope.currentAngle = Math.atan(to) / (2 * Math.PI) * 360
      }
      if (whichquadrant === 4) {
        $scope.currentAngle = Math.atan(to) / (2 * Math.PI) * 360 + 180
      }
      if (whichquadrant === 2) {
        $scope.currentAngle = Math.atan(to) / (2 * Math.PI) * 360
      }
      if (whichquadrant === 1) {
        $scope.currentAngle = Math.atan(to) / (2 * Math.PI) * 360 + 180
      }
    }
    $scope.currentAngle = 0
    $scope.touchstart = function(e) {
      e.preventDefault()
      var pageX = e.gesture.center.pageX
      var pageY = e.gesture.center.pageY

      //判断第几象限
      var whichquadrant = quadrant(pageX, raduisX, pageY, raduisY)
      var to = ((pageX - raduisX) / (pageY - raduisY))
      let moveAngle
      if (whichquadrant === 3) {
        moveAngle = Math.atan(to) / (2 * Math.PI) * 360
      }
      if (whichquadrant === 4) {
        moveAngle = Math.atan(to) / (2 * Math.PI) * 360 + 180
      }
      if (whichquadrant === 2) {
        moveAngle = Math.atan(to) / (2 * Math.PI) * 360
      }
      if (whichquadrant === 1) {
        moveAngle = Math.atan(to) / (2 * Math.PI) * 360 + 180
      }
      $scope.large_round_rotate = $scope.large_round_rotate + moveAngle - $scope.currentAngle
      $scope.currentAngle = moveAngle
    }


    // websocket 
    $scope.websocket = new WebSocket("ws://www.live-ctrl.com/aijukex/stServlet.st?serverId=" + sessionStorage.getItem('serverId'))
    $scope.websocket.onmessage = function(event) {
      $scope.$apply(function() {
        var lightNow = event.data.split('.WAY.')
        $scope.allLights = $scope.allLights.map(function(light) {
          if (light.wayId === lightNow[0]) {
            light.status = lightNow[1]
          } else {
            light
          }
          return light
        })
        $scope.lights = $scope.allLights.filter(function(light, index) {
          return light.name.indexOf($scope.tab_navs[$scope.modleIndex]) > -1;
        });
       // console.log($scope.allLights, $scope.lights)
      })
    }
    $scope.$on("$destroy", function() {
      $scope.websocket.close()
      submitLights()
    })
    // 退出提交light状态
    function submitLights() {
      var onWayIds = ''
      $scope.allLights
        .filter(function(light) { return light.status === 'ON' })
        .forEach(light => {
          onWayIds = onWayIds + ',' + light.wayId
        })
      var offWayIds = ''
      $scope.allLights
        .filter(function(light) { return light.status === 'OFF' })
        .forEach(light => {
          offWayIds = offWayIds + ',' + light.wayId
        })
      //console.log(onWayIds)
      ApiService.modifyWaysStatus({
        onWayIds: onWayIds.slice(1),
        offWayIds: offWayIds.slice(1)
      }).success(function(res) {
        console.log(res)
      })
    }
  }]);

angular.module("colorPicker-controller", [])
  .controller("colorPickerCtrl", ['$scope', '$rootScope', 'ApiService', function($scope, $rootScope,ApiService) {
	$scope.color1 = ['red','green','blue','white'];
	$scope.color2 = ['yellow','pink','cornflowerblue','orange'];

  $scope.goback = function() {
    $rootScope.$ionicGoBack();
  };
	$scope.$on('rgbChange', function() {
	});
	var data = {
		deviceType: 'VIRTUAL_RGB_REMOTE',
		ip: '192.168.1.102'
	};
	ApiService.ctrlHostDeviceByType(data).success(function(res) {
		$scope.deviceId = res.dataObject[0].deviceId;
	});
	$scope.changeRgb = function() {
		var r = $scope.rgb[0];
		var g = $scope.rgb[1];
		var b = $scope.rgb[2];
		var rgb = 'r=' + r + '&g=' + g + '&b=' + b;
		var data = {
			houseId: sessionStorage.getItem('houseId'),
			deviceType: 'VIRTUAL_RGB_REMOTE',
			port: sessionStorage.getItem('port'),
			serverId: sessionStorage.getItem('serverId'),
			deviceId:$scope.deviceId,
			key: 'ON',
			rgb:rgb
		};
		ApiService.smartHostControl(data);
	};
    //关闭
	$scope.color = function(){
		var data = {
			houseId: sessionStorage.getItem('houseId'),
			deviceType: 'VIRTUAL_RGB_REMOTE',
			port: sessionStorage.getItem('port'),
			serverId: sessionStorage.getItem('serverId'),
			deviceId:$scope.deviceId,
			key: 'OFF',
			rgb:'*'
		};
		ApiService.smartHostControl(data);
	};
	$scope.colorSubmit = function(color){
		var key = color.slice(0,1).toUpperCase();
		var data = {
			houseId: sessionStorage.getItem('houseId'),
			deviceType: 'VIRTUAL_RGB_REMOTE',
			port: sessionStorage.getItem('port'),
			deviceId:$scope.deviceId,
			serverId: sessionStorage.getItem('serverId'),
			key: key,
			rgb:'*'
		};

		ApiService.smartHostControl(data).success(function(res){

		});
	};
}]);

angular.module('lock-controller', [])
  .controller('lockCtrl', ['$scope', 'ApiService', '$ionicLoading', '$state', '$rootScope', function($scope, ApiService,$ionicLoading,$state,$rootScope) {
      var ctrl_houseName = sessionStorage.getItem('houseName')
      ctrl_houseName ? $scope.name = sessionStorage.getItem('houseName').replace(/[0-9]/g, '') : null
      ctrl_houseName ? $scope.num = sessionStorage.getItem('houseName').replace(/[^0-9]/g, '') : null
      $scope.goback = function() {
        $rootScope.$ionicGoBack();
      }
      $scope.activeIndex = -1
      $scope.arrys = [{ title: '电源', name: 'source' }, { title: '门', name: 'door' }, { title: '电梯', name: 'elevator' }]
      //获取锁
      var data = {
        ip: sessionStorage.getItem('ip'),
        deviceType: 'FINGERPRINT_LOCK',
        houseId: sessionStorage.getItem('houseId')
      };
      ApiService.ctrlHostDeviceByType(data).success(function(res) {
          if (res && res.success) {
            var deviceId = res.dataObject.devices[0].deviceId;
           // console.log(deviceId)
            if (res.dataObject) {
              $scope.lockCtrl = function(name, index) {
             //  console.log(name, index)
              	$scope.activeIndex = index
                switch (name) {
                  case 'door':
                    openDoor(deviceId);
                    break;
                  case 'source':
                    break;
                  default:
                    break;
                }
              }
            };
          }
        })
     

    function openDoor(deviceId) {
      var data = {
        houseId: sessionStorage.getItem('houseId'),
        deviceType: 'FINGERPRINT_LOCK',
        port: sessionStorage.getItem('port'),
        serverId: sessionStorage.getItem('serverId'),
        deviceId: deviceId,
        subOrderCode: sessionStorage.getItem('subOrderCode')
      };
      $ionicLoading.show({
				template: "开锁成功",
				noBackdrop: 'true',
				duration: 2000
			});
      ApiService.smartHostControl(data).success(function(res) {
         $rootScope.$ionicGoBack();
      });
    }
  }]);

angular.module("service-controller", []).controller("serviceCtrl", ['$scope', '$rootScope', 'ApiService', function($scope,$rootScope, ApiService) {
  $scope.goback = function() {
    $rootScope.$ionicGoBack();
  }
  
  $scope.check = {
    dnd: 'CLOSE',
    clean: 'CLOSE'
  };
  var data = {
    ip: sessionStorage.getItem('ip'),
    deviceType: 'SWITCH',
    houseId: sessionStorage.getItem('houseId')
  };

  ApiService.querySmartDeviceWays(data).success(function(res) {
    console.log(res)
    if (res && res.success) {
      if (res.dataObject.ways) {

        var dnd = res.dataObject.ways.filter(function(data) {
          return data.name == '请勿打扰';
        });
        var clean = res.dataObject.ways.filter(function(data) {
          return data.name == '请即清理';
        });
        $scope.modelClick = function(type) {
        	var way,_type;
        	if (type === 'qingli') {
        		$scope.check.clean === 'CLOSE'? 
        			$scope.check = {
						    dnd: 'CLOSE',
						    clean: 'OPEN'
						  } : 
						  $scope.check = {
						    dnd: 'CLOSE',
						    clean: 'CLOSE'
						  }
						way = clean;
						_type = $scope.check.clean
        	}
        	if (type === 'darao') {
        		$scope.check.dnd === 'CLOSE'? 
        			$scope.check = {
						    dnd: 'OPEN',
						    clean: 'CLOSE'
						  } : 
						  $scope.check = {
						    dnd: 'CLOSE',
						    clean: 'CLOSE'
						  }
						way = dnd
						_type = $scope.check.dnd
        	}
        	var data = {
            houseId: sessionStorage.getItem('houseId'),
            deviceType: 'SWITCH',
            port: sessionStorage.getItem('port'),
            serverId: sessionStorage.getItem('serverId'),
            actionType: _type,
            wayId: way[0].wayId,
            brightness: 90
          };
          ApiService.smartHostControl(data).success(function(res) {
          	console.log(res)
          });
        }
    
      }
    }
  });
}]);

angular.module("readLight-controller",[])
.controller("readLightCtrl",['$scope', '$rootScope', 'ApiService', function($scope,$rootScope,ApiService){
	$scope.goback = function(){
	  $rootScope.$ionicGoBack();
	}
	$scope.check = {
		white:false,
		warm:false
	};
	$scope.brightness = {
		value1:50,
		value2:50
	};
	var data = {
		deviceType:'DIMMER',
		ip:sessionStorage.getItem('ip')
	};
	ApiService.ctrlHostDeviceByType(data).success(function(res){
		if(res.dataObject){
			var whiteLight = res.dataObject[0].ways.filter(function(data){
				return data.name == '调光白光';
			});
			var warmLight = res.dataObject[0].ways.filter(function(data){
				return data.name == '调光暖黄';
			});
			$scope.whiteService = function(){
				var type = $scope.check.white?'OPEN':'CLOSE';
				var data = {
					houseId:sessionStorage.getItem('houseId'),
					deviceType:'SWITCH',
					port:sessionStorage.getItem('port'),
					serverId:sessionStorage.getItem('serverId'),
					actionType:type,
					wayId:whiteLight[0].wayId,
					brightness:90
				};
				ApiService.smartHostControl(data);
			};
			$scope.warmService = function(){
				var type = $scope.check.warm?'OPEN':'CLOSE';
				var data = {
					houseId:sessionStorage.getItem('houseId'),
					deviceType:'SWITCH',
					port:sessionStorage.getItem('port'),
					serverId:sessionStorage.getItem('serverId'),
					actionType:type,
					wayId:warmLight[0].wayId,
					brightness:90
				};
				ApiService.smartHostControl(data);
			};

			$scope.changeSubmit = function(brightness,type){
				var wayId = type =='调光白光'?whiteLight[0].wayId:warmLight[0].wayId;
				var data = {
					houseId:sessionStorage.getItem('houseId'),
					deviceType:'SWITCH',
					port:sessionStorage.getItem('port'),
					serverId:sessionStorage.getItem('serverId'),
					actionType:'OPEN',
					wayId:wayId,
					brightness:brightness
				};
				ApiService.smartHostControl(data);
			};
		}
	});
}]);

angular.module('picShow-controller', [])
.controller('picShowCtrl',['$scope', '$stateParams', '$rootScope', '$ionicHistory', function($scope,$stateParams,$rootScope,$ionicHistory){
	$scope.imgs = $stateParams.data.imgsrcs;
	$scope.index = $stateParams.data.index;

	$scope.back = function(){
		$rootScope.$ionicGoBack();
	};
}]);

angular.module("evaluate_controller",[])
.controller("evaluateCtrl",['$scope', '$stateParams', '$state', 'ApiService', 'DuplicateLogin', 'systemBusy', '$ionicLoading', '$timeout', function($scope,$stateParams,$state,ApiService,DuplicateLogin,systemBusy,$ionicLoading,$timeout){

	$scope.hotelName = $stateParams.data.hotelName;
	$scope.picture = $stateParams.data.picture;
	$scope.star=5;
	$scope.message = {
		content:''
	};
	$scope.stars = ['star_full','star_full','star_full','star_full','star_full'];
	$scope.selectStar=function(num){
		var num = num+1;
		var star_full=[],star = [];
		for(var i=0;i<num;i++){
			star_full.push('star_full');
		}
		for(var i=0;i<5-num;i++){
			star.push('star');
		}
		$scope.stars = star_full.concat(star);

		$scope.star = num;
	};
	$scope.submit = function(){
		var data = {
			hotelId:$stateParams.data.hotelId,
			houseId:$stateParams.data.houseId,
			customerId:localStorage.getItem('customerId'),
			content:encodeURI($scope.message.content),
			stars:$scope.star,
			subOrderCode:$stateParams.data.subOrderCode,
			picture:''
		};
		ApiService.customerFeedBack(data).success(function(res){
			
			if(res.success){

				$ionicLoading.show({
					template:'评价成功'
				});
				$timeout(function(res){
					$ionicLoading.hide();
					$state.go('Noevaluate');
				},2000)
			}else {
				if (res.msg==='非法请求') {
          $ionicLoading.show({
            template: DuplicateLogin
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('login')
          },2000)
        }else {
          $ionicLoading.show({
            template: systemBusy
          });
          $timeout(function(){
            $ionicLoading.hide();
            $state.go('tab.home')
          },2000)
        }
			}
		});
	};
}]);
