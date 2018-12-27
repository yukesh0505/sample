var app = angular.module("myapp", ['ngRoute', 'ngStorage'], );
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
app.controller('ctrl3', function ($scope, $http) {
    $scope.loading = "Loading...";
    $scope.options = [{ "outer": "Filter by Name", "inner": "firstname" }, { "outer": "Filter by Email", "inner": "email" }];
    $scope.getdataasjson = function () {

        $http.get('http://localhost:8080/getdata').success(function (response) {
            if (response.status == '1') {
                console.log(response, "response")
                $scope.demo = response.data;
                
                    //$('#datatable').DataTable();

            }

          

        });
    }
    $scope.callback = function(){
        console.log('this is test case');
        setTimeout($scope.callback(),5000);
    }
    $scope.deletedata = function (id) {
        $http.delete('http://localhost:8080/deldata/' + id).success(function (response) {
            if (response.status == '1') {
                swal("Good job!", "Deleted Successfully!", "success");
                $scope.getdataasjson();

            }

        });
    }

    $scope.save = function(x,y){
        
        var demo = {
            fname:x.firstname,
            lname:x.lastname,
            email:x.email,
            id:y

        }
        console.log(demo);
        $http.put('http://localhost:8080/upddata/',demo).success(function (response) {
            if (response.status == '1') {
                swal("Good job!", "Updated Successfully!", "success");
                $scope.getdataasjson();

            }

        });
    }


});
app.controller('ctrl2', function ($scope, $http) {

    $scope.show = function () {

        $scope.name = "your full name is " + $scope.fname + " " + $scope.lname;

        var data = {
            firstname: $scope.fname,
            lastname: $scope.lname,
            email: $scope.email,
            
        }

        $http.post('http://localhost:8080/demopost', data)
            .success(function (response) {
                if (response == 'inserted') {
                    swal("Good job!", "Saved Successfully!", "success");
                } else {
                    alert('try again');
                }

            })

    }
});

