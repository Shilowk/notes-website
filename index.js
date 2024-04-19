const express = require('express');
const app = express()
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
var flash = require('connect-flash');
const db = require('./db');
const { addNote, deleteNote, editNote } = require('./models/notes');



// Salt and pepper constants
const saltRounds = 10;
const pepper = "hdhdhdhdghgfgfgfgfgfg"

app.set('view engine', 'ejs');
// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("style"))
app.use(express.static("views")); 
app.use(express.static("images")); 

// Session Configuration
app.use(session({
    secret: "kdgakgdkagkadgkadgdagk",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 } // Session timeout after 1 hour
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// MySQL Connection


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated(); 
    next();
})

// User model
function findUser(username, callback) {
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            callback(null, results[0]);
        } else {
            callback(null, null);
        }
    });
}

// Hashing Passwords with Salt and Pepper
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password + pepper, salt);
    return hash;
}

// Verify Passwords
function verifyPassword(password, hashedPassword) {
    return bcrypt.compareSync(password + pepper, hashedPassword);
}

// Passport Local Strategy
passport.use(new LocalStrategy(
    function(username, password, done) {
        findUser(username, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false, { message: 'Incorrect username. Try again' }); }
            if (!verifyPassword(password, user.password)) { return done(null, false, { message: 'Incorrect password. Try again' }); }
            return done(null, user);
        });
    }
));

// Serialize and Deserialize User
passport.serializeUser(function(user, done) {
    done(null, user.id);
});



passport.deserializeUser(function(Id, done) {
    db.query('SELECT * FROM users WHERE id = ?', [Id], function(err, results) {
        if (err) {
            return done(err);
        }
        if (results.length > 0) {
            done(null, results[0]);
        } else {
            done(new Error('User not found'));
        }
    });
});



// Register Route
app.post('/register', function(req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = hashPassword(password);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err, results) {
        if (err) throw err;

        // Authenticate the user after successful registration
        passport.authenticate('local')(req, res, function () {
            res.redirect('/dashboard');
        });
    });
});

// Login Route
app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
            req.flash('error', info.message);  // Store the error message in flash
            return res.redirect('/login');
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Logout Route
app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) {
            // Handle error
            console.error(err);
            return res.redirect('/'); // Redirect to homepage or login page
        }
        // Perform additional operations after logout if needed
        // For example, you can clear session data or perform other cleanup tasks
        
        // Redirect to the homepage or another appropriate page
        res.redirect('/');
    });
});



app.get('/register', function(req, res) {
  res.render('registration');
});

app.get('/login', function(req, res) {
    res.render('login', { messages: req.flash() });
});


app.get('/', function(req, res) {
    var user = req.isAuthenticated() ? req.user : null; // Fetch the authenticated user if available
    if (user) {
        console.log(user);
        console.log(user.username);
    }
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    }
    else{
        res.render('home', { user: user });
    }

});

app.get('/dashboard', function(req, res) {
    var user = req.isAuthenticated() ? req.user : null; // Fetch the authenticated user if available
    if (user) {
        console.log(user);
        console.log(user.username);
    }
    if (req.isAuthenticated()) {
        res.render('dashboard', { user: user });
    }
    else{
        res.redirect('/');
    }
    
}); 



// Middleware to check if user is authenticated
//function isLoggedIn(req, res, next) {
    //if (req.isAuthenticated()) {
    //    return next();
    //}
    //res.redirect('/login');
//}

app.get('/notes', (req, res) => {
    if (req.isAuthenticated()) {
        db.query('SELECT * FROM notes WHERE user_id = ?', [req.user.id], (err, results) => {
            if (err) throw err;
            res.render('notes', {  results });
        });
    } else {
        res.redirect('/dashboard');
    }
});

app.get('/add', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('add');
    } else {
        res.redirect('/dashboard');
    }
});

app.post('/addNote', (req, res) => {
    if (req.isAuthenticated()) {
        const userId = req.user.id;
        const title = req.body.title;
        const content = req.body.content;

        // Call the addNote function directly
        addNote(userId,title, content, (err) => {
            if (err) throw err;
            res.redirect('/notes');
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/deleteNote/:id', (req, res) => {
    if (req.isAuthenticated()) {
        const noteId = req.params.id;

        // Call the deleteNote function directly
        deleteNote(noteId, (err) => {
            if (err) throw err;
            res.redirect('../notes'); // Redirect back to the main notes page
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/ind/:id', function(req, res){
   const boy = req.params.id;
    db.query('SELECT * FROM notes WHERE id = ?', [boy], function(err, results){
        if (err){
           console.log(err  + "error");
        }

        res.render('individual', {results});
       });
    
});

app.post('/editNote/:id', (req, res) => {
    if (req.isAuthenticated()) {
        const id = req.params.id;
        const title = req.body.title;
        const content = req.body.content;

        editNote(id, title, content, (err) => {
            if (err) throw err;
            res.redirect('../notes'); // Redirect back to the main notes page after updating
            
        });
    } else {
        res.redirect('/login');
    }
});





   
app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0" , function(){
  console.log("The app is up and running!")
});