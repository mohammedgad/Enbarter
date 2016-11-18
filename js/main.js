var app = angular.module("BarterApp", ["ngRoute"]);

Parse.initialize("myAppId");
Parse.serverURL = 'https://docker20668-env-9871847.mircloud.host/parse';
Parse.masterKey = 'mySecretMasterKey';

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
    }).when("/dashboard/barter/:id", {
        templateUrl: "barterDashboard.html"
    }).when("/profile/:id", {
        templateUrl: "viewProfile.html"
    }).otherwise({
        templateUrl: "404.html"
    });
});

app.run(function ($rootScope) {
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

});

app.controller('header', function ($scope, $location) {
    $scope.homeLink = ".#/";
    $scope.browseLink = ".#/browse";
    $scope.createBarterLink = ".#/create_barter";

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
});


app.controller('createBarter', function ($scope) {
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
        barter.set("offerTitle", $scope.offerTitle);
        barter.set("offerDescription", $scope.offerDescription);
        barter.set("offerMilestone", $scope.offerMilestone);
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
        barter.set("seekTitle", $scope.seekTitle);
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
        var text = $scope.barterTitle + " " + $scope.barterDescription + " " + $scope.offerTitle + " " + $scope.offerDescription + " " + $scope.offerMilestone + " " + $scope.seekTitle + " " + $scope.seekDescription;
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
            $scope.$apply();
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());

    $scope.sameAccount = function () {
        if ($scope.result && $scope.result.get('user').id == Parse.User.current().id)
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
        $scope.result.add("barterRequests", {
            deadline: $scope.deadline,
            milestone: $scope.milestone,
            user: Parse.User.current().id,
            username: Parse.User.current().get('username')
        });
        var user = Parse.User.current();
        user.addUnique("barterSeeks", $scope.result);
        Pace.start();
        user.save().then($scope.result.save().then(Pace.stop()));
    }

    $scope.bartered = function () {
        if ($scope.result) {
            var barterRequests = $scope.result.get('barterRequests');
            for (var i = 0; i < barterRequests.length; i++)
                if (barterRequests[i].user == Parse.User.current().id)
                    return true;
        }
        return false;
    }

    $scope.showMilestones = function (milesone) {
        alert(milesone);
    }

    $scope.barterUpOwner = function (request) {
        if (confirm('Are you sure you wanna barter up with this request?')) {
            $scope.result.remove("barterRequests", request);
            $scope.result.set("barterUpUser", Parse.User.createWithoutData(request.user));
            $scope.result.set("barterUpMilestone", request.milestone);
            $scope.result.set("barterUpDeadline", request.deadline);
            $scope.result.set("state", "bartered");
            Pace.start();
            $scope.result.save().then(Pace.stop());
        }
    }
});


app.controller('indexCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.catSoft = ".#/browse/gibkTa09CL";
    $scope.catWrite = ".#/browse/Cm4O1u9w3f";
    $scope.catMedia = ".#/browse/xVhMsj1Yne";
    $scope.catData = ".#/browse/E1loFjtGQM";
    $scope.catMarket = ".#/browse/JyDcu5YNE8";
    $scope.catOther = ".#/browse/8N5ksGyQ4h";


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

app.controller('barterDashboardCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    $scope.messages = [];

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
    }

    var query = new Parse.Query(Barter);
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
    query.include('barterUpUser');


    Pace.start();
    query.get($routeParams.id, {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = result.get("Dashboard");
            $scope.$apply();
            $scope.reloadChat();

            // var subscription = query.subscribe();
            // subscription.on('create', function (object) {
            //     $scope.messages.push(object);
            //     $scope.$apply();
            // });
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            $location.path('/');
            $scope.$apply();
        }
    }).then(Pace.stop());

    $scope.sendMessage = function () {
        var chat = new Chat();
        chat.set("message", $scope.message);
        chat.set("user", Parse.User.current());
        chat.set("barter", $scope.result);
        Pace.start();
        chat.save().then(Pace.stop()).then($scope.reloadChat());
        $scope.message = "";
    }

    window.setInterval(function () {
        $scope.reloadChat();
    }, 3000);
});


app.controller('showProfileCtrl', function ($scope, $location, $rootScope, $routeParams) {
    $scope.result = null;
    var query = new Parse.Query(Parse.User);
    query.include("barterSeeks");
    Pace.start();
    query.get($routeParams.id, {
        success: function (result) {
            $scope.result = result;
            $rootScope.title = result.get(result.get('username'));
            $scope.$apply();
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