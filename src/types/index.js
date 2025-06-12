// src/types/index.js - JSDoc type definitions (optional but helpful)
/**
 * @typedef {Object} RouteWithStores
 * @property {string} id
 * @property {string} userId
 * @property {Date} routeDate
 * @property {string} startingPoint
 * @property {string} departureTime
 * @property {string} status
 * @property {number} totalDistance
 * @property {number} totalTime
 * @property {string} completionTime
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Array} stores
 * @property {Object} user
 */

/**
 * @typedef {Object} OptimizationResult
 * @property {Array} optimizedStores
 * @property {Object} summary
 * @property {number} summary.visitedStores
 * @property {number} summary.unreachableStores
 * @property {number} summary.totalDistance
 * @property {number} summary.totalTime
 * @property {string} summary.completionTime
 * @property {Array} unreachableStores
 */

/**
 * @typedef {Object} StoreInput
 * @property {string} distributorId
 * @property {string} storeName
 * @property {string} coordinates
 * @property {'A'|'B'|'C'|'D'} priority
 * @property {number} visitTime
 */
