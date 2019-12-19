const express       = require("express"),
      router        = express.Router({mergeParams: true}),
      Campground    = require("../models/campgrounds"), 
      Comment       = require("../models/comments"),
      middleware    = require("../middleware");

//NEW Route
router.get("/new",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id, function(err,campground){
        if(err){
            req.flash("error","Comment Coul Not Be Created");
            res.send("/campgrounds")
        } else {
            res.render("comments/new",{campground: campground});
        }
    }); 
});

//Create Route
router.post("/",middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id,function(err,campground){
        if(err){
            req.flash("error","Something Went Wrong");
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment,function(err,newComment){
                if(err){
                    req.flash("error","Somethign Went Wrong");
                } else {
                    //add the userame and id of the user
                    newComment.author.id = req.user._id;
                    newComment.author.username = req.user.username;
                    newComment.save();
                    //save comment
                    campground.comments.push(newComment);
                    campground.save();
                    req.flash("sucess","Successfully added comment");
                    res.redirect(`/campgrounds/${campground._id}`);
                }
            });
        }
    });
});

//EDIT Route
router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
    Comment.findById(req.params.comment_id,function(err,foundComment){
        if(err){
            req.flash("error","Something Went Wrong");
            res.redirect("back");
        } else {
            res.render("comments/edit",{comment: foundComment,campground_id: req.params.id});
        }
    })
});
//UPDATE Route
router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedCommment){
        if(err){
            req.flash("error","Something Went Wrong");
            res.redirect("back");
        } else {
            req.flash("success","Comment Updated Successfully");
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    });
});
//DESTROY Route
router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndDelete(req.params.comment_id,function(err){
        if(err){
            req.flash("error","Something Went Wrong");
            res.redirect("back");
        } else {
            req.flash("success","Comment Deleted");
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    });  
});


module.exports = router;