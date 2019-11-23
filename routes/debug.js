const express = require('express');
const router = express.Router();
const { name: projectId } = require('../package.json');

const Multer = require('multer');
const multer = Multer({
  storage: Multer.MemoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // no larger than 10mb
  }
});

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});
const bucket = storage.bucket('simc-web.appspot.com');

const Firestore = require('@google-cloud/firestore');
const db = new Firestore({
  projectId,
  keyFilename: './secret/SIMC-Web-4d0cc28353fd.json',
});

//error test
router.get('/err', (req, res, next) => {
  next(new Error('eiei'));
});
router.get('/love', (req, res, next) => {
  req.flash('love', '💖😍<span onclick="window.location=\\\'https://www.google.com\\\';">💓</span>');
  res.redirect('/');
});

// get session
router.get('/session', (req, res, next) => {
  console.log(req.session);
  next(new Error('don\'t come here!'));
});

router.get('/email', (req, res, next) => {
  res.send(req.user.get('email'));
});

router.get('/upload', (req, res) => {
  res.render('upload.ejs');
});
router.post('/upload', multer.any(), (req, res, next) => {
  req.files.forEach(e => {
    let ext = e.originalname.split('.').slice(-1)[0];
    // const gcspath = 'answers/' + req.body.part + '/' + e.fieldname + '/' + req.user.get('email') + '-' + Date.now() + '.' + ext;
    const gcspath = req.body.path + e.originalname
    if (!gcspath) return ;
    req.body[e.fieldname] = gcspath;
    const file = bucket.file(gcspath);

    const stream = file.createWriteStream({
      metadata: {
        contentType: e.mimetype
      },
      resumable: false
    });

    stream.on('error', (err) => {
      e.cloudStorageError = err;
      next(err);
    });

    stream.on('finish', () => {
      e.cloudStorageObject = gcspath;
      file.makePublic();
    });

    stream.end(e.buffer);
  });
  res.send('ok');
});

router.get('/delete', async (req, res, next) => {
  let a = await db.collection('email').doc(req.query.email).delete();
  res.send(JSON.stringify(a));
});

router.get('/agree', async (req, res, next) => {
  if (req.hostname == 'www.sirirajmedcamp.com' || req.hostname == 'sirirajmedcamp.com') res.send('--');
  let a = await db.collection('users').where('agree', '==', true).get();
  res.send('' + a.docs.length);
});

router.get('/done', async (req, res, next) => {
  if (req.hostname == 'www.sirirajmedcamp.com' || req.hostname == 'sirirajmedcamp.com') res.send('--');
  let a = await db.collection('users').where('done', '==', true).get();
  res.send('' + a.docs.length);
});

router.get('/cnt', async (req, res, next) => {
  /* let x = await db.collection('users')
    .where('done', '==', false)
    .get();

  x.forEach(async e => {
    let pre = (await db.collection('answers')
      .where('email', '==', e.get('email'))
      .where('part', '==', 1)
      .where('num', '==', 5)
      .get()).docs[0].get('ans');

    let name = (await db.collection('answers')
      .where('email', '==', e.get('email'))
      .where('part', '==', 1)
      .where('num', '==', 6)
      .get()).docs[0].get('ans');

    let sur = (await db.collection('answers')
      .where('email', '==', e.get('email'))
      .where('part', '==', 1)
      .where('num', '==', 7)
      .get()).docs[0].get('ans');

    let fb = (await db.collection('answers')
      .where('email', '==', e.get('email'))
      .where('part', '==', 1)
      .where('num', '==', 22)
      .get()).docs[0].get('ans');
    
    console.log(fb + ' -> ' + pre + ' ' + name + ' ' + sur);
  }); */
  
  /* let a = await db.collection('users').get();
  console.log(a.docs.length);
  a.forEach(async e => {
    let file = (await db.collection('answers')
      .where('email', '==', e.get('email'))
      .where('part', '==', 1)
      .where('num', '==', 61)
      .get());
    // if (file.empty) console.log(e.get('email'));
  }); */

  let ans = (await db.collection('answers')
    // .where('email', '==', 'a@aa.com')
    .where('part', '==', 6)
    .get()).docs;
  ans.forEach(e => {
    console.log(e.get('num') + ': ' + e.get('ans'));
  });


  /* let fb = (await db.collection('answers')
    .where('email', '==', 'khwankhwanludee@gmail.com')
    .where('part', '==', 1)
    .where('num', '==', 61)
    .get()).docs[0];
  console.log(fb.get('ans')); */

  res.send('ok');
});

router.get('/newnewuijrnkijferijgreisjgri', async (req, res, next) => {
  /*
  for (i = 1; i <= 60; i++) {
    await db.collection('exam').doc().create({
      answerType: 'text',
      num: i,
      part: 1
    });
  }
  await db.collection('exam').doc().create({
    answerType: 'upload',
    num: 61,
    part: 1
  });
  await db.collection('exam').doc().create({
    answerType: 'upload',
    num: 62,
    part: 1
  });

  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 1,
    part: 6,
    question: '3 8 15 24 35 <b><u>?</u></b>',
    subQuestion: '40\n42\n46\n48\n49'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 2,
    part: 6,
    question: 'ในการแข่งขันกีฬาชนิดหนึ่ง มีนาย A B C D E F G เป็นนักกีฬา และมีการแบ่งออกเป็น 2 กลุ่ม โดยกลุ่มที่ 1 มี 3 คนและกลุ่มที่ 2 มี 4 คน โดยที่มีเงื่อนไขดังนี้<br>(i) A อยู่คนละกลุ่มกับ E และ F<br>(ii) B อยู่กลุ่มเดียวกับ G<br>(iii) ถ้า A อยู่กลุ่มที่ 1 แล้ว C จะอยู่กลุ่มที่ 2<br>ถามว่าข้อใดถูกเสมอในทุกกรณี',
    subQuestion: 'A อยู่คนละกลุ่มกับ B\nF อยู่คนละกลุ่มกับ G\nA อยู่กลุ่มเดียวกับ C\nD อยู่กลุ่มเดียวกับ E\nC อยู่กลุ่มเดียวกับ F'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 3,
    part: 6,
    question: 'นับตั้งแต่ 0.00 ของวันที่ 16 พฤศจิกายน 2562 ถึง 23.59 ของวันที่ 17 พฤศจิกายน 2562 เข็มสั้นและเข็มยาวนาฬิกาเข็มที่เดินเที่ยงตรงจะซ้อนทับกันพอดีกี่ครั้ง',
    subQuestion: '21\n22\n23\n24\n25'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 4,
    part: 6,
    question: '2 # 4=17<br>7 # 2=50<br>3 # 3=28<br>1 # 8=?',
    subQuestion: '1\n2\n6\n10\n16'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 5,
    part: 6,
    question: 'B  S  R  I  O  L  N  V  Z  E  E  <b><u>?</u></b>',
    subQuestion: 'G\nO\nL\nD\nR'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 6,
    part: 6,
    question: 'โมริ โคโกโร่ ถูกฆาตกรรม สารวัตรเมงุเระจับผู้ต้องสงสัยได้ 3 คน คือ โคนัน รัน และไซโนโกะ ซึ่งผู้ต้องสงสัยแต่ละคนให้การดังนี้<br>โคนัน : พี่ไซโนโกะไม่ได้ฆ่าครับ<br>รัน : โคนันพูดโกหกค่ะ<br>ไซโนโกะ : โคนันคุงบริสุทธิ์นะ<br>ถ้าฆาตกรมีคนเดียว และจำนวนคนพูดจริงน้อยกว่าคนพูดโกหก ข้อใดถูก',
    subQuestion: 'โคนันโกหก\nรันเป็นฆาตกร\nทุกคนโกหก\nไซโนโกะพูดจริง\nรันโกหก'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 7,
    part: 6,
    question: 'มีลูกบอล 8 ลูก มีลูกหนึ่งน้ำหนักมากกว่าลูกอื่น ถ้ามีตาชั่ง 2 แขนอยู่หนึ่งอัน ถามว่าต้องชั่งอย่างน้อยที่สุดที่ครั้ง จึงจะระบุลูกที่น้ำหนักมากกว่าลูกอื่นได้',
    subQuestion: '1 ครั้ง\n2 ครั้ง\n3 ครั้ง\n4 ครั้ง\n5 ครั้ง'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 8,
    part: 6,
    question: 'แบคทีเรีย <u>Staphylococcus aureus</u> 1 ตัว อยู่่ในขวดโหลปิดที่มีอาหาร ถ้าแบคทีเรียแบ่งตัวเป็น 2 เท่าทุกวัน และแบคทีเรียแบ่งตัวจนเต็มโหลใน 60 วัน ถามว่าแบคทีเรียจะมีปริมาณครึ่งโหลเมื่อผ่านไปกี่วัน',
    subQuestion: '20 วัน\n30 วัน\n45 วัน\n55 วัน\n59 วัน'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 9,
    part: 6,
    question: 'ในขวดโหลใบหนึ่งมีลูกปัด 200 เม็ด เป็นลูกปัดสีดำ 99 เปอร์เซ็นต์ ถามว่าต้องหยิบลูกปัดสีดำออกกี่เม็ด จึงจะทำให้เหลือลูกปัดสีดำในขวดโหล 98 เปอร์เซ็นต์',
    subQuestion: '2\n4\n10\n100\n120'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 10,
    part: 6,
    question: 'ยอดกับยิ่งวิ่งแข่งเป็นระยะ 100 เมตร ถ้าขณะที่ยอดถึงเส้นชัย ยิ่งยังอยู่ห่างจากเส้นชัย 10 เมตร ถ้าเริ่มแข่งใหม่โดยยอดเริ่มวิ่งหลังจากจุดสตาร์ท 10 เมตร ถามว่าใครจะถึงเส้นชัยก่อน',
    subQuestion: 'ยอด\nยิ่ง\nถึงพร้อมกัน'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 11,
    part: 6,
    question: 'A เป็นพี่ชายคนเดียวของ B  B เป็นอาของ C  C เป็นลูกของ D  D เป็นแม่ของ E ถามว่า A เป็นอะไรกับ E',
    subQuestion: 'พ่อ\nลุง\nพี่เขย\nปู่\nลูกพี่ลูกน้อง'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 12,
    part: 6,
    question: 'ข้อใดไม่สามารถเรียงสลับอักษรจนกลายเป็นคำศัพท์ภาษาอังกฤษที่มีความหมายเป็นอวัยวะในร่างกายได้',
    subQuestion: 'Deni Ky\nHo Tum\nEng Fri\nBrian\nAc Muths'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 13,
    part: 6,
    question: '',
    subQuestion: '7\n11\n13\n15\n26'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 14,
    part: 6,
    question: '',
    subQuestion: '0\n1\n2\n3\n5'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 15,
    part: 6,
    question: 'สมศักดิ์มีเงินน้อยกว่า 2 เท่าของสมชายอยู่ 1,000 บาท สมศักดิ์ สมชาย และสมลักษณ์มีเงินรวมกันเท่ากับเท่าใด<br>(ก) สองเท่าของเงินของสมลักษณ์รวมกับสามเท่าของเงินของสมศักดิ์เท่ากับ 600 บาท<br>(ข) สมลักษณ์มีเงินมากกว่า 3 เท่าของสมศักดิ์อยู่ 1,000 บาท<br>ข้อใดถูกต้อง',
    subQuestion: 'ใช้เงื่อนไข (ก) เพียงข้อเดียวก็เพียงพอในการหาคำตอบ\nใช้เงื่อนไข (ข) เพียงข้อเดียวก็เพียงพอในการหาคำตอบ\nใช้เงื่อนไข (ก) หรือ (ข) เพียงข้อใดข้อหนึ่งก็เพียงพอในการหาคำตอบ\nต้องใช้ทั้งเงื่อนไข (ก) และ (ข) จึงเพียงพอในการหาคำตอบ\nทั้งเงื่อนไข (ก) และ (ข) ยังไม่เพียงพอในการหาคำตอบ'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 16,
    part: 6,
    question: 'มีผู้สมัครเข้าร่วมค่ายเส้นทางสู่หมอศิริราช 256 คน ถ้าต้องการจัดการแข่งขันว่าใครเล่นปิงปองเก่งที่สุด โดยเริ่มแข่งโดยจับคู่กัน แข่งกัน ใครแพ้โดนคัดออก คนที่ชนะทุกคนก็จะให้จับคู่ใหม่ และแข่งกันตามเดิม ถามว่าเมื่อเหลือเฉพาะผู้ที่เล่นปิงปองเก่งที่สุด จะเกิดการแข่งขันปิงปองรวมกี่ครั้ง',
    subQuestion: '192 ครั้ง\n238 ครั้ง\n255 ครั้ง\n256 ครั้ง\n512 ครั้ง'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 17,
    part: 6,
    question: 'กำหนดตัวเลข 4 ตัว 2 ชุดต่อไปนี้ ให้ใช้การดำเนินการบวก ลบ คูณ หาร วงเล็บ โดยให้ใช้ตัวเลขตัวละหนึ่งครั้งสามารถทำให้เป็น 24 ได้หรือไม่<br>(i) 2  5  6  2<br>(ii) 5  5  5  5',
    subQuestion: '(i) ได้ (ii) ได้\n(i) ได้ (ii) ไม่ได้\n(i) ไม่ได้ (ii) ได้\n(i) ไม่ได้ (ii) ไม่ได้'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 18,
    part: 6,
    question: 'รูปในข้อใดไม่สามารถเกิดจากการพับรูปต่อไปนี้ได้',
    subQuestion: '<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_18_1.jpeg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_18_2.jpeg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_18_3.jpeg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_18_4.jpeg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_18_5.jpeg"/>'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 19,
    part: 6,
    question: '1  2  2  4  8  32  <b><u>?</u></b>',
    subQuestion: '40\n64\n128\n256\n1024'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 20,
    part: 6,
    question: 'A  C  F  J  O  U  B  <b><u>?</u></b>',
    subQuestion: 'J\nL\nM\nN\nQ'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 21,
    part: 6,
    question: 'ยา paracetamol เป็นยาที่มีครึ่งชีวิต 4 ชั่วโมง ถ้าปกติกินยา paracetamol 1 เม็ด ยาจะหมดฤทธิ์ใน 16 ชั่วโมง ถ้ากินยา paracetamol ขนาดเดิม 2 เม็ด ถามว่ายาจะหมดฤทธิ์โดยประมาณในกี่ชั่วโมง',
    subQuestion: '16\n20\n24\n32\n64'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 22,
    part: 6,
    question: '3  1  4  1  5  9  2  <b><u>?</u></b>',
    subQuestion: '3\n5\n6\n8\n9'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 23,
    part: 6,
    question: '',
    subQuestion: '<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_23_1.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_23_2.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_23_3.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_23_4.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_23_5.jpg"/>'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 24,
    part: 6,
    question: '',
    subQuestion: '<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_24_1.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_24_2.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_24_3.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_24_4.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_24_5.jpg"/>'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 25,
    part: 6,
    question: '',
    subQuestion: '<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_25_1.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_25_2.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_25_3.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_25_4.jpg"/>\n<img src="https://storage.googleapis.com/simc-web.appspot.com/public/choice/6_25_5.jpg"/>'
  });

  // part 2
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 1,
    part: 2,
    question: 'ถ้ามีเพื่อนของท่านสนิทกับอาจารย์ในรายวิชาหนึ่งมาก แต่ปกติเพื่อนของท่านคนนั้นไม่ตั้งใจเรียน ไม่อ่านหนังสือ ในขณะที่น้องตั้งใจมาก ขยันทบทวนบทเรียนทุกวัน หลังทราบผลการสอบ เพื่อนของท่านได้คะแนนดี ในขณะที่ท่านได้คะแนนไม่ดีเท่าที่ควร ท่านจะทำอย่างไร',
    subQuestion: 'ต่อว่าและเลิกคบกับเพื่อนคนนั้นทันที\nไม่สนใจเรื่องของเพื่อน ดูว่าตัวเองผิดพลาดตรงไหน และปรับปรุงในคราวหน้า\nเข้าไปถามความจริงจากอาจารย์คนนั้นเพื่อความยุติธรรม\nเข้าไปเตือนเพื่อนว่าสิ่งที่เพื่อนทำนั้นผิด และจะส่งผลเสียในอนาคตแน่นอน\nเลิกตั้งใจเรียน และพยายามทำความสนิทสนมกับอาจารย์บ้าง'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 2,
    part: 2,
    question: 'ถ้าท่านต้องทำงานกลุ่ม 5 คน โดยในกลุ่มมีนาย A อยู่ด้วย และท่านเคยได้ยินจากเพื่อนสนิทท่านว่านาย A เป็นคนมั่นใจในตัวเองมาก ชอบออกคำสั่งเพื่อนโดยไม่ทำอะไรเลย ท่านจะมีวิธีการทำงานกับนาย A อย่างไร',
    subQuestion: 'ลองทำงานด้วยกันดูก่อน หากมีเรื่องที่เห็นไม่ตรงกันจริงๆ ค่อยปรับความเข้าใจกัน\nเวลาแบ่งงานพยายามหลีกเลี่ยงการคุยกับนาย A แล้วตั้งใจทำงานส่วนของตนเองให้เต็มที่\nอาสารับงานใหญ่ๆ คนเดียว ลดความกระทบกระทั่งกับเพื่อน\nนั่งจับเข่าคุยตั้งแต่เริ่มงาน ตัดไฟตั้งแต่ต้นลม เวลาทำงานจะได้ไม่มีปัญหา\nคุยกับเพื่อนคนอื่นในกลุ่มเรื่องนาย A โดยไม่บอกเจ้าตัว เพื่อให้เขาไม่มีอำนาจสั่งอะไร'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 3,
    part: 2,
    question: 'มีผู้ป่วยคนหนึ่งมาถามท่านเกี่ยวกับอาการป่วยของตนเอง แล้วท่านเป็นแพทย์ผู้ดูแลผู้ป่วยคนนี้ แต่ท่านจำข้อมูลไม่ได้ แต่จำได้ว่าข้อมูลเกี่ยวกับอาการผู้ป่วยรายนี้อยู่ที่สมุดจดส่วนตัวของท่านในห้องพักแพทย์และท่านกำลังรีบที่จะไปเข้าประชุม ท่านจะทำอย่างไร',
    subQuestion: 'เดินกลับไปดูข้อมูลที่สมุดจดให้\nตอบแบบเท่าที่จำได้อันไหนจำไม่ได้ก็ประมาณข้อมูลเอาเอง\nตอบเท่าที่จำได้ รายละเอียดที่จำไม่ได้บอกผู้ป่วยว่า ไว้ประชุมเสร็จจะมาบอกรายละเอียดอีกที\nบอกผู้ป่วยว่าตอนนี้ยังไม่ว่าง ไว้ว่างแล้วค่อยมาหาใหม่อีกที\nโทรไปบอกหัวหน้าว่าจะไปประชุมช้า เนื่องจากคนไข้มีเหตุจำเป็น'
  }); */
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 4,
    part: 2,
    question: 'ผู้ป่วยชายอายุ 32 ปี มอเตอร์ไซค์ล้ม มีบาดแผลขนาดใหญ่ที่แขนและขา ถูกนำส่งโรงพยาบาล ท่านเป็นแพทย์เวรประจำหอผู้ป่วย ได้รับการแจ้งจากพยาบาลว่า ผู้ป่วยปฏิเสธการรักษาและต้องการกลับบ้าน แต่ผู้ป่วยมีอาการมึนเมา เริ่มอาละวาดทำร้ายข้าวของ ท่านควรทำอย่างไร',
    subQuestion: 'เป็นสิทธิของผู้ป่วยที่จะปฏิเสธการรักษา ปล่อยตัวไปเลย\nให้ผู้ป่วยลงนามปฏิเสธการรักษา และปล่อยตัวไป\nเรียก รปภ. เพื่อกักตัวผู้ป่วยไว้ และรักษาความสงบในหอผู้ป่วย\nปรึกษาจิตแพทย์ร่วมประเมินอาการของผู้ป่วย\nถามย้ำผู้ป่วยอีกครั้ง หากเขายังยืนยันที่จะกลับ ก็ปล่อยตัวแล้วให้ รปภ. เรียกแท็กซี่ให้'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 5,
    part: 2,
    question: 'ผู้ป่วยหมดสติขณะถูกนำส่งโรงพยาบาล แพทย์วินิจฉัยว่าเป็นมะเร็งปอดระยะสุดท้าย ญาติได้มาปรึกษากับท่านซึ่งเป็นแพทย์เจ้าของไข้ ขอร้องไม่ให้บอกผู้ป่วยเนื่องจากรู้ว่าผู้ป่วยขี้กังวลและเป็นโรคหัวใจ แพทย์ควรปฏิบัติอย่างไร',
    subQuestion: 'แนะนำให้ญาติเห็นความสำคัญในการบอกความจริงกับผู้ป่วย\nบอกญาติว่าจะบอกความจริงกับผู้ป่วยเนื่องจากเป็นสิทธิของคนไข้\nรับปากกับญาติว่าจะไม่บอก แต่หากผู้ป่วยถามก็บอกความจริงไป\nบอกความจริงกับผู้ป่วย เพราะหากเกิดอะไรขึ้นก็ไม่ใข่ความรับผิดชอบของแพทย์\nบอกผู้ป่วยว่าเป็นอีกโรคว่าเป็นอีกโรคที่รุนแรงน้อยกว่าแทน เพื่อให้ผู้ป่วยสบายใจ'
  }); /*
  
  // part 3
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 1,
    part: 3,
    question: 'ในประวัติศาสตร์อันยาวนานของมนุษย์มีโรคเพียงชนิดเดียวที่ถูกกำจัดจนหมดสิ้น ด้วยการคิดค้นวัคซีนของมนุษย์ โรคนั้นมีชื่อว่าอะไร',
    subQuestion: '1'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 2,
    part: 3,
    question: 'อุปกรณ์ชิ้นนี้ใช้ในการตรวจหูในทางคลินิก อุปกรณ์ชิ้นนี้มีชื่อว่าอะไร',
    subQuestion: '1'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 3,
    part: 3,
    question: 'นายยุทธรู้สึกว่าตนเองเริ่มอ่านหนังสือได้ไม่ค่อยชัดจึงไปพบจักษุแพทย์เพื่อทำการตรวจสายตา<br>แพทย์ทดสอบสายตานายยุทธด้วยอุปกรณ์ข้างต้น อุปกรณ์นี้มีชื่อว่าอะไร<br>เมื่อทดสอบสายตาเสร็จ แพทย์ได้เขียนลงไปในกระดาษว่า “6/36 Both eyes” หมายความว่าอย่างไร',
    subQuestion: '2'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 4,
    part: 3,
    question: 'ทำไมยาต้านการอักเสบที่ไม่ใช่ steroid แบบดั้งเดิม (conventional NSAIDs) เช่น aspirin จึงต้องทานหลังอาหารเท่านั้น',
    subQuestion: '2'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 5,
    part: 3,
    question: 'CPR ย่อมาจากอะไร เป็นกระบวนการปฐมพยาบาลที่ไว้ใช้เมื่อผู้ป่วยมีอาการอย่างไร',
    subQuestion: '2'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 6,
    part: 3,
    question: 'เลือกตอบ 1 ข้อ อธิบายอย่างละเอียด<br>น้องคิดว่า ยาปฏิชีวนะ กับ ยาแก้อักเสบ เหมือนกันหรือไม่ อย่างไร<br>น้องมีความคิดเห็นอย่างไรกับกระแสต่อต้านการฉีดวัคซีน (The anti-vaccination movement) ที่เกิดขึ้นในหลายมุมทั่วโลก',
    subQuestion: '3'
  });

  // part 4
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 1,
    part: 4,
    question: 'ตราสัญลักษณ์ต่อไปนี้เป็นตราสัญลักษณ์ของสถานที่ใด',
    subQuestion: 'โรงพยาบาลศิริราชปิยมหาราชการุณย์\nศูนย์วิจัยการแพทย์ศิริราช\nศูนย์การแพทย์กาญจนาภิเษก\nศิริราชมูลนิธิ\nพิพิธภัณฑ์ศิริราชพิมุขสถาน'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 2,
    part: 4,
    question: 'extern ของปีการศึกษานี้ (พ.ศ.2562) เป็นนักศึกษาแพทย์ศิริราชรุ่นที่เท่าไร',
    subQuestion: '122\n123\n124\n125\n126'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 3,
    part: 4,
    question: 'ธงมหิดลปีหน้าจะมีสีอะไร',
    subQuestion: 'แดง\nขาว\nฟ้า\nชมพู\nส้ม'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 4,
    part: 4,
    question: 'คณบดีคนปัจจุบันของคณะแพทยศาสตร์ศิริราชพยาบาลชื่ออะไร ดำรงตำแหน่งเป็นวาระที่เท่าไร',
    subQuestion: 'ศ.ดร.นพ.ประสิทธิ์ วัฒนาภา, วาระที่ 1\nศ.ดร.นพ.ประสิทธิ์ วัฒนาภา, วาระที่ 2\nศ.คลินิกเกียรติคุณ นพ.อุดม คชินทร, วาระที่ 2\nศ.คลินิกเกียรติคุณ นพ.ปิยะสกล สกลสัตยาทร, วาระที่ 1\nศ.คลินิกเกียรติคุณ นพ.ปิยะสกล สกลสัตยาทร, วาระที่ 2'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 5,
    part: 4,
    question: 'ข้อใดคือคุณลักษณะที่พึงประสงค์ของบัณฑิตแพทย์ศิริราช',
    subQuestion: 'SKILLS\nSKILL\nSIRIRAJ\nSKULLS\nSKIP'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 6,
    part: 4,
    question: 'ข้อใดกล่าวผิดเกี่ยวกับพิพิธภัณฑ์การแพทย์ศิริราช',
    subQuestion: 'สมเด็จพระเทพฯ เสด็จฯ ทรงเปิดพิพิธภัณฑ์ประวัติการแพทย์ไทย อวย เกตุสิงห์ เมื่อวันที่ 1 ตุลาคม พ.ศ.2522 โดยมีสิ่งจัดแสดงหลายหลาย เช่น กระบองอาญาสิทธิ์ที่แพทย์หลวงใช้เก็บสมุนไพร\nในปี พ.ศ.2525 มีพิพิธภัณฑ์เปิดรวม 13 แห่ง แต่ปัจจุบันมีพิพิธภัณฑ์เปิดเพียง 6 แห่งเท่านั้น\nการมาเยี่ยมชมพิพิธภัณฑ์พิมุขสถานสามารถนั่งเรือด่วนเจ้าพระยามาลงที่ท่าเรือรถไฟได้ โดยพิพิธภัณฑ์จะเปิดทำการในวันจันทร์ พุธ ศุกร์ และอาทิตย์\nพิพิธภัณฑ์นิติเวชศาสตร์ สงกรานต์ นิยมเสน จัดแสดงเครื่องมือที่ใช้ชันสูตรพระบรมศพของพระบาทสมเด็จพระเจ้าอยู่หัวอานันทมหิดล\nพิพิธภัณฑ์ก่อนประวัติศาสตร์ และห้องปฏิบัติการ สุด แสงวิเชียร จัดแสดงเกี่ยวกับวิวัฒนาการมนุษย์ในยุคประวัติศาสตร์ ประวัติศาสตร์พื้นโลก และเครื่องมือเครื่องประดับในสมัยยุคหินเก่า หินกลาง และหินใหม่'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 7,
    part: 4,
    question: 'การเปิดรับสมัครนักศึกษาหลักสูตรแพทยศาสตรบัณฑิตของคณะแพทยศาสตร์ศิริราชพยาบาลในปัจจุบันดำเนินการผ่านโครงการหลายโครงการ โครงการใดต่อไปนี้ไม่ใช่โครงการที่มีในปัจจุบัน',
    subQuestion: 'กสพท\nโครงการโอลิมปิกวิชาการ\nโครงการทุนมหิดลวิทยาจารย์\nโครงการโอลิมปิกวิชาการ – เหรียญทองระดับนานาชาติ\nทุกข้อเป็นโครงการที่มีในปัจจุบัน'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 8,
    part: 4,
    question: 'เมื่อจบการศึกษาชั้นปีใด นักศึกษาในคณะแพทยศาสตร์ศิริราชพยาบาลจะต้องย้ายการเรียนการสอนจากมหาวิทยาลัยมหิดล ศาลายา มาสู่โรงพยาบาลศิริราช',
    subQuestion: 'ชั้นปีที่ 1\nชั้นปีที่ 2\nชั้นปีที่ 3\nชั้นปีที่ 4\nชั้นปีที่ 5'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 9,
    part: 4,
    question: 'นักศึกษาชั้นปีที่ 1 คณะแพทยศาสตร์ศิริราชพยาบาล ปีการศึกษา 2562 เข้าค่ายที่จัดโดยรุ่นพี่หลายค่าย ค่ายที่จัดเป็นค่ายแรกคือค่ายใด',
    subQuestion: 'รักแรกพบ\nทัวร์ศาลายา\nNice To Meet (Sala)Ya\nรับน้องข้ามฟาก\nTrip Camp'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 10,
    part: 4,
    question: 'ในช่วงสิ้นปีพ.ศ. 2561 โครงการก้าวคนละก้าว ได้จัดสร้างภาพยนตร์สารคดี “2,215 เชื่อ บ้า กล้า ก้าว” โดยมีการรับบริจาคเงินเพื่อใช้ในการจัดซื้ออุปกรณ์ทางการแพทย์ ให้กับอาคาร/ตึกใหม่แห่งหนึ่งของโรงพยาบาลศิริราช อาคาร/ตึกแห่งนั้นคืออาคาร/ตึกใด',
    subQuestion: 'นวมินทรบพิตร ๘๔ พรรษา\nอาคารรักษาพยาบาล และสถานีศิริราช\nโรงพยาบาลศิริราชปิยมหาราชการุณย์\nตึก 100 ปีพระศรีนครินทร์\nตึกสยามินทร์'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 11,
    part: 4,
    question: 'ข้อใดไม่ใช่ร้านอาหารบริเวณคณะแพทยศาสตร์ศิริราชพยาบาล',
    subQuestion: 'MK restaurant\nJones’ salad\nFLAIR\nAfter you\nYayoi'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 12,
    part: 4,
    question: 'นักศึกษาแพทย์ศิริราชเริ่มใส่เข็มขัดที่มีหัวเข็มขัดศิริราชในปีใด',
    subQuestion: 'ปี 1\nปี 2\nปี 3\nปี 4\nปี 5'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 13,
    part: 4,
    question: 'นักศึกษาแพทย์ศิริราชชั้นปีที่ 3 จะได้เรียนที่ห้องปฏิบัติการหนึ่งบนตึกอดุลยเดชวิกรม โดยแต่ละคนจะได้ใช้คอมพิวเตอร์ textbook กล้องจุลทรรศน์ และอุปกรณ์การเรียนอื่นๆ เพื่อประกอบการเรียนรู้ ห้องปฏิบัติการนั้นมีชื่อว่าอะไร',
    subQuestion: 'ห้องปฏิบัติการพระอาจวิทยาคม\nห้องปฏิบัติการอวย เกตุสิงห์\nห้องปฏิบัติการเอ. จี. เอลลิส\nห้องปฏิบัติการเฉลิมพระเกียรติ 80 พรรษา\nห้องปฏิบัติการศรีสวรินทิรา'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 14,
    part: 4,
    question: 'ข้อใดต่อไปนี้ไม่ใช่กิจกรรมภายในคณะแพทยศาสตร์ศิริราชพยาบาล',
    subQuestion: 'Hail night\nSIMPIC\nกิจกรรมการทำธงมหิดล\nFamily concert\nรับน้องข้ามฟาก'
  });
  await db.collection('exam').doc().create({
    answerType: 'radio',
    num: 15,
    part: 4,
    question: 'ข้อใดกล่าวไม่ถูกต้องเกี่ยวกับห้องสมุดศิริราช',
    subQuestion: 'มีตู้คืนหนังสือที่สามารถใช้คืนหนังสือได้ตลอด 24 ชม.\nมีตู้หนังสือไฟฟ้าที่เลื่อนได้\nมีห้องจัดแสดงสมุดจดตำราลายพระหัตถ์ส่วนพระองค์ของสมเด็จพระมหิตลาธิเบศร อดุลยเดชวิกรม ที่ชั้น 4 ของห้องสมุด\nอาคารห้องสมุดมีทั้งสิ้น 4 ชั้น\nในวันจันทร์-ศุกร์ ห้องสมุดศิริราชปิดทำการเวลา 20:30 น.'
  }); 
  
  // part 5
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 1,
    part: 5,
    question: 'ในคะแนนเต็ม 100 น้องคิดว่าน้องมีคะแนนความอยากเป็นแพทย์เท่าใด และน้องคิดว่าถ้าสักวันหนึ่งน้องได้เป็นหมอจริงๆ น้องมองภาพตัวเองไว้อย่างไร',
    subQuestion: '3'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 2,
    part: 5,
    question: 'ถ้าน้องนัดกับเพื่อนสนิทคนหนึ่งมาสมัครเข้าค่ายเส้นทางสู่หมอศิริราช ครั้งที่ 21 ครั้งนี้ แต่ผลการสมัครกลับปรากฏว่ามีแค่น้องมีสิทธิเข้าร่วมค่าย น้องจะยังตัดสินใจเข้าค่ายหรือไม่ เพราะเหตุใด',
    subQuestion: '3'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 3,
    part: 5,
    question: 'ทำไมน้องถึงสมัครเข้าค่ายเส้นทางสู่หมอศิริราช และน้องคาดหวังอะไรจากค่ายเส้นทางสู่หมอศิริราชครั้งนี้บ้าง',
    subQuestion: '3'
  });
  await db.collection('exam').doc().create({
    answerType: 'upload',
    num: 4,
    part: 5,
    question: 'ให้ถ่ายรูปเซลฟี่ในท่าที่น้องคิดว่าสร้างสรรค์ที่สุด'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 5,
    part: 5,
    question: 'ถ้าวันหนึ่งมีสัตว์ประหลาดมาบุกโลก น้องคิดว่าสัตว์ประหลาดจะมาบุกโลกด้วยเหตุผลอะไร',
    subQuestion: '3'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 6,
    part: 5,
    question: 'นายวิทย์พูดขึ้นมาว่า “เฮ้อ! วันนี้แดดแรงจังเลย เมื่อก่อนไม่เห็นเป็นแบบนี้” ก่อนจะหันไปมองนาฬิกาบนข้อมือแล้วพูดต่อว่า “นี่มันเก้าโมงเช้าจริงๆ หรือนี่” น้องคิดว่าเหตุผลของเหตุการณ์ข้างต้นคืออะไร (บอกมาให้มากที่สุดเท่าที่เป็นไปได้)',
    subQuestion: '3'
  });
  await db.collection('exam').doc().create({
    answerType: 'textarea',
    num: 7,
    part: 5,
    question: 'น้องมีความคิดเห็นอย่างไรต่อการแพทย์แผนไทยที่มีการนำสมุนไพร การนวด และภูมิปัญญาโบราณอื่นๆ มาใช้ในการดูแลรักษาคนไข้ในปัจจุบัน',
    subQuestion: '3'
  }); */
  

  res.send('ok');
});

module.exports = router;