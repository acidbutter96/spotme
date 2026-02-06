'use strict';

/**
 * New Relic agent configuration.
 * This file is loaded automatically when using `-r newrelic`.
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'music-app'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [],
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true,
    },
  },
  distributed_tracing: {
    enabled: true,
  },
};
