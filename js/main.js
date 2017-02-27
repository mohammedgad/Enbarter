var prerender = false;
var rootS;
Raven.config('https://22c41b4449c04f2f9678babd3400566c@sentry.io/118691').install();
window.prerenderReady = false;
String.prototype.paddingLeft = function (paddingValue) {
    return String(paddingValue + this).slice(-paddingValue.length);
};

var app = angular.module("BarterApp", ["ngRoute", 'ngSanitize']);
app.config(function ($routeProvider, $locationProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "views/indexContent.html"
        }).when("/browse", {
        templateUrl: "views/browse.html"
    }).when("/browse/:id", {
        templateUrl: "views/browse.html"
    }).when("/barter/:id", {
        templateUrl: "views/barter.html"
    }).when("/create_barter", {
        templateUrl: "views/create_barter.html"
    }).when("/dashboard", {
        templateUrl: "views/viewDashboard.html"
    }).when("/dashboard/barter/:id", {
        templateUrl: "views/barterDashboard.html"
    }).when("/profile/edit", {
        templateUrl: "views/editProfile.html"
    }).when("/profile/:id", {
        templateUrl: "views/viewProfile.html"
    }).when("/profile", {
        templateUrl: "views/viewProfile.html"
    }).when("/notifications", {
        templateUrl: "views/notifications.html"
    }).when("/prices", {
        templateUrl: "views/prices.html"
    }).otherwise({
        templateUrl: "views/404.html"
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});

app.run(function ($rootScope, $location) {
    Parse.initialize("EnbarterApp", "Ad06@!30");
    Parse.serverURL = 'https://api.enbarterdev.ml/v1';
    rootS = $rootScope;
    $rootScope.title = 'Enbarter';
    $rootScope.description = "Enbarter is an online skill-exchange platform, driven by the oldest form of doing business: bartering. A barter is a system of exchange where goods or services are directly exchanged for other goods or services without an intermediary medium of exchange, mainly money.";
    $rootScope.keywords = "Enbarter,Barter,Bartering,Skills,Exchange,Entrepreneur,Service,Help,Direct,Professional,Free,Business";
    $rootScope.statusCode = 200;
    $rootScope.isLoggedIn = function () {
        if (Parse.User.current())
            return true;
        return false;
    }
    if (Parse.User.current())
        $rootScope.userId = Parse.User.current().id;
    $rootScope.addItemTo = function (list, item) {
        if (item && list.indexOf(item) == -1)
            list.push(item);
        return item = '';
    }
    $rootScope.removeItemFrom = function (list, item) {
        var index = list.indexOf(item);
        if (index > -1) {
            list.splice(index, 1);
        }
    }

    if ($location.search()['_escaped_fragment_'] && $location.search()['_escaped_fragment_'].length > 0 && $location.path() == '/' && $location.path() != $location.search()['_escaped_fragment_']) {
        $location.path($location.search()['_escaped_fragment_']);
        prerender = true;
    }

    $rootScope.notificationCheck = function (notification) {
        if (notification.get('read')) {
            if (notification.get('redirect') == $location.path())
                location.reload();
            else
                $location.path(notification.get('redirect'));
            return;
        }
        notification.set("read", true);
        $rootScope.nCount--;
        notification.save({
            success: function (results) {
                if (results.get('redirect') == $location.path())
                    location.reload();
                else
                    $location.path(results.get('redirect'));
                $rootScope.$apply();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    }

    $rootScope.$on('$locationChangeStart', function (event) {
        if (prerender)
            prerender = false;

        showSpinner();
        $("html, body").stop().animate({scrollTop: 0}, '100', 'swing');

    });

    $rootScope.$on('$routeChangeSuccess', function (event) {
        $rootScope.statusCode = 200;
        $rootScope.currentUrl = window.location.href || document.URL;
    });

    $rootScope.initFBLogin = function () {
        if (typeof FB === 'undefined') {
            showSpinner();
            $.ajax({
                type: "GET",
                url: "https://connect.facebook.net/en_US/all.js",
                success: function () {
                    $(this).attr('id', 'facebook-jssdk');
                    Parse.FacebookUtils.init({
                        appId: '1394780183887567',
                        status: false,
                        cookie: true,
                        xfbml: true
                    });
                    hideSpinner();
                },
                dataType: "script",
                cache: true
            });
        }
    }
});
app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    }
});
app.controller('header', function ($scope, $location, $rootScope, $sce) {
    $rootScope.alertModal = function (message) {
        $scope.alertMessage = message;
        $scope.$apply();
        $('#alertModal').modal();
    }

    $scope.homeLink = "/";
    $scope.browseLink = "/browse";
    $scope.createBarterLink = "/create_barter";
    $scope.dashboardLink = "/dashboard";
    $rootScope.currentUrl = window.location.href || document.URL;

    $scope.fbLogin = function () {
        showSpinner();
        Parse.FacebookUtils.logIn(null, {
            success: function (user) {
                if (!user.existed()) {
                    FB.api('/me', 'get', {
                        access_token: user.get('authData').access_token,
                        fields: 'id,name'
                    }, function (response) {
                        if (!response.error) {
                            toDataUrl("https://graph.facebook.com/" + response.id + "/picture?type=large", function (result) {
                                user.set("username", response.name);
                                user.set("pic", new Parse.File("pic.jpg", {base64: result.toString('base64')}));
                                user.save(null, {
                                    success: function (user) {
                                        location.reload();
                                    },
                                    error: function (user, error) {
                                        hideSpinner();
                                        $rootScope.alertModal("Oops, something went wrong saving your name.");
                                    }
                                });
                            });
                        } else {
                            hideSpinner();
                            $rootScope.alertModal("Oops something went wrong with facebook.");
                        }
                    });
                } else
                    location.reload();
            },
            error: function (user, error) {
                hideSpinner();
                $rootScope.alertModal("User cancelled the Facebook login or did not fully authorize.");
            }
        });
    }
    $scope.login = function () {
        if (!$scope.username || !$scope.password) {
            $rootScope.alertModal("Username/Password are required!");
            return;
        }
        showSpinner();
        Parse.User.logIn($scope.username.toLowerCase(), $scope.password, {
            success: function (user) {
                location.reload();
                hideSpinner();
            },
            error: function (user, error) {
                errorHandler($rootScope, error);
            }
        });
    }

    $scope.signup = function () {
        if (!$scope.username || !$scope.password || !$scope.email) {
            $rootScope.alertModal("Username/Password/Email are required!");
            return;
        }
        var user = new Parse.User();
        user.set("username", $scope.username.toLowerCase());
        user.set("password", $scope.password);
        user.set("email", $scope.email.toLowerCase());
        showSpinner();
        user.signUp(null, {
            success: function (user) {
                location.reload();
                hideSpinner();
            },
            error: function (user, error) {
                errorHandler($rootScope, error);
            }
        });
    }

    $scope.logout = function () {
        showSpinner();
        Parse.User.logOut().then(function () {
            location.href = "/";
            location.reload();
            hideSpinner();
        });
    }

    $scope.passwordReset = function () {
        var email = prompt("Enter Email");
        if (email) {
            showSpinner();
            Parse.User.requestPasswordReset(email.toLowerCase(), {
                success: function () {
                    $rootScope.alertModal("Request sent");
                    hideSpinner();
                },
                error: function (object, error) {
                    errorHandler($rootScope, error);
                }
            });
        } else $rootScope.alertModal('Email is required');
    }

    if (Parse.User.current()) {
        var Notification = Parse.Object.extend('Notification');
        var query = new Parse.Query(Notification);
        query.equalTo("user", Parse.User.current());
        query.descending("createdAt");
        query.limit(10);
        query.find({
            success: function (results) {
                $scope.notifications = results || [];
                $rootScope.nCount = results.filter(function (x) {
                    if (!x.get('read'))
                        return true;
                    return false;
                }).length;
                $scope.$apply();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });

        var subscription = query.subscribe();
        subscription.on('create', function (object) {
            $rootScope.nCount++;
            $scope.notifications.unshift(object);
            $scope.$apply();
            (new Audio('beeb.mp3')).play();
        });
    }

    $('.navbar-collapse a:not(#dontClose),.navbar-collapse button').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
});


app.controller('createBarter', function ($scope, $rootScope) {
    $scope.milestones = [];
    $rootScope.title = "Enbarter | Create Barter";
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
        hideSpinner();
    });
    if (!Parse.User.current()) {
        $rootScope.alertModal("Please Login to be able to create a new barter!");
    }
    $scope.startBarter = function () {
        if (!Parse.User.current()) {
            $rootScope.alertModal("Not loggedIn");
            return;
        }
        if (!$scope.milestones || !$scope.milestones.length) {
            $rootScope.alertModal('Milestones are required!');
            return;
        }
        var required = ['barterTitle1', 'barterTitle2', 'offerCategory', 'offerDeadline', 'seekCategory', 'seekDeadline'];
        var errors = "";
        for (var i = 0; i < required.length; i++) {
            if (!$scope[required[i]])
                errors += required[i] + "/";
        }
        if (errors.length) {
            $rootScope.alertModal("[" + errors + "] is/are Required");
            return;
        }

        $scope.canStartDisabled = true;
        var Barter = Parse.Object.extend("Barter");
        var Category = Parse.Object.extend("Category");
        var barter = new Barter();

        barter.set("barterTitle", $scope.barterTitle1 + " For " + $scope.barterTitle2);
        barter.set("offerCategory", $scope.categories[$scope.offerCategory]);
        barter.set("offerDescription", $('#offerDescription').summernote('code'));
        var milestones = [];
        for (var i = 0; i < $scope.milestones.length; i++) {
            milestones.push({checked: false, task: $scope.milestones[i]});
        }
        barter.set("offerMilestones", milestones);
        barter.set("offerDeadline", $scope.offerDeadline);
        barter.set("seekCategory", $scope.categories[$scope.seekCategory]);
        barter.set("seekDescription", $('#seekDescription').summernote('code'));
        barter.set("seekDeadline", $scope.seekDeadline);
        barter.set("user", Parse.User.current());
        var text = $('#offerDescription').summernote('code').replace(/(<([^>]+)>)/ig, "") + " " + $('#seekDescription').summernote('code').replace(/(<([^>]+)>)/ig, "");
        barter.set('barterDescription', text);
        text += ' ' + barter.get('barterTitle');
        var words = text.split(" ");
        barter.set("words", new Set(words));
        barter.set("state", "new");

        showSpinner();
        barter.save(null, {
            success: function (barter) {
                window.location.href = "/barter/" + barter.id;
                hideSpinner();
            },
            error: function (barter, error) {
                errorHandler($rootScope, error);
                $scope.canStartDisabled = false;
                $scope.$apply();
            }
        });

    }
});


function getCategories(successCallback) {
    var query = new Parse.Query(Parse.Object.extend("Category"));

    query.find({
        success: function (results) {
            successCallback(results);
        },
        error: function (object, error) {
            errorHandler($rootScope, error);
        }
    });

}
app.controller('browseCtrl', function ($rootScope, $scope, $routeParams, $location) {
    $rootScope.title = "Enbarter | Browse";
    $rootScope.description += " | Browse Barters";
    $rootScope.keywords += " ,browse,search,find";

    $scope.offerCat = 'all';
    $scope.seekCat = 'all';
    $scope.barterState = 'new';
    var skip = 0;
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
        if ($routeParams.id) {
            $scope.seekCat = $routeParams.id;
            $scope.search();
        } else
            hideSpinner();
    });

    var Category = Parse.Object.extend("Category");
    var query;
    $scope.search = function () {
        showSpinner();
        skip = 0;
        query = new Parse.Query(Parse.Object.extend("Barter"));
        query.include('seekCategory');
        query.include('offerCategory');
        query.include('user');
        if ($scope.seekCat && $scope.seekCat != 'all')
            query.equalTo("seekCategory", Category.createWithoutData($scope.seekCat));
        if ($scope.offerCat && $scope.offerCat != 'all')
            query.equalTo("offerCategory", Category.createWithoutData($scope.offerCat));
        if ($scope.barterState && $scope.barterState != 'all')
            query.equalTo("state", $scope.barterState);
        if ($scope.query)
            query.containsAll("words", $scope.query.split(" "));
        query.limit(10);
        query.descending("createdAt");

        query.find({
            success: function (results) {
                $scope.results = results;
                if (results.length > 9)
                    $scope.showLoadMore = true;
                $scope.$apply();
                hideSpinner();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    }

    $scope.loadMore = function () {
        skip++;
        query.skip(skip * 10);
        showSpinner();
        query.find({
            success: function (results) {
                if (results.length) {
                    $scope.results = $scope.results.concat(results);
                }
                if (results.length < 10)
                    $scope.showLoadMore = false;
                $scope.$apply();
                hideSpinner();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    }
});

app.controller('barterCtrl', function ($scope, $location, $rootScope, $routeParams, $sce) {
    $scope.result = null;
    $scope.milestones = [];
    var Barter = Parse.Object.extend("Barter");
    var query = new Parse.Query(Barter);
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
    query.include('barterUpUser');
    query.include('barterRequests.user');


    query.get($routeParams.id, {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = "Enbarter | " + result.get("barterTitle");
            $rootScope.description = result.get("barterDescription");
            $rootScope.keywords = result.get("words").join(",");
            $scope.barterRequests = angularCopy((result.get('barterRequests')) ? result.get('barterRequests') : []);
            $scope.$apply();
            hideSpinner();

        },
        error: function (object, error) {
            if ($location.path().includes("/barter"))
                $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });

    $scope.sameAccount = function () {
        if (Parse.User.current() && $scope.result && $scope.result.get('user').id == Parse.User.current().id)
            return true;
        return false;
    }

    $scope.disable = function () {
        var result = angularCopy($scope.result);
        if (result) {
            result.set("state", "disabled");
            showSpinner();
            result.save({
                success: function (results) {
                    $scope.result = results;
                    $scope.$apply();
                    hideSpinner();
                },
                error: function (object, error) {
                    errorHandler($rootScope, error);
                }
            });
        }
    }

    $scope.barterUpRequest = function () {
        if (!$scope.milestones || !$scope.milestones.length) {
            $rootScope.alertModal('Milestones are required!');
            return;
        }
        var milestones = [];
        for (var i = 0; i < $scope.milestones.length; i++) {
            milestones.push({checked: false, task: $scope.milestones[i]});
        }
        var request = {
            deadline: $scope.deadline,
            milestone: milestones,
            user: Parse.User.current()
        };
        var result = angularCopy($scope.result);
        var barterRequests = result.get('barterRequests');
        result.add("barterRequests", request);
        showSpinner();
        result.save({
            success: function (results) {
                var relation = Parse.User.current().relation("barterRequests");
                relation.add(results);
                Parse.User.current().save({
                    success: function () {
                        $scope.result = results;
                        $scope.barterRequests.push(angularCopy(request));
                        $scope.$apply();
                        hideSpinner();
                    },
                    error: function (object, error) {
                        errorHandler($rootScope, error);
                    }
                });
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
                result.set('barterRequests', angularCopy(barterRequests));
                $scope.$apply();
            }
        });
    }

    $scope.bartered = function () {
        if ($scope.result) {
            var barterRequests = $scope.result.get('barterRequests');
            if (barterRequests)
                for (var i = 0; i < barterRequests.length; i++)
                    if (Parse.User.current() && barterRequests[i].user.id == Parse.User.current().id)
                        return true;
        }
        return false;
    }

    $scope.showMilestones = function (milestones, offer, index) {
        $scope.barterMilestones = angularCopy(milestones);
        $scope.milestonesOffer = offer;
        $scope.milestonesOfferIndex = index;
    }

    $scope.barterUpOwner = function (request, index) {
        var result = angularCopy($scope.result);

        var BarterDashboard = Parse.Object.extend("BarterDashboard");
        var barterDashboard = new BarterDashboard();
        barterDashboard.set("barterUpUser", {
            "__type": "Pointer", "className": "_User",
            "objectId": request.user.id || request.user.objectId
        });
        barterDashboard.set("barterUpMilestones", request.milestone);
        barterDashboard.set("barterUpDeadline", request.deadline);
        barterDashboard.set('user', result.get('user'));
        barterDashboard.set('barter', result);
        barterDashboard.set('offerMilestones', result.get('offerMilestones'));
        barterDashboard.set('offerDeadline', result.get('offerDeadline'));
        showSpinner();
        barterDashboard.save({
            success: function (results) {
                result.set("barterUpUser", {
                    "__type": "Pointer", "className": "_User",
                    "objectId": request.user.id || request.user.objectId
                });
                result.set("barterUpMilestones", request.milestone);
                result.set("barterUpDeadline", request.deadline);
                result.set("state", "bartered");
                result.set('barterDashboard', results);
                result.save({
                    success: function (results) {
                        $scope.result = angularCopy(results);
                        $scope.barterRequests.splice(index, 1);
                        $scope.$apply();
                        hideSpinner();
                    },
                    error: function (object, error) {
                        errorHandler($rootScope, error);
                    }
                });
            }, error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });


    }

    $scope.reportBarter = function () {
        var Report = Parse.Object.extend("ReportBarter");
        var report = new Report();
        report.set("user", Parse.User.current());
        report.set("description", $scope.reportDescription);
        report.set("barter", $scope.result);
        showSpinner();
        report.save({
            success: function (results) {
                $rootScope.alertModal("Thank You");
                hideSpinner();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    }
});


app.controller('indexCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.catSoft = "/browse/0NFJVql0U9";
    $scope.catWrite = "/browse/zSBhtFd8ZE";
    $scope.catMedia = "/browse/Wb8uqGgkdG";
    $scope.catData = "/browse/4TtjWA9W5e";
    $scope.catMarket = "/browse/7lY1lEwRny";
    $scope.catOther = "/browse/U8MCGz0C2B";
    $rootScope.title = 'Enbarter';
    $rootScope.description = "Enbarter is an online skill-exchange platform, driven by the oldest form of doing business: bartering. A barter is a system of exchange where goods or services are directly exchanged for other goods or services without an intermediary medium of exchange, mainly money.";
    $rootScope.keywords = "Enbarter,Barter,Bartering,Skills,Exchange,Entrepreneur,Service,Help,Direct,Professional,Free,Business";


    var query = new Parse.Query(Parse.Object.extend("Barter"));
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
    query.descending("createdAt");
    query.limit(5);

    query.find({
        success: function (results) {
            $scope.barters = results;
            $scope.$apply();
            hideSpinner();
        },
        error: function (object, error) {
            errorHandler($rootScope, error);
        }
    });
});

app.controller('barterDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    $scope.messages = [];
    $scope.offerMilestones = [];
    var Barter = Parse.Object.extend("Barter");
    var Chat = Parse.Object.extend("Chat");
    var BarterDashboard = Parse.Object.extend("BarterDashboard");
    $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
        if (!$('#messageBox').is(":hover"))
            $("#messageBox").animate({scrollTop: document.getElementById('messageBox').scrollHeight}, 600);
    });
    $scope.reloadChat = function () {
        var query = new Parse.Query(Chat);
        query.include("user");
        query.equalTo("BarterDashboard", $scope.result);

        query.find({
            success: function (results) {
                $scope.messages = results;
                $scope.$apply();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });

        var subscription = query.subscribe();
        subscription.on('create', function (object) {
            $scope.messages.push(object);
            $scope.$apply();
            if (object.get('user').id != Parse.User.current().id)
                (new Audio('beeb.mp3')).play();
        });

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            subscription.unsubscribe();
        });
    };

    var query = new Parse.Query(BarterDashboard);
    query.include('barter');
    query.include('barter.seekCategory');
    query.include('barter.offerCategory');
    query.include('user');
    query.include('barterUpUser');
    query.equalTo("barter", {__type: "Pointer", className: "Barter", objectId: $routeParams.id});

    query.find({
        success: function (results) {
            if (results[0]) {
                result = results[0];
                if (!result.get('barterUpUser') && Parse.User.current().id != result.get('user').id) {
                    // alert("Dashboard can't be accessed because there is no barter user");
                    window.location.href = "/barter/" + result.id;
                    return;
                }
                if (!Parse.User.current() || (Parse.User.current().id != result.get('user').id && Parse.User.current().id != result.get('barterUpUser').id)) {
                    $location.path('/');
                    $scope.$apply();
                    return;
                }

                if (!result.get('barterUpMilestones') || !result.get('offerMilestones') || !result.get('barterUpMilestones').length || !result.get('offerMilestones').length) {
                    // alert("Dashboard can't be accessed because there is no Milestones");
                    window.location.href = "/barter/" + result.id;
                    return;
                }
                $scope.result = result;
                $rootScope.title = "Enabrter | Dashboard";
                $scope.offerMilestones = angularCopy(result.get('offerMilestones'));
                $scope.barterUpMilestones = angularCopy(result.get('barterUpMilestones'));

                $scope.$apply();
                $scope.reloadChat();
                if ($scope.result.get('barter').get('state') != 'completed') {
                    var subscription = query.subscribe();
                    subscription.on('update', function (object) {
                        $scope.result = object;
                        $scope.offerMilestones = angularCopy(object.get('offerMilestones'));
                        $scope.barterUpMilestones = angularCopy(object.get('barterUpMilestones'));
                        $scope.$apply();
                    });

                    $rootScope.$on('$locationChangeStart', function (event, next, current) {
                        subscription.unsubscribe();
                    });
                }
                hideSpinner();
            } else {
                $location.path('/NotFound');
                $scope.$apply();
                hideSpinner();
            }
        },
        error: function (object, error) {
            if ($location.path().includes("/dashboard/barter"))
                $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });

    $scope.sendMessage = function () {
        if ($scope.result.get('barter').get('state') != 'completed') {
            $scope.cantSend = true;
            var chat = new Chat();
            chat.set("message", $scope.message);
            chat.set("user", Parse.User.current());
            chat.set("BarterDashboard", $scope.result);
            chat.set("offerUser", $scope.result.get("user"));
            chat.set("barterUpUser", $scope.result.get("barterUpUser"));

            chat.save({
                success: function (results) {
                    $scope.message = "";
                    $scope.cantSend = false;
                    $scope.$apply();
                    $('#messageInput').focus();
                },
                error: function (object, error) {
                    $scope.cantSend = false;
                    $scope.$apply();
                    errorHandler($rootScope, error);
                }
            });
        }
    };
    $scope.checkParse = function (o, column) {
        $scope.checkParseColumn = column;
        $scope.checkParseObject = o;
    };

    $scope.check = function (o, column) {
        var result = angularCopy($scope.result);
        var arr = result.get(column);
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].task == o.task) {
                arr[i].checked = true;
                arr[i].date = new Date();
                arr[i].comment = $scope.comment;
                fileUploadControl = $("#formInput25675")[0];
                if (fileUploadControl.files.length > 0) {
                    var file = fileUploadControl.files[0];
                    var name = $("#formInput25675").val().substring(($("#formInput25675").val().indexOf('\\') >= 0 ? $("#formInput25675").val().lastIndexOf('\\') : $("#formInput25675").val().lastIndexOf('/')) + 1);
                    var parseFile = new Parse.File(name, file);
                    arr[i].file = parseFile;
                }
            }
        }
        result.set(column, arr);
        showSpinner();
        result.save({
            success: function (results) {
                $scope[column] = angularCopy(arr);
                $scope.result = results;
                $scope.comment = '';
                $scope.$apply();
                hideSpinner();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    };

    $scope.closeAndRate = function () {
        var result = angularCopy($scope.result.get('barter'));
        var who = (Parse.User.current().id == result.get('user').id) ? "offer" : "barterUp";
        var oppisite = (who == 'offer') ? 'barterUp' : 'offer';
        result.set(who + "Rate", $scope.rate);
        result.set(who + "Review", $scope.review);
        if (result.get(oppisite + "Rate"))
            result.set("state", 'completed');

        showSpinner();
        result.save({
            success: function (results) {
                $scope.result.set('barter', results);
                $scope.$apply();
                hideSpinner();
            },
            error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    };

    $scope.showClose = function (x) {
        var oppisite = (x == 'offer') ? 'barterUp' : 'offer';
        if ($scope.result && ((x == 'offer' && Parse.User.current().id == $scope.result.get('user').id) || (x == 'barterUp' && Parse.User.current().id == $scope.result.get('barterUpUser').id) || ($scope.result.get('barter').get(oppisite + "Rate"))))
            return false;
        if ($scope.result && $scope.result.get(x + 'FinalPic'))
            return true;
        return false;
    }
    $scope.showFinalPic = function (x) {
        var oppisite = (x == 'offer') ? 'barterUp' : 'offer';
        if ($scope.result && ((x == 'offer' && Parse.User.current().id != $scope.result.get('user').id) || (x == 'barterUp' && Parse.User.current().id != $scope.result.get('barterUpUser').id) ))
            return false;
        var arr = [];
        if ($scope.result)
            arr = $scope.result.get(x + 'Milestones') || [];

        for (var i = 0; i < arr.length; i++) {
            if (!arr[i].checked)
                return false;
        }
        if (arr.length && !$scope.result.get(x + 'FinalPic'))
            return true;
        return false;
    }

    $scope.finalPic = function (x) {
        fileUploadControl = $("#" + x + "FinalPic")[0];
        if (fileUploadControl.files.length == 0) {
            $rootScope.alertModal("You must attach a file!");
            return;
        }
        var result = angularCopy($scope.result);
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = $("#" + x + "FinalPic").val().substring(($("#" + x + "FinalPic").val().indexOf('\\') >= 0 ? $("#" + x + "FinalPic").val().lastIndexOf('\\') : $("#" + x + "FinalPic").val().lastIndexOf('/')) + 1);
            var parseFile = new Parse.File(name, file);
            result.set(x + "FinalPic", parseFile);
        }
        showSpinner();
        result.save({
            success: function () {
                hideSpinner();
            }, error: function (object, error) {
                errorHandler($rootScope, error);
            }
        });
    }
    $scope.canCheck = function (x) {
        if (Parse.User.current().id == $scope.result.get(x).id)
            return true;
        return false;
    }
});

function profileWidget(id, $scope, path, callback, lite) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    if (!lite) {
        query.include("barterSeeks");
        query.include('barterSeeks.seekCategory');
        query.include('barterSeeks.offerCategory');
    }
    query.include('membership');
    query.get(id, {
        success: function (result) {
            $scope.result = result;
            var Barter = Parse.Object.extend("Barter");
            var barterQuery = new Parse.Query(Barter);
            barterQuery.equalTo("user", result);
            var barterQuery1 = new Parse.Query(Barter);
            barterQuery1.equalTo("barterUpUser", result);

            var mainQuery = Parse.Query.or(barterQuery, barterQuery1);
            mainQuery.include('seekCategory');
            mainQuery.include('offerCategory');
            mainQuery.include('barterUpUser');
            mainQuery.include('user');
            mainQuery.find({
                success: function (results) {
                    $scope.barters = results;
                    var count = 0;
                    for (var i = 0; i < results.length; i++) {
                        if (results[i].get('state') == 'completed') count++;
                    }
                    $scope.completedBarters = count;
                    $scope.$apply();
                    callback(result);
                }, error: function () {
                    hideSpinner();
                }
            });
        },
        error: function (object, error) {
            if ($location.path().includes(path))
                $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });
}

app.controller('showProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    profileWidget(($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null), $scope, "/profile", function (result) {
        $rootScope.title = "Enbarter | " + result.get('username');
        var relationQuery = result.relation('barterRequests').query();
        relationQuery.include('seekCategory');
        relationQuery.include('offerCategory');
        relationQuery.find({
            success: function (results) {
                $scope.barterRequests = results;
                $scope.$apply();
                hideSpinner();
            }, error: function () {
                hideSpinner();
            }
        });
    });
});

app.controller('editProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    var id = Parse.User.current() ? Parse.User.current().id : null;
    if (!id) {
        $location.path('/');
        $scope.$apply();
    }
    profileWidget(id, $scope, "/profile/edit", function (result) {
        console.log(result);
        $scope.bio = result.get('bio');
        if (result.get('birthday')) {
            $scope.birthday = result.get('birthday').getFullYear().toString().paddingLeft("0000") + '-' + result.get('birthday').getMonth().toString().paddingLeft("00") + '-' + result.get('birthday').getDate().toString().paddingLeft("00");
        }
        $scope.skills = result.get('skills') ? result.get('skills') : [];
        $scope.workLinks = result.get('workLinks') ? result.get('workLinks') : [];
        $rootScope.title = "Enbarter | Edit: " + result.get('username');
        $scope.$apply();
        hideSpinner();
    }, true);

    $scope.submit = function () {
        $scope.cantSubmit = true;
        var result = angularCopy($scope.result);
        result.set("bio", $('#bioText').summernote('code'));
        if ($scope.birthday)
            result.set("birthday", new Date($scope.birthday));
        result.set("skills", $scope.skills);
        result.set("workLinks", $scope.workLinks);
        if ($("#exampleInputFile1")[0].files.length > 0) {
            var parseFile = new Parse.File("photo1.jpg", {base64: document.getElementById('avatarImg').src});
            result.set("pic", parseFile);
        }
        showSpinner();
        result.save({
            success: function (result) {
                location.reload();
                hideSpinner();
            }, error: function (object, error) {
                errorHandler($rootScope, error);
                $scope.cantSubmit = false;
                $scope.$apply();
            }
        });
    }

    $(document).ready(function () {
        $("#exampleInputFile1").change(function () {
            var filesToUpload = document.getElementById('exampleInputFile1').files;
            var file = filesToUpload[0];

            var img = document.createElement("img");
            var reader = new FileReader();
            reader.onload = function (e) {
                img.src = e.target.result;

                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                var MAX_WIDTH = 256;
                var MAX_HEIGHT = 256;
                var width = img.width;
                var height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                document.getElementById('avatarImg').src = canvas.toDataURL("image/png", 0.7);
            }
            reader.readAsDataURL(file);
        });
    });
});

app.controller('viewDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    var id = ($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null);
    if (!id) {
        $location.path('/');
        $scope.$apply();
    }
    profileWidget(id, $scope, "/dashboard", function (results) {
        $rootScope.title = "Enbarter | Dashboard";
        $scope.$apply();
        hideSpinner();
    }, true);

    $scope.dashboardActive = function (barter) {
        if ((barter && barter.get('barterUpUser')) && (Parse.User.current().id == barter.get('user').id || Parse.User.current().id == barter.get('barterUpUser').id))
            return true;

        return false;
    }
});

app.controller('notificationsCtrl', function ($scope, $location, $rootScope, $routeParams) {
    if (!Parse.User.current()) {
        $location.path('/');
        $scope.$apply();
    }
    $rootScope.title = "Enbarter | Notifications";
    profileWidget(Parse.User.current().id, $scope, '/notifications', function (result) {
        var Notification = Parse.Object.extend('Notification');
        var query = new Parse.Query(Notification);
        query.descending("createdAt");
        query.equalTo("user", Parse.User.current());
        query.find({
            success: function (results) {
                $scope.results = results;
                $scope.$apply();
                hideSpinner();
            },
            error: function (object, error) {
                $location.path('/');
                $scope.$apply();
                hideSpinner();
            }
        });
    }, true);
});

app.controller('pricesCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $rootScope.title = 'Enbarter | Prices';
    function getUser() {
        showSpinner();
        var query = new Parse.Query(Parse.User);
        query.include('paymentInfo');
        query.get(Parse.User.current().id, {
            success: function (result) {
                $scope.user = result;
                $scope.$apply();
                hideSpinner();
            }, error: function () {
                hideSpinner();
            }
        });
    }

    if (Parse.User.current()) {
        getUser();
    } else {
        hideSpinner();
    }

    function initPaddle(callback) {
        if (typeof Paddle === 'undefined') {
            showSpinner();
            $.ajax({
                type: "GET",
                url: "https://cdn.paddle.com/paddle/paddle.js",
                success: function () {
                    Paddle.Setup({
                        vendor: 17807,
                        completeDetails: true
                    });
                    hideSpinner();
                    callback();
                },
                dataType: "script",
                cache: true
            });
        } else {
            callback();
        }
    };
    $scope.buyNow = function () {
        initPaddle(function () {
            Paddle.Checkout.open({
                product: 511568,
                email: Parse.User.current().get('email'),
                passthrough: Parse.User.current().id,
                successCallback: function () {
                    getUser();
                    $rootScope.alertModal("Thank you for your payment, The payment may take up to 72 hours to be processed and appear in your account.");
                }
            });
        });
    }

    $scope.openOverride = function (override) {
        initPaddle(function () {
            Paddle.Checkout.open({
                override: override,
                successCallback: function () {
                    getUser();
                }
            });
        });
    }
});


app.controller('notFoundCtrl', function ($scope, $location, $rootScope, $routeParams) {
    hideSpinner();
    $rootScope.title = 'Enbarter | Not Found';
    $rootScope.statusCode = 404;
});


function hideSpinner() {
    $('#divLoading').fadeOut(250, function () {
        $('#divLoading').removeClass('show');
    });
    window.prerenderReady = true;
}

var errorsMap = {
    100: 'It seems like you\'re offline, Please check your internet connection.'
};

function errorHandler($rootScope, error) {
    if (typeof error === 'undefined') error = {code: 100};
    if (error.code == 141 || errorsMap[error.code])
        message = errorsMap[error.code] || error.message;
    else
        message = "Error: " + error.code + " " + error.message;
    hideSpinner();
    $rootScope.alertModal(message);
    if (error.code == 209) {
        alert("Logging out ...");
        Parse.User.logOut().then(function () {
            location.href = "/";
            location.reload();
        });
    }
}

function showSpinner() {
    $('#divLoading').fadeIn(250, function () {
        $('#divLoading').addClass('show');
    });
}

function toDataUrl(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.send();
}


function angularCopy(source) {
    function isWindow(obj) {
        return obj && obj.window === obj;
    }

    function isScope(obj) {
        return obj && obj.$evalAsync && obj.$watch;
    }

    function isBlankObject(value) {
        return value !== null && typeof value === 'object' && !getPrototypeOf(value);
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function setHashKey(obj, h) {
        if (h) {
            obj.$$hashKey = h;
        } else {
            delete obj.$$hashKey;
        }
    }

    var toString = Object.prototype.toString;
    var isArray = Array.isArray;
    var getPrototypeOf = Object.getPrototypeOf;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    var stackSource = [];
    var stackDest = [];

    return copyElement(source);

    function copyRecurse(source, destination) {
        var h = destination.$$hashKey;
        var key;
        if (isArray(source)) {
            for (var i = 0, ii = source.length; i < ii; i++) {
                destination.push(copyElement(source[i]));
            }
        } else if (isBlankObject(source)) {
            for (key in source) {
                destination[key] = copyElement(source[key]);
            }
        } else if (source && typeof source.hasOwnProperty === 'function') {
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    destination[key] = copyElement(source[key]);
                }
            }
        } else {
            for (key in source) {
                if (hasOwnProperty.call(source, key)) {
                    destination[key] = copyElement(source[key]);
                }
            }
        }
        setHashKey(destination, h);
        return destination;
    }

    function isObject(value) {
        return value !== null && typeof value === 'object';
    }

    function copyElement(source) {
        if (!isObject(source)) {
            return source;
        }
        var index = stackSource.indexOf(source);
        if (index !== -1) {
            return stackDest[index];
        }

        if (isWindow(source) || isScope(source)) {
            throw 'Can\'t copy! Making copies of Window or Scope instances is not supported.';
        }

        var needsRecurse = false;
        var destination = copyType(source);

        if (destination === undefined) {
            destination = isArray(source) ? [] : Object.create(getPrototypeOf(source));
            needsRecurse = true;
        }

        stackSource.push(source);
        stackDest.push(destination);

        return needsRecurse
            ? copyRecurse(source, destination)
            : destination;
    }

    function copyType(source) {
        switch (toString.call(source)) {
            case '[object Int8Array]':
            case '[object Int16Array]':
            case '[object Int32Array]':
            case '[object Float32Array]':
            case '[object Float64Array]':
            case '[object Uint8Array]':
            case '[object Uint8ClampedArray]':
            case '[object Uint16Array]':
            case '[object Uint32Array]':
                return new source.constructor(copyElement(source.buffer), source.byteOffset, source.length);

            case '[object ArrayBuffer]':
                if (!source.slice) {
                    var copied = new ArrayBuffer(source.byteLength);
                    new Uint8Array(copied).set(new Uint8Array(source));
                    return copied;
                }
                return source.slice(0);

            case '[object Boolean]':
            case '[object Number]':
            case '[object String]':
            case '[object Date]':
                return new source.constructor(source.valueOf());

            case '[object RegExp]':
                var re = new RegExp(source.source, source.toString().match(/[^/]*$/)[0]);
                re.lastIndex = source.lastIndex;
                return re;

            case '[object Blob]':
                return new source.constructor([source], {type: source.type});
        }

        if (isFunction(source.cloneNode)) {
            return source.cloneNode(true);
        }
    }
}


$(document).ready(function () {
    if (navigator.userAgent.match(/(Prerender)/) == null) {
        setTimeout(function () {
            $.ajax({
                type: "GET",
                url: "https://s7.addthis.com/js/300/addthis_widget.js",
                dataType: "script",
                success: function () {
                    addthis_config = {pubid: 'ra-584fd4d3f9f8431f'};
                    addthis.init();
                },
                cache: true
            });
            $.ajax({
                type: "GET",
                url: "https://www.google-analytics.com/analytics.js",
                dataType: "script",
                success: function () {
                    ga('create', 'UA-88019035-1', 'auto');
                    ga('send', 'pageview');
                },
                cache: true
            });

            $('body').append('<a href="https://www.youtube.com/watch?v=qj80AQaSi4A" target="_blank"><img style="position: absolute; top: 0; left: 0; border: 0; z-index: 9999999; " src="images/ribbon_tutorial.png" alt="Enbarter Tutorial" data-canonical-src="/images/ribbon_tutorial.png"></a>');
        }, 5000);

        if (navigator.userAgent.match(/(MSIE)/) != null) {
            hideSpinner();
            alert("You are now using enbarter in legacy mode, Kindly use enbarter a modern browser to enjoy the full experience!");
        } else if (navigator.userAgent.match(/(iPhone|Android)/) != null) {
            hideSpinner();
            alert("You are now using enbarter in legacy mode, Kindly use enbarter mobile app to enjoy the full experience!");
        }

        $(document).on("click", 'a[src^="http"]', function (e) {
            e.preventDefault();
            $("body").append('<div class="modal fade in" id="youtubeModal" tabindex="-1" role="dialog" aria-hidden="true" style="display: block"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" onclick="$(\'#youtubeModal\').remove()">&times;</button> </div> <div class="modal-body"> <iframe frameborder="0" src="' + $(this).attr('src') + '" width="100%" height="315" allowfullscreen autoplay></iframe> </div> </div> </div> </div>');
        });
    }
});