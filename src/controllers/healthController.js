import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

export const getHealth = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const isDbHealthy = mongoose.connection.readyState === 1;
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: isDbHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database: {
      status: dbStateMap[mongoose.connection.readyState] || 'unknown',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || null
    },
    memory: {
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100
    }
  };

  return res.status(200).json(ApiResponse.success(healthData, 'KAIRO API Service Operational'));
};

export const getReadiness = (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      error: {
        code: 'DATABASE_NOT_READY',
        message: 'Database is not connected. Service is not ready to accept traffic.'
      }
    });
  }

  return res.status(200).json(ApiResponse.success(
    {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    },
    'KAIRO API is ready to accept traffic'
  ));
};

export default { getHealth, getReadiness };
