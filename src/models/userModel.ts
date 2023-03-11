import crypto from 'crypto';
import { model, Schema } from 'mongoose';
import type { InferSchemaType } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

interface IUser extends InferSchemaType<typeof userSchema> {
  password: string;
}

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please enter your first name!'],
    },
    lastName: {
      type: String,
      required: [true, 'Please enter your last name!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    dateOfBirth: {
      type: Date,
      // required: [true, 'Please enter your date of birth!'],
    },
    phoneNumber: {
      type: String,
      // required: [true, 'Please enter your phone number!'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!! So on updating a user, we need to use Save as well and not findOneAndUpdate
        validator: function (this: IUser, element: string) {
          return element === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    // passwordChangedAt: Date,
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    // passwordResetToken: String,
    passwordResetToken: {
      type: String,
      select: false,
    },
    // passwordResetExpires: Date,
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    __v: {
      type: Number,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    newEmailToken: {
      type: String,
      select: false,
    },
    newEmailExpires: {
      type: Date,
      select: false,
    },
    candidateEmail: {
      type: String,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      select: false,
    },
    googleId: {
      type: String,
    },
    locale: {
      type: String,
    },
  },
  {
    timestamps: true, // add updatedAt
    /*
Do not declare methods using ES6 arrow functions (=>).
Arrow functions explicitly prevent binding this, so your method will not have access to the document
*/
    methods: {
      async correctPassword(candidatePassword: string, userPassword: string) {
        return await bcrypt.compare(candidatePassword, userPassword);
      },
      changedPasswordAfter(JWTTimestamp?: number) {
        if (this.passwordChangedAt) {
          const a = this.passwordChangedAt.getTime() / 1000;
          const changedTimestamp = parseInt(
            (this.passwordChangedAt.getTime() / 1000).toString(), //convert to seconds
            10 //specify the radix (the base in mathematical numeral systems)
          );

          return Number(JWTTimestamp) < changedTimestamp;
        }

        // False means NOT changed
        return false;
      },
      createPasswordResetToken() {
        const resetToken = crypto.randomBytes(32).toString('hex');

        this.passwordResetToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');

        console.log({ resetToken }, this.passwordResetToken);

        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        return resetToken;
      },
      createEmailVerificationToken() {
        const verificationToken = crypto.randomBytes(32).toString('hex');

        this.emailVerificationToken = crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex');

        console.log({ verificationToken }, this.emailVerificationToken);

        this.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

        return verificationToken;
      },
      createNewEmailToken() {
        const NewEmailToken = crypto.randomBytes(32).toString('hex');

        this.newEmailToken = crypto
          .createHash('sha256')
          .update(NewEmailToken)
          .digest('hex');

        console.log({ NewEmailToken }, this.newEmailToken);

        this.newEmailExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

        return NewEmailToken;
      },
    },
    virtuals: {
      fullName: {
        get(value: string, virtual, doc) {
          return this.firstName + ' ' + this.lastName;
        },
        set(value: string, virtual, doc) {
          this.firstName = value.substr(0, value.indexOf(' '));
          this.lastName = value.substr(value.indexOf(' ') + 1);
        },
      },
    },
  }
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.set('passwordConfirm', undefined);
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000); //Subtract 1 second to make sure the token is created before the password was changed
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model('User', userSchema);
