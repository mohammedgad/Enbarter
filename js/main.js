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
    });
});

app.run(function ($rootScope) {
    $rootScope.title = 'EnBarter';
    $rootScope.description = "123";
    $rootScope.keywords = "123";
});

app.controller('header', function ($scope, $location) {
    $scope.homeLink = ".#/";
    $scope.browseLink = ".#/browse";
    $scope.createBarterLink = ".#/create_barter";

    $scope.login = function () {
        Pace.start();
        Parse.User.logIn($scope.email, $scope.password, {
            success: function (user) {
                $scope.$apply();
            },
            error: function (user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
        ;
    }

    $scope.signup = function () {
        var user = new Parse.User();
        user.set("username", $scope.email);
        user.set("password", $scope.password);
        user.set("email", $scope.email);
        Pace.start();

        user.signUp(null, {
            success: function (user) {
                $scope.$apply();
            },
            error: function (user, error) {
                alert("Error: " + error.code + " " + error.message);
            }
        }).then(Pace.stop());
        ;
    }

    $scope.logout = function () {
        Pace.start();
        Parse.User.logOut().then(function () {
            Pace.stop();
            $location.path('/');
        });
    }

    $scope.isLoggedIn = function () {
        if (Parse.User.current())
            return true;
        return false;
    }
});


app.controller('createBarter', function ($scope) {
    getCategories(function (results) {
        $scope.categories = results;
        $scope.$apply();
    });

    $scope.startBarter = function () {

        if (!Parse.User.current()) {
            alert("Not loggedIn");
            return false;
        }

        var Barter = Parse.Object.extend("Barter");
        var Category = Parse.Object.extend("Category");
        var barter = new Barter();

        barter.set("barterTitle", $scope.barterTitle);
        barter.set("barterDescription", $scope.barterDescription);
        barter.set("offerCategory", Category.createWithoutData($scope.offerCategory));
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
        barter.set("seekCategory", Category.createWithoutData($scope.seekCategory));
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

        Pace.start();
        barter.save(null, {
            success: function (barter) {
                alert('New object created with objectId: ' + barter.id);
                window.location.href = "/Enbarter/#/barter/" + barter.id;
            },
            error: function (barter, error) {
                alert('Failed to create new object, with error code: ' + error.message);
            }
        }).then(Pace.stop());
        ;
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
    ;
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
    var query = new Parse.Query(Parse.Object.extend("Barter"));
    query.include('seekCategory');
    query.include('offerCategory');
    query.include('user');
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
    query.descending("objectId");
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