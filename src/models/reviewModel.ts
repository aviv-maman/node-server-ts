// review / rating / createdAt / ref to product / ref to user
import { model, Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';
import { ProductModel } from './productModel';

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product.'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    __v: {
      type: Number,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    statics: {
      async calcAverageRatings(this, productId: string) {
        const stats = await this.aggregate([
          //this => the model. we need to aggregate always on the model
          {
            $match: { product: productId },
          },
          {
            $group: {
              _id: '$product',
              nRating: { $sum: 1 },
              avgRating: { $avg: '$rating' },
            },
          },
        ]);
        if (stats.length > 0) {
          await ProductModel.findByIdAndUpdate(productId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating,
          });
        } else {
          await ProductModel.findByIdAndUpdate(productId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5,
          });
        }
      },
    },
  }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'product',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

interface IReview extends Review {
  calcAverageRatings(productId: string): Promise<any>;
  r: any;
}

/////////////////////////////////////////////////////
reviewSchema.post('save', function (doc: IReview) {
  // this points to current review
  doc.calcAverageRatings(this.product.toString());
});

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(
  /^findOneAnd/,
  { document: true, query: false },
  async function (this, next) {
    const review = await this.findOne().clone(); // r = review
    this.set({ r: review });
    next();
  }
);

reviewSchema.post(/^findOneAnd/, async function (this: IReview) {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.product.toString());
});
/////////////////////////////////////////////////////

export type Review = InferSchemaType<typeof reviewSchema>;
export const ReviewModel = model('Review', reviewSchema);
