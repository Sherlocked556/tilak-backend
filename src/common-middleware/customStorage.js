const fs = require("fs");
const sharp = require("sharp");

function getDestination(req, file, cb) {
  cb(null, "/dev/null");
}

function customStorage(opts) {
  this.getDestination = opts.destination || getDestination;
}

customStorage.prototype._handleFile = function _handleFile(req, file, cb) {
  this.getDestination(req, file, function (err, path) {
    if (err) return cb(err);

    var outStream = fs.createWriteStream(path);
    var transform = sharp()
      .resize({
        width: 500,
        height: 400
      })
      .toFormat("jpeg")
      .jpeg();

    file.stream.pipe(transform).pipe(outStream);
    outStream.on("error", cb);
    outStream.on("finish", function () {
      cb(null, {
        path: path,
        size: outStream.bytesWritten,
      });
    });
  });
};

customStorage.prototype._removeFile = function _removeFile(req, file, cb) {
  fs.unlink(file.path, cb);
};

module.exports = function (opts) {
  return new customStorage(opts);
};
