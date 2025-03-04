const express = require('express');
require('express-async-errors');
require('dotenv').config();
const session = require('express-session');
const flash = require('connect-flash');
const MongoDBStore = require('connect-mongodb-session')(session);
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const app = express();
const errorHandlerMiddleware = require('./middleware/error-handler');
const notFound = require('./middleware/not-found');
const csrfErrorHandler = require('./middleware/csrf-error-handler');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const methodOverride = require('method-override');

const connectDB = require('./db/connect');
const url = process.env.MONGO_URI;

app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());
app.use(xss());
app.use(methodOverride('_method'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

app.use(require('body-parser').urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

const store = new MongoDBStore({
  uri: url,
  collection: 'mySessions',
});
store.on('error', function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'strict',
  },
};
app.use(session(sessionParms));

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

const passport = require('passport');
const passportInit = require('./passport/passportInit');
passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

const storeLocals = require('./middleware/storeLocals');
app.use(storeLocals);

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.set('view engine', 'ejs');

app.use('/brands', require('./routes/brands'));
app.get('/', (req, res) => {
  res.render('index');
});

app.use('/sessions', require('./routes/sessionRoutes'));

app.use(csrfErrorHandler);
app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(url);
    console.log('Connected to MongoDB');
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
};

start();
