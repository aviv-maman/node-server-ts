import type { Query } from 'mongoose';

type QueryString = {
  type?: string;
  name?: string;
  release_date?: string;
  from_date?: string;
  to_date?: string;
  until_date?: string;
  exact_price?: { currency: string; price: string };
  price_range?: { currency: string; minPrice: string; maxPrice: string };
  sort?: string;
  fields?: string;
  page?: string;
  limit?: string;
  count?: number;
};

export class APIFeatures {
  query: Query<any, any, any, any>;
  queryString: QueryString;
  constructor(query: Query<any, any, any, any>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      'page',
      'sort',
      'limit',
      'fields',
      'type',
      'name',
      'release_date',
      'from_date',
      'to_date',
    ];
    excludedFields.forEach(
      (element) =>
        delete (queryObj as unknown as keyof QueryString as any)[element]
    );

    // 1B) Advanced filtering
    // { difficulty: 'easy', duration: { $gte: 5 } }
    //  /api/v1/products?difficulty=easy&duration[gte]=5
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  typeFilter() {
    if (this.queryString.type) {
      const filterByType = this.queryString.type.split(',').join(', ');
      this.query = this.query.find({ type: { $in: filterByType } });
    } else {
      this.queryString.type = undefined;
    }

    return this;
  }

  nameFilter() {
    if (this.queryString.name) {
      const filterByName = this.queryString.name;
      // this.query = this.query.find({
      //   name: { $text: { $search: filterByName, $caseSensitive: false } },
      // });
      this.query = this.query.find({
        name: { $regex: filterByName, $options: 'i' },
      });
    } else {
      this.queryString.name = undefined;
    }

    return this;
  }

  exactDateFilter() {
    if (this.queryString.release_date) {
      const [year, month, day] = this.queryString.release_date.split('-');
      const exactDate = new Date(Number(year), Number(month) - 1, Number(day));
      this.query = this.query.find({
        release_date: exactDate instanceof Date ? exactDate : null,
      });
    } else {
      this.queryString.release_date = undefined;
    }

    return this;
  }

  fromDateFilter() {
    if (this.queryString.from_date) {
      const [year, month, day] = this.queryString.from_date.split('-');
      const fromDate = new Date(Number(year), Number(month) - 1, Number(day));
      this.query = this.query.find({
        release_date: { $gte: fromDate instanceof Date ? fromDate : null },
      });
    } else {
      this.queryString.from_date = undefined;
    }

    return this;
  }

  untilDateFilter() {
    if (this.queryString.until_date) {
      const [year, month, day] = this.queryString.until_date.split('-');
      const untilDate = new Date(Number(year), Number(month) - 1, Number(day));
      this.query = this.query.find({
        release_date: { $lte: untilDate instanceof Date ? untilDate : null },
      });
    } else {
      this.queryString.until_date = undefined;
    }

    return this;
  }

  exactPriceFilter() {
    if (this.queryString.exact_price) {
      const { currency, price } = this.queryString.exact_price;
      if (!currency) {
        this.queryString.exact_price.currency = 'usd';
      }
      if (price) {
        this.query = this.query.find({
          [`price.${this.queryString.exact_price.currency}`]: Number(price),
        });
      }
    } else {
      this.queryString.exact_price = undefined;
    }

    return this;
  }

  minPriceFilter() {
    if (this.queryString.price_range) {
      const { currency, minPrice } = this.queryString.price_range;
      if (!minPrice) {
        return this;
      }
      if (!currency) {
        this.queryString.price_range.currency = 'usd';
      }
      this.query = this.query.find({
        [`price.${currency}`]: {
          $gte: Number(minPrice),
        },
      });
    } else {
      this.queryString.exact_price = undefined;
    }

    return this;
  }

  maxPriceFilter() {
    if (this.queryString.price_range) {
      const { currency, maxPrice } = this.queryString.price_range;
      if (!maxPrice) {
        return this;
      }
      if (!currency) {
        this.queryString.price_range.currency = 'usd';
      }
      this.query = this.query.find({
        [`price.${currency}`]: {
          $lte: Number(maxPrice),
        },
      });
    } else {
      this.queryString.exact_price = undefined;
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  // Field limiting: select only the fields we want to show in the response
  // -__v: exclude the __v field
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  count() {
    this.queryString.count = Number(this.query.count()) || 0;
    return this;
  }
}
