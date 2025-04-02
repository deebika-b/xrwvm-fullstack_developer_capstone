const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3030;

app.use(cors());
app.use(require('body-parser').urlencoded({ extended: false }));

const reviews_data = JSON.parse(fs.readFileSync(__dirname + "/data/reviews.json", 'utf8'));
const dealerships_data = JSON.parse(fs.readFileSync(__dirname + "/data/dealerships.json", 'utf8'));

mongoose.connect("mongodb://localhost:27017/", {dbName: 'dealershipsDB'}).catch(err => {
  console.log('MongoDB connection error:', err);
  // Continue even if MongoDB connection fails
});

const Reviews = require('./review');
const Dealerships = require('./dealership');

try {
  Reviews.deleteMany({}).then(() => {
    Reviews.insertMany(reviews_data.reviews);
  });
  Dealerships.deleteMany({}).then(() => {
    Dealerships.insertMany(dealerships_data.dealerships);
  });
} catch (error) {
  console.error('Error initializing database:', error);
  // Cannot use res here as it's not defined in this scope
}


// Express route to home
app.get('/', async (req, res) => {
    res.send("Welcome to the Mongoose API");
});

// Express route to fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch reviews by a particular dealer
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({dealership: req.params.id});
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Express route to fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const dealers = await Dealerships.find();
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dealers', error: error.message });
  }
});

// Express route to fetch Dealers by a particular state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const dealers = await Dealerships.find({ state: state });
    res.json(dealers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dealers by state', error: error.message });
  }
});

// Express route to fetch dealer by a particular id
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching dealer with ID:', id);
    
    // First try to find by numeric id field
    let dealer;
    try {
        // Convert the id parameter to a number if possible
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
            console.log('Looking up dealer by numeric id:', numericId);
            dealer = await Dealerships.findOne({ id: numericId });
            if (dealer) {
                console.log('Found dealer by numeric id:', dealer.full_name);
            }
        }
    } catch (idError) {
        console.log('Error finding by numeric id:', idError.message);
    }
    
    // If no dealer found by numeric id, try ObjectId as a fallback
    if (!dealer && mongoose.Types.ObjectId.isValid(id)) {
        try {
            console.log('Looking up dealer by ObjectId:', id);
            dealer = await Dealerships.findById(id);
            if (dealer) {
                console.log('Found dealer by ObjectId:', dealer.full_name);
            }
        } catch (objIdError) {
            console.log('Error finding by ObjectId:', objIdError.message);
        }
    }
    
    if (!dealer) {
        console.log('No dealer found with id:', id);
        return res.status(404).json({message: 'Dealer not found'});
    }
    
    res.json(dealer);
} catch (error) {
    console.error('Error in fetchDealer route:', error);
    res.status(500).json({ message: 'Error fetching dealer by ID', error: error.message });
  }
});

//Express route to insert review
app.post('/insert_review', express.raw({ type: '*/*' }), async (req, res) => {
    const data = JSON.parse(req.body);
  const documents = await Reviews.find().sort({ id: -1 });
  let new_id = documents[0].id + 1;

  const review = new Reviews({
    "id": new_id,
    "name": data.name,
    "dealership": data.dealership,
    "review": data.review,
    "purchase": data.purchase,
    "purchase_date": data.purchase_date,
    "car_make": data.car_make,
    "car_model": data.car_model,
    "car_year": data.car_year
  });

  try {
    const savedReview = await review.save();
    res.json(savedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error inserting review' });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
