# Wordpress Product Image Patch
A simple script for patch upload wordpress woocommerce product's images.
It will upload all of the images in "images" folder, then rewrite the csv which contains the information of products.

Installation
---
Note: This requires Node.js v0.14 to run. If you had not install it , you can download it at http://nodejs.org/download/ . 

1.Download the source or clone the git repository:
```bash
$ git clone git@github.com:dollars0427/wordpress_product_image_patch.git
```

2.Switch to the project root directory:
```bash
$ cd wordpress_product_image_patch
```
3.Install the dependencies: 
```bash
$ npm install
```
or 
```bash
$ yarn install
```

Configuration
---
1.Copy the configuration file and edit it: 

```bash
$ cp ./config.example.json config.json
$ vi config.json

```

2.Enter the setting of wordpress API endpoint, JWT Authentication Token, Image field key and product code field in CSV.

```json
 {
  "endpoint": "https://example.com/wp-json",
  "token": "Your JWT Authentication Token",
  "image_field": "Your image field name in CSV",
  "product_code_field": "Your product field name in CSV"
  }
```

3. Create "images" folder and product images folder with this format, put all of images of product inside.

```bash
mkdir images
cd ./images
mkdir productcode
```

Example:
![Image of Example](https://i.ibb.co/Ltg0Y9x/2021-01-02-20-34-35.png)


Usage
---
1.Run upload.js with this command: 

`node upload.js [Path of input csv file] [Path of output csv file]`
