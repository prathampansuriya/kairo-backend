import addressService from '../services/addressService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const getUserId = (req) => req.user?._id || req.user?.id || null;

export async function getAddresses(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const addresses = await addressService.getAddresses(userId);
    res.status(200).json(ApiResponse.success(addresses, 'Addresses retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getAddressById(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const { id } = req.params;
    const address = await addressService.getAddressById(userId, id);
    res.status(200).json(ApiResponse.success(address, 'Address retrieved successfully'));
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const newAddress = await addressService.createAddress(userId, req.body);
    res.status(201).json(ApiResponse.success(newAddress, 'Address saved to vault successfully', 201));
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const { id } = req.params;
    const updated = await addressService.updateAddress(userId, id, req.body);
    res.status(200).json(ApiResponse.success(updated, 'Address updated successfully'));
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const { id } = req.params;
    const result = await addressService.deleteAddress(userId, id);
    res.status(200).json(ApiResponse.success(result, 'Address removed successfully'));
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddress(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) throw ApiError.unauthorized('Authentication required', 'UNAUTHORIZED');
    const { id } = req.params;
    const { type } = req.body;
    const updated = await addressService.setDefault(userId, id, type);
    res.status(200).json(ApiResponse.success(updated, `Default ${type} address updated`));
  } catch (err) {
    next(err);
  }
}