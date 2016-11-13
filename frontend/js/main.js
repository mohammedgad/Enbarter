var app = angular.module("BarterApp", ["ngRoute"]);
Parse.initialize("myAppId");
Parse.serverURL = 'http://env-9871847.mircloud.host/parse';
Parse.clientKey = 'myClientKey';

app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "indexContent.html"
        }).when("/browse", {
        templateUrl: "browse.html"
    }).when("/barter", {
        templateUrl: "barter.html"
    }).when("/create_barter", {
        templateUrl: "create_barter.html"
    });
});

app.run(function ($rootScope) {
    $rootScope.title = 'EnBarter';
    $rootScope.description = "123";
    $rootScope.keywords = "123";
});

app.controller('header', function ($scope) {
    $scope.homeLink = "http://localhost:63342/Enbarter/#/";
    $scope.browseLink = "http://localhost:63342/Enbarter/#/barter";
    $scope.aboutLink = "/";

    $scope.login = function () {
        Parse.User.logIn($scope.email, $scope.password, {
            success: function (user) {
                // Do stuff after successful login.
                alert('Hello');
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
                alert('Hello');
            },
            error: function (user, error) {
                // Show the error message somewhere and let the user try again.
                alert("Error: " + error.code + " " + error.message);
            }
        });
    }
});