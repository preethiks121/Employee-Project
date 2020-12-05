var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const app = express()
const connection= mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'preethipur',
    database:'employee'
})
connection.connect((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("Sql connected.....")
    }
})
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use((req,res,next)=>{
	res.locals.success=req.flash('success')
	res.locals.error=req.flash('error')
	next();
})
app.get('/',(req,res)=>{
    res.render("login")
})
app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				request.flash('error','Incorrect Username/Password')
				response.redirect('/')
			}			
			response.end();
		});
	} else {
		request.flash('error','Please enter Username and Password')
		response.redirect('/')
		response.end();
	}
});
app.get('/home', function(req, res) {
	if (req.session.loggedin) {
		res.render('homepage');
	} else {
		req.flash('error','Please login to view this page!')
		res.redirect('/')
	}
});
app.get("/logout", function(req, res){
    req.session.destroy((err)=>{
    });
    res.redirect("/");
});

app.get('/showDept',(req,res)=>{
  if (req.session.loggedin) {
	var sql='SELECT dname,dnumber FROM department ORDER BY dnumber';
    connection.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('departments', { title: 'department-list', departmentData: data});
  });
} else {
	req.flash('error','Please login to view this page!')
	res.redirect('/')
}
})
app.get('/showEmp',(req,res)=>{
  if (req.session.loggedin) {
	var sql='SELECT CONCAT_WS(" ", `fname`, `lname`) AS `Name`,SSN,dno FROM `employee` ORDER BY SSN';
    connection.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('employees', { title: 'employee-list', employeeData: data});
  });
} else {
	req.flash('error','Please login to view this page!')
	res.redirect('/')
}
})
app.get('/showGrade',(req,res)=>{
  if (req.session.loggedin) {
	var sql='SELECT grade_name,grade_id FROM pay_grade ORDER BY grade_id';
    connection.query(sql, function (err, data, fields) {
    if (err) throw err;
    res.render('grades', { title: 'grade-list', gradeData: data});
  });
} else {
	req.flash('error','Please login to view this page!')
	res.redirect('/')
}
});

//EMPLOYEE ROUTES
app.get('/showEmp/addEmp',(req,res)=>{
	var sql='SELECT dnumber FROM department ORDER BY dnumber';
    connection.query(sql, function (err, data, fields) {
	if (err) throw err;
	var sql1='Select grade_name from pay_grade';
	connection.query(sql1,(err,data1,fields)=>{
		if(err) throw err;
		res.render('emp_form', { dnoData: data,gdata:data1});
	})
  });
})
app.post('/showEmp', function(req, res, next) {
	var SuperSSN = req.body.SuperSSN;
	var bdate    = req.body.bdate;
	var address  = req.body.address;
	var grade_name = req.body.grade_name;
	var sex = req.body.sex;
	var fname = req.body.fname;
	var minit = req.body.minit;
	var lname = req.body.lname;
	var dno = req.body.dno;
   var sql = `INSERT INTO employee (SuperSSN,fname,minit,lname,bdate,address,sex,salary,dno) VALUES ('${SuperSSN}', '${fname}', '${minit}','${lname}','${bdate}','${address}','${sex}',(Select grade_basic+grade_da+grade_pf+grade_bonus from pay_grade where grade_name='${grade_name}'),'${dno}' )`;
   connection.query(sql,function (err, data) {
	  if (err){
		  res.redirect('/showEmp')
	  };
		   console.log("record inserted");
	   });
   res.redirect('/showEmp');
}); 
app.get('/showEmp/:id/edit',(req,res)=>{
	var sql='SELECT dnumber FROM department ORDER BY dnumber';
    connection.query(sql, function (err, data, fields) {
	if (err) throw err;
	var sql1='Select grade_name from pay_grade';
	connection.query(sql1,(err,data1,fields)=>{
		if(err) throw err;
		var sql2=`SELECT * FROM employee,pay_grade,salary where employee.SSN=${req.params.id} and employee.SSN=salary.SSN and salary.grade_no=pay_grade.grade_id ;`;
		connection.query(sql2,(err,data2,fields)=>{
			res.render('emp_edit', { dnoData: data,gdata:data1,employeeData:data2});
		})
	})
  });
})
app.post('/showEmp/:id', function(req, res, next) {
	var SuperSSN = req.body.SuperSSN;
	var bdate    = req.body.bdate;
	var address  = req.body.address;
	var grade_name = req.body.grade_name;
	var sex = req.body.sex;
	var fname = req.body.fname;
	var minit = req.body.minit;
	var lname = req.body.lname;
	var dno = req.body.dno;
   var sql = `UPDATE employee SET SuperSSN='${SuperSSN}',fname='${fname}',minit='${minit}',lname='${lname}',bdate='${bdate}',address='${address}',sex='${sex}',salary=(Select grade_basic+grade_da+grade_pf+grade_bonus from pay_grade where grade_name='${grade_name}'),dno='${dno}' WHERE SSN='${req.params.id}'`;
   connection.query(sql,function (err, data) {
	  if (err){
		  throw err;
	  };
	  res.redirect(`/showEmp`);
		   console.log("record updated");
	   });
});
app.delete('/showEmp/:id/',(req,res)=>{
	var sql=`Delete from employee where SSN=${req.params.id}`;
	connection.query(sql,(err,data)=>{
		if(err)
			throw err;
		res.redirect('/showEmp');
			console.log('record deleted')
	})
})



app.get('/showDept/addDept',(req,res)=>{
		res.render('dept_form');
})
app.post('/showDept', function(req, res, next) {
	var dname = req.body.dname;
    var sql = `INSERT INTO department (dname,comp_id) VALUES ('${dname}', 121)`;
    connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Department not inserted')
		  res.redirect('/showDept')
	  }else{
			
		res.redirect('/showDept');
		console.log("record inserted");
	  }
	   });
}); 
// /adddept
// /addgrade
// /addsal
// /updategrade
// /updatesal
// /deletedept
// /deletegrade
app.listen(3000,()=>{
    console.log("Server is running")
})