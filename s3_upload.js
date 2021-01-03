const fs = require('fs');
const { readdirSync } = require('fs');
const AWS = require('aws-sdk');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const getDirectories = source =>
readdirSync(source, { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

const getFiles = source =>
readdirSync(source, { withFileTypes: true })
.map(dirent => dirent.name);

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const configFile = fs.readFileSync('config.s3.json');
const config = JSON.parse(configFile);

const s3 = new AWS.S3();

async function getCsvRecord(inputFile){
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(`${inputFile}`);
    parse(fileContent, {columns: true}, function (err, records) {
      if(err){
        reject(err);
        return;
      }
      resolve(records);
    });
  });
}

function getCsvHeader(item){
  const keys = Object.keys(item);
  const headers = [];
  for(let i = 0; i < keys.length; i++){
    const key = keys[i];
    const header = {id: key, title: key};
    headers.push(header);
  }
  return headers;
}

function uploadImage(imagePath, imageName){
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: config['bucket'],
      Key: imageName,
      Body: fs.readFileSync(imagePath),
    };
    s3.upload(params, function(err, data) {
      if(err){
        reject(err);
      }
      console.log(`File uploaded successfully.`);
      resolve(data.Location);
    });
  });
}

async function startScript(){
  const products = await getCsvRecord(inputFile);
  const productsKey = getCsvHeader(products[0]);
  const csvWriter = createCsvWriter({
      path: __dirname+ `/${outputFile}`,
      header: productsKey,
  });
  const imagesFolders = getDirectories(__dirname + '/images');

  products.forEach(async function(product, index){
    const productCodeKey = config['product_code_field'];
    const productCode = product[productCodeKey];

    const productFolder = imagesFolders.find(function(folder) {
      const regax = new RegExp(`(${productCode}.+|${productCode})`, 'g');
      if(regax.exec(folder)){
        return folder;
      }
    });
    const folderPath = `${__dirname}/images/${productFolder}`;
    const images = getFiles(folderPath);
    let imageList = [];
    for(let i = 0; i < images.length; i++){
      const image = images[i];
      const imagePath = `${folderPath}/${image}`;
      try{
        const imageURL = await uploadImage(imagePath, image);
        imageList.push(imageURL);
      }catch(e){
        console.log(image);
      }
    }
    imageList = imageList.toString();
    const imageFieldKey = config['image_field'];
    product[imageFieldKey] = imageList;
    await csvWriter.writeRecords([product]);
  });
}

startScript();
