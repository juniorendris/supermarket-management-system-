const mysql = require('mysql2/promise');
const pool = require('./pool');
const express = require('express');
const path = require('path');
const { ok } = require('assert');
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('html'));

async function createTable() {
  const Table1 = `CREATE TABLE IF NOT EXISTS products(
    sku VARCHAR(100) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    expiration_date DATE
  )`;

  try {
    console.log('connecting to the database...');
    await pool.query(Table1);
    console.log('Table created successfully.');
  } catch(error) {
    console.error('could not create the table due to:', error);
  }
}

app.get('/script.js', async(req, res)=>{
  try {
    res.sendFile(path.join(__dirname, 'script.js'));
  } catch(err) {
    console.error(err.message);
    // Added a fallback response if the file fails to send
    if (!res.headersSent) res.status(500).send("Could not load script.js");
  }
});

app.post('/insert-product', async(req, res)=>{
  console.table(req.body);
  const {sku, product_name, category, price, stock_quantity, expiration_date} = req.body;
  const expirationDate = expiration_date || null;
  const productData = [sku, product_name, category, price, stock_quantity, expirationDate];
  const insertProduct = `INSERT INTO products(sku, product_name, category, price, stock_quantity, expiration_date)
  VALUES(?, ?, ?, ?, ?, ?)`;

  try {
    console.log(`product: ${product_name} is being inserted...`);
    const [result] = await pool.query(insertProduct, productData);
    res.status(201).json({ok: true, message: 'product is inserted successfully.'});
    console.log('product is inserted successfully.');
  } catch(error) {
    res.status(500).json({ok: false, error: error.message});
  }
});

app.get('/product-list', async(req, res)=>{
  const displayCmd = `SELECT * FROM products`;
  try {
    console.log('fetching products from the database...');
    const [rows] = await pool.query(displayCmd);
    if (!rows || rows.length === 0) {
      console.log('No products found!');
      return res.status(404).json({success: false, message: 'No products found!'}); // <-- Fixed: Added 'return'
    }
    console.log('All products are displayed successfully.');
    res.status(200).json({success: true, data:rows});
  } catch(error) {
    console.error('Error occurred when displaying products:', error.message);
    res.status(500).json({error: error.message});
  }
});

app.patch('/update-products', async(req, res)=>{
  const {sku, stock_quantity} = req.body;
  const updatedData = [stock_quantity, sku];
  const updateCmd = `UPDATE products SET stock_quantity = ? WHERE sku = ?;`;

  try {
    const [result] = await pool.query(updateCmd, updatedData);
    if (result.affectedRows === 0) {
      console.log('product is not found!');
      return res.status(404).json({success: false, message: 'Product is not found!'});
    }
    res.status(200).json({success: true, message:'Product is updated successfully.'});
    console.log('Product is updated successfully.');
  } catch(error) {
    res.status(500).json({error: error.message});
    console.error('Could not update data:', error.message);
  }
});

app.delete('/delete-product/:sku', async(req, res)=>{
  const {sku} = req.params;
  const deleteCmd = `DELETE FROM products WHERE sku=?;`;
  try {
    const [result] = await pool.query(deleteCmd, [sku]); // <-- Fixed: Destructured [result] properly for mysql2 pool
    if (result.affectedRows === 0) {
      console.log('product is not found!');
      return res.status(404).json({success: false, message: 'Product is not found!'});
    }
    res.status(200).json({success: true, message:'Product is deleted successfully.'});
    console.log('Product is deleted successfully.');
  } catch(error) {
    res.status(500).json({error: error.message});
    console.error('Could not delete data:', error.message);
  }
});

app.get('/search-product/:category', async(req, res)=>{
  const {category} = req.params;
  const searchCmd = `SELECT * FROM products WHERE category=?`;
  try {
    const [rows] = await pool.query(searchCmd, [category]);
    if (!rows || rows.length === 0) {
      console.log(`No products found with category '${category}'.`);
      return res.status(404).json({success: false, message: `No products found with category '${category}'.`}); // <-- Fixed: Added 'return'
    }
    console.log('Category products are found and displayed successfully.');
    res.status(200).json({success: true, data:rows});
  } catch(error) {
    console.error('Error occurred when searching products:', error.message);
    res.status(500).json({error: error.message});
  }
});

app.get('/low-stock-alert', async(req, res)=>{
  const checkStock = `SELECT sku, product_name, stock_quantity FROM products WHERE stock_quantity < 5 AND stock_quantity > 0`;
  try {
    const [rows] = await pool.query(checkStock);
    if (!rows || rows.length === 0) {
      console.log('No items are currently low');
      return res.json({success: false, message: 'No items are currently low.'}); // <-- Fixed: Added 'return'
    }
    res.status(200).json({success: true, data:rows});
    console.log('low stock products are displayed.');
  } catch(error) {
    console.error('Error occurred when finding low stock products:', error.message);
    res.status(500).json({error: error.message});
  }
});

app.get('/expiration-alert', async(req, res)=>{
  const expirationCmd = `SELECT sku, product_name, expiration_date FROM products WHERE expiration_date >= CURDATE() AND expiration_date <= DATE_ADD(CURDATE(), INTERVAL 2 WEEK)`;

  try {
    const [rows] = await pool.query(expirationCmd);
    if (!rows || rows.length === 0) {
      console.log('No items are going to be expired in the next two weeks.');
      return res.json({success: false, message: 'No items are going to be expired in the next two weeks.'}); // <-- Fixed: Added 'return'
    }
    res.status(200).json({success: true, data:rows});
    console.log('expired soon products are displayed.');
  } catch(error) {
    console.error('Error occurred when finding expiring products:', error.message);
    res.status(500).json({error: error.message});
  }
});

app.listen(PORT, ()=>{
  createTable();
  console.log(`server is on port ${PORT}`);
});