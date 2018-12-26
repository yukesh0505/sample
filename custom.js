var app = angular.module("myapp", ['ngRoute','ngStorage'],);
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
app.controller('ctrl3', function ($scope,$http) {
    $scope.loading = "Loading...";
    $scope.options = [{"outer":"Filter by Name","inner":"name"},{"outer":"Filter by Age","inner":"age"}];
    $scope.getdataasjson = function(){
    $scope.demo= [];
    $http.get('jsondata.json').success(function(data) { 
        $scope.data = data.demo;
        console.log(data.demo);
        $scope.loading = "";
     }) 
         
    
    }
});
app.controller('ctrl2', function ($scope,$localStorage) {

    $scope.show = function () {
        localStorage.fname =  $scope.fname;
        localStorage.lname =  $scope.lname; 
        $scope.name = "first name is " + $scope.fname + ",last name is " + $scope.lname;
    }
});

