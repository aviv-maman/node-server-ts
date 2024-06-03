Server written in TypeScript and built with Node.js, Express, MongoDB and Mongoose.

## Features

- RESTful API
- CRUD operations
- Authentication and authorization
- Password reset by sending emails
- Image upload

## Built with

- [Node.js](https://nodejs.org)
- [Express](https://expressjs.com)
- [MongoDB](https://www.mongodb.com)

## Usage

1. Clone the repository

```
git clone https://github.com/aviv-maman/node-server-ts
```

2. Create a `.env` file and fill in the required environment variables according to the next steps.

3. Sign Up on [MongoDB](https://www.mongodb.com) to get your MongoDB URI and password from your MongoDB Atlas cluster and add it to `MONGO_URI` and `MONGO_PASSWORD`.

4. Sign Up on [Google](https://console.cloud.google.com) to get your Google client ID and client secret from your Google console account and add them to `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

5. Sign Up on [Cloudinary](https://cloudinary.com) to get your Cloudinary cloud name, API key, and API secret from your Cloudinary account and add them to `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

6. Write a secret to `JWT_SECRET`.

7. Sign Up on [Nodemailer](https://www.nodemailer.com) to get your Nodemailer host, port, username and password and add them to `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`.

8. Install dependencies

```
npm install
```

9. Run the development server

```
npm run dev
```
