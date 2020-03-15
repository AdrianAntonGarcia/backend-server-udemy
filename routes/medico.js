var express = require('express');
var app = express();
var mdAutenticacion = require('../middlewares/autenticacion');

var Medico = require('../models/medico');

/**
 * Obtener todos los medicos
 */

app.get('/', (req, res, next) => {
    var desde = req.query.desde || 0;
    desde = Number(desde);
    var hasta = req.query.hasta || 5;
    hasta = Number(hasta);
    Medico.find({}).populate('usuario', 'nombre email').populate('hospital').skip(desde).limit(hasta).exec((err, medicos) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error cargando medicos',
                errors: err
            });
        }
        Medico.count({}, (err, conteo) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error contando médicos',
                    errors: err
                });
            }
            res.status(200).json({
                ok: true,
                medicos,
                total: conteo
            });
        });
    });
});

/**
 * Crear un nuevo médico
 */

app.post('/', mdAutenticacion.verificaToken, (req, res) => {
    //Solo funciona si tenemos el pody parser configurado
    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospitalID
    });

    medico.save((err, medicoGuardado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear médico',
                errors: err
            });
        }
        res.status(201).json({
            ok: true,
            medico: medicoGuardado,
            usuarioToken: req.usuario
        });
    });
});

/**
 * Actualizar médico
 */

app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    var body = req.body;

    Medico.findById(id, (err, medicoDB) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar médico',
                errors: err
            });
        }
        //Si no viene un usuario
        if (!medicoDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El médico con el id ' + id + ' no existe',
                errors: { message: 'No existe un médico con ese id' }
            });
        }

        medicoDB.nombre = body.nombre;
        medicoDB.usuario = req.usuario._id;
        medicoDB.hospital = body.hospitalID;


        medicoDB.save((err, medicoGuadado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al modificar el médico',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                médico: medicoGuadado,
                usuarioToken: req.usuario
            });
        });
    });
});

/**
 * Borrar un medico por el id
 */

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {
    var id = req.params.id;
    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar médico',
                errors: err
            });
        }
        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un médico con ese id',
                errors: { message: 'No existe un médico con ese id' }
            });
        }
        res.status(200).json({
            ok: true,
            medico: medicoBorrado,
            usuarioToken: req.usuario
        });
    });
});

module.exports = app;