const Campground    = require("../models/campgrounds"),
      Review        = require("../models/reviews"),
      Comment       = require("../models/comments");
let middlewareObject = {};

middlewareObject.checkCommentOwnership = function(req,res,next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id,function(err,foundComment){
            if(err){
                req.flash("error","Something Went Wrong");
                return res.redirect("back");
            } 
            //we use .equals because fundCampground.author.id is a mongoose object whereas req.user._is is a string therfore === wont work
            if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                next();
            } else {
                req.flash("error","You Dont Have Permission To Do That");
                return res.redirect("back");
            }
        });
    } else {
        req.flash("error","You Need To Be Logged In To Do That");
        res.redirect("back");
    }
}

middlewareObject.isLoggedIn = function (req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You Need To Be Logged In To Do That");
    res.redirect("/login");
}

middlewareObject.checkCampOwnership = function (req,res,next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id,function(err,foundCampground){
            if(err){
                req.flash("error","Something Went Wrong");
                return res.redirect("back");
            } 
            //we use .equals because fundCampground.author.id is a mongoose object whereas req.user._is is a string therfore === wont work
            if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                next();
            } else {
                req.flash("error","You Dont Have Permission To Do That");
                return res.redirect("back");
            }
            
        });
    } else {
        req.flash("error","You Need To Be Logged In To Do That");
        res.redirect("back");
    }
}
middlewareObject.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

middlewareObject.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in foundCampground.reviews
                var foundUserReview = foundCampground.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/campgrounds/" + foundCampground._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = middlewareObject;