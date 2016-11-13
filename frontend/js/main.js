var app = angular.module("BarterApp", ["ngRoute"]);
Parse.initialize("myAppId");
Parse.serverURL = 'http://env-9871847.mircloud.host/parse';
Parse.masterKey = 'mySecretMasterKey';

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "indexContent.html"
        }).when("/browse", {
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

app.controller('header', function ($scope) {
    $scope.homeLink = "http://localhost:63342/Enbarter/#/";
    $scope.browseLink = "http://localhost:63342/Enbarter/#/browse";
    $scope.createBarterLink = "http://localhost:63342/Enbarter/#/create_barter";

    $scope.login = function () {
        Parse.User.logIn($scope.email, $scope.password, {
            success: function (user) {
                // Do stuff after successful login.
                $scope.$apply();
            },
            error: function (user, error) {
                // The login failed. Check error to see why.
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }

    $scope.signup = function () {
        var user = new Parse.User();
        user.set("username", $scope.email);
        user.set("password", $scope.password);
        user.set("email", $scope.email);
        user.signUp(null, {
            success: function (user) {
                // Hooray! Let them use the app now.
                $scope.$apply();
            },
            error: function (user, error) {
                // Show the error message somewhere and let the user try again.
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }

    $scope.logout = function () {
        Parse.User.logOut();
        window.location = "/Enbarter";
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


        barter.save(null, {
            success: function (barter) {
                // Execute any logic that should take place after the object is saved.

                alert('New object created with objectId: ' + barter.id);
                window.location.href = "/Enbarter/#/barter";

            },
            error: function (barter, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                alert('Failed to create new object, with error code: ' + error.message);
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
        error: function (error) {
            alert("Error: " + error.code + " " + error.message);
        }
    });
}
app.controller('browseCtrl', function ($scope) {
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

        if ($scope.seekCat != '-1')
            query.equalTo("seekCategory", Category.createWithoutData($scope.seekCat));
        if ($scope.seekCat != '-1')
            query.equalTo("offerCategory", Category.createWithoutData($scope.offerCat));
        // query.contains("barterTitle", $scope.query);
        query.find({
            success: function (results) {
                console.log(results);
                $scope.results = results;
                $scope.$apply();
            },
            error: function (error) {
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});


app.controller('barterCtrl', function ($scope, $routeParams) {
    var query = new Parse.Query(Parse.Object.extend("Barter"));
    query.get($routeParams.id, {
        success: function (result) {
            $scope.result = result;
            $scope.$apply();
        },
        error: function (object, error) {
            alert("Error: " + error.code + " " + error.message);
            window.location = "./";
        }
    });
});