const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A product name must have less or equal then 40 characters',
      ],
      minlength: [
        3,
        'A product name must have more or equal then 3 characters',
      ],
      // validate: [validator.isAlpha, 'product name must only contain characters']
    },
    slug: String,
    type: {
      type: String,
      required: [true, 'A product must have a type'],
      enum: {
        values: ['franchise', 'game', 'dlc', 'company'],
        message: 'Type is either: franchise, game, dlc or company',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Object,
      required: true,
      validate: [(value) => value.length > 0, 'A product must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    secretProduct: {
      type: Boolean,
      default: false,
    },
    developer: {
      type: [String],
      // required: true,
      // validate: [
      //   (value) => value.length > 0,
      //   'A product must have a developer',
      // ],
    },
    publisher: {
      type: [String],
    },
    release_date: {
      type: Date,
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    __v: {
      type: Number,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
  {
    timestamps: true, // add updatedAt
  }
);

// productSchema.index({ price: 1 });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ startLocation: '2dsphere' });

productSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create() and NOT after .update()
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // this = document
  next();
});

// productSchema.pre('save', async function (next) { // Embedding guides
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
// next();
// });

// productSchema.pre('save', function(next) {
//   console.log('Will save document...');
//   next();
// });

// productSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDLEWARE
// regex to match all methods that start with find => findById is findOne behind the scenes
// productSchema.pre('find', function (next) {
productSchema.pre(/^find/, function (next) {
  this.find({ secretProduct: { $ne: true } }); // this = query object. we can chain all the methods of query

  this.start = Date.now();
  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    // select: '-__v -passwordChangedAt'
  });

  next();
});

// productSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   next();
// });

// AGGREGATION MIDDLEWARE {{URL}}/api/v1/products/product-stats
// productSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretProduct: { $ne: true } } }); // this = aggregation object

//   console.log(this.pipeline());
//   next();
// });

const product = mongoose.model('product', productSchema);

module.exports = product;
