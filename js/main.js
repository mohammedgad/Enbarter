var app = angular.module("BarterApp", ["ngRoute", 'luegg.directives', 'ngSanitize']);

Parse.initialize("N39ZdgBHC1a0NDJNMXwFQ4yIePsXTbgEcwHhFY7u", "5trl769gcrMUSG2lcumx1Biq976NcPSPEg8tbG8p");
Parse.serverURL = 'https://enbarter.back4app.io';

// Parse.initialize("myAppId", "js");
// Parse.serverURL = 'http://localhost:1337/parse';

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "indexContent.html"
        }).when("/browse", {
        templateUrl: "browse.html"
    }).when("/browse/:id", {
        templateUrl: "browse.html"
    }).when("/barter/:id", {
        templateUrl: "barter.html"
    }).when("/create_barter", {
        templateUrl: function () {
            if (!Parse.User.current()) {
                window.location.href = "/Enbarter";
                return "indexContent.html";
            }
            return "create_barter.html";
        }
    }).when("/dashboard", {
        templateUrl: "viewDashboard.html"
    }).when("/dashboard/barter/:id", {
        templateUrl: "barterDashboard.html"
    }).when("/profile/edit", {
        templateUrl: "editProfile.html"
    }).when("/profile/:id", {
        templateUrl: "viewProfile.html"
    }).when("/profile", {
        templateUrl: "viewProfile.html"
    }).when("/notifications", {
        templateUrl: "notifications.html"
    }).otherwise({
        templateUrl: "404.html"
    });
});

app.run(function ($rootScope, $location) {
    $rootScope.title = 'EnBarter';
    $rootScope.description = "123";
    $rootScope.keywords = "123";
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
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});

app.controller('header', function ($scope, $location, $rootScope) {
    $scope.homeLink = ".#/";
    $scope.browseLink = ".#/browse";
    $scope.createBarterLink = ".#/create_barter";
    $scope.dashboardLink = ".#/dashboard";

    $scope.login = function () {
        Pace.start();
        Parse.User.logIn($scope.username, $scope.password, {
            success: function (user) {
                location.reload();
            },
            error: function (user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());

    }

    $scope.signup = function () {
        var email = prompt("Enter Email");
        if (email) {
            var user = new Parse.User();
            user.set("username", $scope.username);
            user.set("password", $scope.password);
            user.set("email", email);
            Pace.start();

            user.signUp(null, {
                success: function (user) {
                    location.reload();
                },
                error: function (user, error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            }).then(Pace.stop());
        } else alert('Email is required');
    }

    $scope.logout = function () {
        Pace.start();
        Parse.User.logOut().then(function () {
            Pace.stop();
            location.href = ".#/";
            location.reload();
        });
    }

    $scope.passwordReset = function () {
        var email = prompt("Enter Email");
        if (email) {
            Pace.start();
            Parse.User.requestPasswordReset(email, {
                success: function () {
                    alert("Request sent");
                },
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            }).then(Pace.stop());
        } else alert('Email is required');
    }

    if (Parse.User.current()) {
        var Notification = Parse.Object.extend('Notification');
        var query = new Parse.Query(Notification);
        query.equalTo("user", Parse.User.current());
        query.descending("createdAt");
        query.limit(10);
        query.find({
            success: function (results) {
                $scope.notifications = results;
                $rootScope.nCount = results.filter(function (x) {
                    if (!x.get('read'))
                        return true;
                    return false;
                }).length;
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });

        var subscription = query.subscribe();
        subscription.on('create', function (object) {
            console.log(object);
            $rootScope.nCount++;
            $scope.notifications.unshift(object);
            $scope.$apply();
        });
    }
});


app.controller('createBarter', function ($scope) {
    $scope.milestones = [];
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
    });

    $scope.startBarter = function () {
        if (!Parse.User.current()) {
            alert("Not loggedIn");
            return;
        }
        if (!$scope.milestones || !$scope.milestones.length) {
            alert('Milestones are required!');
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

        Pace.start();
        barter.save(null, {
            success: function (barter) {
                // alert('New object created with objectId: ' + barter.id);
                window.location.href = "/Enbarter/#/barter/" + barter.id;
            },
            error: function (barter, error) {
                alert('Failed to create new object, with error code: ' + error.message);
            }
        }).then(Pace.stop()).then(function () {
            $scope.canStartDisabled = false;
            $scope.$apply();
        });

    }
});


function getCategories(successCallback) {
    var query = new Parse.Query(Parse.Object.extend("Category"));
    Pace.start();
    query.find({
        success: function (results) {
            successCallback(results);
        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    }).then(Pace.stop());

}
app.controller('browseCtrl', function ($scope, $routeParams, $location) {
    $scope.offerCat = 'all';
    $scope.seekCat = 'all';
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
    });
    $scope.search = function () {
        var Category = Parse.Object.extend("Category");
        var query = new Parse.Query(Parse.Object.extend("Barter"));
        query.include('seekCategory');
        query.include('offerCategory');
        query.include('user');
        if ($scope.seekCat && $scope.seekCat != 'all')
            query.equalTo("seekCategory", Category.createWithoutData($scope.seekCat));
        if ($scope.offerCat && $scope.offerCat != 'all')
            query.equalTo("offerCategory", Category.createWithoutData($scope.offerCat));
        if ($scope.query)
            query.containsAll("words", $scope.query.split(" "));
        Pace.start();
        query.find({
            success: function (results) {
                $scope.results = results;
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
    }

    if ($routeParams.id) {
        $scope.offerCat = $routeParams.id;
        $scope.search();
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

    Pace.start();
    query.get($routeParams.id, {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = result.get("barterTitle");
            $scope.barterRequests = angular.copy((result.get('barterRequests')) ? result.get('barterRequests') : []);
            $scope.$apply();

            console.log(result);
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());

    $scope.sameAccount = function () {
        if (Parse.User.current() && $scope.result && $scope.result.get('user').id == Parse.User.current().id)
            return true;
        return false;
    }

    $scope.disable = function () {
        var result = angular.copy($scope.result);
        if (result) {
            result.set("state", "disabled");
            Pace.start();
            result.save({
                success: function (results) {
                    $scope.result = results;
                    $scope.$apply();
                },
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            }).then(Pace.stop());
        }
    }

    $scope.barterUpRequest = function () {
        if (!$scope.milestones || !$scope.milestones.length) {
            alert('Milestones are required!');
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
        var result = angular.copy($scope.result);
        result.add("barterRequests", request);

        result.save({
            success: function (results) {
                $scope.result = results;
                $scope.barterRequests.push(angular.copy(request));
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
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
        if (confirm('Are you sure you wanna barter up with this request?')) {
            var result = angular.copy($scope.result);
            result.set("barterUpUser", {
                "__type": "Pointer", "className": "_User",
                "objectId": request.user.id || request.user.objectId
            });
            result.set("barterUpMilestones", request.milestone);
            result.set("barterUpDeadline", request.deadline);
            result.set("state", "bartered");
            Pace.start();
            result.save({
                success: function (results) {
                    $scope.result = results;
                    $scope.barterRequests = angular.copy((result.get('barterRequests')) ? result.get('barterRequests') : []);
                    $scope.$apply();
                },
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            }).then(Pace.stop());
        }
    }

    $scope.reportBarter = function () {
        var Report = Parse.Object.extend("ReportBarter");
        var report = new Report();
        report.set("user", Parse.User.current());
        report.set("description", $scope.reportDescription);
        report.set("barter", $scope.result);
        Pace.start();
        report.save({
            success: function (results) {
                alert("Thank You");
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
    }
});


app.controller('indexCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.catSoft = ".#/browse/0NFJVql0U9";
    $scope.catWrite = ".#/browse/zSBhtFd8ZE";
    $scope.catMedia = ".#/browse/Wb8uqGgkdG";
    $scope.catData = ".#/browse/4TtjWA9W5e";
    $scope.catMarket = ".#/browse/7lY1lEwRny";
    $scope.catOther = ".#/browse/U8MCGz0C2B";


    var query = new Parse.Query(Parse.Object.extend("Barter"));
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
    query.descending("createdAt");
    query.limit(5);
    Pace.start();
    query.find({
        success: function (results) {
            $scope.barters = results;
            $scope.$apply();
        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    }).then(Pace.stop());

});
var chatIntervalId;
app.controller('barterDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    $scope.messages = [];
    $scope.offerMilestones = [];
    var Barter = Parse.Object.extend("Barter");
    var Chat = Parse.Object.extend("Chat");

    $scope.reloadChat = function () {
        var query = new Parse.Query(Chat);
        query.include("user");
        query.equalTo("barter", $scope.result);
        Pace.start();
        query.find({
            success: function (results) {
                $scope.messages = results;
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());

        var subscription = query.subscribe();
        subscription.on('create', function (object) {
            console.log(object);
            $scope.messages.push(object);
            $scope.$apply();
        });

        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            subscription.unsubscribe();
        });
    }

    var query = new Parse.Query(Barter);
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
    query.include('barterUpUser');


    Pace.start();
    query.get($routeParams.id, {
        success: function (result) {
            if (!result.get('barterUpUser') && Parse.User.current().id != result.get('user').id) {
                alert("Dashboard can't be accessed because there is no barter user");
                window.location.href = "/Enbarter/#/barter/" + result.id;
                return;
            }
            if (!Parse.User.current() || (Parse.User.current().id != result.get('user').id && Parse.User.current().id != result.get('barterUpUser').id)) {
                alert("Error: Not allowed");
                $location.path('/');
                $scope.$apply();
                return;
            }

            if (!result.get('barterUpMilestones') || !result.get('offerMilestones') || !result.get('barterUpMilestones').length || !result.get('offerMilestones').length) {
                alert("Dashboard can't be accessed because there is no Milestones");
                window.location.href = "/Enbarter/#/barter/" + result.id;
                return;
            }
            $scope.result = result;
            $rootScope.title = "Dashboard";
            $scope.offerMilestones = angular.copy(result.get('offerMilestones'));
            $scope.barterUpMilestones = angular.copy(result.get('barterUpMilestones'));

            $scope.$apply();
            if ($scope.result.get('state') != 'completed')
                $scope.reloadChat();

            console.log(result);

            var subscription = query.subscribe();
            subscription.on('update', function (object) {
                $scope.result = result;
                $scope.offerMilestones = angular.copy(result.get('offerMilestones'));
                $scope.barterUpMilestones = angular.copy(result.get('barterUpMilestones'));
                $scope.$apply();
                console.log(object);
            });

            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                subscription.unsubscribe();
            });
            // if ($scope.result.get('state') != 'completed')
            //     chatIntervalId = window.setInterval(function () {
            //         $scope.reloadChat();
            //     }, 3000);
            // $rootScope.$on('$locationChangeStart', function (event, next, current) {
            //     window.clearInterval(chatIntervalId);
            // });
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());
    $scope.sendMessage = function () {
        if ($scope.result.get('state') != 'completed') {
            $scope.cantSend = true;
            var chat = new Chat();
            chat.set("message", $scope.message);
            chat.set("user", Parse.User.current());
            chat.set("barter", $scope.result);
            Pace.start();
            chat.save({
                success: function (results) {
                    $scope.message = "";
                    $scope.cantSend = false;
                    $scope.$apply();
                },
                error: function (error) {
                    alert("Error: " + error.code + " " + error.message);
                }
            }).then(Pace.stop());
        }
    }
    $scope.checkParse = function (o, column) {
        $scope.checkParseColumn = column;
        $scope.checkParseObject = o;
    }

    $scope.check = function (o, column) {
        var result = angular.copy($scope.result);
        var arr = result.get(column);
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].task == o.task) {
                arr[i].checked = true;
                arr[i].date = new Date();
                arr[i].comment = $scope.comment;
                fileUploadControl = $("#formInput25675")[0];
                if (fileUploadControl.files.length > 0) {
                    var file = fileUploadControl.files[0];
                    var name = "photo1.jpg";
                    var parseFile = new Parse.File(name, file);
                    arr[i].file = parseFile;
                }
            }
        }
        result.set(column, arr);
        Pace.start();
        result.save({
            success: function (results) {
                $scope[column] = angular.copy(arr);
                $scope.result = results;
                $scope.comment = '';
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
    }

    $scope.closeAndRate = function () {
        var result = angular.copy($scope.result);
        var who = (Parse.User.current().id == result.get('user').id) ? "offer" : "barterUp";
        var oppisite = (who == 'offer') ? 'barterUp' : 'offer';
        result.set(who + "Rate", $scope.rate);
        result.set(who + "Review", $scope.review);
        if (result.get(oppisite + "Rate"))
            result.set("state", 'completed');

        Pace.start();
        result.save({
            success: function (results) {
                $scope.result = results;
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
    }

    $scope.showClose = function (x) {
        var oppisite = (x == 'offer') ? 'barterUp' : 'offer';
        if ($scope.result && ((x == 'offer' && Parse.User.current().id == $scope.result.get('user').id) || (x == 'barterUp' && Parse.User.current().id == $scope.result.get('barterUpUser').id) || ($scope.result.get(oppisite + "Rate"))))
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
        var result = angular.copy($scope.result);
        fileUploadControl = $("#" + x + "FinalPic")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";
            var parseFile = new Parse.File(name, file);
            result.set(x + "FinalPic", parseFile);
        }
        result.save({
            success: function () {

            }, error: function (object, error) {
                alert("Error: " + error.code + " " + error.message);
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
    Pace.start();
    query.get(($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null), {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = "Profile: " + result.get('username');
            $scope.$apply();

            console.log(result);
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());


    var Barter = Parse.Object.extend("Barter");
    var barterQuery = new Parse.Query(Barter);
    barterQuery.equalTo("user", Parse.User.current());
    barterQuery.find({
        success: function (results) {
            $scope.barters = results;
            $scope.$apply();
        }
    });
});

app.controller('editProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    Pace.start();
    query.get(Parse.User.current() ? Parse.User.current().id : null, {
        success: function (result) {
            $scope.result = result;
            $scope.username = result.get('username');
            $scope.bio = result.get('bio');
            $scope.birthday = result.get('birthday');
            $scope.skills = result.get('skills') ? result.get('skills') : [];
            $scope.workLinks = result.get('workLinks') ? result.get('workLinks') : [];
            $rootScope.title = "Edit: " + result.get('username');
            $scope.$apply();

            console.log(result);
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());

    $scope.submit = function () {
        $scope.cantSubmit = true;
        var result = angular.copy($scope.result);
        result.set("username", $scope.username);
        result.set("bio", $scope.bio);
        result.set("birthday", $scope.birthday);
        result.set("skills", $scope.skills);
        result.set("workLinks", $scope.workLinks);
        fileUploadControl = $("#exampleInputFile1")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";
            var parseFile = new Parse.File(name, file);
            result.set("pic", parseFile);
        }
        Pace.start();
        result.save({
            success: function (result) {
                location.reload();
            }, error: function (object, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(function () {
            $scope.cantSubmit = false;
            $scope.$apply();
        });
    }
});

app.controller('viewDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    query.include("barterSeeks");
    Pace.start();
    query.get(($routeParams.id) ? $routeParams.id : ((Parse.User.current()) ? Parse.User.current().id : null), {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = "Dashboard";
            $scope.$apply();

            console.log(result);
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());


    var Barter = Parse.Object.extend("Barter");
    var barterQuery = new Parse.Query(Barter);
    barterQuery.equalTo("user", Parse.User.current());
    barterQuery.find({
        success: function (results) {
            $scope.barters = results;
            $scope.$apply();
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
        alert("Error: not allowed");
        $location.path('/');
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
        },
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    });
});