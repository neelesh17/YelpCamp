const mongoose = require("mongoose");

// SCHMA SETUP
let campgroundSchema  = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    price: String,
    location: String,
    lat: Number,
    lng: Number,
    description: String,
    createdAt: { type: Date, default: Date.now },
    author:{
       id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
       },
       username: String
    },
    reviews: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
         }
      ],
    rating: {
         type: Number,
         default: 0
      },
    comments: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "Comment"
        }
     ],
    likes: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
         }
      ]
});
module.exports = mongoose.model("Campground", campgroundSchema);