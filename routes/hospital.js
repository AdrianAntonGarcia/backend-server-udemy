var express = require("express");
var app = express();
var mdAutenticacion = require("../middlewares/autenticacion");
var Hospital = require("../models/hospital");

/**
 * Obtener todos los hospitales
 */

app.get("/", (req, res, next) => {
	var desde = req.query.desde || 0;
	desde = Number(desde);
	var hasta = req.query.hasta || 5;
	hasta = Number(hasta);
	Hospital.find({})
		.populate("usuario", "nombre email")
		.skip(desde)
		.limit(hasta)
		.exec((err, hospitales) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error cargando hospitales",
					errors: err
				});
			}
			Hospital.count({}, (err, conteo) => {
				if (err) {
					return res.status(500).json({
						ok: false,
						mensaje: "Error contando hospitales",
						errors: err
					});
				}
				res.status(200).json({
					ok: true,
					hospitales,
					total: conteo
				});
			});
		});
});

/**
 * Crear un nuevo Hospital
 */

app.post("/", mdAutenticacion.verificaToken, (req, res) => {
	var body = req.body;
	var usuarioPeticion = req.usuario;
	var hospital = new Hospital({
		nombre: body.nombre,
		usuario: usuarioPeticion._id
	});
	hospital.save((err, hospitalCreado) => {
		if (err) {
			return res.status(400).json({
				ok: false,
				mensaje: "Error al crear el hospital",
				errors: err
			});
		}
		res.status(201).json({
			ok: true,
			usuarioPeticion,
			hospitalCreado
		});
	});
});

/**
 * Actualizar un hospital
 */

app.put("/:id", mdAutenticacion.verificaToken, (req, res) => {
	var id = req.params.id;
	var body = req.body;
	Hospital.findById(id, (err, hospitalDB) => {
		//Error severo de base de datos
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: "Error al buscar el hospital para actualizar",
				errors: err
			});
		}
		//Si no ha encontrado el hospital
		if (!hospitalDB) {
			return res.status(400).json({
				ok: false,
				mensaje: "Hospital no encoontrado",
				errors: { message: "No existe un hospital con ese id" }
			});
		}
		hospitalDB.nombre = body.nombre;
		hospitalDB.usuario = req.usuario._id;
		hospitalDB.save((err, hospitalSalvado) => {
			//Error al guardar
			if (err) {
				return res.status(400).json({
					ok: false,
					mensaje: "Error al guardar el hospital",
					errors: err
				});
			}
			res.status(200).json({
				ok: true,
				hospital: hospitalSalvado,
				usuarioToken: req.usuario
			});
		});
	});
});

/**
 * Borrar un usuario por el id
 */

app.delete("/:id", mdAutenticacion.verificaToken, (req, res) => {
	var id = req.params.id;
	Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {
		if (err) {
			return res.status(500).json({
				ok: false,
				mensaje: "Error al borrar hospital",
				errors: err
			});
		}
		if (!hospitalBorrado) {
			return res.status(400).json({
				ok: false,
				mensaje: "No existe un hospital con ese id",
				errors: { message: "No existe un hospital con ese id" }
			});
		}
		res.status(200).json({
			ok: true,
			hospital: hospitalBorrado,
			usuarioToken: req.usuario
		});
	});
});

// ==========================================
// Obtener Hospital por ID
// ==========================================
app.get("/:id", (req, res) => {
	var id = req.params.id;
	Hospital.findById(id)
		.populate("usuario", "nombre img email")
		.exec((err, hospital) => {
			if (err) {
				return res.status(500).json({
					ok: false,
					mensaje: "Error al buscar hospital",
					errors: err
				});
			}
			if (!hospital) {
				return res.status(400).json({
					ok: false,
					mensaje: "El hospital con el id " + id + "no existe",
					errors: { message: "No existe un hospital con ese ID" }
				});
			}
			res.status(200).json({
				ok: true,
				hospital: hospital
			});
		});
});

module.exports = app;
