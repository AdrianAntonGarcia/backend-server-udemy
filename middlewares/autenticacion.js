var jwt = require("jsonwebtoken");
var SEED = require("../config/config").SEED;
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
				mensaje: "Token incorrecto",
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

/**
 * Verificar ADMIN
 * Cualquier ruta que siga por aquí va a pasar por la verificación de admin
 */

exports.verificaADMIN_ROLE = function(req, res, next) {
	var usuario = req.usuario;
	if (usuario.role === "ADMIN_ROLE") {
		next();
		return;
	}else{
		return res.status(401).json({
			ok: false,
			mensaje: "Token incorrecto - No es administrador",
			errors: {message: 'No es administrador, no puede hace eso'}
		});
	}
};

/**
 * Verificar ADMIN o Mismo Usuario
 * Cualquier ruta que siga por aquí va a pasar por la verificación de admin o es el mismo usurio
 */

exports.verificaADMIN_ROLE_o_MismoUsuario = function(req, res, next) {
	var usuario = req.usuario;
	var id = req.params.id;

	if (usuario.role === "ADMIN_ROLE" || usuario._id === id) {
		next();
		return;
	}else{
		return res.status(401).json({
			ok: false,
			mensaje: "Token incorrecto - No es administrador ni es el mismo usuario",
			errors: {message: 'No es administrador, no puede hace eso'}
		});
	}
};
