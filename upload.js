const fs = require('fs');
const { readdirSync } = require('fs');
const parse = require('csv-parse');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const WPAPI = require('wpapi');

const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);

const getDirectories = source =>
readdirSync(source, { withFileTypes: true })
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name);

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
  const imagesFolders = getDirectories(__dirname + '/images');

  products.forEach(async function(product, index){
    const productCodeKey = config['product_code_field'];
    let productCode = product[productCodeKey];

    //Rewrite product code, replace special chara
    productCode = productCode.replace('+', '\\+');

    const productFolder = imagesFolders.find(function(folder) {
      const regax = new RegExp(`(${productCode}.+|${productCode})`, 'g');
      if(regax.exec(folder)){
        return folder;
      }
    });

    if(productFolder){
      const folderPath = `${__dirname}/images/${productFolder}`;
      const images = getFiles(folderPath);
      let imageList = [];
      for(let i = 0; i < images.length; i++){
        const image = images[i];
        const imagePath = `${folderPath}/${image}`;
        try{
          const imageURL = await uploadImage(imagePath);
          imageList.push(imageURL);
        }catch(e){
          console.log(e);
        }
      }
      imageList = imageList.toString();
      const imageFieldKey = config['image_field'];
      product[imageFieldKey] = imageList;
    }

    await csvWriter.writeRecords([product]);
    
  });
}

startScript();
