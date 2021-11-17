const multer = require('multer');
var upload = multer({ dest: __dirname + '/../../techfinderfiles/' }); //setting the default folder for multer

module.exports = upload