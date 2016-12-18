if (navigator.userAgent.match(/(MSIE)/) != null) {
    hideSpinner();
    alert("You are now using enbarter in legacy mode, Kindly use enbarter a modern browser to enjoy the full experience!");
} else if (navigator.userAgent.match(/(iPhone|Android)/) != null) {
    hideSpinner();
    alert("You are now using enbarter in legacy mode, Kindly use enbarter mobile app to enjoy the full experience!");
}
Raven.config('https://22c41b4449c04f2f9678babd3400566c@sentry.io/118691').install();
window.prerenderReady = false;
String.prototype.paddingLeft = function (paddingValue) {
    return String(paddingValue + this).slice(-paddingValue.length);
};

var app = angular.module("BarterApp", ["ngRoute", 'luegg.directives', 'ngSanitize', 'ngRaven']);
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
    }).otherwise({
        templateUrl: "views/404.html"
    });

    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
});

app.run(function ($rootScope, $location) {
    Parse.initialize("EnbarterApp", "28e0691b32ab");
    Parse.serverURL = 'http://api.enbarterdev.ml/v1';

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
        if (list.indexOf(item) == -1)
            list.push(item);
        return item = '';
    }
    $rootScope.removeItemFrom = function (list, item) {
        var index = list.indexOf(item);
        if (index > -1) {
            list.splice(index, 1);
        }
    }

    if ($location.search()['_escaped_fragment_'] && $location.path() == '/' && $location.path() != $location.search()['_escaped_fragment_']) {
        $location.path($location.search()['_escaped_fragment_']);
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
            }
        });
    }

    $rootScope.$on('$locationChangeStart', function (event) {
        showSpinner();
        $("html, body").stop().animate({scrollTop: 0}, '100', 'swing');
    });

    $rootScope.$on('$routeChangeSuccess', function (event) {
        $rootScope.statusCode = 200;
        $rootScope.currentUrl = window.location.href || document.URL;
    });
});

app.controller('header', function ($scope, $location, $rootScope) {
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
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
            }
        });
    }

    $scope.logout = function () {
        showSpinner();
        Parse.User.logOut().then(function () {
            location.href = "/#!";
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
                error: function (error) {
                    $rootScope.alertModal("Error: " + error.code + " " + error.message);
                    hideSpinner();
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
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
        var required = ['barterTitle', 'barterDescription', 'offerCategory', 'offerDescription', 'offerDeadline', 'seekCategory', 'seekDescription', 'seekDeadline'];
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

        barter.set("barterTitle", $scope.barterTitle);
        barter.set("barterDescription", $scope.barterDescription);
        barter.set("offerCategory", $scope.categories[$scope.offerCategory]);
        barter.set("offerDescription", $scope.offerDescription);
        var milestones = [];
        for (var i = 0; i < $scope.milestones.length; i++) {
            milestones.push({checked: false, task: $scope.milestones[i]});
        }
        barter.set("offerMilestones", milestones);
        barter.set("offerSampleLink", $scope.offerSampleLink);
        //file upload
        fileUploadControl = $("#exampleInputFile1")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo.jpg";

            var parseFile = new Parse.File(name, file);
            barter.set("offerSampleImage", parseFile);
        }
        barter.set("offerDeadline", $scope.offerDeadline);
        barter.set("seekCategory", $scope.categories[$scope.seekCategory]);
        barter.set("seekDescription", $scope.seekDescription);
        barter.set("seekSampleLink", $scope.seekSampleLink);
        // upload
        fileUploadControl = $("#exampleInputFile")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";

            var parseFile = new Parse.File(name, file);
            barter.set("seekSampleImage", parseFile);
        }
        barter.set("seekDeadline", $scope.seekDeadline);
        barter.set("user", Parse.User.current());
        var text = $scope.barterTitle + " " + $scope.barterDescription + " " + $scope.offerDescription + " " + $scope.seekDescription;
        var words = text.split(" ");
        barter.set("words", words);
        barter.set("state", "created");

        showSpinner();
        barter.save(null, {
            success: function (barter) {
                // $rootScope.alertModal('New object created with objectId: ' + barter.id);
                window.location.href = "/barter/" + barter.id;
                hideSpinner();
            },
            error: function (barter, error) {
                $rootScope.alertModal('Failed to create new object, with error code: ' + error.message);
                $scope.canStartDisabled = false;
                $scope.$apply();
                hideSpinner();
            }
        }).then(function () {
            $scope.canStartDisabled = false;
            $scope.$apply();
        });

    }
});


function getCategories(successCallback) {
    var query = new Parse.Query(Parse.Object.extend("Category"));

    query.find({
        success: function (results) {
            successCallback(results);
        },
        error: function (error) {
            $rootScope.alertModal("Error: " + error.code + " " + error.message);
        }
    });

}
app.controller('browseCtrl', function ($rootScope, $scope, $routeParams, $location) {
    $rootScope.title = "Enbarter | Browse";
    $rootScope.description += " | Browse Barters";
    $rootScope.keywords += " ,browse,search,find";

    $scope.offerCat = 'all';
    $scope.seekCat = 'all';
    $scope.barterState = 'created';
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
            }
        });
    }
});


app.controller('barterCtrl', function ($scope, $location, $rootScope, $routeParams) {
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
            $rootScope.description = result.get("barterTitle") + " " + result.get("barterDescription");
            $rootScope.keywords = $rootScope.description.replace(" ", ",");
            $scope.barterRequests = angularCopy((result.get('barterRequests')) ? result.get('barterRequests') : []);
            $scope.$apply();
            hideSpinner();

        },
        error: function (object, error) {
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
                error: function (error) {
                    $rootScope.alertModal("Error: " + error.code + " " + error.message);
                    hideSpinner();
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
        result.add("barterRequests", request);

        var user = Parse.User.current();
        user.addUnique("barterSeeks", result);
        showSpinner();
        user.save({
            success: function (results) {
            },
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
            }
        });
        result.save({
            success: function (results) {
                $scope.result = results;
                $scope.barterRequests.push(angularCopy(request));
                $scope.$apply();
                hideSpinner();
            },
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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

    $scope.showMilestones = function (milestones) {
        $scope.barterMilestones = milestones;
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
                $scope.barterRequests.splice(index, 1);
                showSpinner();
                result.save({
                    success: function (results) {
                        $scope.result = result;
                        $scope.$apply();
                        hideSpinner();
                    },
                    error: function (error) {
                        $rootScope.alertModal("Error: " + error.code + " " + error.message);
                        hideSpinner();
                    }
                });
            }, error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
        error: function (error) {
            $rootScope.alertModal("Error: " + error.code + " " + error.message);
            hideSpinner();
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

    $scope.reloadChat = function () {
        var query = new Parse.Query(Chat);
        query.include("user");
        query.equalTo("BarterDashboard", $scope.result);

        query.find({
            success: function (results) {
                $scope.messages = results;
                $scope.$apply();
            },
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
            }
        });

        var subscription = query.subscribe();
        subscription.on('create', function (object) {
            $scope.messages.push(object);
            $scope.$apply();
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


    query.get($routeParams.id, {
        success: function (result) {
            if (!result.get('barterUpUser') && Parse.User.current().id != result.get('user').id) {
                // alert("Dashboard can't be accessed because there is no barter user");
                window.location.href = "/barter/" + result.id;
                return;
            }
            if (!Parse.User.current() || (Parse.User.current().id != result.get('user').id && Parse.User.current().id != result.get('barterUpUser').id)) {
                // alert("Error: Not allowed");
                $location.path('/#!');
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
        },
        error: function (object, error) {
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
                },
                error: function (error) {
                    $rootScope.alertModal("Error: " + error.code + " " + error.message);
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
            error: function (error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
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
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                hideSpinner();
            }
        });
    }
    $scope.canCheck = function (x) {
        if (Parse.User.current().id == $scope.result.get(x).id)
            return true;
        return false;
    }
});


app.controller('showProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    query.include("barterSeeks");

    query.get(($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null), {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = "Enbarter | Profile: " + result.get('username');
            $scope.$apply();

            var Barter = Parse.Object.extend("Barter");
            var barterQuery = new Parse.Query(Barter);
            barterQuery.include('seekCategory');
            barterQuery.include('offerCategory');
            barterQuery.equalTo("user", Parse.User.current());
            barterQuery.find({
                success: function (results) {
                    $scope.barters = results;
                    $scope.$apply();
                    hideSpinner();
                }, error: function () {
                    hideSpinner();
                }
            });

        },
        error: function (object, error) {
            $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });
});

app.controller('editProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);

    query.get(Parse.User.current() ? Parse.User.current().id : null, {
        success: function (result) {
            $scope.result = result;
            $scope.username = result.get('username');
            $scope.bio = result.get('bio');
            if (result.get('birthday')) {
                $scope.birthday = result.get('birthday').getFullYear().toString().paddingLeft("0000") + '-' + result.get('birthday').getMonth().toString().paddingLeft("00") + '-' + result.get('birthday').getDate().toString().paddingLeft("00");
            }
            $scope.skills = result.get('skills') ? result.get('skills') : [];
            $scope.workLinks = result.get('workLinks') ? result.get('workLinks') : [];
            $rootScope.title = "Enbarter | Edit: " + result.get('username');
            $scope.$apply();
            hideSpinner();
        },
        error: function (object, error) {
            $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });

    $scope.submit = function () {
        $scope.cantSubmit = true;
        var result = angularCopy($scope.result);
        result.set("username", $scope.username);
        result.set("bio", $scope.bio);
        if ($scope.birthday)
            result.set("birthday", new Date($scope.birthday));
        result.set("skills", $scope.skills);
        result.set("workLinks", $scope.workLinks);
        fileUploadControl = $("#exampleInputFile1")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";
            var parseFile = new Parse.File(name, file);
            result.set("pic", parseFile);
        }
        showSpinner();
        result.save({
            success: function (result) {
                location.reload();
                hideSpinner();
            }, error: function (object, error) {
                $rootScope.alertModal("Error: " + error.code + " " + error.message);
                $scope.cantSubmit = false;
                $scope.$apply();
                hideSpinner();
            }
        });
    }
});

app.controller('viewDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    query.include("barterSeeks");

    query.get(($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null), {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = "Enbarter } Dashboard";
            $scope.$apply();
            var Barter = Parse.Object.extend("Barter");
            var barterQuery = new Parse.Query(Barter);
            barterQuery.equalTo("user", Parse.User.current());
            barterQuery.find({
                success: function (results) {
                    $scope.barters = results;
                    $scope.$apply();
                    hideSpinner();
                }, error: function () {
                    hideSpinner();
                }
            });

        },
        error: function (object, error) {
            $location.path('/NotFound');
            $scope.$apply();
            hideSpinner();
        }
    });


    $scope.dashboardActive = function (barter) {
        if ((barter && barter.get('barterUpUser')) && (Parse.User.current().id == barter.get('user').id || Parse.User.current().id == barter.get('barterUpUser').id))
            return true;

        return false;
    }
});

app.controller('notificationsCtrl', function ($scope, $location, $rootScope, $routeParams) {
    if (!Parse.User.current()) {
        $location.path('/#!');
        $scope.$apply();
    }
    var Notification = Parse.Object.extend('Notification');
    var query = new Parse.Query(Notification);
    query.descending("createdAt");
    query.equalTo("user", Parse.User.current());
    query.find({
        success: function (results) {
            $scope.results = results;
            $scope.$apply();
            var query1 = new Parse.Query(Parse.User);
            query1.include("barterSeeks");

            query1.get((Parse.User.current().id), {
                    success: function (result) {
                        $scope.result = result;
                        $rootScope.title = "Enbarter | Notifications";
                        $scope.$apply();
                        var Barter = Parse.Object.extend("Barter");
                        var barterQuery = new Parse.Query(Barter);
                        barterQuery.equalTo("user", Parse.User.current());
                        barterQuery.find({
                            success: function (results) {
                                $scope.barters = results;
                                $scope.$apply();
                                hideSpinner();
                            }, error: function () {
                                hideSpinner();
                            }
                        });

                    },
                    error: function (object, error) {
                        $scope.$apply();
                        hideSpinner();
                    }
                }
            );
        },
        error: function (error) {
            $location.path('/#!');
            $scope.$apply();
            hideSpinner();
        }
    });
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


function downloadJSAtOnload() {
    if (!Parse.User.current()) {
        window.fbAsyncInit = function () {
            Parse.FacebookUtils.init({
                appId: '1394780183887567',
                status: false,
                cookie: true,
                xfbml: true
            });
        };
        (function (d, debug) {
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {
                return;
            }
            js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
            ref.parentNode.insertBefore(js, ref);
        }(document, /*debug*/ false));
    }

    var element = document.createElement("script");
    element.src = "http://s7.mylivechat.com/livechat2/livechat2.aspx?hccid=99228221&apimode=chatinline";
    document.body.appendChild(element);
    element = document.createElement("script");
    element.src = "//s7.addthis.com/js/300/addthis_widget.js#pubid=ra-584fd4d3f9f8431f";
    document.body.appendChild(element);

    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');
    ga('create', 'UA-88019035-1', 'auto');
    ga('send', 'pageview');
    (function (h, o, t, j, a, r) {
        h.hj = h.hj || function () {
                (h.hj.q = h.hj.q || []).push(arguments)
            };
        h._hjSettings = {hjid: 350598, hjsv: 5};
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script');
        r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
    })(window, document, '//static.hotjar.com/c/hotjar-', '.js?sv=');
}
if (window.addEventListener)
    window.addEventListener("load", downloadJSAtOnload, false);
else if (window.attachEvent)
    window.attachEvent("onload", downloadJSAtOnload);
else window.onload = downloadJSAtOnload;

