//出货单列表回调
eShop.onPageInit('saleBatch_deliverOrder_list', function(page) {
    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                query: {
                    deliverOrderNo: '',
                    customerId: '',
                    status: '',
                    createTimeFrom: '',
                    createTimeTo: '',
                    creatorId: '',
                    sponsorId: '',
                    auditorId: '',
                    tenantId: xunSoft.user.tenantId(),
                    shopId: xunSoft.user.shopId(),
                    orderBy: 'deliverOrderId desc',
                },
                pageIndex: 1,
                pageSize: xunSoft.user.pageSize()
            },
            response: {
                total: 0,
                data: []
            }
        },
        computed: {
            _totalPrice: function() {
                var total = 0;
                _.each(this.response.data, function(row) {
                    _.each(row.value, function(item) {
                        total += (parseFloat(item.detailSummary.deliverMoney) || 0);
                    });
                });
                return total;
            }
        },
        methods: {
            init: function() {
                this.load();

                //下拉刷新
                pageDiv.find('.pull-to-refresh-content').on('refresh', function() {
                    eShop.pullToRefreshDone();
                    vm.refresh();
                });
            },
            load: function() {
                saleService.get.getDeliverOrderList(vm.request, vm.response);
            },
            refresh: function() {
                this.request.pageIndex = 1;
                this.response.total = 0;
                this.response.data = [];
                this.load();
            },
            //查询
            query: function() {
                mainView.router.load({
                    url: 'saleBatch/common/filter.ios.html',
                    query: {
                        para: vm.request.query,
                        callback: vm.refresh
                    }
                });
            },
            //弹出框
            showMenu: function(item) {
                var buttons = [];
                if (item.flag == 'L') {
                    buttons.push({
                        text: '提交',
                        onClick: function() {
                            vm.updateState('1', item);
                        }
                    });
                }
                if (item.flag == 'T') {
                    buttons.push({
                        text: '取消提交',
                        onClick: function() {
                            vm.updateState('2', item)
                        }
                    });
                }
                if (item.flag == 'T') {
                    buttons.push({
                        text: '审核',
                        onClick: function() {
                            vm.updateState('3', item)
                        }
                    });
                }
                if (item.flag == 'S') {
                    buttons.push({
                        text: '取消审核',
                        onClick: function() {
                            vm.updateState('4', item)
                        }
                    });
                }
                if (item.flag == 'L') {
                    buttons.push({
                        text: '编辑',
                        onClick: function() {
                            vm.update(item)
                        }
                    });
                }
                if (item.flag == 'L') {
                    buttons.push({
                        text: '删除',
                        onClick: function() {
                            vm.delete(item)
                        }
                    });
                }
                buttons.push({
                    text: '打印',
                    color: 'green',
                    onClick: function() {
                        mainView.router.load({ url: "saleBatch/common/print.ios.html?orderType=deliverOrder&orderId=" + item.deliverOrderId });
                    }
                });
                buttons.push({
                    text: '取消',
                    color: 'red'
                });
                eShop.actions(pageDiv.container, buttons);
            },
            //更新
            update: function(deliverOrder) {
                mainView.router.load({
                    url: 'saleBatch/deliverOrder/update.ios.html',
                    query: {
                        deliverOrderId: deliverOrder.deliverOrderId
                    }
                });
            },
            back: function() {
                mainView.router.back();
                if (_.isFunction(page.query.callback)) {
                    page.query.callback();
                }
            },
            //更新状态
            updateState: function(flag, order) {
                var request = {
                    data: {
                        tenantId: xunSoft.user.tenantId(),
                        entityId: order.deliverOrderId,
                        flag: flag
                    }
                };

                //修改单据的状态
                saleService.put.putDeliverUpdateState(request, {}, function(responseData) {
                    xunSoft.helper.showMessage('单据操作成功');
                    if (responseData.data.submitTime) {
                        order.flag = 'T';
                    }
                    if (responseData.data.auditTime) {
                        order.flag = 'S';
                    }
                    if (flag == '2') {
                        order.flag = 'L';
                    }
                    if (flag == '4') {
                        order.flag = 'T';
                    }
                });
            },
            //删除
            delete: function(deliverOrder) {
                var request = {
                    id: deliverOrder.deliverOrderId
                };
                eShop.confirm('您确定要删除当前出货单吗？', function() {
                    saleService.delete.deleteDeliverOrder(request, {}, function(responseData) {
                        _.each(vm.response.data, function(value, key) {
                            if (value.time == deliverOrder.deliverDate) {
                                vm.response.data[key].value.$remove(deliverOrder);
                            }
                        });
                        vm.response.total--;
                        xunSoft.helper.showMessage('单据删除成功');
                    });
                });
            }
        }
    });

    vm.init();
});

//出货单录入详情
eShop.onPageInit('saleBatch_deliverOrder_detail', function(page) {
    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                id: 0
            },
            response: {
                data: {}
            }
        },
        methods: {
            init: function() {
                vm.request.id = page.query.orderId;
                pageDiv.find('.pull-to-refresh-content').on('refresh', function() {
                    eShop.pullToRefreshDone();
                    vm.load();
                });
                this.load();
            },
            load: function() {
                saleService.get.getDeliverOrderDetail(vm.request, vm.response);
            },
            edit: function(e) {
                e.preventDefault();
                e.stopPropagation()
                if (vm.response.data.submitTime || vm.response.data.auditTime) {
                    xunSoft.helper.showMessage("单据已提交审核，不能修改");
                    return;
                }
                mainView.router.load({
                    url: 'saleBatch/deliverOrder/update.ios.html',
                    query: {
                        deliverOrderId: vm.response.data.deliverOrderId,
                        callback: this.load
                    }
                });
            },
            toReturnOrder: function() { //出货退货
                mainView.router.load({
                    url: 'saleBatch/returnOrder/add.ios.html',
                    query: {
                        data: vm.response.data,
                        type: 'fromDeliverOrder',
                        callback: vm.load
                    }
                });
            },
            detail: function(e, item) {
                e.preventDefault();
                e.stopPropagation()
                mainView.router.load({
                    url: 'kind/kindDetail.ios.html',
                    query: {
                        item: item,
                    }
                });
            }
        }
    });

    vm.init();
});

//出货单录入回调
eShop.onPageInit('saleBatch_deliverOrder_add', function(page) {

    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                customerId: 0,
                userId: 0,
                deliverDate: xunSoft.helper.formatDate(new Date()),
                sponsorId: 0,
                sponsorOrganId: xunSoft.user.shopId(),
                sponsorShopId: xunSoft.user.shopId(),
                deliverWarehouseId: xunSoft.user.shopId(),
                accountId: 0,
                advanceMoney: 0,
                creatorId: xunSoft.user.userId(),
                updatorId: xunSoft.user.userId(),
                description: '',
                tenantId: xunSoft.user.tenantId(),
                detailList: []
            },
            response: {
                customers: baseInfoService.customers,
                users: baseInfoService.users,
                accounts: baseInfoService.accounts
            }
        },
        computed: {
            //总数量
            totalDeliverAmount: function() {
                var total = 0;
                _.each(this.request.detailList, function(item) {
                    total += (parseInt(item.deliverAmount) || 0);
                });
                return total;
            },
            //总金额
            totalDeliverMoney: function() {
                var total = 0;
                _.each(this.request.detailList, function(item) {
                    total += (parseFloat(item.deliverMoney) || 0);
                });
                return total;
            }
        },
        watch: {
            "request.customerId": function(val, oldVal) {
                xunSoft.event.smartSelect("#customerId");
            },
            "request.accountId": function(val, oldVal) {
                xunSoft.event.smartSelect("#accountId");
            },
            "request.userId": function(val, oldVal) {
                xunSoft.event.smartSelect("#userId");
            }
        },
        methods: {
            init: function() {
                eShop.calendar({
                    input: pageDiv.find("#deliverDate"),
                    minDate: new Date()
                });
                this.loadDeliverOrder();

            },
            loadDeliverOrder: function() {

                if (page.query.type && page.query.type === 'fromSaleOrder') {
                    _.extend(vm.request, _.omit(page.query.data, "detailList", 'saleOrderId', 'saleOrderNo'));
                    _.each(page.query.data.detailList, function(value, key) {
                        var item = _.omit(value, 'saleAmount', 'salePrice', 'saleMoney', 'saleDetailId', 'saleOrderId');
                        item.deliverAmount = value.saleAmount;
                        item.deliverPrice = value.salePrice;
                        item.deliverMoney = value.saleMoney;
                        item.transferLogData = {
                            fromDoctypeId: 0,
                            fromDocId: page.query.data.saleOrderId,
                            fromDocDetailId: value.saleDetailId
                        };
                        vm.request.detailList.push(item);
                    });
                } else {
                    this.request.sponsorId = xunSoft.user.userId();
                    this.request.accountId = vm.response.accounts[0].accountId;
                    this.request.customerId = vm.response.customers[0].companyId;
                    this.request.userId = vm.response.users[0].userId;
                }

            },
            //销售导入
            import: function() {
                mainView.router.load({
                    url: 'saleBatch/deliverOrder/saleList.ios.html',
                    query: {
                        detailList: vm.request.detailList,
                        editPage: 'saleBatch/deliverOrder/add.ios.html'
                    }
                })

            },
            //回退
            back: function() {
                if (vm.request.detailList.length > 0) {
                    eShop.confirm('单据已经有货品信息了,您确认退出吗？', function() {
                        mainView.router.back();
                    });
                } else {
                    mainView.router.back();
                }
            },
            //选择货品的回调
            selectKind: function(responseData) {
                vm.request.detailList = [];
                _.each(responseData, function(item) {
                    item.deliverAmount = item.Amount;
                    if (item.priceList && !item.Price) {
                        item.salePrice = _.find(item.priceList, function(item) { return item.itemKey == 'sale-price'; }).value;
                    } else {
                        item.salePrice = item.Price;
                    }
                    item.deliverMoney = item.deliverAmount * item.wholesalePrice;
                    item = _.omit(item, "Amount", "Price", "priceList");
                    vm.request.detailList.push(item);
                });
            },
            //编辑货品
            editKind: function(kind) {
                mainView.router.load({
                    url: "saleBatch/deliverOrder/editKindPrice.ios.html",
                    query: {
                        kind: kind,
                        request: vm.request.detailList,
                    }
                });
            },
            //保存
            save: function() {

                if (vm.request.customerId == 0) {
                    xunSoft.helper.showMessage('请选择客户信息');
                    return;
                }

                if (vm.request.advanceMoney > 0 && vm.request.accountId == 0) {
                    xunSoft.helper.showMessage('请选择本次收款的结算账户');
                    return;
                }

                if (vm.request.detailList.length == 0) {
                    xunSoft.helper.showMessage('请至少选择一件货品');
                    return;
                }
                if (vm.request.sponsorId == "") {
                    xunSoft.helper.showMessage('经手人不能为空!');
                    return;
                }

                //处理数据获取请求信息
                var request = {
                    data: _.omit(vm.request, 'detailList')
                };
                request.data.detailList = [];
                _.each(vm.request.detailList, function(item) {
                    var newKind = _.omit(item, 'kind');
                    request.data.detailList.push(newKind);
                });

                //保存
                saleService.post.postDeliverOrder(request, {}, function() {
                    vm.request.detailList = [];
                    xunSoft.helper.showMessage('出货单保存成功！');
                });
            }
        }
    });

    vm.init();
});
//编辑货品信息
eShop.onPageInit('saleBatch_deliverOrder_editKind', function(page) {
    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                kindId: '',
                colorId: [],
                sizeId: [],
                unitId: 0,
                salePrice: 0,
                deliverAmount: 1,
                wholesalePrice: 0,
                discountRate: 100,
                deliverMoney: 0,
                kind: null
            },
            response: {
                kindDetail: {},
                selectedKind: []
            }
        },
        methods: {
            init: function() {
                this.loadKind();
            },
            loadKind: function() {
                //请求数据
                var request = {
                        id: page.query.kindId
                    }
                    //获取商品信息
                kindService.get.getKindDetail(request, {}, function(responseData) {
                    //设置货品信息
                    vm.response.kindDetail = responseData.data;

                    var kindInfo = kindService.utility.parseKind(responseData.data);
                    _.extend(vm.request, kindInfo);
                });
            },
            //保存货品
            saveKind: function() {
                //检查基本信息
                var vs = vm.request.colorId.length;
                if (vm.request.colorId.length == 0) {
                    xunSoft.helper.showMessage('请至少选择一种颜色');
                    return;
                }
                if (vm.request.sizeId.length == 0) {
                    xunSoft.helper.showMessage('请至少选择一种尺码');
                    return;
                }
                if (vm.request.wholesalePrice <= 0 || vm.request.wholesalePrice > 999999) {
                    xunSoft.helper.showMessage('请输入合理的销售价！');
                    return;
                }
                if (vm.request.deliverAmount <= 0 || vm.request.deliverAmount > 999999) {
                    xunSoft.helper.showMessage("请输入合理的数量!");
                    return;
                }
                //检查基本信息
                if (!saleService.utility.deliverCalculate(vm.request, true)) {
                    return;
                }

                //用户选择的颜色尺码组合
                var newKinds = [];
                //遍历颜色
                _.each(vm.request.colorId, function(colorId) {

                    var colorInfo = _.find(vm.response.kindDetail.colorList, function(item) { return item.colorId == colorId; });

                    //遍历尺码
                    _.each(vm.request.sizeId, function(sizeId) {

                        var sizeInfo = _.find(vm.response.kindDetail.sizeList, function(item) { return item.sizeId == sizeId; });

                        //获取新的货品信息
                        var newKind = _.omit(vm.request, 'colorId', 'sizeId', 'kind');
                        newKind.sizeId = sizeId;
                        newKind.colorId = colorId;
                        newKind.kind = _.clone(vm.request.kind);
                        newKind.kind.colorName = colorInfo.colorName;
                        newKind.kind.sizeText = sizeInfo.sizeText;
                        newKinds.push(newKind);
                    })

                });

                if (page.query.detailList) {
                    //添加新的货品信息
                    _.each(newKinds, function(newKind) {
                        //检查货品是否已经存在
                        var kindInfo = _.find(page.query.detailList, function(item) {
                            return item.kindId == newKind.kindId &&
                                item.sizeId == newKind.sizeId &&
                                item.colorId == newKind.colorId;
                        });
                        if (!kindInfo) {
                            //追加货品信息
                            page.query.detailList.push(newKind);
                        } else {
                            //更新已有的货品信息
                            _.extend(kindInfo, newKind);
                        }
                    });
                    vm.request.sizeId = [];
                    vm.request.colorId = [];
                    xunSoft.helper.showMessage("货品信息处理成功!");
                    this.calculateKind();
                } else {
                    xunSoft.helper.showMessage("无法添加货品信息", '警告');
                    mainView.router.back();
                }
            },
            //计算价格信息
            calculate: function() {
                var requestInfo = this.request;
                saleService.utility.deliverCalculate(requestInfo);
            },
            //计算已经选择的货品信息
            calculateKind: function() {
                if (_.isArray(page.query.detailList)) {
                    vm.response.selectedKind = [];
                    _.each(page.query.detailList, function(item) {
                        console.log(item);
                        if (item.kindId == page.query.kindId) {
                            vm.response.selectedKind.push(item);
                        }
                    });
                }
            }
        }
    });

    vm.init();
})

//编辑货品价格
eShop.onPageInit('saleBatch_deliverOrder_editKindPrice', function(page) {
    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                salePrice: 0,
                wholesalePrice: 0,
                deliverAmount: 0,
                deliverMoney: 0,
                discountRate: 100,
                description: '',
            },
            kind: '',
            detailList: ''
        },

        methods: {
            init: function() {
                if (page.query.kind) {
                    page.query.kind.wholesalePrice = page.query.kind.wholesalePrice;
                    _.extend(vm.request, _.omit(page.query.kind, 'kind'))
                    vm.kind = page.query.kind;
                    vm.detailList = page.query.request.detailList;
                }
            },
            delete: function(kind) {
                if (!kind.deliverDetailId) {
                    page.query.request.$remove(kind);
                    mainView.router.back();
                }
                if (_.isEmpty(page.query.request.deletedIDs)) {

                    page.query.request.deletedIDs += kind.deliverDetailId;
                } else {
                    page.query.request.deletedIDs += (',' + kind.deliverDetailId);
                }
                mainView.router.back();
            },
            //保存货品
            saveKind: function() {
                if (vm.request.wholesalePrice <= 0 || vm.request.wholesalePrice > 999999) {
                    xunSoft.helper.showMessage('请输入合理的销售价！');
                    return;
                }
                if (vm.request.deliverAmount <= 0 || vm.request.deliverAmount > 999999) {
                    xunSoft.helper.showMessage("请输入合理的数量!");
                    return;
                }
                if (!saleService.utility.deliverCalculate(vm.request, true)) {
                    return;
                }
                if (page.query.kind) {
                    _.extend(page.query.kind, vm.request)
                }
                if (page.query.detailList) {
                    _.extend(page.query.request.detailList, vm.detailList);

                }
                mainView.router.back();
            },
            //计算价格信息
            calculate: function() {
                var requestInfo = this.request;
                saleService.utility.deliverCalculate(requestInfo, true);
            }
        }
    });

    vm.init();
});


//货品修改
eShop.onPageInit('saleBatch_deliverOrder_update', function(page) {
    var pageDiv = $$(page.container);

    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                customerId: 0,
                userId: 0,
                deliverDate: '',
                sponsorId: 0,
                accountId: 0,
                advanceMoney: 0,
                description: '',
                detailList: [],
                //删除货品列表
                deletedIDs: ''
            },
            response: {
                customers: baseInfoService.customers,
                users: baseInfoService.users,
                accounts: baseInfoService.accounts
            }
        },

        watch: {
            "request.customerId": function(val, oldVal) {
                xunSoft.event.smartSelect("#customerId");
            },
            "request.accountId": function(val, oldVal) {
                xunSoft.event.smartSelect("#accountId");
            },
            "request.sponsorId": function(val, oldVal) {
                xunSoft.event.smartSelect("#userId");
            }
        },
        methods: {
            init: function() {
                eShop.calendar({
                    input: pageDiv.find("#deliverDate"),
                    minDate: new Date()
                });
                this.loadDeliverOrder();
                this.request.sponsorId = xunSoft.user.userId();
                this.request.userId = xunSoft.user.userId();
                this.request.TenantId = xunSoft.user.tenantId();
            },
            loadDeliverOrder: function() {
                if (page.query.deliverOrderId) {
                    var request = {
                        id: page.query.deliverOrderId
                    };
                    saleService.get.getDeliverOrderDetail(request, {}, function(responseData) {
                        //扩展数据
                        _.extendOwn(vm.request, _.omit(responseData.data, 'detailList', 'deletedIDs'));

                        //获取货品明细
                        _.each(responseData.data.detailList, function(item) {
                            //过滤货品信息
                            var newKind = _.pick(item, 'deliverDetailId', 'kindId', 'colorName', 'kindName', 'sizeText', 'brandName', 'unitId', 'colorId', 'deliverPrice', 'sizeId', 'salePrice', 'wholesalePrice', 'deliverAmount', 'deliverMoney', 'discountRate', 'description', 'tenantId');
                            newKind.kind = _.pick(item, 'kindId', 'kindName', 'kindClassName', 'kindNo', 'brandName', 'unitName', 'colorName', 'sizeText');
                            vm.request.detailList.push(newKind);
                        });
                    });
                } else {
                    mainView.router.back();
                }
            },

            //选择货品的回调
            selectKind: function(responseData) {
                vm.request.detailList = [];
                _.each(responseData, function(item) {
                    item.deliverAmount = item.Amount;
                    if (item.priceList && !item.Price) {
                        item.salePrice = _.find(item.priceList, function(item) { return item.itemKey == 'sale-price'; }).value;
                    } else {
                        item.deliverPrice = item.Price;
                    }
                    item.deliverMoney = item.deliverAmount * item.salePrice;
                    item = _.omit(item, "Amount", "Price", "priceList");
                    vm.request.detailList.push(item);
                });
                console.log(vm.request.detailList);
            },
            //编辑货品
            editKind: function(kind) {
                mainView.router.load({
                    url: "saleBatch/deliverOrder/editKindPrice.ios.html",
                    query: {
                        kind: kind,
                        request: vm.request
                    }
                });
            },
            //保存
            save: function() {
                if (vm.request.customerId == 0) {
                    xunSoft.helper.showMessage('请选择客户信息');
                    return;
                }

                if (vm.request.advanceMoney > 0 && vm.request.accountId == 0) {
                    xunSoft.helper.showMessage('请选择本次收款的结算账户');
                    return;
                }

                if (vm.request.detailList.length == 0) {
                    xunSoft.helper.showMessage('请至少选择一件货品');
                    return;
                }
                if (vm.request.sponsorId == "") {
                    xunSoft.helper.showMessage('经手人不能为空!');
                    return;
                }


                //处理数据获取请求信息
                var request = {
                    data: _.omit(vm.request, 'detailList')
                };
                request.data.detailList = [];
                _.each(vm.request.detailList, function(item) {
                    var newKind = _.omit(item, 'kind');
                    request.data.detailList.push(newKind);
                });

                //保存
                saleService.put.putDeliverOrder(request, {}, function() {
                    xunSoft.helper.showMessage('出货单修改成功！');
                    mainView.router.back();
                    if (_.isFunction(page.query.callback)) {
                        page.query.callback();
                    }
                });
            }
        }
    });

    vm.init();
});

//从销售订单录入处货单
eShop.onPageInit('saleBatch_deliverOrder_salelist', function(page) {
    var pageDiv = $$(page.container);
    var vm = new Vue({
        el: page.container,
        data: {
            request: {
                orderNo: '',
                orderId: '',
                orderTypeId: 4 //销售订单
            },
            response: {
                data: [],
                kinds: []
            }
        },
        methods: {
            init: function() {
                //加载数据
                this.loadOrderList();
            },
            //选择销售订单号
            slectOrder: function(item) {
                if (vm.request.orderId != item.orderId) {
                    var selectedItem = _.find(vm.response.data, function(orderData) { return orderData.isActive; });
                    if (selectedItem) {
                        selectedItem.isActive = false;
                    }
                    item.isActive = true;
                    vm.request.orderId = item.orderId;
                    this.loadOrderDetail();
                }
            },
            //获取单号列表
            loadOrderList: function() {
                vm.response.data = [];
                var request = {
                    query: vm.request
                };
                //获取数据  
                transferService.get.getTransferOrderList(request, {}, function(responseData) {
                    if (_.isArray(responseData.data)) {
                        _.each(responseData.data, function(item) {
                            var newOrderData = _.pick(item, 'orderId', 'orderNo', 'purchaseAmount');
                            newOrderData.isActive = false;
                            newOrderData.userLogo = xunSoft.ajax.serviceBase() +
                                "Shop/User/OrderUser/0/" + xunSoft.user.userId() + "/" + item.orderId;
                            vm.response.data.push(newOrderData);

                        });
                    }
                });
            },
            //加载销售订单
            loadOrderDetail: function() {
                vm.response.kinds = [];
                var request = {
                    query: vm.request
                };
                //获取单据信息
                transferService.get.getTransferOrderDetail(request, {}, function(responseData) {
                    if (_.isArray(responseData.data.detailList)) {
                        _.each(responseData.data.detailList, function(item) {
                            var newKind = _.pick(item, 'kindId', 'colorId', 'sizeId', 'unitId', 'transferId', 'originQty', 'transferQty1');
                            newKind.deliverAmount = parseInt(item.transferQty2) || 0;
                            newKind.deliverMoney = 0;
                            newKind.discountRate = 100;
                            newKind.taxRate = 0;
                            newKind.taxMoney = 0;
                            newKind.description = "";
                            newKind.isChecked = true;

                            //查找货品信息
                            var kindInfo = _.find(responseData.data.kindList, function(kind) { return kind.kindId == newKind.kindId; });
                            if (kindInfo) {
                                newKind.deliverPrice = item.price2
                                newKind.wholesalePrice = item.price1
                                newKind.deliverMoney = newKind.deliverAmount * newKind.wholesalePrice;

                            }

                            newKind.kind = _.pick(item, 'kindId', 'brandName', 'kindName', 'kindNo', 'colorName', 'sizeText');
                            vm.response.kinds.push(newKind);
                            console.log(newKind);

                        });
                    }

                });
            },
            //保存选择信息
            save: function() {
                if (_.isArray(page.query.detailList)) {
                    _.each(vm.response.kinds, function(kind) {
                        if (kind.isChecked) {
                            page.query.detailList.push(_.omit(kind, 'isChecked'));
                        }
                    });
                }
                mainView.router.back();
            },
            //检查输入
            checkInput: function() {

                var requestInfo = this.request;

                if (requestInfo.receivePrice > 999999 || requestInfo.receivePrice < 0) {
                    xunSoft.helper.showMessage('请输入合理的出货单价');
                    return false;
                }
                if (requestInfo.receiveAmount > 999999 || requestInfo.receiveAmount < 0) {
                    xunSoft.helper.showMessage('请输入合理的出货数量');
                    return false;
                }
                if (requestInfo.taxRate > 100 || requestInfo.taxRate < 0) {
                    xunSoft.helper.showMessage('请输入合理的出货税率');
                    return false;
                }

                return true;
            }
        }
    });
    vm.init();
})