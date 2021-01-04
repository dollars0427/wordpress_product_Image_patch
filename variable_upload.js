const fs = require('fs');
const { readdirSync } = require('fs');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const WPAPI = require('wpapi');

const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);

const getFiles = source =>
readdirSync(source, { withFileTypes: true })
.map(dirent => dirent.name);

const inputFile = process.argv[2];
const outputFile = process.argv[3];

const token = config['token'];

const wp = new WPAPI({
    endpoint: config['endpoint'],
});

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

function uploadImage(imagePath){
  return new Promise((resolve, reject) => {
    wp.media()
    .setHeaders({
      Authorization: `Bearer ${token}`,
    })
    .file(imagePath)
    .create({}, function(err, res){
      if(err){
        reject(err);
        return;
      }
      resolve(res['source_url']);
    });
  });
}

async function startScript(){
  const products = await getCsvRecord(inputFile);
  const productsKey = getCsvHeader(products[0]);
  const csvWriter = createCsvWriter({
      path: outputFile,
      header: productsKey,
  });

  products.forEach(async function(product, index){
    const productCodeKey = config['product_code_field'];
    const productCode = product[productCodeKey];

    const folderPath = `${__dirname}/images`;
    const images = getFiles(folderPath);

    const productImage = images.find(function(image) {
      const regax = new RegExp(`(${productCode}.+|${productCode})`, 'g');
      if(regax.exec(image)){
        return image;
      }
    });

    if(productImage){
      const imagePath = `${folderPath}/${productImage}`;
      try{
        const imageURL = await uploadImage(imagePath);
        const imageFieldKey = config['image_field'];
        product[imageFieldKey] = imageURL;
        await csvWriter.writeRecords([product]);
      }catch(e){
        console.log(e);
      }
    }
  });
}

startScript();
