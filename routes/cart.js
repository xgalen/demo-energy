var emailTemplates = require('email-templates'),
    nodemailer = require('nodemailer'),
    path = require('path'),
    templatesDir = path.join(__dirname, '../email-templates'),
    smtpTransport = nodemailer.createTransport('SMTP', {
        port: 4040,
        /*hostname: 'localhost.local',
        host: 'localhost',*/
        debug: true
    });
module.exports.get = function (req, res) {
    res.render('view-cart', {
        title: 'Compre ' + res.locals.product.name
    });
};

function sendOrderEmail(product, form, callback) {
    emailTemplates(templatesDir, function (err, template) {
        if (err) {
            console.error(err);
            console.trace(err.stack);
            return callback(err);
        }
        template('order', {
            product: product,
            form: form
        }, function (err, html, text) {
            if (err) {
                console.error(err);
                console.trace(err.stack);
                return callback(err);
            }
            smtpTransport.sendMail({
                from: 'p.revington@gmail.com',
                to: form.email,
                subject: 'Pedido',
                text: text,
                html: html
            }, function (err, status) {
                if (err) {
                    console.error(err);
                    console.trace(err.stack);
                    return callback(err);
                }
                callback(null, status);
            });
        });
    });
}
module.exports.processCart = function (req, res, next) {
    sendOrderEmail(res.locals.product, req.body, function (err, status) {
        if (err) {
            res.locals.messages = res.locals.messages || [];
            res.locals.messages.push({
                type: 'error',
                foreword: 'Ups',
                text: 'Lo sentimos ha habido un error en su pedido. Por favor inténtelo otra vez'
            });
            return res.render('view-cart', {
                title: 'Compre ' + res.locals.product.name,
                form: req.body
            });
        }
        req.pushMessage('success', 'Pedido realizo', 'Gracias ' + req.body.name + ' su pedido se realizó correctamente. En breve recibirá un email de confirmación');
        res.redirect('/');
    });
};
