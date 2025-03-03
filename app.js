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

app.use(helmet());
app.use(xss());
app.use(methodOverride('_method'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

const connectDB = require('./db/connect');
const url = process.env.MONGO_URI;

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
    secure: true,      //Aliina, don't forget: false - for local
    httpOnly: true,
    sameSite: 'strict',
  },
};
app.use(session(sessionParms));

const passport = require('passport');
const passportInit = require('./passport/passportInit');

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.set('view engine', 'ejs');

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(require('body-parser').urlencoded({ extended: true }));

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

app.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

const storeLocals = require('./middleware/storeLocals');
app.use(storeLocals);

const brands = require('./routes/brands');
app.use('/brands', brands);

app.get('/', (req, res) => {
  res.render('index');
});

app.use('/sessions', require('./routes/sessionRoutes'));

app.use(csrfErrorHandler);

app.use(notFound);

app.use(errorHandlerMiddleware);

app.use(express.static(path.join(__dirname, 'public')));

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
