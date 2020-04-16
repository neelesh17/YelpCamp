require('dotenv').config();
const url = process.env.DATABASE_URL ;
// "mongodb://localhost/yelp_camp" ||
const express        = require("express"),
      app            = express(),
      bodyParser     = require("body-parser"),
      mongoose       = require("mongoose"),
      passport       = require("passport"),
      localStrategy  = require("passport-local"),
      flash          = require("connect-flash"),
      methodOverride = require("method-override"),
      User           =  require("./models/user");

const commentRotes     = require("./routes/commnets"),
      campgroundRoutes = require("./routes/campgrounds"),
      forgotRoutes     =require("./routes/reset"),
      reviewRoutes     = require("./routes/reviews"),
      indexRoutes      = require("./routes/index");

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);     
mongoose.set('useFindAndModify', false); 
mongoose.connect(url);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("partials"));
app.set("view engine", "ejs");
app.use(flash());
app.use(express.static(`${__dirname}/public`));
app.use(require("express-session")({
    secret:"Yelp Site Authentication",
    resave: false,
    saveUninitialized: false
}));
app.locals.moment = require("moment");
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
app.use(methodOverride("_method"));

//Requiring Route
app.use("/",indexRoutes);
app.use("/",forgotRoutes);
app.use("/campgrounds",campgroundRoutes);
app.use("/campgrounds/:id/comments",commentRotes);
app.use("/campgrounds/:id/reviews", reviewRoutes);



app.listen(3000 || process.env.PORT,process.env.IP, function(){
    console.log("Yelp Camp has started...");
});
