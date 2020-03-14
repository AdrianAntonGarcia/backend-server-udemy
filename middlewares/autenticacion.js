var jwt = require('jsonwebtoken');
var SEED = require('../config/config').SEED;
/**
 * Verificar token
 * Cualquier ruta que siga por aquí va a pasar por la verificación de token
 */

exports.verificaToken = function(req, res, next) {
    var token = req.query.token;

    jwt.verify(token, SEED, (err, decoded) => {
        if (err) {
            // 401: Unauthorized
            return res.status(401).json({
                ok: false,
                mensaje: 'Token incorrecto',
                errors: err
            });
        }

        /**
         * Modificamos la rquest y le añadimos el payload que viene 
         * de la verificación del jwt, que contiene el usuario.
         */
        req.usuario = decoded.usuario;
        next();
    });
};