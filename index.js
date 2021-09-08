const http = require('http');
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const session = require('express-session');
const exphbs = require('express-handlebars');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'hbs');
app.use('/public', express.static(path.join(__dirname, 'public'))); //mengubah folder menjadi public
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const dbConn = require('./connection/db');
const uploadFile = require('./middlewares/uploadFiles');
const { throws } = require('assert');

hbs.registerPartials(__dirname + '/views/partials');
var pathFile = 'http://localhost:3000/uploads/';

hbs.registerHelper('select', function(selected, options){
  return options.fn(this).replace(
    new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"'
  );
});

var isLogin = true;

app.use(
  session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 2,
    },
    store: new session.MemoryStore(),
    resave: false,
    saveUninitialized: true,
    secret: 'SangatRahasia',
  })
);

app.use(function (req, res, next) {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

app.get('/', function (request, response) {
  const title = 'Drents';
  const query = 'SELECT t1.*, t2.id as typeId, t2.name as type, t3.id as brandId, t3.name as brand FROM tb_car t1 join tb_type t2 on t1.type_id=t2.id join tb_brand t3 on t1.brand_id=t3.id ORDER BY id DESC';

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      let car = [];

      for (var result of results) {
        car.push({
          id: result.id,
          photo: pathFile + result.photo,
          name: result.name,
          plat_number: result.plat_number,
          price: result.price,
          brand: result.brand,
          type: result.type,
        });
      }

      if (car.length == 0) {
        car = false;
      }
      response.render('index', {
        title,
        isLogin: request.session.isLogin,
        car,
      });
    });
  });
});

//RENDER DAN TAMBAH USER

app.get('/signup', function(request, response) {
  const title = 'Sign Up';
  response.render('signup', {
    title,
    isLogin: request.session.isLogin,
  });
});

app.post('/signup', function(request, response){
  const {email, password, no_ktp, name, address, phone, status} = request.body;

  if(name == '' || email == '' || password == '' || status == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/signup');
  } 

  const query = `INSERT INTO tb_user (email, password, no_ktp, name, address, phone, status) VALUES ("${email}", "${password}", "${no_ktp}", "${name}", "${address}", "${phone}", "${status}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Sign up has success!',
      };
      response.redirect('/login');
    });
    conn.release();
  });
});

app.get('/user', function(request,response){
  const title = 'Drents';
  const link = 'active';

  const query = 'SELECT * FROM tb_user';

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, results){
      if(err) throw err;

      let users = [];
      for(var result of results){
        users.push({
          id: result.id,
          name: result.name,
          email: result.email,
          password: result.password,
        });
      }

      if(users.length == 0) {
        users = false
      }

      response.render('user', {
        title,
        isLogin: request.session.isLogin,
        link,
        users,
      });
    });
    conn.release();
  });
});

app.get('/edit-user/:id', function (request, response) {
  const title = 'Edit User';
  const { id } = request.params;
  var selected = 'selected';

  const query = `SELECT * FROM tb_user WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const user = {
        ...results[0],
      };

      response.render('editUser', {
        title,
        isLogin: request.session.isLogin,
        user,
        selected,
      });
    });
    conn.release();
  });
});

app.post('/edit-user', function(request, response){
  var { id, name, email, password, status} = request.body;

  const query = `UPDATE tb_user SET name = "${name}", email = "${email}", password = "${password}", status = "${status}" WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/user');
    });
    conn.release();
  });
});

app.get('/delete-user/:id', function(request,response){
  const { id } = request.params;
  const query = `DELETE FROM tb_user WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/user');
    });
    conn.release();
  });
});

//type
app.get('/type', function(request,response){
  const title = 'Drents';
  const link = 'active';

  const query = 'SELECT * FROM tb_type';

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, results){
      if(err) throw err;

      let types = [];
      for(var result of results){
        types.push({
          id: result.id,
          name: result.name,
        });
      }

      if(types.length == 0) {
        types = false
      }

      response.render('type', {
        title,
        isLogin: request.session.isLogin,
        link,
        types,
      });
    conn.release();
    });
  });
});

app.get('/add-type', function (request, response) {
  const title = 'Add type';
  response.render('addType', {
    title,
        isLogin: request.session.isLogin,
  });
});

app.post('/add-type', function(request, response){
  const {name} = request.body;

  if(name == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/add-type');
  } 

  const query = `INSERT INTO tb_type (name) VALUES ("${name}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Input data success!',
      };
      response.redirect('/type');
    });
    conn.release();
  });
});

app.get('/edit-type/:id', function (request, response) {
  const title = 'Edit type';
  const { id } = request.params;

  const query = `SELECT * FROM tb_type WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const type = {
        ...results[0],
      };

      response.render('editType', {
        title,
        isLogin: request.session.isLogin,
        type,
      });
    });
    conn.release();
  });
});

app.post('/edit-type', function(request, response){
  var { id, name} = request.body;

  const query = `UPDATE tb_type SET name = "${name}" WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/type');
    });
    conn.release();
  });
});

app.get('/delete-type/:id', function(request, response){
  const { id } = request.params;
  const query = `DELETE FROM tb_type WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/type');
    });
    conn.release();
  });
});

//brand
app.get('/brand', function(request,response){
  const title = 'Drents';
  const link = 'active';

  const query = 'SELECT * FROM tb_brand';

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, results){
      if(err) throw err;

      let brands = [];
      for(var result of results){
        brands.push({
          id: result.id,
          name: result.name,
        });
      }

      if(brands.length == 0) {
        brands = false
      }

      response.render('brand', {
        title,
        isLogin: request.session.isLogin,
        link,
        brands,
      });
    });
    conn.release();
  });
});

app.get('/add-brand', function (request, response) {
  const title = 'Add brand';
  response.render('addbrand', {
    title,
        isLogin: request.session.isLogin,
  });
});

app.post('/add-brand', function(request, response){
  const {name} = request.body;

  if(name == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/add-brand');
  } 

  const query = `INSERT INTO tb_brand (name) VALUES ("${name}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Input data success!',
      };
      response.redirect('/brand');
    });
    conn.release();
  });
});

app.get('/edit-brand/:id', function (request, response) {
  const title = 'Edit brand';
  const { id } = request.params;

  const query = `SELECT * FROM tb_brand WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const brand = {
        ...results[0],
      };

      response.render('editbrand', {
        title,
        isLogin: request.session.isLogin,
        brand,
      });
    });
    conn.release();
  });
});

app.post('/edit-brand', function(request, response){
  var { id, name} = request.body;

  const query = `UPDATE tb_brand SET name = "${name}" WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/brand');
    });
    conn.release();
  });
});

app.get('/delete-brand/:id', function(request, response){
  const { id } = request.params;
  const query = `DELETE FROM tb_brand WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/brand');
    });
    conn.release();
  });
});

// car
app.get('/add-car', function(request, response) {
  const title = 'Add Car';
  const queryBrand = 'SELECT id as brandId, name as brand from tb_brand';

  dbConn.getConnection(function (err, connBrand) {
    if (err) throw err;
    connBrand.query(queryBrand, function (err, resultsB) {
      if (err) throw err;

      let brand = [];

      for (var result of resultsB) {
        brand.push({
          brandId: result.brandId,
          brand: result.brand,
        });
      }

      if (brand.length == 0) {
        brand = false;
      }

      const queryType = `SELECT id as typeId, name as type from tb_type`;
      dbConn.getConnection((err, connType) => {
        if(err) throw err;
        connType.query(queryType, (err, resultsT) => {
          if(err) throw err;

          let type = [];

          for (const result of resultsT) {
            type.push({
              typeId: result.typeId,
              type: result.type,
            });
          }

          if (type.length == 0) {
            type = false;
          }

          response.render('addCar', {
            title,
            isLogin: request.session.isLogin,
            brand,
            type,
          });

        });
      });
    });
  });
});

app.post('/add-car', uploadFile('photo'), function(request, response){
  const {name, plat_number, price, status, brand_id, type_id} = request.body;
  var photo = '';

  if(request.file){
    photo = request.file.filename;
  }

  if(name == '' || plat_number == '' || photo == '' || price == '' || status == '' || brand_id == '' || type_id == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/add-car');
  } 

  const query = `INSERT INTO tb_car (name, plat_number, price, photo, status, brand_id, type_id) VALUES ("${name}", "${plat_number}", "${price}", "${photo}", "${status}", "${brand_id}", "${type_id}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Add data success!',
      };
      response.redirect('/car');
    });
    conn.release();
  });
});

app.get('/car', function(request,response){
  const title = 'Drents';
  const link = 'active';

  const query = 'SELECT * FROM tb_car';

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, results){
      if(err) throw err;

      let car = [];
      for(var result of results){
        car.push({
          id: result.id,
          name: result.name,
          plat_number: result.plat_number,
          photo: result.photo,
          price: result.price,
          status: result.status,
          brand_id: result.brand_id,
          type_id: result.type_id,
        });
      }

      if(car.length == 0) {
        car = false
      }

      response.render('car', {
        title,
        isLogin: request.session.isLogin,
        link,
        car,
      });
    });
    conn.release();
  });
});

app.get('/edit-car/:id', function (request, response) {
  const title = 'Edit Car';
  const { id } = request.params;

  const query = `SELECT * FROM tb_car WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const car = {
        ...results[0],
        photo: pathFile + results[0].photo,
      };

      const queryBrand = `SELECT name as brand, id as brandId from tb_brand`;
      dbConn.getConnection(function(err, connBrand){
        if(err) throw err;

        connBrand.query(queryBrand, function(err, resultsB){
          if (err) throw err;

          let brand = [];

          for (var result of resultsB) {
            brand.push({
              brandId: result.brandId,
              brand: result.brand,
            });
          }

          if (brand.length == 0) {
            brand = false;
          }

          const queryType = `SELECT name as type, id as typeId from tb_type`;
          dbConn.getConnection((err, connType) => {
            if(err) throw err;

            connType.query(queryType, (err, resultsT) => {
              if (err) throw err;

              let type = [];

              for (const result of resultsT) {
                type.push({
                  typeId: result.typeId,
                  type: result.type,
                });
              }

              if (type.length == 0) {
                type = false;
              }

              response.render('editCar', {
                title,
                isLogin: request.session.isLogin,
                car,
                brand,
                type,
              });

            });
          });
        });
      });
    });
    conn.release();
  });
});

app.post('/edit-car', uploadFile('photo'), function (request, response) {
  var { id, name, plat_number, price, oldPhoto, status, brand_id, type_id } = request.body;

  var photo = oldPhoto.replace(pathFile, '');

  if (request.file) {
    photo = request.file.filename;
  }

  const query = `UPDATE tb_car SET name = "${name}", plat_number = "${plat_number}", price = "${price}", photo = "${photo}", status = "${status}", brand_id = "${brand_id}", type_id = "${type_id}" WHERE id = ${id}`;
  // console.log(query);
  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      response.redirect(`/car`);
    });
    conn.release();
  });
});

app.get('/delete-car/:id', function(request,response){
  const { id } = request.params;
  const query = `DELETE FROM tb_car WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/car');
    });
    conn.release();
  });
});

// rent
app.get('/add-rent', function(request, response) {
  const title = 'Add rent';
  const query = 'SELECT id, name from tb_car';

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      let car = [];

      for (var result of results) {
        car.push({
          id: result.id,
          name: result.name,
        });
      }

      if (car.length == 0) {
        car = false;
      }
      
      response.render('addRent', {
        title,
        car,
        isLogin: request.session.isLogin,
      });
    });
  });
});

app.post('/add-rent', function(request, response){
  const {borrow_date, return_date, sub_total, user_id, car_id} = request.body;

  if(borrow_date == '' || return_date == '' || sub_total == '' || user_id == '' || car_id == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/add-rent');
  } 

  const query = `INSERT INTO tb_rent (borrow_date, return_date, sub_total, user_id, car_id) VALUES ("${borrow_date}", "${return_date}", "${sub_total}", "${user_id}", "${car_id}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Add data success!',
      };
      response.redirect('/rent');
    });
    conn.release();
  });
});

app.get('/rent', function(request,response){
  const title = 'Drents';
  const link = 'active';

  const query = 'SELECT t1.*, t2.name as car FROM tb_rent t1 join tb_car t2 on t1.car_id=t2.id';

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, results){
      if(err) throw err;

      let rent = [];
      for(var result of results){
        rent.push({
          id: result.id,
          borrow_date: result.borrow_date,
          return_date: result.return_date,
          sub_total: result.sub_total,
          user_id: result.user_id,
          car_id: result.car_id,
          car: result.car,
        });
      }

      if(rent.length == 0) {
        rent = false
      }

      response.render('rent', {
        title,
        isLogin: request.session.isLogin,
        link,
        rent,
      });
    });
    conn.release();
  });
});

app.get('/edit-rent/:id', function (request, response) {
  const title = 'Edit rent';
  const { id } = request.params;

  const query = `SELECT * FROM tb_rent WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const rent = {
        ...results[0],
      };
      
      const queryCar = `SELECT id as carId, name as car from tb_car`;
      dbConn.getConnection((err, connCar) => {
        if(err) throw err;

        connCar.query(queryCar, (err, resultC)=> {
          if(err) throw err;

          let car = [];
          
          for (const result of resultC) {
            car.push({
              carId: result.carId,
              car: result.car,
            });
          }

          if (car.length == 0) {
            car = false;  
          }
          
          response.render('editRent', {
            title,
            isLogin: request.session.isLogin,
            rent,
            car,
          });

        });
      });
    });
    conn.release();
  });
});

app.post('/edit-rent', function (request, response) {
  var { id, borrow_date, return_date, sub_total, user_id, car_id } = request.body;

  const query = `UPDATE tb_rent SET borrow_date = "${borrow_date}", return_date = "${return_date}", sub_total = "${sub_total}", user_id = "${user_id}", car_id = "${car_id}" WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      response.redirect(`/rent`);
    });
    conn.release();
  });
});

app.get('/delete-rent/:id', function(request,response){
  const { id } = request.params;
  const query = `DELETE FROM tb_rent WHERE id = ${id}`;

  dbConn.getConnection(function(err,conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;
      response.redirect('/rent');
    });
    conn.release();
  });
});

//login
app.get('/login', function (request, response) {
  const title = 'Login';
  response.render('login', {
    title,
    isLogin: request.session.isLogin,
  });
});

app.post('/login', function (request, response) {
  const { email, password } = request.body;

  if (email == '' || password == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };
    return response.redirect('/login');
  } 

  const query = `SELECT *, MD5(password) as password FROM tb_user WHERE email = "${email}" AND password = "${password}" AND status = '1'`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      if (results.length == 0) {
        request.session.message = {
          type: 'danger',
          message: 'Email and password dont match!',
        };
        response.redirect('/login');
      } else {
        request.session.message = {
          type: 'success',
          message: 'Login has successfully!',
        };

        request.session.isLogin = true;

        request.session.user = {
          id: results.id,
          email: results.email,
          name: results.name,
          photo: results.photo,
        };
        response.redirect('/');
      }
    });
    conn.release();
  });
});

app.get('/logout', function (request, response) {
  request.session.destroy();
  response.redirect('/');
});

//user signup
app.get('/signupUser', function(request, response) {
  const title = 'User Sign Up';
  response.render('signupUser', {
    title,
    isLogin: request.session.isLogin,
  });
});

app.post('/signupUser', function(request, response){
  const {email, password, no_ktp, name, address, phone} = request.body;
  var status = 2;

  if(name == '' || email == '' || password == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please input all the field!',
    };
    return response.redirect('/signupUser');
  } 

  const query = `INSERT INTO tb_user (email, password, no_ktp, name, address, phone, status) VALUES ("${email}", "${password}", "${no_ktp}", "${name}", "${address}", "${phone}", "${status}");`;

  dbConn.getConnection(function(err, conn){
    if(err) throw err;
    conn.query(query, function(err, result){
      if(err) throw err;

      request.session.message = {
        type: 'success',
        message: 'Sign up has success!',
      };
      response.redirect('/loginUser');
    });
    conn.release();
  });
});

//login user
app.get('/loginUser', function (request, response) {
  const title = 'Login';
  response.render('loginUser', {
    title,
    isLogin: request.session.isLogin,
  });
});

app.post('/loginUser', function (request, response) {
  const { email, password } = request.body;

  if (email == '' || password == '') {
    request.session.message = {
      type: 'danger',
      message: 'Please insert all field!',
    };
    return response.redirect('/loginUser');
  } 

  const query = `SELECT *, MD5(password) as password FROM tb_user WHERE email = "${email}" AND password = "${password}" AND status = '2'`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      if (results.length == 0) {
        request.session.message = {
          type: 'danger',
          message: 'Email and password dont match!',
        };
        response.redirect('/loginUser');
      } else {
        request.session.message = {
          type: 'success',
          message: 'Login has successfully!',
        };

        request.session.isLogin = true;

        request.session.user = {
          id: results.id,
          email: results.email,
          name: results.name,
          photo: results.photo,
        };
        response.redirect('/list');
      }
    });
    conn.release();
  });
});

//index user
app.get('/list', function (request, response) {
  const title = 'Drents';
  const query = 'SELECT t1.*, t2.id as typeId, t2.name as type, t3.id as brandId, t3.name as brand FROM tb_car t1 join tb_type t2 on t1.type_id=t2.id join tb_brand t3 on t1.brand_id=t3.id WHERE t1.status != "1" ORDER BY id DESC';

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      let car = [];

      for (var result of results) {
        car.push({
          id: result.id,
          photo: pathFile + result.photo,
          name: result.name,
          plat_number: result.plat_number,
          price: result.price,
          brand: result.brand,
          type: result.type,
        });
      }

      if (car.length == 0) {
        car = false;
      }
      response.render('list', {
        title,
        isLogin: request.session.isLogin,
        car,
      });
    });
  });
});

app.get('/user-rent/:id', function (request, response) {
  const title = 'User Rent';
  const { id } = request.params;

  const query = `SELECT * FROM tb_car WHERE id = ${id}`;

  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const car = {
        ...results[0],
        photo: pathFile + results[0].photo,
      };

      response.render('userRent', {
        title,
        isLogin: request.session.isLogin,
        car,
      });
    });
    conn.release();
  });
});

app.post('/user-rent', uploadFile('photo'), function (request, response) {
  var { borrow_date, return_date, sub_total, user_id, car_id } = request.body;
  const query = `UPDATE tb_car SET status = "1" WHERE id = ${car_id}`;
  // console.log(query);
  dbConn.getConnection(function (err, conn) {
    if (err) throw err;
    conn.query(query, function (err, results) {
      if (err) throw err;

      const queryRent = `INSERT INTO tb_rent (borrow_date, return_date, sub_total, user_id, car_id) VALUES ("${borrow_date}", "${return_date}", "${sub_total}", "${user_id}", "${car_id}");`;
      dbConn.getConnection(function(err, conn){
        if(err) throw err;
        conn.query(queryRent, function(err, result){
          if(err) throw err;

          request.session.message = {
            type: 'success',
            message: 'Add data success!',
          };
          response.redirect('/list');
        });
        conn.release();
      });
    });
    conn.release();
  });
});

app.get('/logoutUser', function (request, response) {
  request.session.destroy();
  response.redirect('/list');
});


const port = 3000;
const server = http.createServer(app);
server.listen(port);
console.debug(`Server listening on port ${port}`);