var express = require('express');
var app = express();

var Hospital = require('../models/hospital');
var Medico = require('../models/medico');
var Usuario = require('../models/usuario');


/**
 * Búsqueda especifica por colección
 */

app.get('/coleccion/:tabla/:busqueda', (req, res) => {
    var tabla = req.params.tabla;
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');
    switch (tabla) {
        case 'medicos':
            buscarMedicos(busqueda, regex).then((medicos) => {
                res.status(200).json({
                    ok: true,
                    medicos
                });
            });
            break;
        case 'hospitales':
            buscarHospitales(busqueda, regex).then((hospitales) => {
                res.status(200).json({
                    ok: true,
                    hospitales
                });
            });
            break;
        case 'usuarios':
            buscarUsuarios(busqueda, regex).then((usuarios) => {
                res.status(200).json({
                    ok: true,
                    usuarios
                });
            });
            break;
        default:
            res.status(400).json({
                ok: false,
                mensaje: 'Criterio de búsqueda incorrectos, usar: (usuarios, medicos y hospitales)',
                error: { message: 'Tipo de tabla/coleccion no váido' }
            });
            break;
    }

    /**
     * Podemos recoger la promesa en cada case en una variable y diferenciar que colección es con el [tabla]
     */
    // promesa.then(data => {
    //     res.status(200).json({
    //         ok: true,
    //         [tabla]: data
    //     });
    // });
});


/**
 * Búsqueda general
 */

app.get('/todo/:busqueda', (req, res, next) => {
    var busqueda = req.params.busqueda;
    var regex = new RegExp(busqueda, 'i');

    Promise.all([buscarHospitales(busqueda, regex), buscarMedicos(busqueda, regex), buscarUsuarios(busqueda, regex)]).then(respuestas => {
        res.status(200).json({
            ok: true,
            hospitales: respuestas[0],
            medicos: respuestas[1],
            usuarios: respuestas[2]
        });
    });
});

function buscarHospitales(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Hospital.find({ nombre: regex }).populate('usuario', 'nombre email img').exec((err, hospitales) => {
            if (err) {
                reject('Error al cargar hospitales', err);
            } else {
                resolve(hospitales);
            }
        });
    });
}

function buscarMedicos(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Medico.find({ nombre: regex }).populate('usuario', 'nombre email img').populate('hospital').exec((err, medicos) => {
            if (err) {
                reject('Error al cargar los médicos', err);
            } else {
                resolve(medicos);
            }
        });
    });
}

function buscarUsuarios(busqueda, regex) {
    return new Promise((resolve, reject) => {
        Usuario.find({}, 'nombre email role google img').or([{ 'nombre': regex }, { 'email': regex }]).exec((err, usuarios) => {
            if (err) {
                reject('Error al cargar usuarios', err);
            } else {
                resolve(usuarios);
            }
        });
    });
}
module.exports = app;