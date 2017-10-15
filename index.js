// OPTIONS:
// squeezeprotection - basically makes input image larger
exports.write = function (image_path_in, image_path_write, image_path_out, options) {
    if (typeof options === 'undefined') { options = {} }
    if (typeof options.callback === 'undefined') { options.callback = function () { } }
    if (typeof options.squeeze_protection === 'undefined') { options.squeeze_protection = 1 }
    var squeeze_protection = options.squeeze_protection
    var Jimp = require("jimp")
    Jimp.read(image_in, function (err, data) {
        if (err) {
            throw err
        }
        Jimp.read(image_write, function (err_write, data_write) {
            //if (err_write) {
            //    throw err_write
            //}
            var imagematrix = []
            data_write.scan(0, 0, data_write.bitmap.width, data_write.bitmap.height, function (x, y, idx) {
                if (x == 0) {
                    imagematrix.push([])
                }
                var r = Math.round(this.bitmap.data[idx + 0] / 255)
                var g = Math.round(this.bitmap.data[idx + 1] / 255)
                var b = Math.round(this.bitmap.data[idx + 2] / 255)
                imagematrix[y].push(((r * 4) + (g * 2) + (b * 1)))
            })
            // image matrix contains the compressed, "basicifyied" image
            data.scan(0, 0, data.bitmap.width, data.bitmap.height, function (x, y, idx) {
                var matrix_x = Math.floor(x / squeeze_protection) % data_write.bitmap.width
                var matrix_y = Math.floor(y / squeeze_protection) % data_write.bitmap.height

                var r = this.bitmap.data[idx + 0]
                var g = this.bitmap.data[idx + 1]
                var b = this.bitmap.data[idx + 2]
                r = bit_write(r, 0, bit_read(imagematrix[matrix_y][matrix_x], 2))
                g = bit_write(g, 0, bit_read(imagematrix[matrix_y][matrix_x], 1))
                b = bit_write(b, 0, bit_read(imagematrix[matrix_y][matrix_x], 0))

                this.bitmap.data[idx + 0] = r
                this.bitmap.data[idx + 1] = g
                this.bitmap.data[idx + 2] = b
            })

            data.write(image_out, options.callback())
        })
    })
}

exports.read = function (image_in, image_out, options) {
    if (typeof options === 'undefined') { options = {} }
    if (typeof options.callback === 'undefined') { options.callback = function () { } }
    var Jimp = require("jimp")
    Jimp.read(image_in, function (err, data) {
        if (err) {
            throw err
        }
        var iOut = new Jimp(data.bitmap.width, data.bitmap.height, function (err, image) {
            if (err) {
                throw err; // :D
            }
            data.scan(0, 0, data.bitmap.width, data.bitmap.height, function (x, y, idx) {
                image.setPixelColor(((bit_read(this.bitmap.data[idx], 0) * 255) << 24) + ((bit_read(this.bitmap.data[idx + 1], 0) * 255) << 16) + ((bit_read(this.bitmap.data[idx + 2], 0) * 255) << 8) + 255, x, y)
            })
            image.write(image_out, options.callback())
        })
    })
}

//write("in.png", "secret.png", "out.png", function () {
//    //read("out.png", "extracted.png")
//}
////    , {
////    "squeezeprotection": 4
//    //}
//    , 4)

//read("out.png", "extracted.png")

function bit_read(num, bit) {
    return ((num >> bit) % 2)
}

function bit_set(num, bit) {
    return num | 1 << bit;
}

function bit_clear(num, bit) {
    return num & ~(1 << bit);
}

function bit_write(num, idx, bit) {
    return bit == 0 ? bit_clear(num, idx) : bit_set(num, idx);
}
