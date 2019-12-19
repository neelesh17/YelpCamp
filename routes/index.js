const express     = require("express"),
      router      = express.Router(),
      passport    = require("passport"),
      User        =  require("../models/user");


//ROOT Route
router.get("/",function(req,res){
    res.render("landingPage")    
});

//show registration form
router.get("/register",function(req,res){
    res.render("logins/register",{page: 'register'});
});

//handle sign up 
router.post("/register",function(req,res){
    let newUser = new User(
        {
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            avatar: req.body.avatarUrl,
            email: req.body.email
        });
    if(req.body.adminCode === "secret123"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            req.flash("error", err.message);
            res.redirect("/register");
        }
        passport.authenticate("local")(req,res,function(){
            req.flash("success",`Welcome To Yelp Camp ${user.username}`);
            res.redirect("/campgrounds");
        });
    });
});

//show login form
router.get("/login",function(req,res){
    res.render("logins/login",{page: 'login'});
});
//handle login logic
router.post("/login",passport.authenticate("local",{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req,res){
});

//logout Route
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged You Out");
    res.redirect("/campgrounds");
});

//UserProfile
router.get("/users/:id",function(req,res){
    User.findById(req.params.id,function(err,foundUser){
        if(err){
            req.flash("err","User Not Found");
            return res.redirect("/campgrounds");
        }
        res.render("users/show", {user: foundUser});
    })
});

module.exports = router;