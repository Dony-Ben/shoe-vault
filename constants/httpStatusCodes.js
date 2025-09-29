 const STATUS_CODES = {
    Success: 200,            
    OK: 200,
    Created: 201,
    Accepted: 202,
    NoContent: 204,

    MovedPermanently: 301,
    Found: 302,
    NotModified: 304,

    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    Conflict: 409,
    Gone: 410,
    TooManyRequests: 429,
    UnprocessableEntity: 422,

    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
};

module.exports = {STATUS_CODES};