const passport = require('passport');
const express = require('express');

const { CONNECTION_STRING } = require('../constants/dbSettings');
const { default: mongoose } = require('mongoose');
const { Employee } = require('../models');
const {
  validateSchema,
  loginSchema
} = require('../validation/employee');
const encodeToken = require('../helpers/jwtHelper');

// MONGOOSE
mongoose.set('strictQuery', false);
mongoose.connect(CONNECTION_STRING);

const router = express.Router();

// router.post(
//   '/login',
//   validateSchema(loginSchema),
//   passport.authenticate('local', { session: false }),
//   async (req, res, next) => {
//     try {
//       const { email } = req.body;
//       const employee = await Employee.findOne({ email });

//       if (!employee) return res.status(404).send({ message: 'Not found' });

//       const { _id, email: empEmail, firstName, lastName } = employee;

//       const token = encodeToken(_id, empEmail, firstName, lastName);

//       res.status(200).json({
//         token,
//         payload: employee,
//       });
//     } catch (err) {
//       res.status(401).json({
//         statusCode: 401,
//         message: 'Unauthorized',
//       });
//     }
//   },
// );

router.post(
  "/login",
  validateSchema(loginSchema),
  /* passport.authenticate("local", { session: false }) */
  async (req, res, next) => {
    const { email, password } = req.body;

    const employee = await Employee.findOne({ email });

    const isComparePassWord = await bcrypt.compare(password, employee.password);

    console.log("isComparePassWord", isComparePassWord);

    if (isComparePassWord) {
      console.log("true");
      if (!employee) return res.status(404).send({ message: "Not found" });

      const { _id, email: empEmail, firstName, lastName, role } = employee;

      const token = encodeToken(_id, empEmail, firstName, lastName, role);

      res
        .status(200)

        .json({
          token,
          payload: employee,
        });
    } else {
      res.status(401).json({
        statusCode: 401,
        message: "Unauthorized",
      });
    }
  }
);


router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const employee = await Employee.findById(req.user._id);

      if (!employee) return res.status(404).send({ message: 'Not found' });

      res.status(200).json(employee);
    } catch (err) {
      res.sendStatus(500);
    }
  },
);

router.route('/profile').get(passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.user._id);

    if (!employee) return res.status(404).send({ message: 'Not found' });

    res.status(200).json(employee);
  } catch (err) {
    res.sendStatus(500);
  }
},);

router.get('/count', async (req, res, next) => {
  try {
    const employeeCount = await Employee.countDocuments();
    res.status(200).json({ count: employeeCount });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET

router.get('/', function (req, res, next) {
  try {
    Employee.find()
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

// GET:/id
router.get('/:id', function (req, res, next) {
  try {
    const { id } = req.params;
    Employee.findById(id)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

// POST
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const email = data.email;
    const emailUnique = await Employee.findOne({ email });
    if (emailUnique) {
      return res.status(404).send({ message: 'Email already exists' });
    }
    const newItem = new Employee(data);
    newItem
      .save()
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

// PATCH/:id
router.patch('/:id', function (req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    Employee.findByIdAndUpdate(id, data, {
      new: true,
    })
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (error) {
    res.sendStatus(500);
  }
});

// DELETE
router.delete('/:id', function (req, res, next) {
  try {
    const { id } = req.params;
    Employee.findByIdAndDelete(id)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send({ message: err.message });
      });
  } catch (err) {
    res.sendStatus(500);
  }
});

module.exports = router;
