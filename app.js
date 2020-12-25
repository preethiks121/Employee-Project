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
app.post('/auth', function(req, response) {
	var username = req.body.username;
	var password = req.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				response.redirect('/home');
			} else {
				req.flash('error','Incorrect Username/Password')
				response.redirect('/')
			}			
			response.end();
		});
	} else {
		req.flash('error','Please enter Username and Password')
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
	var sql='SELECT CONCAT_WS(" ", `fname`, `lname`) AS `Name`,emp_id,dno FROM `employee` ORDER BY emp_id';
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
app.get('/showComp',(req,res)=>{
	if (req.session.loggedin) {
	  var sql='SELECT * FROM company_details ORDER BY year';
	  connection.query(sql, function (err, data, fields) {
	  if (err) throw err;
	  res.render('company_details', { title: 'company_detail-list', compData: data});
	});
  } else {
	  req.flash('error','Please login to view this page!')
	  res.redirect('/')
  }
  });
//EMPLOYEE ROUTES

app.get('/showEmp/addEmp',(req,res)=>{
	var sql1='SELECT dnumber FROM department ORDER BY dnumber';
	connection.query(sql1,(err,data1,fields)=>{
		if(err) throw err;
		var sql='Select emp_id from employee order by emp_id'
		connection.query(sql,(err,data,fields)=>{
			if(err) throw err;
			res.render('emp_form', { dnoData: data1,emp_iddata:data});
		})
	})
  });
app.post('/showEmp', function(req, res, next) {
	var bdate    = req.body.bdate;
	var address  = req.body.address;
	var sex = req.body.sex;
	var fname = req.body.fname;
	var minit = req.body.minit;
	var lname = req.body.lname;
	var dno = req.body.dno;
   	var sql = `INSERT INTO employee (fname,minit,lname,bdate,address,sex,dno) VALUES ('${fname}', '${minit}','${lname}','${bdate}','${address}','${sex}','${dno}' )`;
   	connection.query(sql,function (err, data) {
	  if (err){
		req.flash('error','Record not inserted')
		response.redirect('/showEmp')
		console.log(err)
	  }else{
		  req.flash('success','Record inserted')
		  res.redirect('/showEmp')
		  console.log('record inserted')
	  }
	});
}); 
app.get('/showEmp/:id',(req,res)=>{
	var sql=`Select * from employee where employee.emp_id=${req.params.id}`
	connection.query(sql,(err,data,fields)=>{
		var sql1=`Select * from salary where emp_id=${req.params.id}`
		connection.query(sql1,(err,data1,fields)=>{
			res.render('showEmpDetails',{empdata:data,saldata:data1});
		})
	})
})
app.get('/showEmp/:id/edit',(req,res)=>{
	var sql='SELECT dnumber FROM department ORDER BY dnumber';
	connection.query(sql,(err,data,fields)=>{
		if(err) throw err;
		var sql2=`SELECT * FROM employee where employee.emp_id=${req.params.id}  ;`;
		connection.query(sql2,(err,data2,fields)=>{
			if(err) throw err;
			var sql1='Select emp_id from employee order by emp_id'
			connection.query(sql1,(err,data1,fields)=>{
				if(err) throw err;
				res.render('emp_edit', { dnoData: data,employeeData:data2,emp_iddata:data1});
			})
		})
	})
  });
app.post('/showEmp/:id', function(req, res, next) {
	var bdate    = req.body.bdate;
	var address  = req.body.address;
	var sex = req.body.sex;
	var fname = req.body.fname;
	var minit = req.body.minit;
	var lname = req.body.lname;
	var dno = req.body.dno;
   var sql = `UPDATE employee SET fname='${fname}',minit='${minit}',lname='${lname}',bdate='${bdate}',address='${address}',sex='${sex}',dno='${dno}' WHERE emp_id='${req.params.id}'`;
   connection.query(sql,function (err, data) {
	  if (err){
		req.flash('error','Record not updated')
		response.redirect('/showEmp')
	  }else{
		req.flash('success','Record updated')
		res.redirect(`/showEmp`);
		console.log("record updated");
	  }
	   });
});
app.delete('/showEmp/:id/',(req,res)=>{
	var sql=`Delete from employee where emp_id=${req.params.id}`;
	connection.query(sql,(err,data)=>{
		if(err){
			req.flash('error','Record not deleted')
			res.redirect(`/showEmp`);
			console.log(err);
		}else{
			req.flash('success','Record deleted')
			res.redirect('/showEmp');
			console.log('record deleted')
		}
	})
})


//DEPARTMENT ROUTES
app.get('/showDept/addDept',(req,res)=>{
	res.render('dept_form')
})
app.post('/showDept', function(req, res, next) {
	var dname = req.body.dname;
    var sql = `INSERT INTO department (dname) VALUES ('${dname}')`;
    connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Department not inserted')
		  res.redirect('/showDept')
		  console.log(err)
	  }else{
		req.flash('success','Record inserted')
		res.redirect('/showDept');
		console.log("record inserted");
	  }
	   });
}); 
app.get('/showDept/:id/edit',(req,res)=>{
	var sql=`SELECT dname,dnumber FROM department where dnumber=${req.params.id};`;
	connection.query(sql,(err,data,fields)=>{
		if(err) throw err;
		res.render('dept_edit', { dnoData: data});
	})
})
app.post('/showDept/:id', function(req, res, next) {
	var dname = req.body.dname;
   var sql = `UPDATE department SET dname='${dname}' WHERE dnumber=${req.params.id}`;
   connection.query(sql,function (err, data) {
	  if (err){
		req.flash('error','Department not Updated')
		res.redirect('/showDept')
	  }else{
		  req.flash('success','Department Updated')
		res.redirect(`/showDept`);
		   console.log('record updated');
	  }
	  
	});
});
app.delete('/showDept/:id/',(req,res)=>{
	var sql=`Delete from department where dnumber=${req.params.id}`;
	connection.query(sql,(err,data)=>{
		if (err){
		req.flash('error','Department not Deleted')
		res.redirect('/showDept')
	  }else{
		  req.flash('success','Department Deleted')
		res.redirect(`/showDept`);
		   console.log('record deleted');
	  }
	})
})


// PAYGRADE DETAILS
app.get('/showGrade/addGrade',(req,res)=>{
	res.render('grade_form');
  });
app.post('/showGrade', function(req, res, next) {
	var grade_name    = req.body.grade_name;
	var grade_basic  = req.body.grade_basic;
	var grade_da = req.body.grade_da;
	var grade_pf = req.body.grade_pf;
	var grade_bonus = req.body.grade_bonus;
   	var sql = `INSERT INTO pay_grade (grade_name,grade_basic,grade_da,grade_pf,grade_bonus) VALUES ('${grade_name}', '${grade_basic}','${grade_da}','${grade_pf}','${grade_bonus}')`;
   	connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Grade not inserted')
		res.redirect('/showGrade')
	  }else{
		  req.flash('success','Grade Inserted')
		  res.redirect('/showGrade')
		  console.log('record inserted')
	  }
	});
});
app.get('/showGrade/:id/edit',(req,res)=>{
	var sql=`SELECT * FROM pay_grade where grade_id=${req.params.id};`;
	connection.query(sql,(err,data,fields)=>{
		res.render('grade_edit', { gdata: data});
	})
})
app.post('/showGrade/:id', function(req, res, next) {
	var grade_name    = req.body.grade_name;
	var grade_basic  = req.body.grade_basic;
	var grade_da = req.body.grade_da;
	var grade_pf = req.body.grade_pf;
	var grade_bonus = req.body.grade_bonus;
   var sql = `UPDATE pay_grade SET grade_name='${grade_name}',grade_basic='${grade_basic}',grade_da='${grade_da}',grade_pf='${grade_pf}',grade_bonus='${grade_bonus}' WHERE grade_id=${req.params.id}`;
   connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Grade not updated')
		res.redirect('/showGrade')
	  }else{
		   req.flash('success','Grade updated')
	  res.redirect(`/showGrade`);
		   console.log('record updated');
	  }
	});
});
app.delete('/showGrade/:id/',(req,res)=>{
	var sql=`Delete from pay_grade where grade_id=${req.params.id}`;
	connection.query(sql,(err,data)=>{
		if (err){
		  req.flash('error','Grade not deleted')
		res.redirect('/showGrade')
	  }else{
		   req.flash('success','Grade deleted')
	  res.redirect(`/showGrade`);
		   console.log('record deleted');
	  }
	})
})


// SALARY DETAILS ROUTES 
app.get('/showSal',(req,res)=>{
	if (req.session.loggedin) {
		var sql='Select emp_id from employee';
		connection.query(sql,(err,data,fields)=>{
			var sql1='Select grade_name from pay_grade'
			connection.query(sql1,(err,data1,fields)=>{
				res.render('sal_deet_form',{emp_iddata:data,gdata:data1});
			})
		})
	} else {
	  req.flash('error','Please login to view this page!')
	  res.redirect('/')
  }
});
app.post('/showSal/addSal', function(req, res, next) {
	var emp_id    = req.body.emp_id;
	var grade_name = req.body.grade_name;
	var emp_salary_month = req.body.emp_salary_month;
	var emp_salary_year = req.body.emp_salary_year;
	var recieved_date = req.body.recieve_date;
	   var sql = `INSERT INTO salary (emp_id,grade_no,emp_salary_month,emp_salary_year,recieve_date,emp_net_salary,emp_gross) VALUES 
	   ('${emp_id}', (Select grade_id from pay_grade where grade_name='${grade_name}'),
	   '${emp_salary_month}',
	   '${emp_salary_year}',
	   '${recieved_date}',
	   (Select grade_basic+grade_da+grade_bonus-grade_pf from pay_grade where grade_name='${grade_name}'),
	   (Select (grade_basic+grade_da+grade_bonus-grade_pf)*12 from pay_grade where grade_name='${grade_name}') )`;
   	connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Salary not added')
		res.redirect('/showSal')
	  }else{
		req.flash('success','Salary Added!')
		  res.redirect('/showSal')
		  console.log('record inserted')
	  }
	});
});


//COMPANY DETAILS
app.get('/showComp/add_deet',(req,res)=>{
	res.render('comp_form');
  });
app.post('/showComp', function(req, res, next) {
	var turnover  = req.body.turnover;
	var tax = req.body.tax;
   	var sql = `INSERT INTO company_details (turnover,tax) VALUES ('${turnover}', '${tax}')`;
   	connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Record not inserted')
		res.redirect('/showComp')
	  }else{
		  req.flash('success','Record Inserted')
		  res.redirect('/showComp')
		  console.log('record inserted')
	  }
	});
});
app.get('/showComp/:id/edit',(req,res)=>{
	var sql=`SELECT * FROM company_details where year=${req.params.id};`;
	connection.query(sql,(err,data,fields)=>{
		if(err)
		console.log(err)
		res.render('comp_edit', { cdata: data});
	})
})
app.post('/showComp/:id', function(req, res, next) {
	var turnover = req.body.turnover;
	var tax  = req.body.tax;
   var sql = `UPDATE company_details SET turnover='${turnover}',tax='${tax}' WHERE year=${req.params.id}`;
   connection.query(sql,function (err, data) {
	  if (err){
		  req.flash('error','Record not updated')
		res.redirect('/showComp')
	  }else{
		   req.flash('success','Record updated')
	  res.redirect(`/showComp`);
		   console.log('record updated');
	  }
	});
});
app.delete('/showComp/:id/',(req,res)=>{
	var sql=`Delete from company_details where year=${req.params.id}`;
	connection.query(sql,(err,data)=>{
		if (err){
		  req.flash('error','Record not deleted')
		res.redirect('/showComp')
	  }else{
		   req.flash('success','Record deleted')
	  res.redirect(`/showComp`);
		   console.log('record deleted');
	  }
	})
})


//PORTAL ROUTES
app.listen(3000,()=>{
    console.log("Server is running")
})