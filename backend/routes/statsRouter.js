// routes/stats.js
import express from 'express';
import mongoose from 'mongoose'; 
import Expense from '../models/expenseSchema.js';
import Product from '../models/productSchema.js';

const router = express.Router();

/**
 * GET /api/stats/expenses-by-month
 * Returns an array of:
 *   { month: "YYYY-MM", total: Number }
 */
router.get('/expenses-by-month', async (req, res, next) => {
  try {
    const data = await Expense.aggregate([
      // 1) pick whichever date is set
      {
        $addFields: {
          actualDate: {
            $cond: [
              { $ifNull: ['$purchaseDate', false] },
              '$purchaseDate',
              '$registeredDate'
            ]
          }
        }
      },
      // 2) group by year-month string
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$actualDate' } },
          total: { $sum: '$finalPrice' }
        }
      },
      // 3) rename fields
      {
        $project: {
          _id: 0,
          month: '$_id',
          total: 1
        }
      },
      // 4) sort ascending by month
      { $sort: { month: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/price-history', async (req, res, next) => {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ message: 'Missing productId' });
    }
  
    try {
      const data = await Expense.aggregate([
        // 1) only expenses for the requested product
        { 
          $match: { productName: mongoose.Types.ObjectId(productId) } 
        },
  
        // 2) turn that ObjectId into the actual product doc
        {
          $lookup: {
            from: 'products',               // the Mongo collection name
            localField: 'productName',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },           // we know there's exactly one
  
        // 3) project only what we need: 
        //    - date (purchaseDate or registeredDate)
        //    - finalPrice
        //    - product.name (for context)
        {
          $project: {
            _id: 0,
            date: { $ifNull: ['$purchaseDate', '$registeredDate'] },
            price: '$finalPrice',
            productName: '$product.name'
          }
        },
  
        // 4) sort by date ascending
        { $sort: { date: 1 } }
      ]);
  
      res.json(data);
    } catch (err) {
      console.error('Error in /api/stats/price-history:', err);
      next(err);
    }
  });

  router.get('/price-per-unit-history', async (req, res, next) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ message: 'Missing productId' });
  }

  try {
    const data = await Expense.aggregate([
      {
        $match: { productName: new mongoose.Types.ObjectId(productId) }
      },
      {
        $project: {
          date: { $ifNull: ['$purchaseDate', '$registeredDate'] },
          pricePerUnit: '$pricePerUnit', // directly use saved field here
          measurementUnit: 1,  // include if you want it for frontend
          productName: 1       // just keep productName ObjectId for now
        }
      },
      { $sort: { date: 1 } }
    ]);

    // If you want to populate productName for name and measurementUnit, do it here:
    const populated = await Expense.populate(data, { path: 'productName', select: 'name measurementUnit' });

    res.json(populated);
  } catch (err) {
    console.error('Error in /api/stats/price-per-unit-history:', err);
    next(err);
  }
});

export default router;