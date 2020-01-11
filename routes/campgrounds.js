const express       = require("express"),
      router        = express.Router(),
      Campground    = require("../models/campgrounds"),
      Comment       = require("../models/comments"),
      Review        = require("../models/reviews"),
      middleware    = require("../middleware"); //we did not put /index in the route because index.js is a special file.
                                     // That is automatically required if we require the directory

//configuring multer for image upload        
var multer = require('multer');
var storage = multer.diskStorage({
filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
}
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
cloud_name: 'dqtcm5xy3', 
api_key: process.env.CLOUDINARY_API_KEY, 
api_secret: process.env.CLOUDINARY_API_SECRET
});     
                                                                                    

//INDEX Route
router.get("/",function(req,res){
    var noMatch = null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex},function(err,campGrounds){
            if(err){
                req.flash("error","No Campgrounds Found");
            } else {
                if(campGrounds.length < 1) {
                    noMatch = "No campgrounds match that query, please try again.";
                }
                res.render("campgrounds/index",{campGrounds: campGrounds, page:'campgrounds',noMatch: noMatch});
            }
        });
    } else {
        Campground.find({},function(err,campGrounds){
            if(err){
                req.flash("error","No Campgrounds Found");
            } else {
                res.render("campgrounds/index",{campGrounds: campGrounds, page:'campgrounds',noMatch: noMatch});
            }
        });
    }
});

//NEW Route
router.get("/new",middleware.isLoggedIn,function(req,res){
    res.render("campgrounds/new");
});

//SHOW Route
router.get("/:id",function(req,res){
    Campground.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err){
            req.flash("error","Campground Not Found");
        } else {
            res.render("campgrounds/show",{campgrounds: foundCampground});
        }
    });
});

//CREATE Route
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err,result) {
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        req.body.campground.imageId = result.public_id;
        // add author to campground
        req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
        }
        Campground.create(req.body.campground, function(err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            req.flash("success","Successfully Created Campground");
            res.redirect('/campgrounds/' + campground.id);
        });
    });
});

//EDIT Route
router.get("/:id/edit",middleware.checkCampOwnership,function(req,res){
    Campground.findById(req.params.id,function(err,foundCampground){
        res.render("campgrounds/edit",{campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampOwnership, upload.single('image'),function(req, res){
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;    
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });

//DESTROY Route
router.delete("/:id",middleware.checkCampOwnership,function(req,res){
    Campground.findById(req.params.id,async function(err,removedCampground){
        if(err){
            req.flash("error","Campground Not Found");
            return res.redirect("/campgrounds");
        }
        try {
            await cloudinary.v2.uploader.destroy(removedCampground.imageId);
            await Comment.deleteMany({_id: { $in: removedCampground.comments }});
            await Review.deleteMany({_id: {$in: removedCampground.reviews}});
            removedCampground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
    });
});

// Campground Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/campgrounds");
        }
        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;