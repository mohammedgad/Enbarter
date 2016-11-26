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
            $location.path(results.get('redirect'));
            return;
        }
        notification.set("read", true);
        $rootScope.nCount--;
        notification.save({
            success: function (results) {
                $location.path(results.get('redirect'));
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
        Parse.User.logIn($scope.email, $scope.password, {
            success: function (user) {
                location.reload();
            },
            error: function (user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());

    }

    $scope.signup = function () {
        var user = new Parse.User();
        user.set("username", $scope.email);
        user.set("password", $scope.password);
        user.set("email", $scope.email);
        Pace.start();

        user.signUp(null, {
            success: function (user) {
                location.reload();
            },
            error: function (user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
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
        Pace.start();
        Parse.User.requestPasswordReset($scope.email, {
            success: function () {
                alert("Request sent");
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
    }

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
});


app.controller('createBarter', function ($scope) {
    $scope.milestones = [];
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
    });

    $scope.startBarter = function () {
        $scope.canStartDisabled = true;
        if (!Parse.User.current()) {
            alert("Not loggedIn");
            return false;
        }

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
                alert('New object created with objectId: ' + barter.id);
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
        if ($scope.result) {
            result.set("state", "disabled");
            Pace.start();
            result.save().then(Pace.stop()).then($scope.$apply());
        }
    }

    $scope.barterUpRequest = function () {

        var milestones = [];
        for (var i = 0; i < $scope.milestones.length; i++) {
            milestones.push({checked: false, task: $scope.milestones[i]});
        }
        var request = {
            deadline: $scope.deadline,
            milestone: milestones,
            user: Parse.User.current().id,
            username: Parse.User.current().get('username'),
            pic: Parse.User.current().get('pic')
        };
        $scope.result.add("barterRequests", request);

        var user = Parse.User.current();
        user.addUnique("barterSeeks", $scope.result);
        Pace.start();
        user.save();
        $scope.result.save().then(Pace.stop()).then($scope.barterRequests.push(angular.copy(request)));
    }

    $scope.bartered = function () {
        if ($scope.result) {
            var barterRequests = $scope.result.get('barterRequests');
            if (barterRequests)
                for (var i = 0; i < barterRequests.length; i++)
                    if (Parse.User.current() && barterRequests[i].user == Parse.User.current().id)
                        return true;
        }
        return false;
    }

    $scope.showMilestones = function (milestones) {
        $scope.barterMilestones = milestones;
    }

    $scope.barterUpOwner = function (request) {
        if (confirm('Are you sure you wanna barter up with this request?')) {
            $scope.result.remove("barterRequests", JSON.parse(angular.toJson(request)));
            $scope.result.set("barterUpUser", Parse.User.createWithoutData(request.user));
            $scope.result.set("barterUpMilestones", request.milestone);
            $scope.result.set("barterUpDeadline", request.deadline);
            $scope.result.set("state", "bartered");
            Pace.start();
            $scope.result.save().then(Pace.stop()).then($scope.barterRequests.splice($scope.barterRequests.indexOf(request), 1));
        }
    }

    $scope.reportBarter = function () {
        var Report = Parse.Object.extend("ReportBarter");
        var report = new Report();
        report.set("user", Parse.User.current());
        report.set("description", $scope.reportDescription);
        report.set("barter", $scope.result);
        Pace.start();
        report.save(null).then(Pace.stop()).then(alert("Thank You"));
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
            var chat = new Chat();
            chat.set("message", $scope.message);
            chat.set("user", Parse.User.current());
            chat.set("barter", $scope.result);
            Pace.start();
            chat.save().then(Pace.stop());
            $scope.message = "";
        }
    }
    $scope.checkParse = function (o, column) {
        $scope.checkParseColumn = column;
        $scope.checkParseObject = o;
    }

    $scope.check = function (o, column) {
        var arr = $scope.result.get(column);
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
        $scope.result.set(column, arr);
        $scope[column] = angular.copy(arr);
        Pace.start();
        $scope.result.save().then(Pace.stop());
    }

    $scope.closeAndRate = function () {
        var who = (Parse.User.current().id == $scope.result.get('user').id) ? "offer" : "barterUp";
        var oppisite = (who == 'offer') ? 'barterUp' : 'offer';
        $scope.result.set(who + "Rate", $scope.rate);
        $scope.result.set(who + "Review", $scope.review);
        fileUploadControl = $("#formInput2565")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";
            var parseFile = new Parse.File(name, file);
            $scope.result.set(who + "FinalPic", parseFile);
        }
        if ($scope.result.get(oppisite + "Rate"))
            $scope.result.set("state", 'completed');

        Pace.start();
        $scope.result.save().then(Pace.stop());
    }

    $scope.showClose = function (x) {
        var oppisite = (x == 'offer') ? 'barterUp' : 'offer';
        if ($scope.result && ((x == 'offer' && Parse.User.current().id == $scope.result.get('user').id) || (x == 'barterUp' && Parse.User.current().id == $scope.result.get('barterUpUser').id) || ($scope.result.get(oppisite + "Rate"))))
            return false;
        var arr = [];
        if ($scope.result)
            arr = $scope.result.get(x + 'Milestones');
        for (var i = 0; i < arr.length; i++) {
            if (!arr[i].checked)
                return false;
        }
        if (arr.length)
            return true;
        else
            return false;
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
        $scope.result.set("username", $scope.username);
        $scope.result.set("bio", $scope.bio);
        $scope.result.set("birthday", $scope.birthday);
        $scope.result.set("skills", $scope.skills);
        $scope.result.set("workLinks", $scope.workLinks);
        fileUploadControl = $("#exampleInputFile1")[0];
        if (fileUploadControl.files.length > 0) {
            var file = fileUploadControl.files[0];
            var name = "photo1.jpg";
            var parseFile = new Parse.File(name, file);
            $scope.result.set("pic", parseFile);
        }
        Pace.start();
        $scope.result.save({
            success: function (result) {
                location.reload();
            }, error: function (object, error) {
                alert("Error: " + error.code + " " + error.message);
            }
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