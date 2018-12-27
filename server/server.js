var express = require('express');
var bodyParser = require('body-parser');
// var mysql = require('mysql');
//var assert = require('assert');
var app = express();
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var users = mongoose.model('demo', {
    firstname: { type: String },
    lastname: { type: String },
    email: { type: String }

}); //Model declaration

app.use(bodyParser.json());
app.all('*', function (req, res, next) {
    console.log("shjgjhdgjd");
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/getdata', function (req, res) {
    users.find({}).exec(function (err, demo1) {
        if (err) {

        } else {
            res.send({ status: "1", data: demo1 });
        }
    });
});


app.put('/upddata', function (req, res) {
    console.log(req.body.id,"delete data");
    var update = {
        firstname:req.body.fname,
        lastname:req.body.lname,
        email:req.body.email,
    }
    var datavalue = new users(req.body);
    users.findOneAndUpdate({'_id':req.body.id},update).exec(function (err, demo1) {
        if (err) {

        } else {
            
            res.send({ status: "1"});
        }
    });
});

app.delete('/deldata/:id', function (req, res) {
    console.log(req.params.id,"delete data")
    users.findOne({'_id':req.params.id}).exec(function (err, demo1) {
        if (err) {

        } else {
            demo1.remove();
            res.send({ status: "1"});
        }
    });
});

app.post('/demopost', function (req, res) {
    //console.log(req.body);
    var datavalue = new users(req.body);
    //console.log(typeof datavalue, "datavalue")
    datavalue.save(function (err, data) { //Query To insert details to mongodb
        //console.log(data, "after saved");
        if (err) {
            //console.log('err establish');
        }
        else {
            //console.log(data);
            res.send("inserted");
        }
    });
});
app.listen(8080);