import { Address } from '../models/Address.js';
import { ApiError } from '../utils/ApiError.js';

export class AddressService {
  /**
   * List all addresses for a customer, defaults first
   */
  async getAddresses(userId) {
    return Address.find({ userId })
      .sort({ isDefaultShipping: -1, isDefaultBilling: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Alias for backward compatibility with controllers calling getUserAddresses
   */
  async getUserAddresses(userId) {
    return this.getAddresses(userId);
  }

  /**
   * Retrieve single address with strict customer ownership check
   */
  async getAddressById(userId, addressId) {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized', 'ADDRESS_NOT_FOUND');
    }
    return address;
  }

  /**
   * Create new address for customer
   */
  async createAddress(userId, addressData) {
    // If setting as default shipping, unset existing default
    if (addressData.isDefaultShipping) {
      await Address.updateMany({ userId, isDefaultShipping: true }, { isDefaultShipping: false });
    }

    // If setting as default billing, unset existing default
    if (addressData.isDefaultBilling) {
      await Address.updateMany({ userId, isDefaultBilling: true }, { isDefaultBilling: false });
    }

    // If this is the user's very first address, automatically make it default
    const count = await Address.countDocuments({ userId });
    const isFirst = count === 0;

    const address = await Address.create({
      ...addressData,
      userId,
      isDefaultShipping: addressData.isDefaultShipping || isFirst,
      isDefaultBilling: addressData.isDefaultBilling || isFirst
    });

    return address;
  }

  /**
   * Update address with customer ownership check
   */
  async updateAddress(userId, addressId, updateData) {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized', 'ADDRESS_NOT_FOUND');
    }

    if (updateData.isDefaultShipping) {
      await Address.updateMany(
        { userId, _id: { $ne: addressId }, isDefaultShipping: true },
        { isDefaultShipping: false }
      );
    }

    if (updateData.isDefaultBilling) {
      await Address.updateMany(
        { userId, _id: { $ne: addressId }, isDefaultBilling: true },
        { isDefaultBilling: false }
      );
    }

    Object.assign(address, updateData);
    await address.save();
    return address;
  }

  /**
   * Delete address with customer ownership check
   */
  async deleteAddress(userId, addressId) {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized', 'ADDRESS_NOT_FOUND');
    }

    // If default shipping was deleted, promote another address to default
    if (address.isDefaultShipping) {
      const another = await Address.findOne({ userId });
      if (another) {
        another.isDefaultShipping = true;
        await another.save();
      }
    }

    return { message: 'Address removed successfully' };
  }

  /**
   * Validate address ownership for order snapshot creation
   */
  async validateAddressOwnership(userId, addressId) {
    const address = await Address.findOne({ _id: addressId, userId }).lean();
    if (!address) {
      throw ApiError.badRequest('Selected address is invalid or not owned by user', 'INVALID_ADDRESS');
    }
    return address;
  }

  /**
   * Set address as default shipping or billing
   * @param {string} userId
   * @param {string} addressId
   * @param {'shipping'|'billing'} type
   */
  async setDefault(userId, addressId, type = 'shipping') {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw ApiError.notFound('Address not found or unauthorized', 'ADDRESS_NOT_FOUND');
    }

    if (type === 'shipping') {
      await Address.updateMany(
        { userId, _id: { $ne: addressId }, isDefaultShipping: true },
        { isDefaultShipping: false }
      );
      address.isDefaultShipping = true;
    } else if (type === 'billing') {
      await Address.updateMany(
        { userId, _id: { $ne: addressId }, isDefaultBilling: true },
        { isDefaultBilling: false }
      );
      address.isDefaultBilling = true;
    } else {
      throw ApiError.badRequest("Invalid default type. Must be 'shipping' or 'billing'", 'INVALID_DEFAULT_TYPE');
    }

    await address.save();
    return address;
  }
}

export const addressService = new AddressService();
export default addressService;
