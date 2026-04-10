/**
 * Standardized API response helpers
 * Every controller should use these instead of res.json() directly
 * Ensures consistent response shape across the whole API
 */

/**
 * Success response
 * @param {Response} res - Express response object
 * @param {number}   status  - HTTP status code (default 200)
 * @param {string}   message - Human-readable message
 * @param {any}      data    - Response payload
 * @param {object}   meta    - Optional pagination / extra info
 */
const success = (res, status = 200, message = "Success", data = null, meta = null) => {
  const response = { success: true, message };
  if (data !== null)  response.data = data;
  if (meta !== null)  response.meta = meta;
  return res.status(status).json(response);
};

/**
 * Error response
 * @param {Response} res   - Express response object
 * @param {number}   status  - HTTP status code (default 500)
 * @param {string}   message - Human-readable error message
 * @param {any}      errors  - Optional validation errors / details
 */
const error = (res, status = 500, message = "Internal server error", errors = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(status).json(response);
};

/**
 * Paginated response helper
 * @param {Response} res
 * @param {Array}    items      - Array of results
 * @param {number}   total      - Total count
 * @param {number}   page       - Current page (1-indexed)
 * @param {number}   pageSize   - Items per page
 */
const paginated = (res, items, total, page, pageSize, message = "Success") => {
  return res.status(200).json({
    success:  true,
    message,
    data:     items,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNext:    page * pageSize < total,
      hasPrev:    page > 1,
    },
  });
};

module.exports = { success, error, paginated };
