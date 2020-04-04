var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;
var CLIENT_ID = require('../config/config').CLIENT_ID;

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);


var app = express();
var Usuario = require('../models/usuario');

var mdAutenticacion = require('../middlewares/autenticacion');

/**
 * Servicio que renueva el token del usuario
 */

app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {
	// Lo prolongamos por 4 horas
	var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas
	// Aquí el token es válido
	res.status(200).json({
		ok: true,
		usuario: req.usuario,
		token
	});

});

/**
 * Login google
 */

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    // Aquí está toda la información del usuario
    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true,
        payload
    };
}

app.post('/google', async(req, res) => {
    var token = req.body.token;
    var googleUser = await verify(token).catch((e) => {
        // return res.status(400).json({
        //     ok: false,
        //     mensaje: 'Token no válido',
        //     error: e
        // });

    });
    if (googleUser === undefined) {
        return res.status(403).json({
            ok: false,
            mensaje: 'Token no válido'
        });
    } else {
        Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuarios login google',
                    errors: err
                });
            }
            // Entonces ya existe
            if (usuarioDB) {
                /**
                 * Si el correo ya estaba registrado y no fue por la autenticación por google
                 * hay que sacarlo
                 */
                if (usuarioDB.google === false) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Debe usar su autenticación normal'
                    });
                } else {
                    /**
                     * Si el usuario existe hacemos login
                     */
                    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                    /**
                     * Devolvemos el token que luego el usuario nos tiene que mandar para poder hacer las operaciones
                     */

                    res.status(200).json({
                        ok: true,
                        usuario: usuarioDB,
                        token: token,
						id: usuarioDB._id,
						menu: obtenerMenu(usuarioDB.role)
                    });
                }
            } else {
                /**
                 * El usuario no existe, hay que crearlo
                 */
                var usuario = new Usuario();
                usuario.nombre = googleUser.nombre;
                usuario.email = googleUser.email;
                usuario.img = googleUser.img;
                usuario.google = true;
                usuario.password = ':P';

                usuario.save((err, usuarioDB) => {
                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al guardar usuario base de datos login google',
                            errors: err
                        });
                    }
                    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

                    /**
                     * Devolvemos el token que luego el usuario nos tiene que mandar para poder hacer las operaciones
                     */

                    res.status(200).json({
                        ok: true,
                        usuario: usuarioDB,
                        token: token,
						id: usuarioDB._id,
						menu: obtenerMenu(usuarioDB.role)
                    });
                });
            }
        });
    }
});


/**
 * Login normal
 */
app.post('/', (req, res) => {
    var body = req.body;
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuarios login',
                errors: err
            });
        }
        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });
        }
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        //Ocultamos la contraseña
        usuarioDB.password = ':P';
        /**
         * Crear el token,
         * El primer parámetro (payload) es lo que nos va a devolver el jwt más adelante cuando
         * verfiquemos los token, el segundo parámetro es la semilla para codificar
         * y el tercero el tiempo de expiración del token.
         */
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

        /**
         * Devolvemos el token que luego el usuario nos tiene que mandar para poder hacer las operaciones
         */

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
			id: usuarioDB._id,
			menu: obtenerMenu(usuarioDB.role)
        });
    });
});

function obtenerMenu(role){

	menu = [
        {
            titulo: 'Principal',
            icono: 'mdi mdi-gauge',
            submenu: [
                { titulo: 'Dashboard', url: '/dashboard' },
                { titulo: 'ProgressBar', url: '/progress' },
                { titulo: 'Gráficas', url: '/graficas1' },
                { titulo: 'Promesas', url: '/promesas' },
                { titulo: 'Rxjs', url: '/rxjs' }
            ]
        },
        {
            titulo: 'Mantenimientos',
            icono: 'mdi mdi-folder-lock-open',
            submenu: [
                // { titulo: 'Usuarios', url: '/usuarios'},
                { titulo: 'Hospitales', url: '/hospitales'},
                { titulo: 'Médicos', url: '/medicos'}
            ]
        }
	];
	
	if(role === 'ADMIN_ROLE'){
		// El unshift lo pone al principio
		menu[1].submenu.unshift({ titulo: 'Usuarios', url: '/usuarios'});
	}

	return menu;
}

module.exports = app;