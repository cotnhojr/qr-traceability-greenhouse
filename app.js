const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const path = require('path');
const db = require('./firebase-config');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/admin', (req, res) => res.render('admin'));

app.post('/add-product-batch', async (req, res) => {
  try {
    const data = req.body;
    const batchCode = data.batchCode;
    await db.collection('batches').doc(batchCode).set(data);

    const qrUrl = `https://tamica-verdigrisy-nash.ngrok-free.dev/product/${batchCode}`; // Sau deploy thay domain thật
    const qrPath = path.join(__dirname, 'public/qrcodes', `${batchCode}.png`);
    await QRCode.toFile(qrPath, qrUrl);

    res.render('success', { message: 'Thêm lô thành công!', qrImage: `/qrcodes/${batchCode}.png`, batchCode });
  } catch (error) {
    res.render('error', { message: error.message });
  }
});

app.get('/product/:batchCode', async (req, res) => {
  try {
    const doc = await db.collection('batches').doc(req.params.batchCode).get();
    if (!doc.exists) return res.render('error', { message: 'Không tìm thấy lô!' });
    res.render('product', { product: doc.data() });
  } catch (error) {
    res.render('error', { message: error.message });
  }
});

app.listen(5000, () => console.log('Server chạy tại http://localhost:5000/admin'));