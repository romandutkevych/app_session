var express = require("express");
var bodyParser = require("body-parser");
var mongoClient = require("mongodb").MongoClient;
// var MongoStore = require("connect-mongo")(express);
var objectId = require("mongodb").ObjectID;
// var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var path = require('path');



var app = express();
var jsonParser = bodyParser.json();
var url = "mongodb://localhost:27017/usersdb";

app.use(cookieParser());
app.use(session({
    secret: "keyboard"
    // store:  mongoClient.connect(url, function (err, db) {
    //         db.collection("sessions")
    //     })
}));


app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');


var auth = function(req, res, next){
    if(req.session.user){
        return next();
    }else {
        res.sendFile(path.join(__dirname+'/public/log.html'));
    }
};

app.get("/api/users", function(req, res){

    mongoClient.connect(url, function(err, db){
        db.collection("users").find({}).toArray(function(err, users){
            res.send(users)
            db.close();
        });
    });
});
app.get("/api/users/:id", function(req, res){

    var id = new objectId(req.params.id);
    mongoClient.connect(url, function(err, db){
        db.collection("users").findOne({_id: id}, function(err, user){

            if(err) return res.status(400).send();

            res.send(user);
            db.close();
        });
    });
});


app.get("/api/users/srch/:email", function(req, res){

    mongoClient.connect(url, function(err, db){
        db.collection("users").findOne({email:req.params.email},function(err, user){
            console.log(user);
            res.send(user);
            db.close();
        });
    });
});

app.get("/", function(req,res){
    if(!req.session.user){
        res.sendFile(path.join(__dirname + '/public/log.html'));
    }else if(req.session.user =='admin') {
        res.sendFile(path.join(__dirname+'/public/table.html'));
    }else{
        res.sendFile(path.join(__dirname+'/public/next.html'));
    }
})

app.get("/log",auth,function(req,res) {
    if (!req.session.user) {
        res.sendFile(path.join(__dirname + '/public/log.html'));
    } else if (req.session.user == 'admin') {
        res.sendFile(path.join(__dirname + '/public/table.html'));
    } else {
        res.sendFile(path.join(__dirname + '/public/next.html'));
    }
});

app.get("/table",auth,function (req,res) {
    if (!req.session.user) {
        res.sendFile(path.join(__dirname + '/public/log.html'));
    } else if (req.session.user == 'admin') {
        res.sendFile(path.join(__dirname + '/public/table.html'));
    } else {
        res.sendFile(path.join(__dirname + '/public/next.html'));
    }});

app.get("/next",auth,function (req,res) {
    if (!req.session.user) {
        res.sendFile(path.join(__dirname + '/public/log.html'));
    } else {
        res.sendFile(path.join(__dirname + '/public/next.html'));
    }
});

app.post("/api/users/log",jsonParser,function(req, res){
    var userEmail = req.body.email;
    var userPassword = req.body.password;

        mongoClient.connect(url,function(err, db){
            db.collection("users").findOne({email:userEmail},function(err, user){

                if(user){
                    if(userPassword == user.password){
                       // req.session.user = userEmail;
                        if(user.right == "admin") {
                            req.session.user = 'admin';
                            console.log(req.session.user);
                            console.log(user);
                            res.send({redirect: '/table'});
                        }else{
                            req.session.user = 'user';
                            console.log(req.session.user);
                            console.log(user);
                            res.send({redirect: '/next'});
                        }
                    }else{
                        console.log("wrong password");
                        res.send('wrong password');
                    }
                }
                else{
                    console.log("not user");
                    res.send('not user');
                }



                if(err) return res.status(400).send();
                db.close();
            });
        })
});

app.get('/logout', function (req, res) {
    delete req.session.user;
    res.send({redirect: '/log'});
});

// function checkSignIn(req, res){
//     if(req.session.user){
//         next();     //If session exists, proceed to page
//     } else {
//         var err = new Error("Not logged in!");
//         console.log(req.session.user);
//         next(err);  //Error, trying to access unauthorized page!
//     }
// }

app.post("/api/users", jsonParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);

    var userEmail = req.body.email;
    var userPassword = req.body.password;
    var rights;
    if(req.body.email == 'admin'){
        rights = 'admin';
    }else{
        rights = 'user';
    }
    var user = {email: userEmail, password: userPassword, right: rights};

    mongoClient.connect(url, function(err, db){
        db.collection("users").insertOne(user, function(err, result){
            if(err) return res.status(400).send();

            console.log(user);
            res.send(user);
            db.close();
        });
    });
});

app.delete("/api/users/:id", function(req, res){

    var id = new objectId(req.params.id);
    mongoClient.connect(url, function(err, db){
        db.collection("users").findOneAndDelete({_id: id}, function(err, result){

            if(err) return res.status(400).send();

            var user = result.value;
            res.send(user);
            db.close();
        });
    });
});

app.put("/api/users", jsonParser, function(req, res){

    if(!req.body) return res.sendStatus(400);
    var id = new objectId(req.body.id);
    var userEmail = req.body.email;
    var userPassword = req.body.password;

    mongoClient.connect(url, function(err, db){
        db.collection("users").findOneAndUpdate({_id: id}, { $set: {password: userPassword, email: userEmail}},
            {returnOriginal: false },function(err, result){

                if(err) return res.status(400).send();

                var user = result.value;
                res.send(user);
                db.close();
            });
    });
});

app.listen(3000, function(){
    console.log("Сервер ожидает подключения...");
});