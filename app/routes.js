module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/styles.css', (req, res) => {
      res.sendFile(__dirname + '/public/styles.css');
    })

    // app.get('/main.js', (req, res) => {
    //   res.sendFile(__dirname + '/public/main.js');
    // })

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('movies').find({user: req.user.local.email}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            myMovies: result,
            thisMovies: '',
            thisOver: '',
            thisTitle: ''
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// interact with movies ===============================================================

    app.post('/search/:mov/', (req, res) => {
      let mov = req.body.mov
      // console.log(req.body.mov)
      url = `https://api.themoviedb.org/3/search/movie?api_key=e54287ed12091ea4716ed53e3db2812f&language=en-US&query=${mov}&page=1&include_adult=false`
      fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log(data.results[0], 'data')
        thisTitle = data.results[0].original_title
        thisOver = data.results[0].overview
        db.collection('movies').find({user: req.user.local.email}).toArray((err, result) => {
          if (err) return console.log(err)
          res.render('search.ejs', {
            user : req.user,
            myMovies: result,
            // thisMovies: '',
            thisOver: thisOver,
            thisTitle: thisTitle
          })
        })
      })
      .catch(error => {
        console.error(error)
      })
    })

    app.post('/mine/:movie', (req, res) => {
      db.collection('movies').findOne({user: req.user.local.email, title: req.body.myMov, over: req.body.myOver, love: true}, (err, result) =>{
        if (err) return console.log(err)
        //if it is
        if (result) {
          console.log('we got it')
          res.redirect('/profile')
        }
        //if it's a new word
        else {
          db.collection('movies').save({user: req.user.local.email, title: req.body.myMov, over: req.body.myOver, love: true}, (err, result) => {
            if (err) return console.log(err)
          console.log('saved to database')
          res.redirect('/profile')
        })
        }
      })
    })

    // app.delete('/movies', (req, res) => {
    //   db.collection('movies').findOneAndDelete({user: req.user.local.email, movie: req.body.movie}, (err, result) => {
    //     if (err) return res.send(500, err)
    //     res.send('Message deleted!')
    //   })
    // })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash movies
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash movies
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
