// routes/stats.js
import express from 'express';
import mongoose from 'mongoose'; 
import Expense from '../models/expenseSchema.js';
import Product from '../models/productSchema.js';
import Shop from '../models/shopSchema.js';

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
      // 1. Match Product
      {
        $match: { productName: new mongoose.Types.ObjectId(productId) }
      },
      // 2. Join Product (to get name/unit)
      {
        $lookup: {
          from: 'products',
          localField: 'productName',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      // 3. Join Shop (to get shop name)
      {
        $lookup: {
          from: 'shops',
          localField: 'shopName',
          foreignField: '_id',
          as: 'shop'
        }
      },
      { $unwind: '$shop' },
      // 4. NEW: Join Brand (to get brand name for stats)
      {
        $lookup: {
          from: 'brands',
          localField: 'brandName',
          foreignField: '_id',
          as: 'brand'
        }
      },
      { $unwind: '$brand' },
      // 5. Project
      {
        $project: {
          _id: 0,
          date: { $ifNull: ['$purchaseDate', '$registeredDate'] },
          pricePerUnit: 1,
          finalPrice: 1, // Useful for reference
          productName: '$product.name',
          measurementUnit: '$product.measurementUnit',
          shopName: '$shop.name',
          brandName: '$brand.name', // NEW
          hasDiscount: 1,           // NEW
          discountValue: 1          // NEW (Optional, if you want to show how much %)
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    console.error('Error in /api/stats/price-per-unit-history:', err);
    next(err);
  }
});
export default router;