import { ApiResponse } from '../utils/ApiResponse.js';
import * as newsletterService from '../services/newsletterService.js';

export const subscribeHandler = async (req, res, next) => {
  try {
    const { email, source } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const result = await newsletterService.subscribe({
      email,
      source,
      ipAddress,
      userAgent
    });

    return res.status(200).json(ApiResponse.success(result, result.message));
  } catch (error) {
    next(error);
  }
};

export const unsubscribeHandler = async (req, res, next) => {
  try {
    const email = req.body.email || req.query.email;
    const token = req.body.token || req.query.token;

    const result = await newsletterService.unsubscribe({ email, token });
    return res.status(200).json(ApiResponse.success(result, result.message));
  } catch (error) {
    next(error);
  }
};

export const getStatsHandler = async (req, res, next) => {
  try {
    const stats = await newsletterService.getSubscriberStats();
    return res.status(200).json(ApiResponse.success(stats, 'Real subscriber statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

export const listSubscribersHandler = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await newsletterService.listSubscribers({ page, limit, status, search });
    return res.status(200).json(ApiResponse.success(result, 'Subscribers retrieved'));
  } catch (error) {
    next(error);
  }
};

export default {
  subscribeHandler,
  unsubscribeHandler,
  getStatsHandler,
  listSubscribersHandler
};

