import { Router } from 'express';
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = Router();

// router.param('id', productController.checkID);

// POST /product/234fad4/reviews
// GET /product/234fad4/reviews

router.use('/:productId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(productController.aliasTopProducts, productController.getAllProducts);

router.route('/product-stats').get(productController.getProductStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    productController.getMonthlyPlan
  );

router
  .route('/products-within/:distance/center/:latlng/unit/:unit')
  .get(productController.getProductsWithin);
// /products-within?distance=233&center=-40,45&unit=mi
// /products-within/233/center/-40,45/unit/mi

router
  .route('/distances/:latlng/unit/:unit')
  .get(productController.getDistances);

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    productController.createProduct
  );

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    productController.deleteProduct
  );

module.exports = router;
