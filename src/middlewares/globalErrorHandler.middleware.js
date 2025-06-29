const errorHandler = (err, req, res, next) => {
  console.error('💥', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    status: err.status || 'error',
    message,
  });
};

export default errorHandler;
