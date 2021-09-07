const multer = require('multer');

module.exports = (imageFile) => {
  const storage = multer.diskStorage({
    destination: function (request, file, cb) {
      cb(null, 'uploads');
    },
    filename: function (request, file, cb) {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, ''));
    },
  });

  const fileFilter = function (request, file, cb) {
    if (file.filename === imageFile) {
      if (!file.originalname.match(/\.(jpg|JPG|jpeg|jpeg|png|PNG||mp4||mp3||MP4||MP3||m4a||M4A)$/)) {
        request.fileValidationError = {
          message: 'Only image/audio files are allowed!',
        };
        return cb(new Error('Only image/audio files are allowed!'), false);
      }
    }
    cb(null, true);
  };

  const sizeInMb = 10;
  const maxSize = sizeInMb * 10000 * 1000;

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  }).single(imageFile);

  return function (request, response, next) {
    upload(request, response, function (err) {
      // if (request.fileValidationError) {
      //   request.session.message = {
      //     type: 'danger',
      //     message: 'Please select file to upload',
      //   };
      //   return response.redirect(request.originalUrl);
      // }

      if (err) {
        if (err.code == 'LIMIT_FILE_SIZE') {
          request.session.message = {
            type: 'danger',
            message: 'Error, Max file size 10MB',
          };
          return response.redirect(request.originalUrl);
        }

        request.session.message = {
          type: 'danger',
          message: err,
        };
        return response.redirect(request.originalUrl);
      }

      return next();
    });
  };
};