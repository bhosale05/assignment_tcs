const express = require('express')
const path = require('path')
const hbs = require('hbs')
const bodyParser = require('body-parser')
const config = require('../config.json')
const mongoose = require('mongoose')
const deviceSchema = require('../model/device_schema')
const UserSchema = require('../model/user_schema')
const bcrypt = require('bcrypt')
const saltRounds = 10;
const flash = require('connect-flash')
const session = require('express-session')
const { application } = require('express')
const app = express()
const port = process.env.PORT || 3000

mongoose.connect('mongodb+srv://AB:archanab@ab.eoxpi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        console.log('Connect to DB...');
    })
    .catch((error) => {
        console.log(`Error : ${error}`);
    })

app.use(bodyParser.urlencoded({ extended: true }));
const publicpath = path.join(__dirname, '../public')
const viewpath = path.join(__dirname, '../template/views')
const partialpath = path.join(__dirname, '../template/partials')

app.set('views', viewpath);
app.set('view engine', 'hbs');
hbs.registerPartials(partialpath);

app.use(express.static(publicpath))
app.use(flash());

app.set('trust proxy', 1) // trust first proxy

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}))

app.get('', function(req, res) {
    res.render('signin',{
        title: config.signin.title
    });
});

app.get('/signin', (req, res) => {
    res.render('signin', {
        title: config.signin.title,
        message : req.flash('message')
    });
})

app.get('/signup', (req, res) => {
    res.render('signup', {
        title: config.signup.title,
        message : req.flash('message')
    });
})

app.post('/signin-user', (req, res) => {
    if (req.body.username && req.body.password) {
        UserSchema.findOne({ username: req.body.username }, (err, user) => {
            if (!user) {
                console.log(`error : no user with email : ${req.body.username}`);
                req.flash('message', `Error : No user with User Name ${req.body.username}}`)
            }
            if (user) {
                bcrypt.compare(req.body.password, user.password, (err, match) => {

                    if (err) {
                        console.log(`error : ${err}`);
                        req.flash('message', `Error : ${err}`)
                    }
                    if (!match) {
                        console.log(`error : Incorrect Password`);
                        req.flash('message', `Error : Incorrect Password`)
                        res.redirect('signin')
                    }
                    if (match) {
                        console.log(`login successfully for ${JSON.stringify(user)}`);
                        req.flash('message', 'login successfully')
                        sess = req.session;
                        sess.name = user.username;
                        res.render('index', {
                            title: config.devicepage.title,
                            text: config.devicepage.text,
                            name: req.session.name
                        });
                    }
                })
            }
            if (err) {
                console.log(`error : ${err}`);
                req.flash('message', `Error : ${err}`)
            }
        })
    }
})

app.post('/signup-user', async (req, res) => {
    let data = req.body;
    let password = data.password;
    let salt = await bcrypt.genSalt(saltRounds);
    let hashedPassword = await bcrypt.hash(password, salt);
    data.password = hashedPassword;
    UserSchema.collection.insertOne(data, (error, result) => {
        if (error) {
            console.log(`error : ${error}`);
            req.flash('message', `Error : ${error}`)
        } else {
            console.log(`User records Insert for ${JSON.stringify(data)}`);
            req.flash('message', 'User Added SuccessFully')
            setTimeout(() => {
                res.render('signin', {
                    title: config.signin.title
                });
            }, 1000);
        }
    })
});

app.get('/index', (req, res) => {
    console.log(session);
        res.render('index', {
            title: config.devicepage.title,
            text: config.devicepage.text,
            name: req.session.username
        })
   
})

app.get('/add', (req, res) => {
        res.render('add', {
            title: config.adddevice.title,
            addConfig: config.adddevice,
            name: req.session.name,
            message : req.flash('message')
        });
   
});

app.post('/add_device', (req, res) => {
    req.body.isCheckedOut = false;
    req.boddy.lastCheckedOutBy = req.session.username;
    deviceSchema.collection.insertOne(req.body, (error, result) => {
        if (error) {
            console.log(`error : ${error}`);
            req.flash('message', `Error : ${error}`);
        } else {
            console.log(`Device details Insert for ${JSON.stringify(req.body)}`);
            req.flash('message', 'Device Added SuccessFully')
            setTimeout(() => {
                res.render('add', {
                    title: config.adddevice.title,
                    addConfig: config.adddevice,
                    name: req.session.name
                });
            }, 1000);
        }
    })
});

app.get('/show', (req, res) => {
    deviceSchema.find((error, result) => {
        if (error) {
            console.log(`error : ${error}`);
            res.status(400).json({ error: error })
        } else {
            console.log(`get All Deivces`)
            res.render('show', {
                title: config.showalldevice.title,
                configData: config.showalldevice,
                name: req.session.name,
                result : result,
                message : req.flash('message')
            });
        }
    })
        
});


app.delete('/remove/:id', (req, res) => {
    deviceSchema.findByIdAndRemove(req.params.id, (err, res) => {
        if(!err){
            console.log(`Remove Device Successfully`);
        }
    })
})

app.get('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            req.flash('message', `Error : ${err}`)
        } else {
            res.redirect('/signin');
        }
    })
})

app.listen(port, () => {
    console.log(`Web-server app running on port ${port}`)
})