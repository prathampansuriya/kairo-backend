import wishlistService from '../services/wishlistService.js';

export async function getWishlist(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const result = await wishlistService.getWishlist(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleWishlist(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId, variantSku } = req.body;

    const result = await wishlistService.toggleWishlistItem({
      userId,
      productId,
      variantSku
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function moveToCart(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { productId, variantSku } = req.body;

    const result = await wishlistService.moveToCart({
      userId,
      productId,
      variantSku
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getWishlist,
  toggleWishlist,
  moveToCart
};
