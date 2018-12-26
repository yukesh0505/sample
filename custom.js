var app = angular.module("myapp", ['ngRoute']);
app.config(function ($routeProvider) {
    $routeProvider
        .when('/home', {
            templateUrl: 'home.html',
            controller: 'ctrl1'
        })
        .when('/about', {
            templateUrl: 'about.html',
            controller: 'ctrl3'
        })
        .when('/contact', {
            templateUrl: 'contact.html',
            controller: 'ctrl2'
        })
        .otherwise({
            redirectTo: '/home'
        });
});
app.controller('ctrl1', function ($scope) {
    $scope.disp = "svd";
    $scope.message = "bye";
    console.log($scope.disp);
});
app.controller('ctrl3', function ($scope) {
    $scope.disp = "about";
    $scope.message = "bye";
    console.log($scope.disp);
    $scope.array=[{
        name:"srini",
        age:"25"
    },
    {
        name:"srini",
        age:"25"
    }]
});
app.controller('ctrl2', function ($scope) {

    $scope.show = function () {

        $scope.name = "first name is " + $scope.fname + "<br/>,last name is " + $scope.lname;
    }
});

