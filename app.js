const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
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

    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    const qrUrl = `${baseUrl}/product/${batchCode}`;

    // Tạo thư mục qrcodes nếu chưa tồn tại (fix lỗi ENOENT trên Render)
    const qrcodesDir = path.join(__dirname, 'public/qrcodes');
    if (!fs.existsSync(qrcodesDir)) {
      fs.mkdirSync(qrcodesDir, { recursive: true });
    }

    // Tên file QR an toàn (thay khoảng trắng, tiếng Việt bằng gạch ngang)
    const safeBatchCode = batchCode.replace(/[^a-zA-Z0-9]/g, '-');
    const qrPath = path.join(qrcodesDir, `${safeBatchCode}.png`);
    await QRCode.toFile(qrPath, qrUrl);

    res.render('success', { 
      message: 'Thêm lô thành công!', 
      qrImage: `/qrcodes/${safeBatchCode}.png`, 
      batchCode 
    });
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